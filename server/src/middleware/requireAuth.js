import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'You need to be signed in.');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'You need to be signed in.');
    }

    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
    }

    // Attach verified user to request, including what's needed to provision public.users
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    };
    next();
  } catch (err) {
    next(err);
  }
};
