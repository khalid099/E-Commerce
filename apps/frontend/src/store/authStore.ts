'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User } from '@ecommerce/shared-types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get<{ success: boolean; data: User }>('/auth/me');
          set({ user: res.data.data, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          set({ user: null });
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },
    }),
    {
      name: 'shophive-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
