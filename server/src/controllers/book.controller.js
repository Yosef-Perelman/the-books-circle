import { searchBooks as searchGoogleBooks, getExploreBooks, getBookById, searchAuthors, getAuthorDetails } from '../integrations/googleBooks.js';
import { readBookCover } from '../integrations/gemini.js';
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

export const scanBookCoverCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'BAD_REQUEST', 'An image is required.');
  }

  const identified = await readBookCover(req.file.buffer, req.file.mimetype);
  if (!identified) {
    return res.json({ data: { candidate: null } });
  }

  // Enrich with metadata via a title+author lookup; fall back to the bare
  // Gemini read if nothing comes back — a partial match still lets the user
  // confirm the details by hand instead of losing the scan entirely.
  let enriched = null;
  try {
    const query = [identified.title, identified.author].filter(Boolean).join(' ');
    const results = await searchGoogleBooks(query, 1);
    enriched = results[0] ?? null;
  } catch (err) {
    console.error('Book lookup after scan failed:', err);
  }

  res.json({
    data: {
      candidate: {
        title: enriched?.title || identified.title,
        author: enriched?.author || identified.author,
        genre: enriched?.genre ?? null,
        pageCount: enriched?.pageCount ?? null,
        coverUrl: enriched?.coverUrl ?? null,
        isbn: enriched?.isbn ?? null,
        publishedDate: enriched?.publishedDate ?? null
      }
    }
  });
});

export const getBookReviewsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviews = await PostModel.getBookReviews(id);
  res.json({ data: reviews });
});
