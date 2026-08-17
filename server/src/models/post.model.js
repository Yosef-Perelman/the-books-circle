import { supabase } from '../config/supabase.js';
import * as CircleModel from './circle.model.js';

function mapPost(row) {
  return {
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    type: row.type,
    content: row.content,
    userBookId: row.user_book_id,
    createdAt: row.created_at
  };
}

export async function createPost({ circleId, userId, type, content = null, userBookId = null }) {
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ circle_id: circleId, user_id: userId, type, content, user_book_id: userBookId })
    .select()
    .single();

  if (error) throw error;
  return mapPost(data);
}

// to. In MVP a user has one active circle, but this keeps multi-circle free.
export async function createPostForAllCircles({ userId, type, content = null, userBookId = null }) {
  const circles = await CircleModel.findByUser(userId);
  return Promise.all(
    circles.map((c) => createPost({ circleId: c.id, userId, type, content, userBookId }))
  );
}

export async function getFeed(circleId, currentUserId, offset = 0, limit = 10) {
  let query = supabase
    .from('feed_posts')
    .select(`
      id,
      type,
      content,
      created_at,
      circles:circle_id (id, name),
      users:user_id (id, display_name, avatar_url),
      user_books:user_book_id (
        id, status,
        books (id, title, author, cover_url, api_id)
      ),
      reactions (user_id),
      comments (id)
    `);

  if (circleId !== 'global') {
    query = query.eq('circle_id', circleId);
  } else {
    // For global feed, get all circles the user is in
    const circles = await CircleModel.findByUser(currentUserId);
    const circleIds = circles.map(c => c.id);
    if (circleIds.length > 0) {
      query = query.in('circle_id', circleIds);
    } else {
      // User is not in any circles, return empty feed
      return [];
    }
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  return data.map(row => ({
    id: row.id,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
    circle: row.circles ? {
      id: row.circles.id,
      name: row.circles.name
    } : null,
    user: row.users ? {
      id: row.users.id,
      name: row.users.display_name,
      avatarUrl: row.users.avatar_url
    } : null,
    userBook: row.user_books ? {
      id: row.user_books.id,
      status: row.user_books.status,
      book: row.user_books.books ? {
        id: row.user_books.books.id,
        title: row.user_books.books.title,
        author: row.user_books.books.author,
        coverUrl: row.user_books.books.cover_url,
        apiId: row.user_books.books.api_id
      } : null
    } : null,
    reactionsCount: row.reactions ? row.reactions.length : 0,
    commentsCount: row.comments ? row.comments.length : 0,
    userReacted: row.reactions ? row.reactions.some(r => r.user_id === currentUserId) : false
  }));
}

export async function toggleReaction(postId, userId) {
  // Check if exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('reactions').insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function getComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      users:user_id (id, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  return data.map(row => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    user: row.users ? {
      id: row.users.id,
      name: row.users.display_name,
      avatarUrl: row.users.avatar_url
    } : null
  }));
}

export async function addComment(postId, userId, content) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      id,
      content,
      created_at,
      users:user_id (id, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    content: data.content,
    createdAt: data.created_at,
    user: data.users ? {
      id: data.users.id,
      name: data.users.display_name,
      avatarUrl: data.users.avatar_url
    } : null
  };
}
