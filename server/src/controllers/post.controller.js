import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as PostModel from '../models/post.model.js';
import * as CircleModel from '../models/circle.model.js';
import * as UserBookService from '../services/userBook.service.js';
import { STATUS, SOURCE } from '../utils/constants.js';

// Posts carry a post id, not a circle id, so requireCircleMember can't sit on
// these routes directly — resolve the post's circle and check membership by
// hand. 404, not 403: never confirm a post/circle exists to a non-member.
async function assertCanAccessPost(postId, userId) {
  const circleId = await PostModel.getPostCircleId(postId);
  if (!circleId) {
    throw new ApiError(404, 'NOT_FOUND', 'Post not found.');
  }
  const member = await CircleModel.isMember(circleId, userId);
  if (!member) {
    throw new ApiError(404, 'NOT_FOUND', 'Post not found.');
  }
  return circleId;
}

export const getPostsCtrl = asyncHandler(async (req, res) => {
  const { circleId, offset = 0, limit = 10 } = req.query;
  if (!circleId) {
    throw new ApiError(400, 'BAD_REQUEST', 'A circle is required.');
  }
  const member = await CircleModel.isMember(circleId, req.user.id);
  if (!member) {
    throw new ApiError(404, 'NOT_FOUND', 'Circle not found.');
  }
  const posts = await PostModel.getFeed(circleId, req.user.id, Number(offset), Number(limit));
  res.json({ data: posts });
});

export const toggleReactionCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await assertCanAccessPost(id, userId);
  const reacted = await PostModel.toggleReaction(id, userId);
  res.json({ data: { reacted } });
});

export const getCommentsCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await assertCanAccessPost(id, req.user.id);
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

  await assertCanAccessPost(id, userId);
  const comment = await PostModel.addComment(id, userId, content.trim());
  res.status(201).json({ data: comment });
});

export const createPostCtrl = asyncHandler(async (req, res) => {
  const { type, content, book, userBookId, rating, circleId } = req.body;
  const userId = req.user.id;

  if (!type || !['text', 'review'].includes(type)) {
    return res.status(400).json({ error: 'Invalid post type' });
  }

  if (type === 'text' && (!content || !content.trim())) {
    return res.status(400).json({ error: 'Text posts must have content' });
  }

  if (!circleId) {
    return res.status(400).json({ error: 'A circle is required' });
  }
  const member = await CircleModel.isMember(circleId, userId);
  if (!member) {
    throw new ApiError(404, 'NOT_FOUND', 'Circle not found.');
  }

  let finalUserBookId = userBookId || null;

  if (type === 'review') {
    if (!finalUserBookId && !book) {
      return res.status(400).json({ error: 'Review posts must include a book or userBookId' });
    }

    if (!finalUserBookId && book) {
      try {
        const added = await UserBookService.addBook({
          userId,
          bookData: book,
          status: STATUS.WANT, // Just attach to shelf if not present
          source: SOURCE.MANUAL,
          rating: rating || null
        });
        finalUserBookId = added.userBook.id;
      } catch (err) {
        // If it's a 409 conflict, it means they already have it! We need to find their user_book_id
        if (err.status === 409) {
          const userBooks = await UserBookService.getUserBooks(userId);
          const existing = userBooks.find(ub => ub.book.apiId === book.apiId);
          if (existing) {
            finalUserBookId = existing.id;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    if (finalUserBookId && rating) {
      await UserBookService.updateRating(finalUserBookId, userId, rating);
    }
  }

  await PostModel.createPost({
    circleId,
    userId,
    type,
    content: content ? content.trim() : null,
    userBookId: finalUserBookId
  });

  res.status(201).json({ data: { success: true } });
});

export const deletePostCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await PostModel.deletePost(id, userId);
  res.json({ data: { success: true } });
});
