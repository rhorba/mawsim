'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { Role } from '@mawsim/core';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

interface TopBarProps {
  role?: Role | null;
  locale: string;
  bellSlot?: React.ReactNode;
}

const roleColors: Record<Role, string> = {
  farmer: 'bg-[var(--color-secondary)] text-white',
  buyer: 'bg-[var(--color-primary)] text-white',
  logistics: 'bg-[var(--color-info)] text-white',
  admin: 'bg-[var(--color-foreground)] text-white',
};

const roleLabels: Record<Role, string> = {
  farmer: 'Producteur',
  buyer: 'Acheteur',
  logistics: 'Transporteur',
  admin: 'Admin',
};

export function TopBar({ role, locale, bellSlot }: TopBarProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const otherLocale = locale === 'fr' ? 'ar' : 'fr';
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xl font-bold text-[var(--color-primary)]">Mawsim</span>
          <span className="text-[var(--color-secondary)] font-arabic text-base">موسم</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/prix">{t('priceboard')}</NavLink>
          <NavLink href="/listings">{t('listings')}</NavLink>
          {role === 'farmer' && (
            <>
              <NavLink href="/farmer/listings">{t('myListings')}</NavLink>
              <NavLink href="/farmer/listings/new">{t('postListing')}</NavLink>
              <NavLink href="/farmer/deals">{t('deals')}</NavLink>
              <NavLink href="/farmer/alerts">Alertes prix</NavLink>
              <NavLink href="/farmer/profile">{t('profile')}</NavLink>
            </>
          )}
          {role === 'buyer' && (
            <>
              <NavLink href="/buyer/rfqs">{t('myRFQs')}</NavLink>
              <NavLink href="/buyer/rfqs/new">{t('postRFQ')}</NavLink>
              <NavLink href="/buyer/deals">{t('deals')}</NavLink>
              <NavLink href="/buyer/alerts">Alertes prix</NavLink>
              <NavLink href="/buyer/profile">{t('profile')}</NavLink>
            </>
          )}
          {role === 'logistics' && <NavLink href="/logistics">{t('logistics')}</NavLink>}
          {role === 'admin' && <NavLink href="/admin">{t('admin')}</NavLink>}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Locale switch */}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: otherLocale })}
            className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] px-2 py-1 rounded border border-[var(--color-border)] transition-colors"
          >
            {otherLocale === 'ar' ? 'العربية' : 'Français'}
          </button>

          {role ? (
            <div className="flex items-center gap-2">
              {bellSlot}
              <span
                className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', roleColors[role])}
              >
                {roleLabels[role]}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                className="text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-mid)] transition-colors"
              >
                {t('signup')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg)] transition-colors"
    >
      {children}
    </Link>
  );
}
