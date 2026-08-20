import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { upload } from '../middleware/upload.js';
import { searchBooks, getExplore, getBookDetails, searchAuthorsCtrl, getAuthorDetailsCtrl, getBookReviewsCtrl, scanBookCoverCtrl } from '../controllers/book.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/explore', getExplore);
router.get('/search', searchBooks);
router.post('/scan', upload.single('image'), scanBookCoverCtrl);
router.get('/authors/search', searchAuthorsCtrl);
router.get('/authors/:id', getAuthorDetailsCtrl);
router.get('/:id', getBookDetails);
router.get('/:id/reviews', getBookReviewsCtrl);

export default router;
