import { NextRequest, NextResponse } from 'next/server';
import { adminClient, resolveCaller, authEnabled } from '@/lib/authServer';

// Group chat messages. Reads require a valid session (when auth is enabled) so
// the thread isn't world-readable via the anon key; writes set `sender` from the
// session so a user can't post as someone else.

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get('groupId');
  if (!groupId) return NextResponse.json({ messages: [] });

  const caller = resolveCaller(req, req.nextUrl.searchParams.get('address'));
  if (authEnabled() && !caller) return NextResponse.json({ messages: [] });

  const { data, error } = await adminClient()
    .from('messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ messages: [], error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const sender = resolveCaller(req, body?.sender);
  if (!sender) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const groupId = String(body?.groupId || '');
  if (!groupId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const { data, error } = await adminClient().from('messages').insert([
    {
      group_id: groupId,
      sender,
      text: body?.text ?? null,
      attachment_url: body?.attachmentUrl ?? null,
    },
  ]).select();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: data?.[0] ?? null });
}
