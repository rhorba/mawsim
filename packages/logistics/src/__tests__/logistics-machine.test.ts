import { describe, expect, it } from 'vitest';
import { LogisticsTransitionError, assertLogisticsTransition } from '../logistics-machine.js';

describe('logistics state machine', () => {
  it('allows open → quoted', () => {
    expect(() => assertLogisticsTransition('open', 'quoted')).not.toThrow();
  });

  it('allows open → assigned (direct assignment without quote)', () => {
    expect(() => assertLogisticsTransition('open', 'assigned')).not.toThrow();
  });

  it('allows quoted → assigned', () => {
    expect(() => assertLogisticsTransition('quoted', 'assigned')).not.toThrow();
  });

  it('allows quoted → open (quote rejected, back to open)', () => {
    expect(() => assertLogisticsTransition('quoted', 'open')).not.toThrow();
  });

  it('allows assigned → in_transit', () => {
    expect(() => assertLogisticsTransition('assigned', 'in_transit')).not.toThrow();
  });

  it('allows in_transit → delivered', () => {
    expect(() => assertLogisticsTransition('in_transit', 'delivered')).not.toThrow();
  });

  it('rejects open → in_transit (must be assigned first)', () => {
    expect(() => assertLogisticsTransition('open', 'in_transit')).toThrow(LogisticsTransitionError);
  });

  it('rejects delivered → any (terminal state)', () => {
    const statuses = ['open', 'quoted', 'assigned', 'in_transit'] as const;
    for (const s of statuses) {
      expect(() => assertLogisticsTransition('delivered', s)).toThrow(LogisticsTransitionError);
    }
  });

  it('rejects assigned → open (no going back once assigned)', () => {
    expect(() => assertLogisticsTransition('assigned', 'open')).toThrow(LogisticsTransitionError);
  });

  it('throws LogisticsTransitionError with descriptive message', () => {
    expect(() => assertLogisticsTransition('delivered', 'open')).toThrow(
      'Invalid logistics transition: delivered → open'
    );
  });
});
