import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { SignupForm } from './signup-form';

export default async function SignupPage() {
  const t = await getTranslations('auth');

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--color-foreground)]">
            {t('signupTitle')}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Rejoignez la première marketplace agricole du Maroc
          </p>
        </div>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {t('alreadyAccount')}{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            {t('loginCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}
