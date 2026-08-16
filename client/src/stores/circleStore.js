import { create } from 'zustand';
import { authApi } from '../api/auth';

const ACTIVE_CIRCLE_KEY = 'trc_active_circle';

export const useCircleStore = create((set, get) => ({
  circles: [],
  activeCircleId: localStorage.getItem(ACTIVE_CIRCLE_KEY) || null,
  members: [],

  setActive: (id) => {
    localStorage.setItem(ACTIVE_CIRCLE_KEY, id);
    set({ activeCircleId: id });
  },

  // Circles come back on GET /api/auth/me — there's no standalone "list my
  // circles" route in api-contract.md, so this is the one place to load them.
  loadCircles: async () => {
    const { circles } = await authApi.getMe();
    const current = get().activeCircleId;
    const stillValid = circles.some((c) => c.id === current);
    const activeCircleId = stillValid ? current : (circles[0]?.id ?? null);

    if (activeCircleId) {
      localStorage.setItem(ACTIVE_CIRCLE_KEY, activeCircleId);
    } else {
      localStorage.removeItem(ACTIVE_CIRCLE_KEY);
    }
    set({ circles, activeCircleId });
  },

  reset: () => {
    localStorage.removeItem(ACTIVE_CIRCLE_KEY);
    set({ circles: [], activeCircleId: null, members: [] });
  }
}));
