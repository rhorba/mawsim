import { cn } from '@/lib/cn';

const gradeStyles: Record<string, string> = {
  premium:
    'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]',
  grade_a:
    'bg-[var(--color-primary-light)] text-[var(--color-secondary)] border-[var(--color-border)]',
  grade_b: 'bg-[var(--color-bg)] text-[var(--color-foreground)] border-[var(--color-border)]',
  standard: 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)]',
};

export function GradeBadge({ grade, label }: { grade: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border',
        gradeStyles[grade] ?? gradeStyles.standard
      )}
    >
      {label}
    </span>
  );
}

const statusStyles: Record<string, string> = {
  active: 'bg-[var(--color-primary-light)] text-[var(--color-secondary)]',
  draft: 'bg-[var(--color-bg)] text-[var(--color-muted)]',
  negotiating: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  sold: 'bg-[var(--color-secondary)] text-white',
  expired: 'bg-[var(--color-bg)] text-[var(--color-muted)]',
  cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  open: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  matched: 'bg-[var(--color-primary-light)] text-[var(--color-secondary)]',
  closed: 'bg-[var(--color-bg)] text-[var(--color-muted)]',
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
        statusStyles[status] ?? statusStyles.draft
      )}
    >
      {label}
    </span>
  );
}
