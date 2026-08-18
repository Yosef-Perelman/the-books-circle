import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCircleMember } from '../middleware/requireCircleMember.js';
import { addBookCtrl, getUserBooksCtrl, updateStatusCtrl, updateRatingCtrl, removeBookCtrl, getInterviewQuestionsCtrl, generateReviewCtrl } from '../controllers/userBook.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', addBookCtrl);
router.get('/', getUserBooksCtrl);
router.patch('/:id/status', updateStatusCtrl);
router.patch('/:id/rating', updateRatingCtrl);
router.delete('/:id', removeBookCtrl);
router.get('/:id/interview/questions', getInterviewQuestionsCtrl);
router.post('/:id/interview/review', generateReviewCtrl);

export default router;
