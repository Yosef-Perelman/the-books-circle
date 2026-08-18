import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MOCK_NAMES = [
  'Emma Watson', 'Liam Neeson', 'Olivia Colman', 'Noah Centineo',
  'Ava Max', 'Oliver Twist', 'Isabella Swan', 'Elijah Wood',
  'Sophia Loren', 'James Dean', 'Mia Wallace', 'William Wallace',
  'Charlotte Bronte', 'Benjamin Button', 'Amelia Earhart', 'Lucas Skywalker',
  'Harper Lee', 'Henry Ford', 'Evelyn Waugh', 'Alexander Great'
];

const CIRCLE_NAMES = [
  'Fantasy Readers', 'Historical Fiction Geeks', 'Non-Fiction Enthusiasts',
  'Book Club 2026', 'Thriller Addicts'
];

const GOOGLE_BOOK_IDS = [
  'zyTCAlFPjgYC', // Example ID (Harry Potter)
  '90MuwAEACAAJ', 'f280CwAAQBAJ', 'Sm5AKLXKxHgC', 'x-G9M3h5vKMC',
  '4m2zAwAAQBAJ', 'oXoSAAAAQBAJ', 'P-e5CwAAQBAJ', '3xP_AQAAQBAJ',
  'sB9_AwAAQBAJ', '7h8-DwAAQBAJ', 'a0-nDwAAQBAJ', 'j7s6EAAAQBAJ',
  'nB_4uQAACAAJ', 'YgTMEAAAQBAJ'
];

async function fetchGoogleBook(id) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
    const data = await res.json();
    return {
      api_id: data.id,
      title: data.volumeInfo.title,
      author: data.volumeInfo.authors?.[0] || 'Unknown',
      cover_url: data.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      description: data.volumeInfo.description,
      genre: data.volumeInfo.categories?.[0] || null,
      page_count: data.volumeInfo.pageCount || null,
      published_date: data.volumeInfo.publishedDate || null
    };
  } catch (err) {
    return null;
  }
}

function randElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runSeed() {
  console.log('Starting seed process...');

  // 1. Create Users
  console.log('Creating users...');
  for (const name of MOCK_NAMES) {
    const email = `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    // create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: name }
    });
    
    if (authUser?.user) {
      const uId = authUser.user.id;
      await supabase.from('users').upsert({
        id: uId,
        email: email,
        display_name: name,
        avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      });
    }
  }

  // Get all user IDs (including previously created ones)
  const { data: allUsers } = await supabase.from('users').select('id');
  const userIds = allUsers.map(u => u.id);

  if (userIds.length === 0) {
    console.error('No users found. Aborting.');
    return;
  }

  // 2. Create Circles
  console.log('Creating circles...');
  const circleIds = [];
  for (const cName of CIRCLE_NAMES) {
    const { data: circle, error: circleError } = await supabase.from('circles').insert({
      name: cName,
      creator_id: userIds[0], // First user creates all the test circles
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase()
    }).select('id').single();
    if (circleError) {
      console.error('Error creating circle:', circleError);
    }
    if (circle) circleIds.push(circle.id);
  }

  // 3. Add Members to Circles
  const { data: allCircles } = await supabase.from('circles').select('id');
  const allCircleIds = allCircles.map(c => c.id);

  if (allCircleIds.length === 0) {
    console.error('No circles created. Aborting membership assignment.');
    return;
  }
  
  console.log('Adding members to circles...');
  const memberships = [];
  for (const uId of userIds) {
    // each user joins 1-3 circles
    const numCircles = randInt(1, 3);
    const joined = new Set();
    while(joined.size < numCircles) {
      joined.add(randElement(allCircleIds));
    }
    for (const cId of joined) {
      memberships.push({ circle_id: cId, user_id: uId });
    }
  }
  await supabase.from('circle_members').upsert(memberships, { onConflict: 'circle_id,user_id' });

  // Fetch all books (in case upsert failed or they already exist)
  const { data: allBooks } = await supabase.from('books').select('id');
  const dbBooks = allBooks.map(b => b.id);
  
  if (dbBooks.length === 0) {
    console.error('No books found. Aborting post creation.');
    return;
  }

  // 5. Create User Books & Reviews
  console.log('Creating posts, reviews, and reactions...');
  const postIds = [];
  for (const uId of userIds) {
    // Assign 2-5 books per user
    const numBooks = randInt(2, 5);
    const assigned = new Set();
    while (assigned.size < numBooks && assigned.size < dbBooks.length) {
      assigned.add(randElement(dbBooks));
    }
    
    for (const bId of assigned) {
      const status = randElement(['want', 'reading', 'finished']);
      const rating = status === 'finished' ? randInt(3, 5) : null;
      
      const { data: ub } = await supabase.from('user_books').insert({
        user_id: uId,
        book_id: bId,
        status,
        rating
      }).select('id').single();

      // Find user circles to post to
      const userCircles = memberships.filter(m => m.user_id === uId).map(m => m.circle_id);
      
      if (ub && userCircles.length > 0) {
        // Create a post
        const cId = randElement(userCircles);
        let content = '';
        let type = 'text';
        
        if (status === 'finished') {
          type = 'review';
          content = rating === 5 ? 'An absolute masterpiece. Could not put it down!' : 'Good read, but pacing was a bit slow in the middle.';
        } else if (status === 'reading') {
          content = 'Just started reading this and I am already hooked!';
        } else {
          content = 'I cannot wait to finally read this one. Heard great things.';
        }

        const { data: post } = await supabase.from('feed_posts').insert({
          user_id: uId,
          circle_id: cId,
          type,
          user_book_id: ub.id,
          content
        }).select('id').single();

        if (post) postIds.push(post.id);
      }
    }
  }

  // 6. Comments & Reactions
  console.log('Creating comments and likes...');
  for (const pId of postIds) {
    // 1-4 likes per post
    const likers = new Set();
    while(likers.size < randInt(1, 4)) {
      likers.add(randElement(userIds));
    }
    const likesArr = Array.from(likers).map(u => ({ post_id: pId, user_id: u }));
    await supabase.from('reactions').insert(likesArr);

    // 0-2 comments per post
    const numComments = randInt(0, 2);
    for (let i = 0; i < numComments; i++) {
      await supabase.from('comments').insert({
        post_id: pId,
        user_id: randElement(userIds),
        content: randElement(['Totally agree!', 'Interesting perspective.', 'I felt the same way.', 'Added to my list!'])
      });
    }
  }

  console.log('Seed completed successfully!');
}

runSeed().catch(console.error);
