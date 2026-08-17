import { apiClient } from './client';

export const usersApi = {
  getUser: async (userId) => {
    return await apiClient(`/users/${userId}`);
  }
};
