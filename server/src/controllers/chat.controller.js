import { asyncHandler } from '../utils/asyncHandler.js';
import * as AIService from '../services/ai.service.js';
import * as UserModel from '../models/user.model.js'; // to get displayName if we have a model for it. Actually we don't have user.model.js exported yet.
import { supabase } from '../config/supabase.js';

export const handleChatCtrl = asyncHandler(async (req, res) => {
  const { history } = req.body;
  const userId = req.user.id;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Valid history array is required' });
  }

  // Get user's display name for personalized prompt
  const { data: user } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  const displayName = user?.display_name || 'the user';

  try {
    const result = await AIService.processChat(history, userId, displayName);
    res.json({ data: result });
  } catch (err) {
    console.error('Chat processing error:', err);
    res.status(500).json({ error: 'Failed to process chat with AI Assistant' });
  }
});
