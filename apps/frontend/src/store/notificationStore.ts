'use client';

import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { NOTIFICATION_EVENTS, NOTIFICATION_NAMESPACE } from '@ecommerce/shared-types';
import type { Notification, UnreadCount } from '@ecommerce/shared-types';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/notifications';

// The API client talks to `<origin>/api`; the socket namespace lives at the bare
// origin, so strip the `/api` suffix to reach it.
const SOCKET_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
).replace(/\/api\/?$/, '');

// The live socket is held at module scope, not in the store — it's an imperative
// resource, not render state, and must survive re-renders as a single instance.
let socket: Socket | null = null;
// Synchronous guard so two overlapping connect() calls (React 18 StrictMode
// double-invoke, or a fast logout/login) can't each open a socket and leak one.
let connecting = false;

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  /** False until the first fetch resolves — lets the panel avoid an empty flash. */
  loaded: boolean;
  /** Fetch the backlog and open the real-time channel. Idempotent. */
  connect: () => Promise<void>;
  /** Tear down the socket and clear state (on logout). */
  disconnect: () => void;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  items: [],
  unreadCount: 0,
  loaded: false,

  connect: async () => {
    if (socket || connecting) return;
    connecting = true;
    try {
      await get().fetch();

      // The httpOnly auth cookie is forwarded on the handshake via withCredentials;
      // the gateway authenticates from it and drops unauthenticated sockets.
      socket = io(`${SOCKET_ORIGIN}${NOTIFICATION_NAMESPACE}`, {
        withCredentials: true,
        transports: ['websocket'],
      });

      socket.on(NOTIFICATION_EVENTS.NEW, (n: Notification) => {
        set((s) => ({ items: [n, ...s.items.filter((i) => i.id !== n.id)] }));
      });

      // The server is authoritative for the badge — it pushes the count on every
      // change so all open tabs stay in sync.
      socket.on(NOTIFICATION_EVENTS.UNREAD, (payload: UnreadCount) => {
        set({ unreadCount: payload.count });
      });
    } finally {
      connecting = false;
    }
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    connecting = false;
    set({ items: [], unreadCount: 0, loaded: false });
  },

  fetch: async () => {
    try {
      const [list, count] = await Promise.all([listNotifications(1, 20), getUnreadCount()]);
      set({ items: list.data, unreadCount: count, loaded: true });
    } catch {
      // Guests / unauthenticated — leave the panel empty.
      set({ loaded: true });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
    }));
    try {
      await markNotificationRead(id);
    } catch {
      /* the socket's unread event reconciles the badge either way */
    }
    // Local fallback so the badge is right even if the socket is momentarily down.
    set((s) => ({ unreadCount: s.items.filter((i) => !i.isRead).length }));
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((i) => ({ ...i, isRead: true })), unreadCount: 0 }));
    try {
      await markAllNotificationsRead();
    } catch {
      /* reconciled by the socket / next fetch */
    }
  },

  remove: async (id) => {
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      unreadCount: s.items.filter((i) => i.id !== id && !i.isRead).length,
    }));
    try {
      await deleteNotification(id);
    } catch {
      /* reconciled by the next fetch */
    }
  },
}));
