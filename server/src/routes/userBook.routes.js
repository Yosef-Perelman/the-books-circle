import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCircleMember } from '../middleware/requireCircleMember.js';
import { addBookCtrl, getUserBooksCtrl } from '../controllers/userBook.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', addBookCtrl);
router.get('/', getUserBooksCtrl);

export default router;
