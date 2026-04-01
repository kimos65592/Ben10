let scene, camera, renderer, model, mixer, clock;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,1,5000);
  camera.position.set(0, 200, 800);

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("container").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff,1.2));

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(10,10,10);
  scene.add(light);

  clock = new THREE.Clock();

  animate();
}

// تحميل من الجهاز
function loadCustomModel(){

  const fbxFile = document.getElementById("fbxInput").files[0];
  const texFile = document.getElementById("texInput").files[0];

  if(!fbxFile || !texFile){
    alert("ارفع الملفات الأول");
    return;
  }

  const loader = new THREE.FBXLoader();
  const textureLoader = new THREE.TextureLoader();

  const readerFbx = new FileReader();
  readerFbx.readAsArrayBuffer(fbxFile);

  readerFbx.onload = function(e){

    if(model) scene.remove(model);

    model = loader.parse(e.target.result);

    const readerTex = new FileReader();
    readerTex.readAsDataURL(texFile);

    readerTex.onload = function(te){

      const texture = textureLoader.load(te.target.result);

      model.traverse(child=>{
        if(child.isMesh){
          child.material.map = texture;
          child.material.emissive = new THREE.Color(0x00ff00);
          child.material.emissiveIntensity = 0.4;
        }
      });

      // ضبط الحجم
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.sub(center);

      const scale = 300 / Math.max(size.x, size.y, size.z);
      model.scale.set(scale, scale, scale);

      scene.add(model);

      camera.lookAt(0,0,0);

      mixer = new THREE.AnimationMixer(model);
      if(model.animations.length>0){
        mixer.clipAction(model.animations[0]).play();
      }

    };
  };
}

// AI
const API_KEY = "YOUR_API_KEY";

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ar-EG";

function startListening(){
  document.getElementById("status").innerText="🎧 بسمعك...";
  recognition.start();
}

recognition.onresult = async function(event){
  const text = event.results[0][0].transcript;

  speak("ثانية 😏");

  const reply = await askGPT(text);

  speak(reply);
};

async function askGPT(text){

  const res = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${API_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      model:"gpt-4o-mini",
      messages:[
        {role:"system",content:"You are Ben 10. Short replies."},
        {role:"user",content:text}
      ],
      max_tokens:50
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "مش فاهمك";
}

// صوت
function speak(text){
  document.getElementById("status").innerText="🗣️ بيتكلم...";

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang="ar-EG";

  speech.onstart = ()=>{
    if(model) model.rotation.y += 0.5;
  };

  speech.onend = ()=>{
    document.getElementById("status").innerText="جاهز...";
  };

  speechSynthesis.speak(speech);
}

// Animation
function animate(){
  requestAnimationFrame(animate);

  if(mixer) mixer.update(clock.getDelta());

  if(model) model.rotation.y += 0.002;

  renderer.render(scene,camera);
}

window.onload = init;
