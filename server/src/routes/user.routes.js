import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getUserCtrl, getUserCirclesCtrl, getUserPostsCtrl } from '../controllers/user.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/:id', getUserCtrl);
router.get('/:id/circles', getUserCirclesCtrl);
router.get('/:id/posts', getUserPostsCtrl);

export default router;
