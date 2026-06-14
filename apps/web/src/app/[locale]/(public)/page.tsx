import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[var(--color-secondary)] to-[oklch(0.28_0.08_145)] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[var(--color-warn)] rounded-full animate-pulse" />
              Marketplace B2B agricole — Maroc
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              De la terre à l&apos;usine.
              <br />
              <span className="text-[var(--color-primary-mid)]">Sans intermédiaires.</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Connectez-vous directement avec des acheteurs industriels. Vendez votre récolte au
              prix du marché. Pas de middlemen, pas de marges cachées.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)]"
              >
                <Link href="/signup">Je suis producteur</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Link href="/signup">Je suis acheteur</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Link href="/prix">{t('nav.priceboard')} →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '1.4M', label: 'Exploitations agricoles', sub: 'Ministère Agriculture' },
            { value: '90M qtx', label: 'Céréales attendus 2026', sub: 'HCP BEP 2026' },
            { value: '27 Mrd MAD', label: 'Importations céréales', sub: 'Office des Changes' },
            { value: '4%', label: 'Commission totale', sub: 'vs 15–30% par couche' },
          ].map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[var(--color-foreground)] mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Price board teaser */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
              {t('priceboard.title')}
            </h2>
            <p className="text-[var(--color-muted)] mt-1">{t('priceboard.subtitle')}</p>
          </div>
          <Link
            href="/prix"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Voir tous les prix →
          </Link>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <table className="w-full price-table text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Produit
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Région
                </th>
                <th className="text-end px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Prix moy. (MAD/qtx)
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  product: 'Blé dur',
                  region: 'Meknès-Tafilalet',
                  price: '32 000',
                  source: 'ONICL',
                },
                { product: 'Blé tendre', region: 'Gharb', price: '28 500', source: 'ONICL' },
                {
                  product: 'Orge',
                  region: 'Béni Mellal-Khénifra',
                  price: '22 000',
                  source: 'ONICL',
                },
                {
                  product: 'Olive Picholine',
                  region: 'Marrakech-Safi',
                  price: '85 000',
                  source: 'Mawsim',
                },
                {
                  product: 'Dattes Medjoul',
                  region: 'Drâa-Tafilalet',
                  price: '420 000',
                  source: 'Mawsim',
                },
              ].map((row) => (
                <tr
                  key={`${row.product}-${row.region}`}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{row.product}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{row.region}</td>
                  <td className="px-4 py-3 text-end font-semibold tabular-nums text-[var(--color-primary)]">
                    {row.price}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--color-muted)] mt-3 text-end">
          Prix indicatifs. Données réelles disponibles après inscription.
        </p>
      </section>
    </div>
  );
}
