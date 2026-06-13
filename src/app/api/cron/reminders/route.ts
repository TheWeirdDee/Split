import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, fallback } from 'viem';
import { celo } from 'viem/chains';
import { SAVINGS_CIRCLE_ADDRESS, SAVINGS_CIRCLE_ABI } from '@/lib/contract';
import { NextRequest, NextResponse } from 'next/server';

const REMINDER_WINDOW_SECS = 3600; // notify if deadline is within 1 hour

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const publicClient = createPublicClient({
    chain: celo,
    transport: fallback([
      http('https://forno.celo.org'),
      http('https://rpc.ankr.com/celo'),
      http('https://celo.drpc.org'),
    ]),
  });

  if (!SAVINGS_CIRCLE_ADDRESS) {
    return NextResponse.json({ error: 'SAVINGS_CIRCLE_ADDRESS not configured' }, { status: 500 });
  }

  try {
    const circleCount = await publicClient.readContract({
      address: SAVINGS_CIRCLE_ADDRESS,
      abi: SAVINGS_CIRCLE_ABI,
      functionName: 'circleCount',
    }) as bigint;

    const total = Number(circleCount);
    const now = Math.floor(Date.now() / 1000);
    let sent = 0;
    let errors = 0;

    for (let i = 1; i <= total; i++) {
      try {
        const res: any = await publicClient.readContract({
          address: SAVINGS_CIRCLE_ADDRESS,
          abi: SAVINGS_CIRCLE_ABI,
          functionName: 'getCircle',
          args: [BigInt(i)],
        });

        const status = Number(res[2]); // 0 = Active
        if (status !== 0) continue;

        const circleName: string = res[0];
        const nextDeadline = Number(res[6]);
        const memberAddrs: string[] = res[8];

        const secsUntilDeadline = nextDeadline - now;
        const secsOverdue = now - nextDeadline;

        const isUpcoming = secsUntilDeadline > 0 && secsUntilDeadline <= REMINDER_WINDOW_SECS;
        const isOverdue = secsOverdue > 0 && secsOverdue <= REMINDER_WINDOW_SECS;

        if (!isUpcoming && !isOverdue) continue;

        const title = isOverdue
          ? `Contribution overdue in ${circleName}`
          : `Contribution due in ${circleName}`;
        const body = isOverdue
          ? `Your contribution to "${circleName}" is overdue. Contribute now to avoid being marked missed.`
          : `Your contribution to "${circleName}" is due in less than 1 hour. Don't miss it.`;

        for (const addr of memberAddrs) {
          const { error } = await supabaseAdmin.from('notifications').insert({
            user_address: addr.toLowerCase(),
            group_id: null,
            type: 'reminder',
            title,
            body,
            actor: null,
            action_url: `/app/save/${i}`,
            is_read: false,
          });
          if (error) errors++;
          else sent++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ ok: true, checked: total, sent, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
