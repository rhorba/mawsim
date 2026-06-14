'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type SignupRole = 'farmer' | 'buyer' | 'logistics';

const roles: { value: SignupRole; label: string; emoji: string }[] = [
  { value: 'farmer', label: 'Producteur', emoji: '🌾' },
  { value: 'buyer', label: 'Acheteur', emoji: '🏭' },
  { value: 'logistics', label: 'Transporteur', emoji: '🚛' },
];

export function SignupForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>('farmer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          name: form.get('name'),
          role,
          phone: form.get('phone') || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Erreur lors de l'inscription.");
        setLoading(false);
        return;
      }

      // Auto-sign-in after signup
      await signIn('credentials', {
        email: form.get('email'),
        password: form.get('password'),
        redirect: false,
      });

      router.push('/');
      router.refresh();
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
              {error}
            </div>
          )}

          {/* Role picker */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{t('chooseRole')}</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-[var(--radius-md)] border text-xs font-medium transition-all',
                    role === r.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)]'
                  )}
                >
                  <span className="text-lg">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-[var(--color-foreground)]">
              {t('name')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--color-foreground)]"
            >
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-[var(--color-foreground)]">
              {t('phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+212 6XX XXX XXX"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            {t('signupCta')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
