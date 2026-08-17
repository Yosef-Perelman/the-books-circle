import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  try {
    // 1. Get circles
    const { data: circles, error: circlesErr } = await supabase.from('circles').select('id, name');
    if (circlesErr) throw circlesErr;
    console.log(`Found ${circles.length} circles`);

    // 2. Get users to find the current user
    const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) throw authErr;

    // We assume the user is the one who logged in recently or has a specific email.
    // Let's just find the user with the most recent created_at or we can add ALL users to ALL circles to be safe?
    // The user's name is probably their email if they signed up directly, or we can look for 'Daniel'.
    // Let's just add the most recently created user who isn't one of our seeded ones (chen/maya/yosef).
    const nonSeededUsers = users.filter(u => !['chen@example.com', 'maya@example.com', 'yosef@example.com'].includes(u.email));
    
    if (nonSeededUsers.length === 0) {
      console.log("Could not find any target users.");
      return;
    }
    
    // 3. Add to circles
    for (const targetUser of nonSeededUsers) {
      console.log(`Target user found: ${targetUser.email} (ID: ${targetUser.id})`);
      for (const circle of circles) {
        const { error: memberErr } = await supabase
          .from('circle_members')
          .insert({ circle_id: circle.id, user_id: targetUser.id })
          .select();
        
        if (memberErr && memberErr.code !== '23505') { 
          console.error(`Error adding to circle ${circle.name}:`, memberErr);
        } else {
          console.log(`Added user ${targetUser.email} to circle: ${circle.name}`);
        }
      }
    }

    // 4. Create some dummy posts in the first circle
    if (circles.length > 0) {
      const circleId = circles[0].id;
      
      // Let's get some user_books for the seeded users to reference
      const { data: userBooks, error: ubErr } = await supabase
        .from('user_books')
        .select('id, user_id, status')
        .limit(5);
        
      if (!ubErr && userBooks.length > 0) {
        const posts = [
          { circle_id: circleId, user_id: userBooks[0].user_id, type: 'started', user_book_id: userBooks[0].id, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { circle_id: circleId, user_id: userBooks[1]?.user_id || userBooks[0].user_id, type: 'finished', user_book_id: userBooks[1]?.id || userBooks[0].id, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
          { circle_id: circleId, user_id: userBooks[2]?.user_id || userBooks[0].user_id, type: 'added', user_book_id: userBooks[2]?.id || userBooks[0].id, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }
        ];

        for (const post of posts) {
          const { error: postErr } = await supabase.from('feed_posts').insert(post);
          if (postErr) console.error("Error creating post:", postErr);
        }
        console.log("Created dummy posts.");
      }
    }
    
    console.log("Done!");
  } catch (err) {
    console.error("Script failed:", err);
  }
}

run();
