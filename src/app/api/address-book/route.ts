import { NextRequest, NextResponse } from 'next/server';
import { adminClient, resolveCaller } from '@/lib/authServer';

// Address book is strictly private to its owner. The owner is resolved from the
// session (never trusted from the client when auth is enabled), so one user can
// never read or modify another's saved contacts.

export async function GET(req: NextRequest) {
  const owner = resolveCaller(req, req.nextUrl.searchParams.get('address'));
  if (!owner) return NextResponse.json({ entries: [] });

  const { data, error } = await adminClient()
    .from('address_book')
    .select('*')
    .eq('owner_address', owner)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ entries: [], error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const owner = resolveCaller(req, body?.address);
  if (!owner) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const contactAddress = String(body?.contactAddress || '').toLowerCase();
  const nickname = String(body?.nickname || '').trim();
  if (!contactAddress || !nickname) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const { error } = await adminClient().from('address_book').upsert(
    {
      owner_address: owner,
      contact_address: contactAddress,
      nickname,
      notes: body?.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_address,contact_address' }
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const owner = resolveCaller(req, req.nextUrl.searchParams.get('address'));
  if (!owner) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  // Scope the delete to the owner so you can't delete someone else's row.
  const { error } = await adminClient().from('address_book').delete().eq('id', id).eq('owner_address', owner);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
