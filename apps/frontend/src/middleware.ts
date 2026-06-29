import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getTokenRole(token: string): string | null {
  try {
    // Decode JWT payload — no signature verification needed here (backend verifies)
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Admin routes: require ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const role = getTokenRole(token);
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Customer-only routes: require any authenticated user
  const protectedPaths = ['/cart', '/checkout', '/orders'];
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cart/:path*', '/checkout/:path*', '/orders/:path*'],
};
