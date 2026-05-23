import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface GroupMessage {
  id: string;
  group_id: string;
  sender: string;
  text: string | null;
  attachment_url: string | null;
  created_at: string;
}

export const useGroupChat = (groupId: string) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching group messages:', error);
      setMessages([]);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (groupId: string, sender: string, text: string | null, attachmentUrl: string | null) => {
    const { data, error } = await supabase.from('messages').insert([
      {
        group_id: groupId,
        sender: sender.toLowerCase(),
        text,
        attachment_url: attachmentUrl,
      },
    ]).select();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    if (data && data[0]) {
      setMessages((prev) => [...prev, data[0]]);
    }
  };

  return { messages, loading, fetchMessages, sendMessage };
};