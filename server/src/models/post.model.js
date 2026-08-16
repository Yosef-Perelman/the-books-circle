import { supabase } from '../config/supabase.js';
import * as CircleModel from './circle.model.js';

function mapPost(row) {
  return {
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    type: row.type,
    userBookId: row.user_book_id,
    createdAt: row.created_at
  };
}

export async function createPost({ circleId, userId, type, userBookId = null }) {
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ circle_id: circleId, user_id: userId, type, user_book_id: userBookId })
    .select()
    .single();

  if (error) throw error;
  return mapPost(data);
}

// Posts a `finished_at`/`started_at`/etc event once per circle the user belongs
// to. In MVP a user has one active circle, but this keeps multi-circle free.
export async function createPostForAllCircles({ userId, type, userBookId = null }) {
  const circles = await CircleModel.findByUser(userId);
  return Promise.all(
    circles.map((c) => createPost({ circleId: c.id, userId, type, userBookId }))
  );
}
