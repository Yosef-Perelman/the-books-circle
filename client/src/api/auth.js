import { apiClient } from './client';

export const authApi = {
  getMe: () => apiClient('/auth/me'),
};
