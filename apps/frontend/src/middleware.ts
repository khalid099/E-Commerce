import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const protectedPaths = ['/cart', '/checkout', '/orders'];
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cart/:path*', '/checkout/:path*', '/orders/:path*'],
};
