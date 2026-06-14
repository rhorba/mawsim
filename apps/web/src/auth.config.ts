import type { NextAuthConfig } from 'next-auth';

// Edge-safe config (no Node.js APIs) — used by middleware
export const authConfig = {
  pages: {
    signIn: '/fr/login',
    error: '/fr/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — no auth required
      const publicPrefixes = [
        '/fr/prix',
        '/ar/prix',
        '/fr/listings',
        '/ar/listings',
        '/fr/login',
        '/ar/login',
        '/fr/signup',
        '/ar/signup',
        '/_next',
        '/favicon',
        '/api/auth',
      ];
      const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));
      if (isPublic) return true;

      // Everything else requires auth
      return isLoggedIn;
    },
  },
  providers: [], // filled in auth.ts (Node.js only)
} satisfies NextAuthConfig;
