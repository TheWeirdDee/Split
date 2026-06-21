import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

/**
 * Lists every group the connected wallet belongs to or created, merging
 * Supabase-backed groups with any offline `local-` groups from localStorage.
 * Works (offline-only) even when no wallet is connected.
 */
export const useGroups = () => {
  const { address } = useWallet();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    let localData: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        localData = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
      } catch (err) {
        console.error('Error reading local groups:', err);
      }
    }

    if (!address) {
      setGroups(localData);
      setLoading(false);
      return;
    }
    setLoading(true);

    const lowerAddr = address.toLowerCase();

    try {
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
        setGroups(localData);
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
        setGroups(localData);
      } else {
        setGroups([...localData, ...(groupData || [])]);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setGroups(localData);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refreshGroups: fetchGroups };
};

/**
 * Loads a single group plus its members. Reads from localStorage for `local-`
 * groups, otherwise from Supabase (`groups` + `group_members`).
 *
 * @param groupId on-chain/Supabase group id, or a `local-` offline id.
 */
export const useGroup = (groupId: string) => {
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    if (groupId.startsWith('local-')) {
      if (typeof window !== 'undefined') {
        try {
          const localGroups = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
          const found = localGroups.find((g: any) => g.id === groupId);
          setGroup(found || null);
          setMembers(found ? found.members : []);
        } catch (err) {
          console.error('Error loading local group:', err);
        }
      }
      setLoading(false);
      return;
    }

    try {
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
          const { data: memberData } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId);

          // Onchain groups historically didn't write the creator into
          // group_members, leaving the member list empty (so expenses couldn't
          // be split). Self-heal by ensuring the creator is always present.
          let memberList = memberData || [];
          const creator = groupData.created_by?.toLowerCase();
          if (creator && !memberList.some((m: any) => m.wallet_address?.toLowerCase() === creator)) {
            memberList = [{ group_id: groupId, wallet_address: creator, display_name: null }, ...memberList];
          }
          setMembers(memberList);
        } else {
          setMembers([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch group:', err);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  return { group, members, loading, refreshGroup: fetchGroupData };
};

