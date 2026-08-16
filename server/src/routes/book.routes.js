import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { searchBooks, getExplore, getBookDetails, searchAuthorsCtrl, getAuthorDetailsCtrl } from '../controllers/book.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/explore', getExplore);
router.get('/search', searchBooks);
router.get('/authors/search', searchAuthorsCtrl);
router.get('/authors/:id', getAuthorDetailsCtrl);
router.get('/:id', getBookDetails);

export default router;
