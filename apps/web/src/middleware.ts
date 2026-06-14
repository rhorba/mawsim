import NextAuth, { type NextAuthResult } from 'next-auth';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextMiddleware } from 'next/server';
import { authConfig } from './auth.config';
import { routing } from './i18n/routing';

// Explicit annotations work around next-auth v5 + pnpm TS2742 (non-portable inferred types).
const auth: NextAuthResult['auth'] = NextAuth(authConfig).auth;

const intlMiddleware = createIntlMiddleware(routing);

const middleware = auth((req) => {
  return intlMiddleware(req);
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  // Match all routes except static files and API routes that handle their own auth
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
