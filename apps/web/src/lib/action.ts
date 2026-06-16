import { AuthorizationError, UnauthenticatedError } from '@mawsim/core';
import type { Role, Session } from '@mawsim/core';
import { ZodError } from 'zod';
import { getSession } from './session';

// Domain errors whose message is safe + useful to show the user (FR-facing).
const VALIDATION_ERROR_NAMES = new Set([
  'ListingValidationError',
  'ListingTransitionError',
  'DealTransitionError',
  'EscrowTransitionError',
  'NegotiationError',
  'PaymentError',
]);

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
      if (err instanceof ZodError) {
        return {
          success: false,
          error: err.issues[0]?.message ?? 'Données invalides',
          code: 'VALIDATION',
        };
      }
      if (err instanceof Error && VALIDATION_ERROR_NAMES.has(err.name)) {
        return { success: false, error: err.message, code: 'VALIDATION' };
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
