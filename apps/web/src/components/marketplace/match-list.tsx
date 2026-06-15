'use client';

import { GradeBadge } from '@/components/marketplace/badges';
import { Link } from '@/i18n/navigation';
import type { RfqMatchView } from '@/server/rfq-types';
import { formatMAD } from '@mawsim/core';
import { useTranslations } from 'next-intl';

export function MatchList({ matches, locale }: { matches: RfqMatchView[]; locale: 'fr' | 'ar' }) {
  const t = useTranslations();

  if (matches.length === 0) {
    return (
      <div className="text-center text-[var(--color-muted)] py-10 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)]">
        {t('rfq.noMatches')}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.listingId}>
          <Link
            href={`/listings/${m.listingId}`}
            className="flex items-center justify-between gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[var(--color-foreground)] truncate">
                  {m.productVariety || t(`products.${m.productCategory}`)}
                </p>
                <GradeBadge grade={m.qualityGrade} label={t(`grades.${m.qualityGrade}`)} />
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">
                {m.farmName} · {t(`regions.${m.region}`)} · ★ {m.sellerRating.toFixed(1)}
              </p>
            </div>

            <div className="text-end shrink-0">
              <p className="font-semibold text-[var(--color-primary)] tabular-nums">
                {formatMAD(m.askPricePerQtx, locale)}
              </p>
              <p className="text-[10px] text-[var(--color-muted)] uppercase">
                {t('common.perQtx')}
              </p>
            </div>

            <div className="text-end shrink-0 w-20">
              <div className="text-sm font-bold text-[var(--color-secondary)] tabular-nums">
                {Math.round(m.score * 100)}%
              </div>
              <p className="text-[10px] text-[var(--color-muted)]">{t('rfq.matchScore')}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
