import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface AddressBookEntry {
  id: string;
  user_address: string;
  contact_address: string;
  nickname: string;
  created_at: string | null;
}

export const useAddressBook = () => {
  const { address } = useWallet();
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    const { data, error } = await supabase
      .from<AddressBookEntry>('address_book')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching address book entries:', error);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const upsertEntry = async (contactAddress: string, nickname: string) => {
    if (!address) return;

    const payload = {
      user_address: address.toLowerCase(),
      contact_address: contactAddress.toLowerCase(),
      nickname,
    };

    const { error } = await supabase
      .from('address_book')
      .upsert(payload, { onConflict: ['user_address', 'contact_address'] });

    if (error) {
      throw error;
    }

    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!address) return;

    const { error } = await supabase
      .from('address_book')
      .delete()
      .eq('id', id)
      .eq('user_address', address.toLowerCase());

    if (error) {
      throw error;
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return { entries, loading, fetchEntries, upsertEntry, deleteEntry };
};
