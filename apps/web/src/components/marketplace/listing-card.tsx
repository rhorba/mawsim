import { GradeBadge } from '@/components/marketplace/badges';
import { Link } from '@/i18n/navigation';
import type { PublicListingCard } from '@/server/listing-types';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';

export async function ListingCard({
  listing,
  locale,
}: {
  listing: PublicListingCard;
  locale: 'fr' | 'ar';
}) {
  const t = await getTranslations();

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden transition-all hover:border-[var(--color-border-strong)] hover:shadow-md"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-bg)] flex items-center justify-center">
        <span className="font-display text-3xl font-bold text-[var(--color-primary)]/40">
          {t(`products.${listing.productCategory}`)}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[var(--color-foreground)] leading-tight">
              {listing.productVariety || t(`products.${listing.productCategory}`)}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {t(`regions.${listing.region}`)}
            </p>
          </div>
          <GradeBadge grade={listing.qualityGrade} label={t(`grades.${listing.qualityGrade}`)} />
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="font-display text-lg font-bold text-[var(--color-primary)] tabular-nums">
              {formatMAD(listing.askPricePerQtx, locale)}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">
              {t('common.perQtx')}
            </p>
          </div>
          <p className="text-sm text-[var(--color-muted)] tabular-nums">
            {listing.quantityQtx.toLocaleString(locale)} {t('common.quintaux')}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-xs">
          <span className="text-[var(--color-muted)] truncate">{listing.farmName}</span>
          <span className="flex items-center gap-2 text-[var(--color-muted)] shrink-0">
            {listing.certificationCount > 0 && (
              <span className="text-[var(--color-secondary)] font-medium">
                ✓ {listing.certificationCount}
              </span>
            )}
            <span className="text-[var(--color-warn)]">★ {listing.sellerRating.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
