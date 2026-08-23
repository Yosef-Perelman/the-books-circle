import { supabase } from '../config/supabase.js';
import * as BookModel from '../models/book.model.js';
import * as PostModel from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { STATUS, POST_TYPE, SOURCE } from '../utils/constants.js';

// Every entry path lands on the shelf as 'want' — no exceptions
// (docs/features/add-book.md). Reading/finished only happen through the
// normal status transition, so there is no 'status' parameter to bypass here.
export async function addBook({ userId, bookData, source = SOURCE.SEARCH, rating = null }) {
  // 1. Resolve or create the catalog book
  const book = await BookModel.findOrCreate(bookData);

  // 2. Insert into user_books
  const { data: userBook, error: insertError } = await supabase
    .from('user_books')
    .insert({
      user_id: userId,
      book_id: book.id,
      status: STATUS.WANT,
      source: source,
      started_at: null,
      finished_at: null,
      rating: rating
    })
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation (user already added this book)
    if (insertError.code === '23505') {
      throw new ApiError(409, 'CONFLICT', 'You already have this book on your shelf.');
    }
    throw insertError;
  }

  // 3. Create the 'added' feed post for all circles the user is in
  await PostModel.createPostForAllCircles({
    userId,
    type: POST_TYPE.ADDED,
    userBookId: userBook.id
  });

  return { userBook, book };
}

export async function updateRating(userBookId, userId, rating) {
  const { error } = await supabase
    .from('user_books')
    .update({ rating })
    .eq('id', userBookId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function updateStatus(userBookId, userId, status) {
  // 'finished' is rejected by the controller before this runs — the only path
  // to that status is publishReview(), which posts the review itself.
  const updates = { status };
  if (status === STATUS.READING) updates.started_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_books')
    .update(updates)
    .eq('id', userBookId)
    .eq('user_id', userId);

  if (error) throw error;

  // Create a new post for status change
  await PostModel.createPostForAllCircles({
    userId,
    type: status === STATUS.READING ? POST_TYPE.STARTED : POST_TYPE.ADDED,
    userBookId
  });

  return true;
}

// The only path to a 'finished' status. Posts the review to every circle the
// user belongs to (same reach as 'added'/'started'), then flips the status —
// posting first means a failed status flip leaves a visible, recoverable
// review rather than a silently "finished" book with no announcement.
export async function publishReview({ userBookId, userId, content }) {
  const { data: userBook, error: fetchError } = await supabase
    .from('user_books')
    .select('id, user_id')
    .eq('id', userBookId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!userBook || userBook.user_id !== userId) {
    throw new ApiError(404, 'NOT_FOUND', 'Book not found.');
  }

  const posts = await PostModel.createPostForAllCircles({
    userId,
    type: POST_TYPE.REVIEW,
    content,
    userBookId
  });

  const { error: updateError } = await supabase
    .from('user_books')
    .update({ status: STATUS.FINISHED, finished_at: new Date().toISOString() })
    .eq('id', userBookId)
    .eq('user_id', userId);

  if (updateError) {
    // Compensating action: no multi-statement transaction over the Supabase
    // JS client, so undo the posts rather than leave a review with a stale status.
    await Promise.all(posts.map((p) => supabase.from('feed_posts').delete().eq('id', p.id)));
    throw updateError;
  }

  return { posts };
}

export async function removeBook(userBookId, userId) {
  const { error } = await supabase
    .from('user_books')
    .delete()
    .eq('id', userBookId)
    .eq('user_id', userId);
    
  if (error) throw error;
  return true;
}

export async function getUserBooks(userId) {
  const { data, error } = await supabase
    .from('user_books')
    .select(`
      id,
      status,
      rating,
      started_at,
      finished_at,
      books (
        id,
        title,
        author,
        genre,
        page_count,
        cover_url,
        api_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(ub => ({
    id: ub.id, // The user_book id (useful for reviews/status changes)
    status: ub.status,
    rating: ub.rating,
    book: {
      id: ub.books.id,
      title: ub.books.title,
      author: ub.books.author,
      genre: ub.books.genre,
      pageCount: ub.books.page_count,
      coverUrl: ub.books.cover_url,
      apiId: ub.books.api_id
    }
  }));
}
