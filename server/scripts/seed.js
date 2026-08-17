// Seeds demo data into ONE circle: books, user_books, reviews, and the
// matching feed posts, with finished_at spread across months so the
// leaderboard's monthly/yearly toggle actually looks different.
//
// Usage: npm run seed -- F1-8KZQ
//
// Safe to re-run: skips any member who already has user_books rows, and
// upserts books by isbn — so it won't duplicate or clobber real data once
// POST /api/user-books is live.

import { supabase } from '../src/config/supabase.js';
import * as CircleModel from '../src/models/circle.model.js';
import * as PostModel from '../src/models/post.model.js';
import { STATUS, SOURCE, POST_TYPE } from '../src/utils/constants.js';

const SEED_BOOKS = [
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', pageCount: 310, isbn: '9780547928227' },
  { title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', genre: 'Fantasy', pageCount: 309, isbn: '9780590353427' },
  { title: '1984', author: 'George Orwell', genre: 'Dystopian', pageCount: 328, isbn: '9780451524935' },
  { title: 'Educated', author: 'Tara Westover', genre: 'Memoir', pageCount: 334, isbn: '9780399590504' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', pageCount: 412, isbn: '9780441013593' },
  { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', pageCount: 336, isbn: '9781250301697' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-fiction', pageCount: 443, isbn: '9780062316097' },
  { title: 'The Night Circus', author: 'Erin Morgenstern', genre: 'Fantasy', pageCount: 387, isbn: '9780307744432' }
];

const SAMPLE_ARTICLE =
  'A cosy, unhurried read that earns every one of its chapters. The pacing dips in the middle third, ' +
  'but the ending pulls everything together in a way that feels inevitable rather than convenient. Recommended.';

function monthsAgoIso(monthsBack, dayOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(d.getDate() - dayOffset);
  return d.toISOString();
}

// find-then-insert, not upsert: books.isbn's unique index is partial
// (`where isbn is not null`), which a plain ON CONFLICT (isbn) can't target.
// Matches the dedup order in database.md's "Book deduplication rule".
async function findOrCreateBook(book) {
  const { data: existing, error: findError } = await supabase
    .from('books')
    .select('*')
    .eq('isbn', book.isbn)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('books')
    .insert({ title: book.title, author: book.author, genre: book.genre, page_count: book.pageCount, isbn: book.isbn })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function memberAlreadySeeded(userId) {
  const { count, error } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function insertUserBook({ userId, bookId, status, startedAt, finishedAt }) {
  const { data, error } = await supabase
    .from('user_books')
    .insert({
      user_id: userId,
      book_id: bookId,
      status,
      source: SOURCE.MANUAL,
      started_at: startedAt,
      finished_at: finishedAt
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function insertReview(userBookId, rating) {
  const { error } = await supabase
    .from('reviews')
    .insert({ user_book_id: userBookId, rating, qa_json: [], article_text: SAMPLE_ARTICLE });

  if (error) throw error;
}

// added -> started -> finished (with a review), `monthsBack` months ago, so
// monthly vs all-time leaderboard periods actually differ.
async function seedFinishedBook(circleId, userId, book, monthsBack) {
  const userBook = await insertUserBook({
    userId,
    bookId: book.id,
    status: STATUS.FINISHED,
    startedAt: monthsAgoIso(monthsBack, 5),
    finishedAt: monthsAgoIso(monthsBack)
  });
  const rating = 4 + Math.round(Math.random()) / 2; // 4 or 4.5
  await insertReview(userBook.id, rating);
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.ADDED, userBookId: userBook.id });
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.STARTED, userBookId: userBook.id });
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.FINISHED, userBookId: userBook.id });
}

async function seedReadingBook(circleId, userId, book) {
  const userBook = await insertUserBook({
    userId,
    bookId: book.id,
    status: STATUS.READING,
    startedAt: monthsAgoIso(0, 2),
    finishedAt: null
  });
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.ADDED, userBookId: userBook.id });
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.STARTED, userBookId: userBook.id });
}

async function seedWantBook(circleId, userId, book) {
  const userBook = await insertUserBook({
    userId,
    bookId: book.id,
    status: STATUS.WANT,
    startedAt: null,
    finishedAt: null
  });
  await PostModel.createPost({ circleId, userId, type: POST_TYPE.ADDED, userBookId: userBook.id });
}

async function run() {
  const inviteCode = process.argv[2];
  if (!inviteCode) {
    console.error('Usage: npm run seed -- <INVITE-CODE>');
    process.exit(1);
  }

  const circle = await CircleModel.findByInviteCode(inviteCode);
  if (!circle) {
    console.error(`No circle found with code ${inviteCode}`);
    process.exit(1);
  }

  const members = await CircleModel.listMembers(circle.id);
  if (members.length === 0) {
    console.error('That circle has no members yet — join it first.');
    process.exit(1);
  }

  console.log(`Seeding "${circle.name}" (${members.length} member${members.length === 1 ? '' : 's'})...`);

  const books = [];
  for (const book of SEED_BOOKS) {
    books.push(await findOrCreateBook(book));
  }

  for (let m = 0; m < members.length; m += 1) {
    const member = members[m];

    if (await memberAlreadySeeded(member.id)) {
      console.log(`  ${member.displayName}: already has books, skipping`);
      continue;
    }

    // Rotate which books each member gets — 5 distinct offsets out of 8
    // books never collide, so no member gets the same book twice.
    const finishedThisMonth = books[m % books.length];
    const finishedLastMonth = books[(m + 1) % books.length];
    const finishedTwoMonthsAgo = books[(m + 2) % books.length];
    const reading = books[(m + 3) % books.length];
    const want = books[(m + 4) % books.length];

    await seedFinishedBook(circle.id, member.id, finishedThisMonth, 0);
    await seedFinishedBook(circle.id, member.id, finishedLastMonth, 1);
    await seedFinishedBook(circle.id, member.id, finishedTwoMonthsAgo, 2);
    await seedReadingBook(circle.id, member.id, reading);
    await seedWantBook(circle.id, member.id, want);

    console.log(`  ${member.displayName}: seeded 5 books, 3 finished across 3 months`);
  }

  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
