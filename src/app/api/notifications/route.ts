import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Server-side notification creation. Centralising the INSERT here lets us lock
// the `notifications` table so the public anon key can no longer be used to
// forge/insert notifications directly — only this controlled endpoint (running
// with the service-role key) writes them. Preference + quiet-hours checks live
// here too so they can't be bypassed from the client.

type NotificationType =
  | 'reminder' | 'payment' | 'join' | 'expense'
  | 'system' | 'message' | 'settlement' | 'group_joined';

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
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

export async function POST(req: NextRequest) {
  let input: any;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ sent: false, reason: 'bad_request' }, { status: 400 });
  }

  const userAddress = String(input?.userAddress || '').toLowerCase();
  const type = input?.type as NotificationType;
  const title = String(input?.title || '');
  const body = String(input?.body || '');
  if (!userAddress || !type || !title) {
    return NextResponse.json({ sent: false, reason: 'bad_request' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Respect recipient preferences / quiet hours.
  const { data: pref } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('wallet_address', userAddress)
    .maybeSingle();

  const preferenceKey = mapTypeToPreference(type);
  if (pref?.[preferenceKey] === false) {
    return NextResponse.json({ sent: false, reason: 'preference_disabled' });
  }
  if (pref?.quiet_hours_enabled && isInQuietHours(pref.quiet_hours_start, pref.quiet_hours_end)) {
    return NextResponse.json({ sent: false, reason: 'quiet_hours' });
  }

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_address: userAddress,
    group_id: input?.groupId ?? null,
    type,
    title,
    body,
    actor: input?.actor ?? null,
    action_url: input?.actionUrl ?? null,
    is_read: false,
  });

  if (error) {
    return NextResponse.json({ sent: false, reason: 'error' }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
