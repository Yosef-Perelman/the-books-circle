import { apiClient } from './client.js';

export const feedApi = {
  getFeed: (circleId) => apiClient(`/circles/${encodeURIComponent(circleId)}/feed`),
  likePost: (postId) => apiClient(`/posts/${encodeURIComponent(postId)}/like`, { body: {} }),
  // apiClient infers POST whenever a body is present, so DELETE needs to be explicit.
  unlikePost: (postId) => apiClient(`/posts/${encodeURIComponent(postId)}/like`, { method: 'DELETE' })
};
