// ./middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Home page - redirect to dashboard if authenticated
  if (pathname === '/') {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Not authenticated, continue to home page
    return NextResponse.next();
  }
  
  // Auth routes - redirect to dashboard if already authenticated
  if (pathname.startsWith('/auth/')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // Just check if token exists, let API routes handle validation
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  const protectedPaths = [
    '/dashboard'
  ];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // No token, redirect to sign in
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
    
    // Token exists, let the page/API routes handle detailed validation
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*'
  ]
};