import { checkRateLimit } from '@/lib/rate-limit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { LoginSchema } from '@mawsim/core';
import { db } from '@mawsim/db';
import { accounts, sessions, users, verificationTokens } from '@mawsim/db/schema';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';

// Explicit annotations work around next-auth v5 + pnpm TS2742 (non-portable inferred types).
const nextAuth = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env['AUTH_GOOGLE_ID'] ?? '',
      clientSecret: process.env['AUTH_GOOGLE_SECRET'] ?? '',
      // Google OAuth users get buyer role by default; they can switch in onboarding
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          role: 'buyer',
        };
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        // Rate-limit by email to mitigate credential stuffing (10 attempts / 15 min)
        if (!checkRateLimit(`login:${normalizedEmail}`, 10)) return null;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            passwordHash: users.passwordHash,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist role into JWT on sign-in
        token['userId'] = user.id;
        token['role'] = (user as { role?: string }).role ?? 'buyer';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token['userId'] as string;
        (session as unknown as { user: { role: string } }).user.role = token['role'] as string;
      }
      return session;
    },
  },
});

export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
