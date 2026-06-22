import type { NotificationItem } from '@/components/layout/notification-bell';
import { NotificationBell } from '@/components/layout/notification-bell';
import { getMyNotifications, getMyUnreadCount } from '@/server/notifications';

export async function NotificationBellServer() {
  const [itemsRes, countRes] = await Promise.all([getMyNotifications(), getMyUnreadCount()]);

  const items: NotificationItem[] = itemsRes.success ? (itemsRes.data as NotificationItem[]) : [];
  const unread = countRes.success ? (countRes.data as number) : 0;

  return <NotificationBell initialItems={items} initialUnread={unread} />;
}
