import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Pass through all requests - no routing logic needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
