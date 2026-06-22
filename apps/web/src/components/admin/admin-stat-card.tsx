import { Link } from '@/i18n/navigation';

interface AdminStatCardProps {
  label: string;
  value: string;
  href?: string;
  accent?: 'primary' | 'danger' | 'warning' | 'neutral';
}

const accentClasses = {
  primary: 'border-[var(--color-primary)]',
  danger: 'border-[var(--color-danger)]',
  warning: 'border-amber-400',
  neutral: 'border-[var(--color-border)]',
};

const valueClasses = {
  primary: 'text-[var(--color-primary)]',
  danger: 'text-[var(--color-danger)]',
  warning: 'text-amber-600',
  neutral: 'text-[var(--color-foreground)]',
};

export function AdminStatCard({ label, value, href, accent = 'neutral' }: AdminStatCardProps) {
  const content = (
    <div
      className={`bg-[var(--color-surface)] border-l-4 ${accentClasses[accent]} rounded-[var(--radius-lg)] p-5 shadow-sm`}
    >
      <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClasses[accent]} font-display`}>{value}</p>
      {href && <p className="text-xs text-[var(--color-primary)] mt-2 hover:underline">Voir →</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}
