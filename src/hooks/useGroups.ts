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

    const lowerAddr = address.toLowerCase();

    // Groups where user has a membership row
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('wallet_address', lowerAddr);
    const memberGroupIds: string[] = (memberData || []).map((m: any) => m.group_id);

    // Groups created by this user (creator may not have a group_members row)
    const { data: createdData } = await supabase
      .from('groups')
      .select('id')
      .eq('created_by', lowerAddr);
    const createdGroupIds: string[] = (createdData || []).map((g: any) => g.id);

    const allGroupIds = Array.from(new Set([...memberGroupIds, ...createdGroupIds]));
    if (allGroupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*, group_members(*)')
      .in('id', allGroupIds)
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
      .maybeSingle();

    if (groupError) {
      console.error('Error fetching group:', groupError);
    } else {
      setGroup(groupData);
      
      if (groupData) {
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId);
        
        setMembers(memberData || []);
      } else {
        setMembers([]);
      }
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  return { group, members, loading, refreshGroup: fetchGroupData };
};
