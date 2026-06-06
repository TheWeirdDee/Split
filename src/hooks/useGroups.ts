import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export const useGroups = () => {
  const { address } = useWallet();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!address) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('wallet_address', address.toLowerCase());

    if (memberError) {
      console.error('Error fetching member groups:', memberError);
      setLoading(false);
      return;
    }

    const groupIds = memberData.map(m => m.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*, group_members(*)')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupError) {
      console.error('Error fetching group details:', groupError);
    } else {
      setGroups(groupData || []);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refreshGroups: fetchGroups };
};

export const useGroup = (groupId: string) => {
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
    } else {
      setGroup(groupData);
      
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);
      
      setMembers(memberData || []);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  return { group, members, loading, refreshGroup: fetchGroupData };
};
