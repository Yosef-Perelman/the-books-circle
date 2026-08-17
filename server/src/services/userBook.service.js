import { supabase } from '../config/supabase.js';
import * as BookModel from '../models/book.model.js';
import * as PostModel from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { STATUS, POST_TYPE, SOURCE } from '../utils/constants.js';

export async function addBook({ userId, bookData, status = STATUS.WANT, source = SOURCE.SEARCH }) {
  // 1. Resolve or create the catalog book
  const book = await BookModel.findOrCreate(bookData);

  // 2. Insert into user_books
  const { data: userBook, error: insertError } = await supabase
    .from('user_books')
    .insert({
      user_id: userId,
      book_id: book.id,
      status: status,
      source: source,
      started_at: status === STATUS.READING ? new Date().toISOString() : null,
      finished_at: status === STATUS.FINISHED ? new Date().toISOString() : null
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

export async function getUserBooks(userId) {
  const { data, error } = await supabase
    .from('user_books')
    .select(`
      id,
      status,
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
