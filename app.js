let scene, camera, renderer, model, mixer, clock;

// ====== INIT ======
function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight,1,5000);
  camera.position.set(0, 200, 800);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.getElementById("container").appendChild(renderer.domElement);

  // إضاءة
  scene.add(new THREE.AmbientLight(0xffffff,1.2));

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(10,10,10);
  scene.add(light);

  clock = new THREE.Clock();

  loadModel();
  animate();
}

// ====== تحميل الموديل ======
function loadModel() {

  const loader = new THREE.FBXLoader();
  const textureLoader = new THREE.TextureLoader();

  loader.load("model.fbx", function(object){

    model = object;

    textureLoader.load("texture.png", function(texture){

      texture.encoding = THREE.sRGBEncoding;

      model.traverse(child=>{
        if(child.isMesh){
          child.material.map = texture;
          child.material.color.set(0xffffff);
          child.material.needsUpdate = true;

          // Glow أخضر 🔥
          child.material.emissive = new THREE.Color(0x00ff00);
          child.material.emissiveIntensity = 0.4;
        }
      });

      // 🔥 ضبط الحجم والمكان تلقائي
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.y -= center.y;
      model.position.z -= center.z;

      const scale = 300 / Math.max(size.x, size.y, size.z);
      model.scale.set(scale, scale, scale);

      scene.add(model);

      // Animation
      mixer = new THREE.AnimationMixer(model);
      if(model.animations.length > 0){
        mixer.clipAction(model.animations[0]).play();
      }

      // كاميرا تبص عليه
      camera.lookAt(0,0,0);

      // 🔥 اختبار
      scene.add(new THREE.AxesHelper(200));
    });

  }, undefined, function(error){
    console.error("❌ فشل تحميل الموديل:", error);
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
        {role:"system",content:"You are Ben 10. Short funny hero replies."},
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
    model.rotation.y += 0.002;
  }

  renderer.render(scene,camera);
}

window.onload = init;
