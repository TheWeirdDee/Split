"use client";

import { AppHeader } from '@/components/app/AppHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllRead, unreadCount } = useNotifications();

  return (
    <>
      <AppHeader title="Notifications" showBack />
      <div className="pt-20 px-4 pb-24 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex items-center justify-center text-brand">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
              <p className="text-xs text-text-secondary">
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-2 rounded-3xl animate-pulse" />
          ))
        ) : notifications.length === 0 ? (
          <Card className="p-6 text-center text-text-secondary">
            No notifications yet. Reminders and group alerts will appear here.
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className="p-4 border border-border"
                style={{ background: notification.is_read ? '#0D0D0D' : '#111' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
                    <p className="text-xs text-text-secondary mt-1 leading-5">{notification.body}</p>
                    <p className="text-[10px] text-[#6d6d6d] mt-3">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {!notification.is_read && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#00c896] font-semibold">New</span>
                    )}
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="text-[11px] text-brand hover:underline"
                      >
                        Open
                      </a>
                    )}
                    {!notification.is_read && (
                      <Button size="icon" variant="secondary" onClick={() => markAsRead(notification.id)}>
                        Read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
