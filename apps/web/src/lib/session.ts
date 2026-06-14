import { auth } from '@/auth';
import { AuthorizationError, UnauthenticatedError } from '@mawsim/core';
import type { Role, Session } from '@mawsim/core';

// Typed session getter for server components and server actions
export async function getSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    role: ((session.user as unknown as { role: string }).role ?? 'buyer') as Role,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthenticatedError();
  return session;
}

export async function requireRole(allowed: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) {
    throw new AuthorizationError(`Role '${session.role}' cannot perform this action`);
  }
  return session;
}
