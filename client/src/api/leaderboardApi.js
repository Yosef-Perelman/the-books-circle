import { apiClient } from './client.js';

export const leaderboardApi = {
  getLeaderboard: (circleId, period) =>
    apiClient(`/circles/${encodeURIComponent(circleId)}/leaderboard?period=${encodeURIComponent(period)}`)
};
