import { apiClient } from './client';

export const usersApi = {
  getUser: async (userId) => {
    return await apiClient(`/users/${userId}`);
  },
  getUserCircles: async (userId) => {
    return await apiClient(`/users/${userId}/circles`);
  },
  getUserPosts: async (userId, offset = 0, limit = 10) => {
    return await apiClient(`/users/${userId}/posts?offset=${offset}&limit=${limit}`);
  }
};
