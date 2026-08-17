import { ApiError } from '../utils/ApiError.js';
import * as CircleModel from '../models/circle.model.js';
import * as ReactionModel from '../models/reaction.model.js';

// requireCircleMember can't help here — the route only carries a post id, not
// a circle id — so likes resolve and check membership by hand.
async function assertCircleAccess(postId, userId) {
  const circleId = await ReactionModel.findCircleIdForPost(postId);
  if (!circleId || !(await CircleModel.isMember(circleId, userId))) {
    // 404, not 403 — same rule as requireCircleMember: never reveal a post
    // in a circle you're not in.
    throw new ApiError(404, 'NOT_FOUND', 'Post not found.');
  }
}

export async function likePost(postId, userId) {
  await assertCircleAccess(postId, userId);
  await ReactionModel.add(postId, userId);
  const likeCount = await ReactionModel.countForPost(postId);
  return { likeCount, likedByMe: true };
}

export async function unlikePost(postId, userId) {
  await assertCircleAccess(postId, userId);
  await ReactionModel.remove(postId, userId);
  const likeCount = await ReactionModel.countForPost(postId);
  return { likeCount, likedByMe: false };
}
