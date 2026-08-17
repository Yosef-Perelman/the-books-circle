import { apiClient } from './client';

export const postsApi = {
  getPosts: async (circleId, offset = 0, limit = 10) => {
    return await apiClient(`/posts?circleId=${circleId}&offset=${offset}&limit=${limit}`);
  },
  toggleReaction: async (postId) => {
    return await apiClient(`/posts/${postId}/react`, { method: 'POST' });
  },
  getComments: async (postId) => {
    return await apiClient(`/posts/${postId}/comments`);
  },
  addComment: async (postId, content) => {
    return await apiClient(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }
    });
  },
  createPost: async (postData) => {
    return await apiClient(`/posts`, {
      method: 'POST',
      body: postData
    });
  }
};
