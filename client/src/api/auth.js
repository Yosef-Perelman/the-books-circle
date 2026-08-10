import { apiClient } from './client';

export const authApi = {
  login: (credentials) => apiClient('/auth/login', { body: credentials }),
  register: (payload) => apiClient('/auth/register', { body: payload }),
  getMe: () => apiClient('/auth/me'),
};
