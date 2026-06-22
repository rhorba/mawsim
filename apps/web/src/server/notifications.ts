'use server';

import { withRole } from '@/lib/action';
import { getNotifications, getUnreadCount, markAllRead, markRead } from '@mawsim/notifications';

export const getMyNotifications = withRole(
  ['farmer', 'buyer', 'logistics', 'admin'],
  async (session) => {
    return getNotifications(session.userId, 20);
  }
);

export const getMyUnreadCount = withRole(
  ['farmer', 'buyer', 'logistics', 'admin'],
  async (session) => {
    return getUnreadCount(session.userId);
  }
);

export const markNotificationRead = withRole(
  ['farmer', 'buyer', 'logistics', 'admin'],
  async (session, notificationId: string) => {
    await markRead(notificationId, session.userId);
  }
);

export const markAllNotificationsRead = withRole(
  ['farmer', 'buyer', 'logistics', 'admin'],
  async (session) => {
    await markAllRead(session.userId);
  }
);
