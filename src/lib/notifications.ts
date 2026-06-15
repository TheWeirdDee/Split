import { supabase } from '@/lib/supabase';

type NotificationType =
  | 'reminder'
  | 'payment'
  | 'join'
  | 'expense'
  | 'system'
  | 'message'
  | 'settlement'
  | 'group_joined';

interface CreateNotificationInput {
  userAddress: string;
  groupId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actor?: string | null;
  actionUrl?: string | null;
}

const mapTypeToPreference = (type: NotificationType) => {
  if (type === 'reminder') return 'allow_reminders';
  if (type === 'expense') return 'allow_expense_updates';
  if (type === 'message') return 'allow_messages';
  if (type === 'settlement' || type === 'payment') return 'allow_settlements';
  return 'allow_group_updates';
};

const toMinutes = (value: string | null | undefined): number | null => {
  if (!value || !value.includes(':')) return null;
  const [h, m] = value.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const isInQuietHours = (start: string, end: string): boolean => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null) return false;

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

/**
 * Inserts a notification only if the recipient's preferences allow it.
 * Honors per-type opt-outs (mapped via {@link mapTypeToPreference}) and the
 * recipient's quiet-hours window, returning a `{ sent, reason }` result rather
 * than throwing when a message is intentionally suppressed.
 */
export const createNotificationSafe = async (input: CreateNotificationInput) => {
  const normalizedAddress = input.userAddress.toLowerCase();
  const preferenceKey = mapTypeToPreference(input.type);

  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .maybeSingle();

  if (pref?.[preferenceKey] === false) {
    return { sent: false, reason: 'preference_disabled' as const };
  }

  if (
    pref?.quiet_hours_enabled &&
    isInQuietHours(pref.quiet_hours_start, pref.quiet_hours_end)
  ) {
    return { sent: false, reason: 'quiet_hours' as const };
  }

  const { error } = await supabase.from('notifications').insert({
    user_address: normalizedAddress,
    group_id: input.groupId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    actor: input.actor ?? null,
    action_url: input.actionUrl ?? null,
    is_read: false,
  });

  if (error) {
    throw error;
  }

  return { sent: true as const };
};
