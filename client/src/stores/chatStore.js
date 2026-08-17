import { create } from 'zustand';

export const useChatStore = create((set) => ({
  messages: [
    { role: 'ai', parts: "Hi! I'm your AI Librarian. Ask me for book recommendations, or see what your friends are reading!" }
  ],
  setMessages: (newMessages) => set({ messages: newMessages }),
  resetChat: () => set({ 
    messages: [
      { role: 'ai', parts: "Hi! I'm your AI Librarian. Ask me for book recommendations, or see what your friends are reading!" }
    ] 
  }),
}));
