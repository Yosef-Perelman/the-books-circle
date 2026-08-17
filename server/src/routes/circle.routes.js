import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCircleMember } from '../middleware/requireCircleMember.js';
import { validate } from '../middleware/validate.js';
import * as circleController from '../controllers/circle.controller.js';
import { createCircleSchema, joinCircleSchema, leaderboardQuerySchema } from '../schemas/circle.schema.js';

const router = Router();

// requireCircleMember reads :id, so it only belongs on the :id route below —
// on '/' or '/join' there's no :id yet and it would 400.
router.post('/', requireAuth, validate(createCircleSchema), asyncHandler(circleController.create));
router.post('/join', requireAuth, validate(joinCircleSchema), asyncHandler(circleController.join));
router.get('/:id', requireAuth, requireCircleMember, asyncHandler(circleController.getOne));
router.get('/:id/feed', requireAuth, requireCircleMember, asyncHandler(circleController.getFeed));
router.get(
  '/:id/leaderboard',
  requireAuth,
  requireCircleMember,
  validate(leaderboardQuerySchema, 'query'),
  asyncHandler(circleController.getLeaderboard)
);

export default router;
