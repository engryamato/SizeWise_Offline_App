import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS } from './lib/security';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Additional security measures for specific routes
  const pathname = request.nextUrl.pathname;

  // Prevent access to sensitive files
  if (pathname.includes('..') || pathname.includes('.env') || pathname.includes('config')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sqlite (SQLite WASM files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sqlite).*)',
  ],
};
