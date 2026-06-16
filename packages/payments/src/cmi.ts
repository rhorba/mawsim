import type { Money } from '@mawsim/core';

// CMI / CashPlus payment-rail adapter.
//
// Mawsim is NOT a financial institution (CLAUDE.md §11.4): it instructs a payment
// processor (CMI for cards, CashPlus for cash, bank transfer for large deals) and
// records the resulting provider reference against the escrow. The real CMI
// integration lands in prod; in dev/CI we use this deterministic mock so the
// escrow state machine can be exercised end-to-end without external creds.

export type ChargePurpose = 'escrow_deposit' | 'escrow_remainder';

export type ChargeRequest = {
  /** Amount to capture, in integer centimes (MAD). Never a float. */
  amount: Money;
  /** Deal the charge belongs to — used to build a traceable provider reference. */
  dealId: string;
  purpose: ChargePurpose;
};

export type ChargeResult = {
  /** Processor-side reference we persist for reconciliation + audit. */
  providerRef: string;
  amount: Money;
  status: 'captured';
  capturedAt: Date;
};

export type RefundResult = {
  providerRef: string;
  amount: Money;
  status: 'refunded';
  refundedAt: Date;
};

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * The payment rail Mawsim talks to. Swappable: the mock below in dev/CI, a real
 * CMI client in prod. Amounts are always integer centimes.
 */
export interface PaymentGateway {
  charge(req: ChargeRequest): Promise<ChargeResult>;
  refund(providerRef: string, amount: Money): Promise<RefundResult>;
}

/** Deterministic in-memory gateway for dev/CI — no network, no creds. */
export class MockCmiGateway implements PaymentGateway {
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (!Number.isInteger(req.amount) || req.amount <= 0) {
      throw new PaymentError(
        `Invalid charge amount: ${req.amount} (must be positive integer centimes)`
      );
    }
    return {
      providerRef: `cmi_mock_${req.purpose}_${req.dealId}`,
      amount: req.amount,
      status: 'captured',
      capturedAt: new Date(),
    };
  }

  async refund(providerRef: string, amount: Money): Promise<RefundResult> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new PaymentError(
        `Invalid refund amount: ${amount} (must be positive integer centimes)`
      );
    }
    return {
      providerRef,
      amount,
      status: 'refunded',
      refundedAt: new Date(),
    };
  }
}

/** Default gateway used by the app until a real CMI client is wired in prod. */
export const paymentGateway: PaymentGateway = new MockCmiGateway();
