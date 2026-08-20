import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCircleMember } from '../middleware/requireCircleMember.js';
import { getMyCirclesCtrl, getLeaderboardCtrl, getMembersCtrl, createCircleCtrl, joinCircleCtrl, leaveCircleCtrl, getCircleByIdCtrl, joinCircleByIdCtrl } from '../controllers/circle.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/my', getMyCirclesCtrl);
router.get('/:id/leaderboard', requireCircleMember, getLeaderboardCtrl);
router.get('/:id/members', requireCircleMember, getMembersCtrl);

router.get('/:id', requireCircleMember, getCircleByIdCtrl);
router.post('/', createCircleCtrl);
router.post('/join', joinCircleCtrl);
router.post('/:id/join', joinCircleByIdCtrl);
router.delete('/:id/leave', leaveCircleCtrl);

export default router;
