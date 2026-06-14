import type { LogisticsStatus } from '@mawsim/core';

const LOGISTICS_TRANSITIONS: Record<LogisticsStatus, LogisticsStatus[]> = {
  open: ['quoted', 'assigned'],
  quoted: ['assigned', 'open'],
  assigned: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
};

export class LogisticsTransitionError extends Error {
  constructor(from: LogisticsStatus, to: LogisticsStatus) {
    super(`Invalid logistics transition: ${from} → ${to}`);
    this.name = 'LogisticsTransitionError';
  }
}

export function assertLogisticsTransition(from: LogisticsStatus, to: LogisticsStatus): void {
  const allowed = LOGISTICS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new LogisticsTransitionError(from, to);
  }
}
