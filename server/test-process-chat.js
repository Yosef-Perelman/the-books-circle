import { processChat } from './src/services/ai.service.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = '9524ed14-c1a1-457d-b319-5329add92f84';
const displayName = 'Test User';
const history = [
  { role: 'user', parts: [{ text: 'add the hobbit to my want to read list' }] }
];

async function run() {
  try {
    const res = await processChat(history, userId, displayName);
    console.log("Success!", res);
  } catch(err) {
    console.error("Error:", err);
  }
}
run();
