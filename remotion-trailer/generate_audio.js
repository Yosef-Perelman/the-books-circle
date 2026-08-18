import fs from 'fs';

const apiKey = 'sk_8c7965f9893340d17e31511a69f3fb62a1c57b8566c7daa0';
const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

const scenes = [
  {
    id: 'scene1',
    text: "Welcome to The Books Circle. The ultimate social platform designed entirely for readers. Here, you're not just tracking books; you're building a vibrant reading community. Keep your finger on the pulse of what your friends are reading through a dynamic, real-time social feed. You can easily share your latest thoughts, spark conversations, and dive deep into literary discussions. Want to talk about a specific genre or niche? Join dedicated reading circles where you can connect with like-minded bibliophiles, exchange thoughts, and discover hidden gems together. The Books Circle makes reading a truly shared, interactive experience that brings stories to life."
  },
  {
    id: 'scene2',
    text: "Discovering your next great read has never been easier. Our powerful search engine lets you explore a vast library of books, complete with rich details, gorgeous covers, and community ratings. Dive into comprehensive book pages to read summaries, and explore author profiles to find everything they've ever published. When you find a book you love, seamlessly organize it onto your personal shelves. You can easily move books from 'Want to Read' to 'Reading' and build a beautiful digital showcase of your literary journey. Your profile is your personal sanctuary, keeping your entire reading life perfectly organized and always accessible."
  },
  {
    id: 'scene3',
    text: "But here is where The Books Circle truly shines. When you finish reading a book and mark it as 'Finished', our advanced AI Librarian steps in to elevate your experience. Instead of forcing you to write a review from scratch, the AI conducts a personalized, interactive interview with you. It asks you thoughtful, customized questions about your unique experience with the book. All you have to do is answer naturally, sharing your favorite moments, what stuck with you, or how the book made you feel. Once you've shared your thoughts, the AI takes your answers and instantly crafts a professional, magazine-quality review written perfectly in your voice. You can then review the draft, make any tweaks, and seamlessly publish it to your circles. It’s the easiest way to share brilliant, articulate reviews with your friends, without any writer's block."
  },
  {
    id: 'scene4',
    text: "For deeper insights, you can chat directly with our AI Librarian. Because the AI is deeply integrated with our database and the global Books API, it understands exactly what you and your friends are reading. It can analyze the tastes of people in your network and combine that with the world's book data to give you highly personalized, intelligent recommendations. The Books Circle. Read together, intelligently."
  }
];

async function generateAudio(scene) {
  console.log(`Generating audio for ${scene.id}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: scene.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Error from ElevenLabs for ${scene.id}:`, text);
    return false;
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(`${scene.id}.mp3`, Buffer.from(buffer));
  fs.writeFileSync(`/home/daniel2026/.gemini/antigravity-ide/brain/f2f08f26-5dfd-463c-be15-49121af44e9a/${scene.id}.mp3`, Buffer.from(buffer));
  console.log(`Saved ${scene.id}.mp3`);
  return true;
}

async function run() {
  for (const scene of scenes) {
    const success = await generateAudio(scene);
    if (!success) process.exit(1);
    // wait a bit between requests to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("All audio generated!");
}

run();
