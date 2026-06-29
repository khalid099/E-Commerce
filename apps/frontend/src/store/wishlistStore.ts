'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import type { WishlistItem } from '@ecommerce/shared-types';

interface WishlistState {
  items: WishlistItem[];
  /** False until the first fetch resolves — lets views avoid an empty-state flash. */
  loaded: boolean;
  fetchWishlist: () => Promise<void>;
  /** Add or remove the product; resolves to the new wishlisted state. */
  toggle: (productId: string) => Promise<boolean>;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  loaded: false,

  fetchWishlist: async () => {
    try {
      const res = await api.get<{ success: boolean; data: WishlistItem[] }>('/wishlist');
      set({ items: res.data.data, loaded: true });
    } catch {
      // Guests / unauthenticated — leave the wishlist empty.
      set({ loaded: true });
    }
  },

  toggle: async (productId) => {
    const has = get().items.some((i) => i.productId === productId);
    if (has) {
      const res = await api.delete<{ success: boolean; data: WishlistItem[] }>(
        `/wishlist/items/${productId}`,
      );
      set({ items: res.data.data });
      return false;
    }
    const res = await api.post<{ success: boolean; data: WishlistItem[] }>('/wishlist/items', {
      productId,
    });
    set({ items: res.data.data });
    return true;
  },

  reset: () => set({ items: [], loaded: false }),
}));
