'use client';

import { markAllNotificationsRead, markNotificationRead } from '@/server/notifications';
import { useEffect, useRef, useState } from 'react';

export type NotificationItem = {
  id: string;
  event: string;
  entityId: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
};

const EVENT_LABELS: Record<string, string> = {
  bid_received: 'Nouvelle offre reçue',
  counteroffer_received: 'Contre-offre reçue',
  deal_agreed: 'Transaction confirmée',
  payment_received: 'Paiement reçu',
  delivery_confirmed: 'Livraison confirmée',
  escrow_released: 'Séquestre libéré',
  dispute_opened: 'Litige ouvert',
  logistics_quoted: 'Devis transport reçu',
  logistics_assigned: 'Transporteur assigné',
  price_alert_triggered: 'Alerte prix déclenchée',
};

interface NotificationBellProps {
  initialItems: NotificationItem[];
  initialUnread: number;
}

export function NotificationBell({ initialItems, initialUnread }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (unread > 0) {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
      setUnread(0);
    }
  }

  async function handleClickItem(id: string) {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-1.5 rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--color-danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              Notifications
            </span>
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]">
            {items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                Aucune notification
              </li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClickItem(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-[var(--color-bg)] transition-colors ${!n.readAt ? 'bg-[var(--color-primary)]/5' : ''}`}
                >
                  <p
                    className={`text-sm ${!n.readAt ? 'font-semibold text-[var(--color-foreground)]' : 'font-normal text-[var(--color-muted)]'}`}
                  >
                    {EVENT_LABELS[n.event] ?? n.event}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString('fr-MA', { dateStyle: 'medium' })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
