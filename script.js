const API_KEY = "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";

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ar-EG";

function startListening() {
  recognition.start();
}

recognition.onresult = async function(event) {
  const userText = event.results[0][0].transcript;
  console.log("You:", userText);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Ben 10.
You are a confident hero, funny and energetic.
Keep replies short.
`
        },
        {
          role: "user",
          content: userText
        }
      ],
      max_tokens: 80
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;

  speak(reply);
};

function speak(text) {
  const avatar = document.getElementById("avatar");

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "ar-EG";

  speech.onstart = () => {
    avatar.classList.add("talking");
  };

  speech.onend = () => {
    avatar.classList.remove("talking");
  };

  speechSynthesis.speak(speech);
}
