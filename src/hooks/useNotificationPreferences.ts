import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface NotificationPreferences {
  user_address: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  allow_reminders: boolean;
  allow_expense_updates: boolean;
  allow_group_updates: boolean;
  allow_messages: boolean;
  allow_settlements: boolean;
}

const defaultPreferences: NotificationPreferences = {
  user_address: '',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  allow_reminders: false,
  allow_expense_updates: false,
  allow_group_updates: false,
  allow_messages: false,
  allow_settlements: false,
};

export const useNotificationPreferences = () => {
  const { address } = useWallet();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    const { data, error } = await supabase
      .from<NotificationPreferences>('notification_preferences')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
    }

    setPreferences(data ? { ...defaultPreferences, ...data } : { ...defaultPreferences, user_address: address.toLowerCase() });
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (changes: Partial<NotificationPreferences>) => {
    if (!address) return;

    const payload = {
      user_address: address.toLowerCase(),
      ...preferences,
      ...changes,
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_address' });

    if (error) {
      throw error;
    }

    const merged = { ...preferences, ...changes, user_address: address.toLowerCase() };
    setPreferences(merged);
    return merged;
  };

  return {
    preferences,
    loading,
    fetchPreferences,
    updatePreferences,
  };
};
