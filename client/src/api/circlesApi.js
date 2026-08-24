import { apiClient } from './client';

export const circlesApi = {
  getMyCircles: async () => {
    return await apiClient('/circles/my');
  },
  getMembers: async (id) => {
    return await apiClient(`/circles/${id}/members`);
  },
  createCircle: async (name) => {
    return await apiClient('/circles', { method: 'POST', body: { name } });
  },
  joinCircle: async (inviteCode) => {
    return await apiClient('/circles/join', { method: 'POST', body: { inviteCode } });
  },
  leaveCircle: async (id) => {
    return await apiClient(`/circles/${id}/leave`, { method: 'DELETE' });
  },
  getLeaderboard: async (circleId, period = 'month') => {
    return await apiClient(`/circles/${circleId}/leaderboard?period=${period}`);
  },
  getCircleById: async (id) => {
    return await apiClient(`/circles/${id}`);
  },
  joinCircleById: async (id) => {
    return await apiClient(`/circles/${id}/join`, { method: 'POST' });
  }
};
