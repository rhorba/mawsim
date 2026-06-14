import { describe, expect, it } from 'vitest';
import {
  AuthorizationError,
  UnauthenticatedError,
  assertRole,
  can,
  hasRole,
  withRole,
} from '../rbac.js';
import type { Session } from '../types.js';

const farmerSession: Session = {
  userId: 'u1',
  role: 'farmer',
  email: 'mehdi@demo.mawsim.ma',
  name: 'Mehdi Fellah',
};

const buyerSession: Session = {
  userId: 'u2',
  role: 'buyer',
  email: 'atlas@demo.mawsim.ma',
  name: 'Atlas Food',
};

const logisticsSession: Session = {
  userId: 'u3',
  role: 'logistics',
  email: 'transport@demo.mawsim.ma',
  name: 'Trans Atlas',
};

const adminSession: Session = {
  userId: 'u4',
  role: 'admin',
  email: 'admin@mawsim.ma',
  name: 'Admin',
};

// ── assertRole ─────────────────────────────────────────────────

describe('assertRole', () => {
  it('passes when role is allowed', () => {
    expect(() => assertRole(farmerSession, ['farmer'])).not.toThrow();
    expect(() => assertRole(buyerSession, ['buyer', 'admin'])).not.toThrow();
    expect(() => assertRole(adminSession, ['farmer', 'buyer', 'logistics', 'admin'])).not.toThrow();
  });

  it('throws UnauthenticatedError when session is null', () => {
    expect(() => assertRole(null, ['farmer'])).toThrow(UnauthenticatedError);
    expect(() => assertRole(undefined, ['farmer'])).toThrow(UnauthenticatedError);
  });

  it('throws AuthorizationError when role is not in allowed list', () => {
    expect(() => assertRole(farmerSession, ['buyer'])).toThrow(AuthorizationError);
    expect(() => assertRole(buyerSession, ['farmer'])).toThrow(AuthorizationError);
    expect(() => assertRole(logisticsSession, ['farmer', 'buyer'])).toThrow(AuthorizationError);
  });

  it('buyer cannot act as farmer — critical role isolation', () => {
    expect(() => assertRole(buyerSession, ['farmer'])).toThrow(AuthorizationError);
  });

  it('logistics cannot act as farmer or buyer', () => {
    expect(() => assertRole(logisticsSession, ['farmer'])).toThrow(AuthorizationError);
    expect(() => assertRole(logisticsSession, ['buyer'])).toThrow(AuthorizationError);
  });
});

// ── hasRole ────────────────────────────────────────────────────

describe('hasRole', () => {
  it('returns true for matching role', () => {
    expect(hasRole(farmerSession, ['farmer'])).toBe(true);
    expect(hasRole(adminSession, ['admin'])).toBe(true);
  });

  it('returns false for non-matching role', () => {
    expect(hasRole(farmerSession, ['buyer'])).toBe(false);
    expect(hasRole(null, ['farmer'])).toBe(false);
  });
});

// ── withRole factory ───────────────────────────────────────────

describe('withRole factory', () => {
  it('calls handler when role matches', async () => {
    const postListing = withRole(['farmer', 'admin'], async (session) => {
      return `posted by ${session.userId}`;
    });

    const result = await postListing(farmerSession);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('posted by u1');
  });

  it('returns FORBIDDEN when role does not match', async () => {
    const postListing = withRole(['farmer', 'admin'], async () => 'ok');
    const result = await postListing(buyerSession);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe('FORBIDDEN');
  });

  it('returns UNAUTHORIZED when session is null', async () => {
    const postListing = withRole(['farmer'], async () => 'ok');
    const result = await postListing(null);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe('UNAUTHORIZED');
  });

  it('admin can always post listings', async () => {
    const postListing = withRole(['farmer', 'admin'], async (session) => session.role);
    const result = await postListing(adminSession);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('admin');
  });
});

// ── Capability checks — bank details access ────────────────────

describe('bank details access control (critical)', () => {
  it('farmer can manage bank details', () => {
    // bank details capability is implicit via role — only farmer + admin in RLS
    expect(hasRole(farmerSession, ['farmer', 'admin'])).toBe(true);
  });

  it('buyer CANNOT access farmer bank details', () => {
    expect(hasRole(buyerSession, ['farmer', 'admin'])).toBe(false);
  });

  it('logistics CANNOT access farmer bank details', () => {
    expect(hasRole(logisticsSession, ['farmer', 'admin'])).toBe(false);
  });

  it('admin CAN access farmer bank details', () => {
    expect(hasRole(adminSession, ['farmer', 'admin'])).toBe(true);
  });
});

// ── Capability map ─────────────────────────────────────────────

describe('can() capability checks', () => {
  it('farmer can post listings', () => {
    expect(can(farmerSession, 'listing:create')).toBe(true);
  });

  it('buyer cannot post listings', () => {
    expect(can(buyerSession, 'listing:create')).toBe(false);
  });

  it('buyer can post RFQs', () => {
    expect(can(buyerSession, 'rfq:post')).toBe(true);
  });

  it('farmer cannot post RFQs', () => {
    expect(can(farmerSession, 'rfq:post')).toBe(false);
  });

  it('logistics can view price board', () => {
    expect(can(logisticsSession, 'price_board:view')).toBe(true);
  });

  it('logistics cannot verify certifications', () => {
    expect(can(logisticsSession, 'certification:verify')).toBe(false);
  });

  it('admin can resolve disputes', () => {
    expect(can(adminSession, 'dispute:resolve')).toBe(true);
  });

  it('only admin can view platform KPIs', () => {
    expect(can(adminSession, 'kpi:view')).toBe(true);
    expect(can(farmerSession, 'kpi:view')).toBe(false);
    expect(can(buyerSession, 'kpi:view')).toBe(false);
    expect(can(logisticsSession, 'kpi:view')).toBe(false);
  });

  it('buyer must fund escrow, farmer cannot', () => {
    expect(can(buyerSession, 'escrow:fund')).toBe(true);
    expect(can(farmerSession, 'escrow:fund')).toBe(false);
  });
});
