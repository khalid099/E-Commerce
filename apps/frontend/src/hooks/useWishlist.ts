'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/errors';
import type { Product } from '@ecommerce/shared-types';

/**
 * Single source of truth for the wishlist heart anywhere (grid cards, detail).
 * Guests are sent to login; success/failure surface a toast. Membership is read
 * reactively from the store so every heart for a product stays in sync.
 */
export function useWishlist(productId: string) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.productId === productId));
  const toggleStore = useWishlistStore((s) => s.toggle);
  const showToast = useUiStore((s) => s.showToast);
  const [isToggling, setIsToggling] = useState(false);

  const toggle = async (product: Product) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsToggling(true);
    try {
      const nowWishlisted = await toggleStore(product.id);
      showToast(nowWishlisted ? `${product.name} saved to wishlist` : `${product.name} removed`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not update wishlist'));
    } finally {
      setIsToggling(false);
    }
  };

  return { wishlisted, toggle, isToggling };
}
