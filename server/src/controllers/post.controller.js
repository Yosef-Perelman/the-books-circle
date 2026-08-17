import { asyncHandler } from '../utils/asyncHandler.js';
import * as PostModel from '../models/post.model.js';

export const getPostsCtrl = asyncHandler(async (req, res) => {
  const { circleId, offset = 0, limit = 10 } = req.query;
  const posts = await PostModel.getFeed(circleId || 'global', req.user.id, Number(offset), Number(limit));
  res.json({ data: posts });
});

export const toggleReactionCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const reacted = await PostModel.toggleReaction(id, userId);
  res.json({ data: { reacted } });
});

export const getCommentsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await PostModel.getComments(id);
  res.json({ data: comments });
});

export const addCommentCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const comment = await PostModel.addComment(id, userId, content.trim());
  res.status(201).json({ data: comment });
});
