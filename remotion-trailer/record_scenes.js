import { chromium } from 'playwright';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function installMouseHelper(page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const box = document.createElement('div');
      box.classList.add('playwright-mouse-pointer');
      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        .playwright-mouse-pointer {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10000;
          left: 0;
          width: 30px;
          height: 30px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="black" stroke="white" stroke-width="2" d="M4 2L20 12L13 14L16 22L12 24L9 16L3 20V2Z"/></svg>');
          background-size: contain;
          background-repeat: no-repeat;
          margin: 0;
          padding: 0;
          transition: transform 0.1s ease;
        }
        .playwright-mouse-pointer.clicking {
          transform: scale(0.8);
        }
      `;
      document.head.appendChild(styleElement);
      document.body.appendChild(box);
      document.addEventListener('mousemove', event => {
        box.style.left = event.pageX + 'px';
        box.style.top = event.pageY + 'px';
      }, true);
      document.addEventListener('mousedown', event => {
        box.classList.add('clicking');
      }, true);
      document.addEventListener('mouseup', event => {
        box.classList.remove('clicking');
      }, true);
    });
  });
}

async function smoothClick(page, locatorOrSelector) {
  const locator = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector) : locatorOrSelector;
  await locator.first().waitFor({ state: 'visible' });
  const box = await locator.first().boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 25 });
    await page.waitForTimeout(200);
    await page.mouse.click(x, y);
  } else {
    await locator.first().click();
  }
}

async function recordScene(sceneNumber) {
  console.log(`\n--- Preparing to record Scene ${sceneNumber} ---`);
  const context = await chromium.launchPersistentContext('/tmp/playwright-trailer-profile', {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    recordVideo: {
      dir: `./videos/scene${sceneNumber}/`,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  
  await installMouseHelper(page);
  await page.goto('http://localhost:5173');
  
  console.log("---------------------------------------------------------");
  console.log("Please log in to your account. Do not click anywhere else.");
  if (sceneNumber === 3) {
    console.log("Make sure you have 'Atomic Habits' in your 'Currently Reading' list!");
  }
  console.log("---------------------------------------------------------");
  await askQuestion("Press ENTER when you are logged in and ready... ");
  
  console.log(`Starting automated recording for Scene ${sceneNumber}...`);
  console.log("---------------------------------------------------------");
  
  try {
    if (sceneNumber === 1) {
      console.log("SCENE 1: The Social Experience (Feed & Circles)");
      
      // 1. Scroll feed slowly
      await page.waitForTimeout(2000);
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(2000);
      await page.mouse.wheel(0, -800);
      await page.waitForTimeout(2000);
      
      // 2. Write a post
      console.log("Writing a post...");
      await smoothClick(page, 'textarea[placeholder="What are your thoughts on your latest read?"]');
      await page.waitForTimeout(1000);
      await page.keyboard.type("Just started reading a fascinating new sci-fi novel! The world-building is incredible.", { delay: 80 });
      await page.waitForTimeout(1500);
      await smoothClick(page, 'button:has-text("Post")');
      await page.waitForTimeout(3000);
      
      // 3. Like a post
      console.log("Liking a post...");
      await page.waitForTimeout(1000);
      await smoothClick(page, page.locator('.tabler-icon-heart').nth(1));
      await page.waitForTimeout(1500);
      
      // 4. Comment on a post
      console.log("Writing a comment...");
      await smoothClick(page, page.locator('.tabler-icon-message-circle').nth(1));
      await page.waitForTimeout(1000);
      await smoothClick(page, 'input[placeholder="Write a comment..."]');
      await page.waitForTimeout(500);
      await page.keyboard.type("This is exactly what I was thinking! Great read.", { delay: 60 });
      await page.waitForTimeout(1000);
      await smoothClick(page, 'button:has-text("Send")');
      await page.waitForTimeout(3000);
      
      // 5. Check circles
      await smoothClick(page, 'text=New circle');
      await page.waitForTimeout(2000);
      await smoothClick(page, 'button.mantine-Modal-close');
      await page.waitForTimeout(3000);
      
      
    } else if (sceneNumber === 2) {
      console.log("SCENE 2: Discover & Organize (Explore & Profile)");
      
      // Scene 2 Action
      await page.waitForTimeout(1500);
      await smoothClick(page, 'text=Explore');
      await page.waitForTimeout(2000);
      
      // search slowly
      await smoothClick(page, 'input[placeholder="Search books, authors, ISBN..."]');
      await page.waitForTimeout(1000);
      await page.keyboard.type('Dune', { delay: 300 });
      await page.waitForTimeout(1500);
      await page.keyboard.press('Enter');
      
      console.log("Waiting for search results...");
      await page.waitForSelector('.mantine-Paper-root', { state: 'visible', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      // click the first book to go to BookPage
      console.log("Going to Book Page...");
      await smoothClick(page, page.locator('.mantine-Paper-root').first());
      await page.waitForSelector('button:has-text("Add to my shelf")', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // scroll book page slowly
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(2000);
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(2000);
      
      // click author
      console.log("Going to Author Page...");
      await smoothClick(page, 'text=Frank Herbert');
      await page.waitForSelector('h1', { state: 'visible', timeout: 15000 }); // Wait for Author Name (H1)
      await page.waitForTimeout(2000);
      
      // scroll author page slowly
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(2500);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(2000);
      
      // go to profile
      await smoothClick(page, 'text=Profile');
      await page.waitForTimeout(2500);
      
      // Switch profile tabs
      await smoothClick(page, 'button[role="tab"]:has-text("Want to Read")');
      await page.waitForTimeout(2500);
      await smoothClick(page, 'button[role="tab"]:has-text("Reading")');
      await page.waitForTimeout(2000);
      
      // Scroll profile
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(2000);
      await smoothClick(page, 'button[role="tab"]:has-text("Reading")');
      await page.waitForTimeout(2000);
      
    } else if (sceneNumber === 3) {
      console.log("SCENE 3: The AI Review (The Climax)");
      
      // Go to profile and find Atomic Habits
      await page.waitForTimeout(1500);
      await smoothClick(page, 'text=Profile');
      await page.waitForTimeout(2500);
      await smoothClick(page, 'button[role="tab"]:has-text("Reading")');
      await page.waitForTimeout(2000);
      
      console.log("Changing status to Finished...");
      await smoothClick(page, page.locator('.mantine-Badge-root:has-text("Finished"):visible').first());
      
      console.log("Waiting for Interview Modal...");
      await page.waitForSelector('button:has-text("Next")', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      console.log("Answering questions...");
      // Answer Q1
      await smoothClick(page, 'textarea[placeholder="Type your thoughts here..."]');
      await page.waitForTimeout(500);
      await page.keyboard.type("The concept of making just 1% improvements every day completely shifted my mindset.", { delay: 60 });
      await page.waitForTimeout(1000);
      await smoothClick(page, 'button:has-text("Next")');
      await page.waitForTimeout(2000);
      
      // Answer Q2
      await smoothClick(page, 'textarea[placeholder="Type your thoughts here..."]');
      await page.waitForTimeout(500);
      await page.keyboard.type("I'd recommend it to anyone who struggles with building good habits. It's incredibly practical.", { delay: 60 });
      await page.waitForTimeout(1000);
      await smoothClick(page, 'button:has-text("Next")');
      await page.waitForTimeout(2000);
      
      // Answer Q3
      await smoothClick(page, 'textarea[placeholder="Type your thoughts here..."]');
      await page.waitForTimeout(500);
      await page.keyboard.type("It left me feeling highly motivated! The British Cycling team story really proved that small changes compound.", { delay: 60 });
      await page.waitForTimeout(1000);
      await smoothClick(page, 'button:has-text("Write my review")');
      
      console.log("Waiting for generation...");
      await page.waitForSelector('button:has-text("Publish Review")', { state: 'visible', timeout: 45000 });
      await page.waitForTimeout(2000);
      
      // Scroll the generated review
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(2000);
      await smoothClick(page, 'button:has-text("Publish Review")');
      await page.waitForTimeout(3000);
      
    } else if (sceneNumber === 4) {
      console.log("SCENE 4: Deep Insights with AI Chat");
      
      await page.waitForTimeout(1500);
      await smoothClick(page, 'text=AI Chat');
      await page.waitForSelector('input[placeholder="Ask about books, what friends are reading, or ask to add a book to your list..."]', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Type a deep question slowly
      console.log("Asking the Librarian...");
      await page.fill('input[placeholder="Ask about books, what friends are reading, or ask to add a book to your list..."]', '');
      await page.waitForTimeout(500);
      await smoothClick(page, 'input[placeholder="Ask about books, what friends are reading, or ask to add a book to your list..."]');
      await page.keyboard.type("What are the main philosophical themes in Dune?", { delay: 60 });
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      
      // Wait for AI response
      console.log("Waiting for AI response...");
      // Increase timeout significantly for AI generation
      await page.waitForTimeout(15000);
      
      // Scroll to read
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(3000);
    }
  } catch (err) {
    console.error("Error during automation:", err);
  }

  await context.close();
  
  // Rename the video
  const videoFiles = fs.readdirSync(`./videos/scene${sceneNumber}`);
  const videoFile = videoFiles.find(f => f.endsWith('.webm'));
  if (videoFile) {
    fs.renameSync(`./videos/scene${sceneNumber}/${videoFile}`, `./scene${sceneNumber}.webm`);
    fs.copyFileSync(`./scene${sceneNumber}.webm`, `/home/daniel2026/.gemini/antigravity-ide/brain/f2f08f26-5dfd-463c-be15-49121af44e9a/scene${sceneNumber}.webm`);
    console.log(`Saved scene${sceneNumber}.webm!`);
  }
}

async function run() {
  console.log("Welcome to the Modular Trailer Recorder!");
  console.log("Which scene would you like to record?");
  console.log("1) Scene 1: The Social Experience");
  console.log("2) Scene 2: Discover & Organize");
  console.log("3) Scene 3: The AI Librarian Review");
  console.log("4) Scene 4: Deep Insights with AI Chat");
  console.log("5) Record ALL (one by one)");
  
  const choice = await askQuestion("Enter your choice (1-5): ");
  const num = parseInt(choice);
  
  if (num >= 1 && num <= 4) {
    await recordScene(num);
  } else if (num === 5) {
    await recordScene(1);
    await recordScene(2);
    await recordScene(3);
    await recordScene(4);
  } else {
    console.log("Invalid choice.");
  }
  
  process.exit(0);
}

run();
