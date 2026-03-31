// ====== Three.js ======
let scene, camera, renderer, model, mixer, clock;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,1,2000);
  camera.position.set(0, 100, 500);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.getElementById("container").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff,1.2));

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(10,10,10);
  scene.add(light);

  clock = new THREE.Clock();

  loadModel();
  animate();
}

// تحميل الموديل
function loadModel() {

  const loader = new THREE.FBXLoader();
  const textureLoader = new THREE.TextureLoader();

  loader.load("Ben10.fbx", function(object){

    model = object;

    textureLoader.load("ben_d.png_baseColor.png", function(texture){

      texture.encoding = THREE.sRGBEncoding;
      texture.flipY = false;

      model.traverse(child=>{
        if(child.isMesh){
          child.material.map = texture;
          child.material.color.set(0xffffff);

          // ✨ Glow أخضر
          child.material.emissive = new THREE.Color(0x00ff00);
          child.material.emissiveIntensity = 0.5;
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

    });

  });
}

// ====== AI ======
const API_KEY = "YOUR_API_KEY";

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ar-EG";

function startListening(){
  document.getElementById("status").innerText="🎧 بسمعك...";
  recognition.start();
}

recognition.onresult = async function(event){
  const userText = event.results[0][0].transcript;

  document.getElementById("status").innerText="🧠 بفكر...";

  speak("ثانية 😏");

  const reply = await askGPT(userText);

  speak(reply);
};

// GPT
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
        {role:"system",content:"You are Ben 10. Heroic, funny, short replies."},
        {role:"user",content:text}
      ],
      max_tokens:50
    })
  });

  const data = await res.json();

  try{
    return data.choices[0].message.content;
  }catch{
    return "مش سامعك كويس!";
  }
}

// ====== صوت + حركة ======
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

// ====== Animation ======
function animate(){
  requestAnimationFrame(animate);

  if(mixer) mixer.update(clock.getDelta());

  if(model){
    model.rotation.y += 0.003;
  }

  renderer.render(scene,camera);
}

window.onload = init;
