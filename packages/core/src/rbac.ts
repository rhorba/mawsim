import type { ActionResult, Role, Session } from './types.js';

export class AuthorizationError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export function assertRole(
  session: Session | null | undefined,
  allowed: Role[]
): asserts session is Session {
  if (!session) throw new UnauthenticatedError();
  if (!allowed.includes(session.role)) {
    throw new AuthorizationError(
      `Role '${session.role}' cannot perform this action. Required: ${allowed.join(' | ')}`
    );
  }
}

export function hasRole(session: Session | null | undefined, allowed: Role[]): session is Session {
  return !!session && allowed.includes(session.role);
}

// Server-action factory — wraps a handler with role check, returns ActionResult
export function withRole<TArgs extends unknown[], TReturn>(
  allowed: Role[],
  handler: (session: Session, ...args: TArgs) => Promise<TReturn>
) {
  return async (
    session: Session | null | undefined,
    ...args: TArgs
  ): Promise<ActionResult<TReturn>> => {
    try {
      assertRole(session, allowed);
      const data = await handler(session, ...args);
      return { success: true, data };
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        return { success: false, code: 'UNAUTHORIZED', error: err.message };
      }
      if (err instanceof AuthorizationError) {
        return { success: false, code: 'FORBIDDEN', error: err.message };
      }
      throw err;
    }
  };
}

// Role capability map (mirrors §7 of CLAUDE.md)
export const ROLE_CAPABILITIES = {
  farmer: [
    'listing:create',
    'listing:edit',
    'listing:publish',
    'listing:browse',
    'offer:make',
    'offer:counter',
    'delivery:confirm',
    'price_board:view',
    'price_alert:set',
    'certification:upload',
    'review:post',
  ],
  buyer: [
    'rfq:post',
    'listing:browse',
    'offer:make',
    'offer:counter',
    'contract:sign',
    'escrow:fund',
    'delivery:confirm',
    'price_board:view',
    'price_alert:set',
    'review:post',
  ],
  logistics: [
    'listing:browse',
    'logistics:register',
    'logistics:view_requests',
    'logistics:quote',
    'delivery:confirm',
    'price_board:view',
  ],
  admin: [
    'listing:create',
    'listing:edit',
    'rfq:post',
    'listing:browse',
    'offer:make',
    'offer:counter',
    'contract:sign',
    'escrow:fund',
    'delivery:confirm',
    'price_board:view',
    'price_board:manage',
    'price_alert:set',
    'certification:verify',
    'dispute:resolve',
    'kpi:view',
    'review:post',
  ],
} satisfies Record<Role, string[]>;

export function can(session: Session, capability: string): boolean {
  return ROLE_CAPABILITIES[session.role].includes(capability);
}
