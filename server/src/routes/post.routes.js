import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getPostsCtrl, toggleReactionCtrl, getCommentsCtrl, addCommentCtrl, createPostCtrl, deletePostCtrl } from '../controllers/post.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getPostsCtrl);
router.post('/', createPostCtrl);
router.delete('/:id', deletePostCtrl);
router.post('/:id/react', toggleReactionCtrl);
router.get('/:id/comments', getCommentsCtrl);
router.post('/:id/comments', addCommentCtrl);

export default router;
