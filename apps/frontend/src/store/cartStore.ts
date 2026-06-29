'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import type { Cart } from '@ecommerce/shared-types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ success: boolean; data: Cart }>('/cart');
      set({ cart: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    const res = await api.post<{ success: boolean; data: Cart }>('/cart/items', {
      productId,
      quantity,
    });
    set({ cart: res.data.data });
  },

  updateItem: async (itemId, quantity) => {
    const res = await api.patch<{ success: boolean; data: Cart }>(`/cart/items/${itemId}`, {
      quantity,
    });
    set({ cart: res.data.data });
  },

  removeItem: async (itemId) => {
    const res = await api.delete<{ success: boolean; data: Cart }>(`/cart/items/${itemId}`);
    set({ cart: res.data.data });
  },

  clearCart: async () => {
    const res = await api.delete<{ success: boolean; data: Cart }>('/cart');
    set({ cart: res.data.data });
  },

  reset: () => set({ cart: null }),
}));
