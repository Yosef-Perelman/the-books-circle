import { apiClient } from './client';

export const chatApi = {
  sendMessage: async (history) => {
    return await apiClient('/chat', {
      method: 'POST',
      body: { history }
    });
  },
  getTools: async () => {
    return await apiClient('/chat/tools');
  }
};
