import { asyncHandler } from '../utils/asyncHandler.js';
import * as CircleModel from '../models/circle.model.js';

export const getMyCirclesCtrl = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const circles = await CircleModel.findByUser(userId);
  console.log('getMyCircles called for user:', userId, 'Found:', circles);
  res.json({ data: circles });
});

export const getLeaderboardCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const members = await CircleModel.getMembers(id);
  
  // Create a pseudo-random but deterministic leaderboard based on real members for MVP
  const mappedMembers = members.map((m, index) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl,
    score: (members.length - index) * 5 + 2 // Fake score
  })).sort((a, b) => b.score - a.score);
  
  res.json({ data: mappedMembers });
});

export const getMembersCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const members = await CircleModel.getMembers(id);
  res.json({ data: members });
});

export const createCircleCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Circle name is required' });
  }
  const circle = await CircleModel.createCircle(name.trim(), req.user.id);
  res.status(201).json({ data: circle });
});

export const joinCircleCtrl = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode || inviteCode.trim() === '') {
    return res.status(400).json({ error: 'Invite code is required' });
  }
  try {
    const circle = await CircleModel.joinCircle(inviteCode.trim(), req.user.id);
    res.json({ data: circle });
  } catch (err) {
    if (err.message === 'Invalid invite code' || err.message === 'Already a member of this circle') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

export const leaveCircleCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await CircleModel.leaveCircle(id, req.user.id);
  res.json({ data: { success: true } });
});

export const getCircleByIdCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const circle = await CircleModel.getCircleById(id);
  res.json({ data: circle });
});

export const joinCircleByIdCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const circle = await CircleModel.joinCircleById(id, req.user.id);
    res.json({ data: circle });
  } catch (err) {
    if (err.message === 'Circle not found' || err.message === 'Already a member of this circle') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});
