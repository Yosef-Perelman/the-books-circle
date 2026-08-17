import * as CircleService from '../services/circle.service.js';
import * as FeedService from '../services/feed.service.js';
import * as LeaderboardService from '../services/leaderboard.service.js';

export async function create(req, res) {
  const circle = await CircleService.createCircle(req.user.id, req.body.name);
  res.status(201).json({ data: { circle } });
}

export async function join(req, res) {
  const circle = await CircleService.joinCircle(req.user.id, req.body.inviteCode);
  res.status(200).json({ data: { circle } });
}

export async function getOne(req, res) {
  const circle = await CircleService.getCircle(req.circleId);
  res.status(200).json({ data: { circle } });
}

export async function getFeed(req, res) {
  const posts = await FeedService.getCircleFeed(req.circleId, req.user.id);
  res.status(200).json({ data: { posts } });
}

export async function getLeaderboard(req, res) {
  const leaderboard = await LeaderboardService.getLeaderboard(req.circleId, req.validatedQuery.period);
  res.status(200).json({ data: leaderboard });
}
