'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/errors';
import type { Product } from '@ecommerce/shared-types';

/**
 * Single source of truth for adding to the cart from anywhere (grid cards,
 * product detail, quick-add). Guests are sent to login; success bumps the
 * cart badge and shows the confirmation toast; stock conflicts surface the
 * server message.
 */
export function useAddToCart() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUiStore((s) => s.showToast);
  const bumpCart = useUiStore((s) => s.bumpCart);
  const [isAdding, setIsAdding] = useState(false);

  const add = async (product: Product, quantity = 1) => {
    if (!user) {
      router.push('/login');
      return false;
    }
    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
      bumpCart();
      showToast(`${product.name} added to cart`);
      return true;
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not add to cart'));
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return { add, isAdding };
}
