import { asyncHandler } from '../utils/asyncHandler.js';
import { supabase } from '../config/supabase.js';

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
