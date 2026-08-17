import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getMyCirclesCtrl, getLeaderboardCtrl, getMembersCtrl, createCircleCtrl, joinCircleCtrl, leaveCircleCtrl } from '../controllers/circle.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/my', getMyCirclesCtrl);
router.get('/:id/leaderboard', getLeaderboardCtrl);
router.get('/:id/members', getMembersCtrl);

router.post('/', createCircleCtrl);
router.post('/join', joinCircleCtrl);
router.delete('/:id/leave', leaveCircleCtrl);

export default router;
