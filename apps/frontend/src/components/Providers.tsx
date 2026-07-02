'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store/store';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useNotificationStore } from '@/store/notificationStore';

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

function WishlistInitializer() {
  const user = useAuthStore((s) => s.user);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const reset = useWishlistStore((s) => s.reset);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      reset();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function NotificationInitializer() {
  const user = useAuthStore((s) => s.user);
  const connect = useNotificationStore((s) => s.connect);
  const disconnect = useNotificationStore((s) => s.disconnect);

  // Connect when a session exists, tear down when it ends. No unmount cleanup —
  // mirrors Cart/WishlistInitializer so a StrictMode double-invoke doesn't
  // disconnect right after connecting (which would flicker the badge to empty).
  useEffect(() => {
    if (user) {
      void connect();
    } else {
      disconnect();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      <CartInitializer />
      <WishlistInitializer />
      <NotificationInitializer />
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}
