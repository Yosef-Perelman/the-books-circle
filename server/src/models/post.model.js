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

export async function deletePost(postId, userId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function searchReviews(bookTitleQuery) {
  // First, find books matching the title
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id')
    .ilike('title', `%${bookTitleQuery}%`);
    
  if (booksError) throw booksError;
  const bookIds = books.map(b => b.id);
  if (bookIds.length === 0) return [];
  
  // Get user_books tied to these books
  const { data: userBooks, error: ubError } = await supabase
    .from('user_books')
    .select('id')
    .in('book_id', bookIds);
    
  if (ubError) throw ubError;
  const userBookIds = userBooks.map(ub => ub.id);
  if (userBookIds.length === 0) return [];
  
  // Find review posts
  const { data: posts, error: postsError } = await supabase
    .from('feed_posts')
    .select(`
      id, content, created_at,
      users:user_id (display_name),
      user_books:user_book_id (rating, books (title, author))
    `)
    .eq('type', 'review')
    .in('user_book_id', userBookIds)
    .limit(5);
    
  if (postsError) throw postsError;
  
  return posts.map(p => ({
    reviewer: p.users?.display_name || 'Anonymous',
    bookTitle: p.user_books?.books?.title,
    author: p.user_books?.books?.author,
    rating: p.user_books?.rating,
    reviewContent: p.content,
    date: p.created_at
  }));
}

export async function getBookReviews(bookApiId) {
  // First, find the internal book id for the given API ID
  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('api_id', bookApiId)
    .single();

  if (!book) return [];

  // Get user_books tied to this book
  const { data: userBooks } = await supabase
    .from('user_books')
    .select('id')
    .eq('book_id', book.id);
    
  if (!userBooks || userBooks.length === 0) return [];
  const userBookIds = userBooks.map(ub => ub.id);
  
  // Find review posts
  const { data: posts, error } = await supabase
    .from('feed_posts')
    .select(`
      id, content, created_at,
      circles:circle_id (id, name),
      users:user_id (id, display_name, avatar_url),
      user_books:user_book_id (rating)
    `)
    .eq('type', 'review')
    .in('user_book_id', userBookIds)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return posts.map(p => ({
    id: p.id,
    reviewerId: p.users?.id,
    reviewerName: p.users?.display_name || 'Anonymous',
    reviewerAvatar: p.users?.avatar_url,
    circleId: p.circles?.id,
    circleName: p.circles?.name || 'Global',
    rating: p.user_books?.rating,
    content: p.content,
    createdAt: p.created_at
  }));
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
        id, status, rating,
        books (id, title, author, cover_url, api_id)
      ),
      reactions (user_id),
      comments (id)
    `);

  if (circleId !== 'global') {
    query = query.eq('circle_id', circleId);
  } else {
    // For global feed, get all circles the user is in + the real Global circle
    const circles = await CircleModel.findByUser(currentUserId);
    const circleIds = circles.map(c => c.id);
    const globalCircleId = await CircleModel.getOrCreateGlobalCircle(currentUserId);
    
    if (!circleIds.includes(globalCircleId)) {
      circleIds.push(globalCircleId);
    }
    
    query = query.in('circle_id', circleIds);
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
      rating: row.user_books.rating,
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

export async function getFeedByUser(userId, currentUserId, offset = 0, limit = 10) {
  const query = supabase
    .from('feed_posts')
    .select(`
      id,
      type,
      content,
      created_at,
      circles:circle_id (id, name),
      users:user_id (id, display_name, avatar_url),
      user_books:user_book_id (
        id, status, rating,
        books (id, title, author, cover_url, api_id)
      ),
      reactions (user_id),
      comments (id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;
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
      rating: row.user_books.rating,
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
