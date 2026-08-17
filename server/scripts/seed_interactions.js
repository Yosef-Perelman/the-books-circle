import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get some posts
  const { data: posts } = await supabase.from('feed_posts').select('id, circle_id');
  // Get users
  const { data: users } = await supabase.from('users').select('id');
  
  if (!posts || posts.length === 0 || !users || users.length === 0) {
    console.log("No posts or users found.");
    return;
  }

  console.log(`Found ${posts.length} posts and ${users.length} users.`);

  // Dummy comments
  const dummyComments = [
    "Wow, this looks amazing! 🤩",
    "I've been meaning to read this. How is it?",
    "Great choice!",
    "I couldn't put it down once I started.",
    "Not my favorite, but I hope you enjoy it!"
  ];

  for (const post of posts) {
    // Add 1-3 random reactions
    const numReactions = Math.floor(Math.random() * 3) + 1;
    const shuffledUsers = users.sort(() => 0.5 - Math.random());
    for (let i = 0; i < numReactions; i++) {
      await supabase.from('reactions').insert({ post_id: post.id, user_id: shuffledUsers[i].id }).select();
    }

    // Add 0-2 random comments
    const numComments = Math.floor(Math.random() * 3);
    for (let i = 0; i < numComments; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomComment = dummyComments[Math.floor(Math.random() * dummyComments.length)];
      await supabase.from('comments').insert({ post_id: post.id, user_id: randomUser.id, content: randomComment });
    }
  }

  console.log("Seeded interactions successfully!");
}

run().catch(console.error);
