// ====== إعداد Three.js ======
let scene, camera, renderer, model, mixer, clock;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,1,2000);
  camera.position.set(0,0,500);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.getElementById("container").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff,1.2));
  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(10,10,10);
  scene.add(light);

  clock = new THREE.Clock();
  animate();
}

document.getElementById("applyBtn").onclick = function() {
  const fbxFile = document.getElementById('fbxInput').files[0];
  const texFile = document.getElementById('texInput').files[0];

  if (!fbxFile || !texFile) return alert("ارفع الملفين!");

  const textureLoader = new THREE.TextureLoader();
  const fbxLoader = new THREE.FBXLoader();

  const readerTex = new FileReader();
  readerTex.onload = function(e) {
    const texture = textureLoader.load(e.target.result);
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;

    const readerFbx = new FileReader();
    readerFbx.onload = function(fe) {

      if (model) scene.remove(model);

      model = fbxLoader.parse(fe.target.result);

      model.traverse(child=>{
        if(child.isMesh){
          child.material.map = texture;
          child.material.color.set(0xffffff);
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      model.scale.set(1.5,1.5,1.5);

      scene.add(model);

      mixer = new THREE.AnimationMixer(model);
      if(model.animations.length>0){
        mixer.clipAction(model.animations[0]).play();
      }
    };

    readerFbx.readAsArrayBuffer(fbxFile);
  };

  readerTex.readAsDataURL(texFile);
};

// ====== AI ======
const API_KEY = "YOUR_API_KEY"; // حط مفتاحك هنا

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ar-EG";

function startListening(){
  document.getElementById("status").innerText="🎧 بسمعك...";
  recognition.start();
}

recognition.onresult = async function(event){
  const userText = event.results[0][0].transcript;

  document.getElementById("status").innerText="🧠 بفكر...";

  const res = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${API_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      model:"gpt-4o-mini",
      messages:[
        {role:"system",content:"You are Ben 10. Heroic, funny, short replies."},
        {role:"user",content:userText}
      ],
      max_tokens:80
    })
  });

  const data = await res.json();
  const reply = data.choices[0].message.content;

  speak(reply);
};

// ====== الصوت + حركة ======
function speak(text){
  document.getElementById("status").innerText="🗣️ بيتكلم...";

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang="ar-EG";

  speech.onstart = ()=>{
    if(model){
      model.rotation.y += 0.5;
    }
  };

  speech.onend = ()=>{
    document.getElementById("status").innerText="جاهز...";
  };

  speechSynthesis.speak(speech);
}

// ====== Animation Loop ======
function animate(){
  requestAnimationFrame(animate);

  if(mixer) mixer.update(clock.getDelta());

  if(model){
    model.rotation.y += 0.005;
  }

  renderer.render(scene,camera);
}

window.onload = init;
