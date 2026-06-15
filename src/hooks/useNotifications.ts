import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface NotificationItem {
  id: string;
  user_address: string;
  group_id: string | null;
  type: string;
  title: string;
  body: string;
  actor: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Loads the connected wallet's notifications and subscribes to a Supabase
 * realtime channel so new INSERTs stream in live. Provides `markAsRead`,
 * `markAllRead`, and a derived `unreadCount`.
 */
export const useNotifications = () => {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchNotifications();

    if (!address) return;

    const channelName = `notifications-${address.toLowerCase()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_address=eq.${address.toLowerCase()}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, address]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification read:', error);
    } else {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_address', address?.toLowerCase());

    if (error) {
      console.error('Error marking all notifications read:', error);
      return;
    }

    setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return { notifications, loading, fetchNotifications, markAsRead, markAllRead, unreadCount };
};