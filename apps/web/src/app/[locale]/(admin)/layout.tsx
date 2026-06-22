import { TopBar } from '@/components/layout/top-bar';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/deals', label: 'Transactions' },
  { href: '/admin/disputes', label: 'Litiges' },
  { href: '/admin/certifications', label: 'Certifications' },
  { href: '/admin/prices', label: 'Prix' },
] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (session.role !== 'admin') redirect(`/${locale}`);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <TopBar role={session.role} locale={locale} />

      {/* Admin sub-nav */}
      <nav className="bg-[var(--color-foreground)] text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-10 overflow-x-auto">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium px-3 py-1.5 rounded whitespace-nowrap text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
