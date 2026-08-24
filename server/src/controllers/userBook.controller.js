import { asyncHandler } from '../utils/asyncHandler.js';
import * as UserBookService from '../services/userBook.service.js';
import * as GeminiApi from '../integrations/gemini.js';
import * as BookModel from '../models/book.model.js';
import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { STATUS } from '../utils/constants.js';

export const addBookCtrl = asyncHandler(async (req, res) => {
  const { book, source } = req.body;
  const userId = req.user.id;

  const result = await UserBookService.addBook({
    userId,
    bookData: book,
    source
  });

  res.status(201).json({ data: result });
});

export const getUserBooksCtrl = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user.id;
  const books = await UserBookService.getUserBooks(userId);
  res.json({ data: books });
});
export const updateStatusCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (status === STATUS.FINISHED) {
    throw new ApiError(400, 'BAD_REQUEST', 'Finishing a book requires completing the review interview.');
  }

  await UserBookService.updateStatus(id, userId, status);
  res.json({ message: 'Status updated' });
});

export const publishReviewCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'BAD_REQUEST', 'Review content is required.');
  }

  const result = await UserBookService.publishReview({ userBookId: id, userId, content: content.trim() });
  res.status(201).json({ data: result });
});

export const updateRatingCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;
  await UserBookService.updateRating(id, userId, rating);
  res.json({ message: 'Rating updated' });
});

export const removeBookCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await UserBookService.removeBook(id, userId);
  res.json({ message: 'Book removed' });
});

export const getInterviewQuestionsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Fetch book details
  const { data: userBook } = await supabase
    .from('user_books')
    .select('book_id, books (title, author, genre)')
    .eq('id', id)
    .single();

  if (!userBook) {
    return res.status(404).json({ error: 'User book not found' });
  }

  const questions = await GeminiApi.generateInterviewQuestions({
    title: userBook.books.title,
    author: userBook.books.author,
    genre: userBook.books.genre
  });

  res.json({ data: questions });
});

export const generateReviewCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qa } = req.body;
  const userId = req.user.id;

  // Fetch user and book details
  const { data: userBook } = await supabase
    .from('user_books')
    .select('rating, books (title, author, genre)')
    .eq('id', id)
    .single();

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  if (!userBook || !profile) {
    return res.status(404).json({ error: 'Not found' });
  }

  const article = await GeminiApi.generateReviewArticle({
    title: userBook.books.title,
    author: userBook.books.author,
    genre: userBook.books.genre,
    displayName: profile.display_name,
    rating: userBook.rating || 0,
    qa
  });

  res.json({ data: article });
});
