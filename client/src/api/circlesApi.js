import { apiClient } from './client.js';

export const circlesApi = {
  createCircle: (name) => apiClient('/circles', { body: { name } }),
  joinCircle: (inviteCode) => apiClient('/circles/join', { body: { inviteCode } }),
  getCircle: (id) => apiClient(`/circles/${encodeURIComponent(id)}`)
};
