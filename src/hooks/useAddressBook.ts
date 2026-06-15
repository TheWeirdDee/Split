import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export interface AddressBookEntry {
  id: string;
  owner_address: string;
  contact_address: string;
  nickname: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Manages the connected wallet's personal address book (saved contacts),
 * backed by the Supabase `address_book` table and scoped to `owner_address`.
 *
 * @returns entries, loading state, and helpers to fetch, upsert, delete,
 *          and resolve a wallet address to its saved nickname.
 */
export const useAddressBook = () => {
  const { address } = useWallet();
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!address) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('address_book')
      .select('*')
      .eq('owner_address', address.toLowerCase())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching address book:', error);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const upsertEntry = async (contactAddress: string, nickname: string, notes: string | null = null) => {
    if (!address) return;
    const normalizedContact = contactAddress.toLowerCase();
    const { error } = await supabase.from('address_book').upsert(
      {
        owner_address: address.toLowerCase(),
        contact_address: normalizedContact,
        nickname: nickname.trim(),
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_address,contact_address' }
    );
    if (error) throw error;
    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('address_book').delete().eq('id', id);
    if (error) throw error;
    await fetchEntries();
  };

  const getNickname = (walletAddress: string) => {
    const match = entries.find(
      (entry) => entry.contact_address.toLowerCase() === walletAddress.toLowerCase()
    );
    return match?.nickname || null;
  };

  return { entries, loading, fetchEntries, upsertEntry, deleteEntry, getNickname };
};
