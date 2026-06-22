import { describe, expect, it } from 'vitest';
import {
  AdminValidationError,
  assertDealIsDisputed,
  assertPricePositiveInteger,
} from '../admin-guards.js';

describe('assertDealIsDisputed', () => {
  it('passes for disputed status', () => {
    expect(() => assertDealIsDisputed('disputed')).not.toThrow();
  });

  it('throws AdminValidationError for offer_made', () => {
    expect(() => assertDealIsDisputed('offer_made')).toThrow(AdminValidationError);
  });

  it('throws AdminValidationError for completed', () => {
    expect(() => assertDealIsDisputed('completed')).toThrow(AdminValidationError);
  });

  it('throws AdminValidationError for negotiating', () => {
    expect(() => assertDealIsDisputed('negotiating')).toThrow(AdminValidationError);
  });

  it('error name is AdminValidationError', () => {
    try {
      assertDealIsDisputed('agreed');
    } catch (err) {
      expect(err).toBeInstanceOf(AdminValidationError);
      expect((err as AdminValidationError).name).toBe('AdminValidationError');
    }
  });
});

describe('assertPricePositiveInteger', () => {
  it('passes for valid centimes price', () => {
    expect(() => assertPricePositiveInteger(35000)).not.toThrow();
  });

  it('passes for price of 1', () => {
    expect(() => assertPricePositiveInteger(1)).not.toThrow();
  });

  it('throws for zero', () => {
    expect(() => assertPricePositiveInteger(0)).toThrow(AdminValidationError);
  });

  it('throws for negative price', () => {
    expect(() => assertPricePositiveInteger(-500)).toThrow(AdminValidationError);
  });

  it('throws for float price', () => {
    expect(() => assertPricePositiveInteger(350.5)).toThrow(AdminValidationError);
  });

  it('throws for NaN', () => {
    expect(() => assertPricePositiveInteger(Number.NaN)).toThrow(AdminValidationError);
  });
});
