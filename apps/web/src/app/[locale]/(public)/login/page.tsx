import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--color-foreground)]">
            {t('loginTitle')}
          </h1>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-[var(--color-primary)] font-medium hover:underline">
            {t('signupCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}
