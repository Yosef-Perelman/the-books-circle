import { create } from 'zustand';

// Modal state and toast helpers only. No server data — see client-architecture.md.
export const useUiStore = create((set) => ({
  modal: null, // null | { type: 'addBook' | 'joinCircle' | 'interview' | 'confirmReading', props: {} }

  openModal: (type, props = {}) => set({ modal: { type, props } }),
  closeModal: () => set({ modal: null })
}));
