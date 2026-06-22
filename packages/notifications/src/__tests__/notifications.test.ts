import { describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted — define all mock implementations inline without referencing outer vars.
vi.mock('@mawsim/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'notif-1',
                userId: 'user-1',
                event: 'bid_received',
                entityId: 'deal-1',
                data: null,
                readAt: null,
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@mawsim/db/schema', () => ({
  notifications: {
    id: 'id',
    userId: 'userId',
    event: 'event',
    entityId: 'entityId',
    data: 'data',
    readAt: 'readAt',
    createdAt: 'createdAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
  sql: vi.fn().mockReturnValue('sql_expr'),
}));

import { createNotification, getNotifications, markAllRead, markRead } from '../in-app.js';

describe('createNotification', () => {
  it('inserts without throwing', async () => {
    await expect(
      createNotification({ userId: 'user-1', event: 'bid_received', entityId: 'deal-1' })
    ).resolves.toBeUndefined();
  });
});

describe('getNotifications', () => {
  it('returns an array', async () => {
    const items = await getNotifications('user-1');
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('markRead', () => {
  it('resolves without throwing', async () => {
    await expect(markRead('notif-1', 'user-1')).resolves.toBeUndefined();
  });
});

describe('markAllRead', () => {
  it('resolves without throwing', async () => {
    await expect(markAllRead('user-1')).resolves.toBeUndefined();
  });
});

describe('sendEmail', () => {
  it('no-ops gracefully when RESEND_API_KEY is absent', async () => {
    const { sendEmail } = await import('../email.js');
    const prev = process.env['RESEND_API_KEY'];
    process.env['RESEND_API_KEY'] = '';
    await expect(
      sendEmail({ to: 'test@example.com', template: 'offer_received', data: {} })
    ).resolves.toBeUndefined();
    process.env['RESEND_API_KEY'] = prev ?? '';
  });
});
