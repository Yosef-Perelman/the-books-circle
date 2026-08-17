import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../src/config/supabase.js';
import * as BookModel from '../src/models/book.model.js';
import * as UserBookService from '../src/services/userBook.service.js';
import { searchBooks } from '../src/integrations/googleBooks.js';
import { STATUS, SOURCE, POST_TYPE } from '../src/utils/constants.js';

// Dummy Users to create
const dummyUsers = [
  { email: 'chen@example.com', password: 'password123', name: 'Chen' },
  { email: 'yosef@example.com', password: 'password123', name: 'Yosef' },
  { email: 'daniel@example.com', password: 'password123', name: 'Daniel' },
  { email: 'maya@example.com', password: 'password123', name: 'Maya' }
];

async function clearOldData() {
  console.log('Clearing old data...');
  await supabase.from('feed_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('user_books').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('books').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('circle_members').delete().neq('circle_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('circles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

async function seedUsers() {
  console.log('Seeding users...');
  const userIds = [];
  
  for (const u of dummyUsers) {
    // Check if user exists in auth.users (we can't query auth.users directly via normal client, but we can try to create and catch error)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.name }
    });

    if (authError) {
      if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
        console.log(`User ${u.email} already exists.`);
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingAuth = usersData?.users.find(x => x.email === u.email);
        
        if (existingAuth) {
          const uid = existingAuth.id;
          const { data: existingUser } = await supabase.from('users').select('id').eq('id', uid).single();
          if (!existingUser) {
             await supabase.from('users').insert({
               id: uid,
               email: u.email,
               display_name: u.name,
               avatar_url: `https://ui-avatars.com/api/?name=${u.name}&background=random`
             });
          }
          userIds.push(uid);
        }
      } else {
        console.error('Error creating auth user:', authError);
      }
    } else {
      const uid = authData.user.id;
      // Ensure public.users exists
      await supabase.from('users').insert({
        id: uid,
        email: u.email,
        display_name: u.name,
        avatar_url: `https://ui-avatars.com/api/?name=${u.name}&background=random`
      });
      userIds.push(uid);
      console.log(`Created user ${u.email}`);
    }
  }
  return userIds;
}

async function seedCircles(userIds) {
  console.log('Seeding circles...');
  if (userIds.length === 0) return [];

  const { data: circle, error } = await supabase
    .from('circles')
    .insert({
      name: 'Sci-Fi & Fantasy Readers',
      invite_code: 'SCIFI123',
      creator_id: userIds[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating circle:', error);
    return [];
  }

  // Add all users to this circle
  const members = userIds.map(id => ({
    circle_id: circle.id,
    user_id: id
  }));

  await supabase.from('circle_members').insert(members);
  console.log(`Created circle ${circle.name} and added members.`);
  return [circle.id];
}

async function seedBooksAndShelves(userIds) {
  console.log('Fetching real books from API...');
  
  // Let's get some popular books from OpenLibrary
  const queries = ['Harry Potter', 'Dune', '1984', 'The Hobbit', 'Project Hail Mary', 'The Martian'];
  let realBooks = [];
  
  for (const q of queries) {
    const results = await searchBooks(q, 1);
    if (results.length > 0) {
      realBooks.push(results[0]);
    }
  }

  console.log(`Found ${realBooks.length} real books.`);

  console.log('Adding books to shelves...');
  // Distribute books among users
  let i = 0;
  for (const book of realBooks) {
    const userId = userIds[i % userIds.length];
    
    // Some logic for status
    const statuses = [STATUS.FINISHED, STATUS.READING, STATUS.WANT];
    const status = statuses[i % 3];

    try {
      // Find or create in our DB
      const dbBook = await BookModel.findOrCreate(book);
      
      // Add to user shelf (this also triggers feed posts)
      await UserBookService.addBook({
        userId,
        bookData: book,
        status,
        source: SOURCE.SEARCH
      });

      console.log(`Added ${book.title} to user ${userId} as ${status}`);
    } catch (err) {
      if (err.code !== '23505') { // Ignore duplicate key errors if already seeded
        console.error(`Failed to add book ${book.title}:`, err);
      }
    }
    i++;
  }
}

async function main() {
  await clearOldData();
  const userIds = await seedUsers();
  await seedCircles(userIds);
  await seedBooksAndShelves(userIds);
  console.log('Seeding complete! 🎉');
  process.exit(0);
}

main();
