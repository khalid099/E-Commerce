import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { Notification, UnreadCount } from '@ecommerce/shared-types';
import { CORS_ORIGIN } from '../config/configuration';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

// Real-time delivery channel. Namespaced so it never collides with a future
// gateway. CORS mirrors the HTTP layer with credentials enabled so the browser
// forwards the httpOnly auth cookie on the handshake.
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly jwtService: JwtService) {}

  // Authenticate on connect: the JWT is read from the same httpOnly cookie the
  // REST API uses. An unauthenticated or forged handshake is dropped — a socket
  // never joins a room it can't prove ownership of.
  handleConnection(client: Socket): void {
    const userId = this.authenticate(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    // Per-user room so a push reaches exactly that user's open tabs — never a
    // broadcast that could leak one customer's notification to another.
    void client.join(this.room(userId));
  }

  /** Push a newly created notification to every open tab of its owner. */
  emitNew(userId: string, notification: Notification): void {
    this.server.to(this.room(userId)).emit('notification:new', notification);
  }

  /** Push the owner's current unread count (badge sync across tabs). */
  emitUnread(userId: string, count: number): void {
    const payload: UnreadCount = { count };
    this.server.to(this.room(userId)).emit('notification:unread', payload);
  }

  private authenticate(client: Socket): string | null {
    try {
      const token = this.extractToken(client);
      if (!token) return null;
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload.sub ?? null;
    } catch {
      // Expired/invalid token — treat as unauthenticated, no stack trace to client.
      return null;
    }
  }

  private extractToken(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
    // Fallback for non-browser clients that pass the token via the auth payload.
    const authToken = client.handshake.auth?.token;
    return typeof authToken === 'string' ? authToken : null;
  }

  private room(userId: string): string {
    return `user:${userId}`;
  }
}
