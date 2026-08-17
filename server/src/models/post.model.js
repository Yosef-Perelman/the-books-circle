import { supabase } from '../config/supabase.js';
import * as CircleModel from './circle.model.js';
import { POST_TYPE } from '../utils/constants.js';

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

function mapFeedRow(row, viewerId) {
  const userBook = row.user_book && {
    id: row.user_book.id,
    status: row.user_book.status,
    source: row.user_book.source,
    startedAt: row.user_book.started_at,
    finishedAt: row.user_book.finished_at,
    book: row.user_book.book && {
      id: row.user_book.book.id,
      title: row.user_book.book.title,
      author: row.user_book.book.author,
      genre: row.user_book.book.genre,
      pageCount: row.user_book.book.page_count,
      coverUrl: row.user_book.book.cover_url,
      isbn: row.user_book.book.isbn
    },
    review: row.user_book.review && {
      rating: row.user_book.review.rating,
      articleText: row.user_book.review.article_text
    }
  };

  return {
    id: row.id,
    type: row.type,
    createdAt: row.created_at,
    user: {
      id: row.user.id,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url
    },
    userBook,
    // Raw reaction rows never leave the model — who liked what is not the
    // client's business. See features/feed.md.
    likeCount: row.reactions.length,
    likedByMe: row.reactions.some((r) => r.user_id === viewerId),
    commentCount: row.comments.length
  };
}

export async function createPost({ circleId, userId, type, userBookId = null }) {
  if (!Object.values(POST_TYPE).includes(type)) {
    throw new Error(`Invalid post type: ${type}`);
  }

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ circle_id: circleId, user_id: userId, type, user_book_id: userBookId })
    .select()
    .single();

  if (error) throw error;
  return mapPost(data);
}

export async function findByCircle(circleId, viewerId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(`
      id, type, created_at,
      user:users ( id, display_name, avatar_url ),
      user_book:user_books (
        id, status, source, started_at, finished_at,
        book:books ( id, title, author, genre, page_count, cover_url, isbn ),
        review:reviews ( rating, article_text )
      ),
      reactions ( user_id ),
      comments ( id )
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map((row) => mapFeedRow(row, viewerId));
}

// Posts a `finished_at`/`started_at`/etc event once per circle the user belongs
// to. In MVP a user has one active circle, but this keeps multi-circle free.
export async function createPostForAllCircles({ userId, type, userBookId = null }) {
  const circles = await CircleModel.findByUser(userId);
  return Promise.all(
    circles.map((c) => createPost({ circleId: c.id, userId, type, userBookId }))
  );
}
