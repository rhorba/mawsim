import { cn } from '@/lib/cn';
import type { DealStatus, QualityGrade } from '@mawsim/core';

interface GradeBadgeProps {
  grade: QualityGrade;
  className?: string;
}

const gradeLabels: Record<QualityGrade, string> = {
  premium: 'Premium',
  grade_a: 'Grade A',
  grade_b: 'Grade B',
  standard: 'Standard',
};

export function GradeBadge({ grade, className }: GradeBadgeProps) {
  return (
    <span
      className={cn(
        `badge-${grade}`,
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold',
        className
      )}
    >
      {gradeLabels[grade]}
    </span>
  );
}

interface StatusBadgeProps {
  status: DealStatus | 'active' | 'draft' | 'negotiating' | 'sold' | 'expired' | 'cancelled';
  label: string;
  className?: string;
}

const statusClass: Record<string, string> = {
  completed: 'status-completed',
  agreed: 'status-completed',
  active: 'status-active',
  offer_made: 'status-active',
  negotiating: 'status-negotiating',
  contract_signed: 'status-negotiating',
  escrow_funded: 'status-negotiating',
  in_transit: 'status-negotiating',
  delivered: 'status-negotiating',
  disputed: 'status-disputed',
  cancelled: 'status-cancelled',
  expired: 'status-cancelled',
  sold: 'status-completed',
  draft: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        statusClass[status] ?? 'bg-gray-100 text-gray-500',
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'verified';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        variant === 'default' && 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
        variant === 'outline' && 'border border-[var(--color-border)] text-[var(--color-muted)]',
        variant === 'verified' && 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
        className
      )}
    >
      {children}
    </span>
  );
}
