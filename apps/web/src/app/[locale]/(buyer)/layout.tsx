import { NotificationBellServer } from '@/components/layout/notification-bell-server';
import { TopBar } from '@/components/layout/top-bar';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function BuyerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (session.role !== 'buyer' && session.role !== 'admin') {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <TopBar
        role={session.role}
        locale={locale}
        bellSlot={
          <Suspense fallback={null}>
            <NotificationBellServer />
          </Suspense>
        }
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
