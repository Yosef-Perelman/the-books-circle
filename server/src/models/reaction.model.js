import { supabase } from '../config/supabase.js';

// unique (post_id, user_id) makes this idempotent — a repeat like is a
// no-op success, not an error. Mirrors circle.model.addMember's 23505 handling.
export async function add(postId, userId) {
  const { error } = await supabase
    .from('reactions')
    .insert({ post_id: postId, user_id: userId });

  if (error && error.code !== '23505') throw error;
}

export async function remove(postId, userId) {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function countForPost(postId) {
  const { count, error } = await supabase
    .from('reactions')
    .select('user_id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count ?? 0;
}

export async function hasLiked(postId, userId) {
  const { data, error } = await supabase
    .from('reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Authorization needs the post's circle before it can check membership —
// there's no requireCircleMember here since the route only carries a post id.
export async function findCircleIdForPost(postId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('circle_id')
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  return data?.circle_id ?? null;
}
