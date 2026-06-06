import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface UserProfile {
  wallet_address: string;
  display_name: string | null;
  avatar_emoji: string | null;
  streak_count: number;
  last_checkin: string | null;
}

export const useProfile = () => {
  const { address } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!address) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    setProfile(data || null);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateDisplayName = async (name: string) => {
    if (!address) return;

    const upsertData = {
      wallet_address: address.toLowerCase(),
      display_name: name.trim() || null,
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(upsertData, { onConflict: 'wallet_address' });

    if (error) throw error;
    await fetchProfile();
  };

  /**
   * Called when user opens the app.
   * Increments streak if last check-in was yesterday, resets if > 1 day ago.
   */
  const recordDailyCheckIn = useCallback(async () => {
    if (!address) return null;

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Fetch current profile
    const { data: current } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (current?.last_checkin === today) {
      // Already checked in today
      return current;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isConsecutive = current?.last_checkin === yesterdayStr;
    const newStreak = isConsecutive ? (current.streak_count || 0) + 1 : 1;

    const { data: updated, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          wallet_address: address.toLowerCase(),
          display_name: current?.display_name || null,
          avatar_emoji: current?.avatar_emoji || null,
          streak_count: newStreak,
          last_checkin: today,
        },
        { onConflict: 'wallet_address' }
      )
      .select()
      .single();

    if (!error) setProfile(updated);
    return updated;
  }, [address]);

  return { profile, loading, fetchProfile, updateDisplayName, recordDailyCheckIn };
};
