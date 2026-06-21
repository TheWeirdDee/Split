import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export interface GroupMessage {
  id: string;
  group_id: string;
  sender: string;
  text: string | null;
  attachment_url: string | null;
  created_at: string;
}

/**
 * Loads and posts chat messages for a group via the Supabase `messages` table.
 * Newly sent messages are appended optimistically to local state.
 *
 * @param groupId the group whose message thread to load.
 */
export const useGroupChat = (groupId: string) => {
  const { address, ensureSession } = useWallet();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const qs = address ? `&address=${address.toLowerCase()}` : '';
      const res = await fetch(`/api/messages?groupId=${encodeURIComponent(groupId)}${qs}`);
      const json = await res.json();
      setMessages(json.messages || []);
    } catch (error) {
      console.error('Error fetching group messages:', error);
      setMessages([]);
    }
    setLoading(false);
  }, [groupId, address]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (groupId: string, sender: string, text: string | null, attachmentUrl: string | null) => {
    await ensureSession();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, sender: sender.toLowerCase(), text, attachmentUrl }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      console.error('Error sending message:', json);
      throw new Error('Failed to send message');
    }
    const json = await res.json();
    if (json.message) setMessages((prev) => [...prev, json.message]);
  };

  return { messages, loading, fetchMessages, sendMessage };
};