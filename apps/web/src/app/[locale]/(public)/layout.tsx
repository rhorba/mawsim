import { TopBar } from '@/components/layout/top-bar';
import { getSession } from '@/lib/session';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar role={session?.role ?? null} locale={locale} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--color-muted)]">
          Mawsim موسم — De la terre à l&apos;usine. Sans intermédiaires inutiles.
        </div>
      </footer>
    </div>
  );
}
