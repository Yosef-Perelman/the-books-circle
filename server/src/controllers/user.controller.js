import { asyncHandler } from '../utils/asyncHandler.js';
import { supabase } from '../config/supabase.js';
import * as CircleModel from '../models/circle.model.js';
import * as PostModel from '../models/post.model.js';

export const getUserCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ data });
});

export const getUserCirclesCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const circles = await CircleModel.findByUser(id);
  res.json({ data: circles });
});

export const getUserPostsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { offset = 0, limit = 10 } = req.query;
  const posts = await PostModel.getFeedByUser(id, req.user.id, Number(offset), Number(limit));
  res.json({ data: posts });
});
