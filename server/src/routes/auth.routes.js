import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(authController.getMe));

export default router;
