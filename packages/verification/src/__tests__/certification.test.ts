import { describe, expect, it, vi } from 'vitest';

// Stub @mawsim/db so this test runs without a real DB.
vi.mock('@mawsim/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'cert-123' }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 'cert-1',
              farmerId: 'fp-1',
              farmName: 'Ferme El Kbir',
              type: 'organic',
              issuedBy: 'ONSSA',
              validUntil: new Date('2026-12-31'),
              documentKey: 'docs/cert1.pdf',
              createdAt: new Date('2026-01-01'),
            },
          ]),
        }),
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@mawsim/db/schema', () => ({
  farmerCertifications: {
    id: 'id',
    farmerId: 'farmerId',
    verified: 'verified',
    adminNote: 'adminNote',
    type: 'type',
    issuedBy: 'issuedBy',
    validUntil: 'validUntil',
    documentKey: 'documentKey',
    createdAt: 'createdAt',
  },
  farmerProfiles: { id: 'id', farmName: 'farmName', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

import {
  getPendingCertifications,
  submitCertification,
  verifyCertification,
} from '../certification.js';

describe('submitCertification', () => {
  it('returns the new certification id', async () => {
    const id = await submitCertification({
      farmerId: 'fp-1',
      type: 'organic',
      documentKey: 'docs/cert.pdf',
      issuedBy: 'ONSSA',
      validUntil: new Date('2026-12-31'),
    });
    expect(id).toBe('cert-123');
  });
});

describe('verifyCertification', () => {
  it('calls update without throwing for approved status', async () => {
    await expect(
      verifyCertification({ certificationId: 'cert-1', status: 'approved' })
    ).resolves.toBeUndefined();
  });

  it('calls update without throwing for rejected status with note', async () => {
    await expect(
      verifyCertification({
        certificationId: 'cert-1',
        status: 'rejected',
        note: 'Document expiré',
      })
    ).resolves.toBeUndefined();
  });
});

describe('getPendingCertifications', () => {
  it('returns an array of pending certifications', async () => {
    const certs = await getPendingCertifications();
    expect(Array.isArray(certs)).toBe(true);
  });
});
