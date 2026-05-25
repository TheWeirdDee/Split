import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface NotificationPreferences {
  wallet_address: string;
  allow_reminders: boolean;
  allow_expense_updates: boolean;
  allow_group_updates: boolean;
  allow_messages: boolean;
  allow_settlements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  updated_at: string;
}

const defaults: Omit<NotificationPreferences, 'wallet_address' | 'updated_at'> = {
  allow_reminders: true,
  allow_expense_updates: true,
  allow_group_updates: true,
  allow_messages: true,
  allow_settlements: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'UTC',
};

export const useNotificationPreferences = () => {
  const { address } = useWallet();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!address) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const normalized = address.toLowerCase();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('wallet_address', normalized)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      const seed = {
        wallet_address: normalized,
        ...defaults,
        updated_at: new Date().toISOString(),
      };
      const { error: seedError } = await supabase.from('notification_preferences').insert(seed);
      if (seedError) {
        console.error('Error creating default preferences:', seedError);
        setPreferences(seed as NotificationPreferences);
      } else {
        setPreferences(seed as NotificationPreferences);
      }
      setLoading(false);
      return;
    }

    setPreferences(data as NotificationPreferences);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (
    patch: Partial<Omit<NotificationPreferences, 'wallet_address' | 'updated_at'>>
  ) => {
    if (!address) return;
    const normalized = address.toLowerCase();
    const next = {
      wallet_address: normalized,
      ...(preferences || defaults),
      ...patch,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(next, { onConflict: 'wallet_address' });

    if (error) throw error;
    setPreferences(next as NotificationPreferences);
  };

  return { preferences, loading, fetchPreferences, updatePreferences };
};
