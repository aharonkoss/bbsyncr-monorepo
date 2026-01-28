import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  console.log('🔍 Middleware - Hostname:', hostname);

  // Extract subdomain
  let subdomain = null;
  
  // Handle localhost development
  if (hostname.includes('localhost')) {
    // Format: subdomain.localhost:3000 or just localhost:3000
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      subdomain = parts[0];
      console.log('✅ Subdomain detected:', subdomain);
    }
  } else {
    // Production: subdomain.bbsynr.com
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
      console.log('✅ Subdomain detected:', subdomain);
    }
  }

  // Add subdomain to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subdomain', subdomain || '');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which paths to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
