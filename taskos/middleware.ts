import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export default function middleware(req: NextRequest) {
  const { userId } = getAuth(req);
  const { pathname } = req.nextUrl;
  
  console.log(`🔍 MIDDLEWARE: ${pathname}, userId: ${userId ? 'authenticated' : 'not authenticated'}`);
  
  // Define public routes that don't require authentication
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/signup';
  
  // If the user is not signed in and the route is not public, redirect to login
  if (!userId && !isPublic) {
    console.log(`🚀 MIDDLEWARE: Redirecting unauthenticated user from ${pathname} to /login`);
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is signed in and trying to access sign-in or sign-up, redirect them to the projects page
  if (userId && isPublic) {
    console.log(`🚀 MIDDLEWARE: Redirecting authenticated user from ${pathname} to /projects`);
    const projectsUrl = new URL('/projects', req.url);
    return NextResponse.redirect(projectsUrl);
  }

  console.log(`✅ MIDDLEWARE: Allowing access to ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/projects',
    '/projects/(.*)',
    '/login',
    '/signup',
    '/'
  ],
};
