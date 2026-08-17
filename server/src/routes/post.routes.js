import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import * as postController from '../controllers/post.controller.js';

const router = Router();

// No requireCircleMember here — the route only carries a post id. Circle
// membership is checked inside post.service.js once the post's circle is
// looked up.
router.post('/:id/like', requireAuth, asyncHandler(postController.like));
router.delete('/:id/like', requireAuth, asyncHandler(postController.unlike));

export default router;
