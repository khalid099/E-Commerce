'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store/store';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

function AuthInitializer() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function CartInitializer() {
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const reset = useCartStore((s) => s.reset);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      reset();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      <CartInitializer />
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}
