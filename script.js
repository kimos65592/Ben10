const API_KEY = "YOUR_API_KEY";

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
You are confident, funny, and heroic.
Keep replies short and energetic.
Never say you're an AI.
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
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "ar-EG";
  speech.rate = 1;
  speech.pitch = 1.2;
  speechSynthesis.speak(speech);
}
