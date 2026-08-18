import fs from 'fs';

const apiKey = 'sk_8c7965f9893340d17e31511a69f3fb62a1c57b8566c7daa0';
const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

const text = "Reading used to be a solitary journey. But what if you could share every page with the people who matter most? Welcome to The Books Circle. Create your own private book club, organize your reading shelves, and discover your next favorite story. And when you finish a great read? Our AI Librarian will interview you, and craft a stunning magazine-style review based entirely on your thoughts. Share it instantly with your friends. Start your shared reading journey today, with The Books Circle.";

async function run() {
  console.log("Generating audio...");
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error from ElevenLabs:", text);
    process.exit(1);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync('/home/daniel2026/.gemini/antigravity-ide/brain/f2f08f26-5dfd-463c-be15-49121af44e9a/voiceover.mp3', Buffer.from(buffer));
  console.log("Audio generated and saved to artifacts directory!");
}

run();
