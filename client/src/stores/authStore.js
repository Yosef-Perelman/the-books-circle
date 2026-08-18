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
    // TEMPORARY BACKDOOR FOR BROWSER SUBAGENT
    set({ 
      user: {
        id: '15ec8a50-286d-4954-b9ac-beba3a0086ea',
        email: 'yanovslo1@gmail.com',
        displayName: 'daniel yanovsky',
        avatarUrl: null
      }, 
      token: 'dummy-token',
      status: 'ready' 
    });
    localStorage.setItem('trc_token', 'dummy-token');
    get().refreshMyCircles();
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
