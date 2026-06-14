import { AuthorizationError, UnauthenticatedError } from '@mawsim/core';
import type { Role, Session } from '@mawsim/core';
import { getSession } from './session';

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION' | 'INTERNAL';
    };

// Server action factory with role check + structured error response
export function withRole<TArgs extends unknown[], TReturn>(
  allowed: Role[],
  handler: (session: Session, ...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      const session = await getSession();
      if (!session) {
        return { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' };
      }
      if (!allowed.includes(session.role)) {
        return {
          success: false,
          error: `Role '${session.role}' cannot perform this action`,
          code: 'FORBIDDEN',
        };
      }
      const data = await handler(session, ...args);
      return { success: true, data };
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        return { success: false, error: err.message, code: 'UNAUTHORIZED' };
      }
      if (err instanceof AuthorizationError) {
        return { success: false, error: err.message, code: 'FORBIDDEN' };
      }
      console.error('[action]', err);
      return { success: false, error: 'Internal server error', code: 'INTERNAL' };
    }
  };
}

// Variant that throws instead of returning result (for use in RSC / route handlers)
export function withRoleThrow<TArgs extends unknown[], TReturn>(
  allowed: Role[],
  handler: (session: Session, ...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await getSession();
    if (!session) throw new UnauthenticatedError();
    if (!allowed.includes(session.role)) {
      throw new AuthorizationError(`Role '${session.role}' cannot perform this action`);
    }
    return handler(session, ...args);
  };
}
