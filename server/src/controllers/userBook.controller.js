import { asyncHandler } from '../utils/asyncHandler.js';
import * as UserBookService from '../services/userBook.service.js';

export const addBookCtrl = asyncHandler(async (req, res) => {
  const { book, status, source } = req.body;
  const userId = req.user.id;

  const result = await UserBookService.addBook({
    userId,
    bookData: book,
    status,
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
  await UserBookService.updateStatus(id, userId, status);
  res.json({ message: 'Status updated' });
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
