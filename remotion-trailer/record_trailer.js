import { chromium } from 'playwright';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
  console.log("Starting browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: './videos/',
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  
  console.log("---------------------------------------------------------");
  console.log("Please log in to your account in the opened browser window.");
  console.log("Also, make sure you have 'Atomic Habits' in your 'Reading' list!");
  console.log("---------------------------------------------------------");
  await askQuestion("Press ENTER when you are logged in and ready to start the automated recording... ");
  
  console.log("Starting automated flow and recording! Do NOT touch the mouse or keyboard.");
  
  try {
    // 1. Go to Feed (assuming we land there)
    await page.waitForTimeout(2000);
    // scroll a little bit to show dynamic feed
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);
    
    // 2. Go to Circles
    console.log("Navigating to Circles...");
    await page.click('text=My Circles');
    await page.waitForTimeout(3000);
    
    // 3. Go to Explore
    console.log("Navigating to Explore...");
    await page.click('text=Explore');
    await page.waitForTimeout(2000);
    await page.fill('input[placeholder="Search for books, authors..."]', 'Atomic Habits');
    await page.waitForTimeout(3000); 
    
    // 4. Go to Profile
    console.log("Navigating to Profile...");
    await page.click('text=Profile');
    await page.waitForTimeout(2000);
    
    // Go to "Reading" tab
    await page.click('button[role="tab"]:has-text("Reading")');
    await page.waitForTimeout(1500);
    
    // Change status to Finished by clicking the Finished badge
    console.log("Changing status to Finished...");
    await page.click('.mantine-Badge-root:has-text("Finished")');
    await page.waitForTimeout(4000); // Wait for modal to pop up and settle
    
    // 5. Answer AI questions
    const answerTexts = [
      "I really loved the idea of getting 1% better every day. It takes the pressure off making huge overnight changes.",
      "I would recommend this to anyone who struggles with procrastination or feels stuck in bad routines.",
      "It left me feeling motivated and organized. I started tracking my daily habits immediately."
    ];
    
    for (const text of answerTexts) {
      await page.waitForSelector('textarea');
      // type it slowly like a human
      await page.type('textarea', text, { delay: 50 });
      await page.waitForTimeout(1000);
      
      const nextBtnText = await page.locator('button.mantine-Button-root >> text=/Next Question|Write my review/i').textContent();
      await page.click(`button:has-text("${nextBtnText.trim()}")`);
      await page.waitForTimeout(2000); 
    }
    
    // 6. Wait for AI generation
    console.log("Waiting for AI generation...");
    await page.waitForSelector('text=Here is a draft based on your thoughts', { timeout: 30000 });
    await page.waitForTimeout(4000); 
    
    // Publish Review
    console.log("Publishing Review...");
    await page.click('button:has-text("Publish Review")');
    await page.waitForTimeout(3000);
    
    // 7. Go to AI Chat
    console.log("Navigating to AI Chat...");
    await page.click('text=AI Chat');
    await page.waitForTimeout(2000);
    
    // Type in chat
    await page.type('input[placeholder="Ask the AI Librarian..."]', "Can you recommend a similar book to Atomic Habits?", { delay: 50 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    
    // Wait for AI to reply
    await page.waitForTimeout(6000);

  } catch (err) {
    console.error("Error during automation:", err);
  }

  console.log("Closing browser and saving video...");
  await context.close();
  await browser.close();
  
  const videoFiles = fs.readdirSync('./videos');
  const videoFile = videoFiles.find(f => f.endsWith('.webm'));
  if (videoFile) {
    fs.renameSync(`./videos/${videoFile}`, './trailer-recording.webm');
    fs.copyFileSync('./trailer-recording.webm', '/home/daniel2026/.gemini/antigravity-ide/brain/f2f08f26-5dfd-463c-be15-49121af44e9a/trailer-recording.webm');
    console.log("Video saved to trailer-recording.webm in both the project and artifacts folder!");
  }
  process.exit(0);
}

run();
