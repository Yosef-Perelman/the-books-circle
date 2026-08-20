import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { useCircleStore } from './circleStore';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  status: 'idle', // 'idle' | 'loading' | 'ready'
  myCircleIds: [],
  
  refreshMyCircles: async () => {
    try {
      // Import circlesApi dynamically to avoid circular dependencies if any
      const { circlesApi } = await import('../api/circlesApi');
      const circles = await circlesApi.getMyCircles();
      set({ myCircleIds: circles.map(c => c.id) });
    } catch (err) {
      console.error('Failed to refresh circles in authStore', err);
    }
  },
  
  initializeAuth: () => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user ? formatUser(session.user) : null,
        token: session?.access_token || null,
        status: 'ready'
      });
      if (session?.access_token) {
        localStorage.setItem('trc_token', session.access_token);
        get().refreshMyCircles();
      } else {
        localStorage.removeItem('trc_token');
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ? formatUser(session.user) : null,
        token: session?.access_token || null,
        status: 'ready'
      });
      if (session?.access_token) {
        localStorage.setItem('trc_token', session.access_token);
        get().refreshMyCircles();
      } else {
        localStorage.removeItem('trc_token');
        set({ myCircleIds: [] });
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    useCircleStore.getState().reset();
    set({ myCircleIds: [] });
  }
}));

// Helper to format Supabase user to our expected format
function formatUser(supabaseUser) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
  };
}
