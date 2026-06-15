'use client';

import { Button } from '@/components/ui/button';
import { closeRfq } from '@/server/rfq';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function CloseRfqButton({ rfqId }: { rfqId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await closeRfq(rfqId);
            if (!res.success) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {t('rfq.closeCta')}
      </Button>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
