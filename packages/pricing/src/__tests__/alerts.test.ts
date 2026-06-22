import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DB mock (configured per-test via vi.mocked) ─────────────────────────────
vi.mock('@mawsim/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@mawsim/db/schema', () => ({
  priceAlerts: {
    id: 'id',
    userId: 'userId',
    productCategory: 'productCategory',
    productVariety: 'productVariety',
    region: 'region',
    direction: 'direction',
    thresholdPricePerQtx: 'thresholdPricePerQtx',
    active: 'active',
    lastTriggeredAt: 'lastTriggeredAt',
  },
  pricePoints: {
    productCategory: 'productCategory',
    productVariety: 'productVariety',
    region: 'region',
    recordedAt: 'recordedAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col, val) => ({ __eq: val })),
  and: vi.fn((...args) => ({ __and: args })),
  gte: vi.fn(),
  sql: vi.fn().mockReturnValue('sql_avg'),
}));

import { db } from '@mawsim/db';
import { checkPriceAlerts, createPriceAlert, deactivatePriceAlert } from '../alerts.js';

const SAMPLE_ALERT = {
  id: 'alert-1',
  userId: 'user-1',
  productCategory: 'cereals',
  productVariety: null,
  region: 'Meknès-Tafilalet',
  direction: 'above',
  thresholdPricePerQtx: 15000,
  active: true,
  lastTriggeredAt: null,
};

function mockSelectChain(resolveValue: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(resolveValue),
    }),
  };
}

function mockSelectChainWithAndOr(resolveValue: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(resolveValue),
    }),
  };
}

describe('checkPriceAlerts', () => {
  beforeEach(() => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no active alerts', async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelectChain([]) as never);
    const result = await checkPriceAlerts();
    expect(result).toEqual([]);
  });

  it('triggers alert when currentAvg >= threshold (above)', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([SAMPLE_ALERT]) as never)
      .mockReturnValueOnce(mockSelectChainWithAndOr([{ avg: 16000 }]) as never);

    const result = await checkPriceAlerts();
    expect(result).toHaveLength(1);
    expect(result[0]!.alertId).toBe('alert-1');
    expect(result[0]!.direction).toBe('above');
    expect(result[0]!.currentAvgPricePerQtx).toBe(16000);
    expect(result[0]!.thresholdPricePerQtx).toBe(15000);
  });

  it('triggers alert when currentAvg <= threshold (below)', async () => {
    const belowAlert = {
      ...SAMPLE_ALERT,
      id: 'alert-2',
      direction: 'below',
      thresholdPricePerQtx: 12000,
    };
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([belowAlert]) as never)
      .mockReturnValueOnce(mockSelectChainWithAndOr([{ avg: 11000 }]) as never);

    const result = await checkPriceAlerts();
    expect(result).toHaveLength(1);
    expect(result[0]!.direction).toBe('below');
    expect(result[0]!.currentAvgPricePerQtx).toBe(11000);
  });

  it('does not trigger when avg does not cross above threshold', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([SAMPLE_ALERT]) as never)
      .mockReturnValueOnce(mockSelectChainWithAndOr([{ avg: 14000 }]) as never); // below threshold

    const result = await checkPriceAlerts();
    expect(result).toHaveLength(0);
  });

  it('skips alert when no price data available (avg undefined)', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([SAMPLE_ALERT]) as never)
      .mockReturnValueOnce(mockSelectChainWithAndOr([{ avg: null }]) as never);

    const result = await checkPriceAlerts();
    expect(result).toHaveLength(0);
  });

  it('includes productVariety in triggered match when set on alert', async () => {
    const alertWithVariety = { ...SAMPLE_ALERT, productVariety: 'Blé dur Karim' };
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([alertWithVariety]) as never)
      .mockReturnValueOnce(mockSelectChainWithAndOr([{ avg: 16000 }]) as never);

    const result = await checkPriceAlerts();
    expect(result[0]!.productVariety).toBe('Blé dur Karim');
  });
});

describe('createPriceAlert', () => {
  it('returns a uuid string id', async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    } as never);

    const id = await createPriceAlert({
      userId: 'user-1',
      productCategory: 'cereals',
      region: 'Meknès-Tafilalet',
      thresholdPricePerQtx: 15000,
      direction: 'above',
    });

    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('includes productVariety when provided', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

    await createPriceAlert({
      userId: 'user-1',
      productCategory: 'olives',
      productVariety: 'Picholine',
      region: 'Marrakech-Safi',
      thresholdPricePerQtx: 50000,
      direction: 'below',
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ productVariety: 'Picholine' })
    );
  });
});

describe('deactivatePriceAlert', () => {
  it('calls update and resolves without throwing', async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: mockWhere }),
    } as never);

    await expect(deactivatePriceAlert('alert-1')).resolves.toBeUndefined();
    expect(mockWhere).toHaveBeenCalledOnce();
  });
});
