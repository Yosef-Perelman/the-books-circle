import { searchBooks as searchGoogleBooks, getExploreBooks, getBookById, searchAuthors, getAuthorDetails } from '../integrations/googleBooks.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as PostModel from '../models/post.model.js';

export const searchBooks = asyncHandler(async (req, res) => {
  const query = req.query.q;
  
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  const results = await searchGoogleBooks(query.trim());
  
  res.json({ data: results });
});

export const getExplore = asyncHandler(async (req, res) => {
  const data = await getExploreBooks();
  res.json({ data });
});

export const getBookDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const book = await getBookById(id);
  res.json({ data: { book } });
});

export const searchAuthorsCtrl = asyncHandler(async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({ data: [] });
  }
  const results = await searchAuthors(query.trim());
  res.json({ data: results });
});

export const getAuthorDetailsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const author = await getAuthorDetails(id);
  res.json({ data: { author } });
});

export const getBookReviewsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviews = await PostModel.getBookReviews(id);
  res.json({ data: reviews });
});
