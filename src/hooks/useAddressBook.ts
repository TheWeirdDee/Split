import { useCallback, useEffect, useState } from 'react';
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
  const { address, ensureSession } = useWallet();
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!address) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/address-book?address=${address.toLowerCase()}`);
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (error) {
      console.error('Error fetching address book:', error);
      setEntries([]);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const upsertEntry = async (contactAddress: string, nickname: string, notes: string | null = null) => {
    if (!address) return;
    await ensureSession();
    const res = await fetch('/api/address-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address.toLowerCase(), contactAddress, nickname, notes }),
    });
    if (!res.ok) throw new Error('Failed to save contact');
    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!address) return;
    await ensureSession();
    const res = await fetch(`/api/address-book?id=${id}&address=${address.toLowerCase()}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete contact');
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
