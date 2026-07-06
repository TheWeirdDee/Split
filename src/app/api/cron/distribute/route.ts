import { createPublicClient, createWalletClient, http, fallback } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { SAVINGS_CIRCLE_ADDRESS, SAVINGS_CIRCLE_ABI } from '@/lib/contract';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 1. Authorize the request via CRON_SECRET bearer token if set
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch the admin private key for signing transaction gas
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!adminPrivateKey) {
    return NextResponse.json({ error: 'ADMIN_PRIVATE_KEY or PRIVATE_KEY not configured' }, { status: 500 });
  }

  if (!SAVINGS_CIRCLE_ADDRESS) {
    return NextResponse.json({ error: 'SAVINGS_CIRCLE_ADDRESS not configured' }, { status: 500 });
  }

  const rpcUrl = process.env.CELO_RPC_URL || 'https://forno.celo.org';
  const publicClient = createPublicClient({
    chain: celo,
    transport: fallback([
      http(rpcUrl),
      http('https://rpc.ankr.com/celo'),
      http('https://celo.drpc.org'),
    ]),
  });

  const account = privateKeyToAccount(
    (adminPrivateKey.startsWith('0x') ? adminPrivateKey : `0x${adminPrivateKey}`) as `0x${string}`
  );

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: fallback([
      http(rpcUrl),
      http('https://rpc.ankr.com/celo'),
      http('https://celo.drpc.org'),
    ]),
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 3. Read total circleCount from the contract
    const circleCount = await publicClient.readContract({
      address: SAVINGS_CIRCLE_ADDRESS,
      abi: SAVINGS_CIRCLE_ABI,
      functionName: 'circleCount',
    }) as bigint;

    const total = Number(circleCount);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const results = [];

    // 4. Iterate and process all active rotating circles
    for (let i = 1; i <= total; i++) {
      try {
        const circleData: any = await publicClient.readContract({
          address: SAVINGS_CIRCLE_ADDRESS,
          abi: SAVINGS_CIRCLE_ABI,
          functionName: 'getCircle',
          args: [BigInt(i)],
        });

        const name = circleData[0];
        const mode = Number(circleData[1]); // 0 = Rotating, 1 = Goal
        const status = Number(circleData[2]); // 0 = Active, 1 = Completed, 2 = Dissolved
        const nextDeadline = BigInt(circleData[6]);
        const memberAddrs: string[] = circleData[8];

        if (status !== 0 || mode !== 0) continue; // Only process Active Rotating circles

        // Get details from config mapping
        const configData: any = await publicClient.readContract({
          address: SAVINGS_CIRCLE_ADDRESS,
          abi: SAVINGS_CIRCLE_ABI,
          functionName: 'circles',
          args: [BigInt(i)],
        });

        if (!configData) continue;
        const configObj = configData[2];

        let frequency = 0n;
        let gracePeriod = 0n;
        if (configObj) {
          if (typeof configObj === 'object') {
            frequency = configObj.frequency !== undefined ? BigInt(configObj.frequency) : (configObj[3] !== undefined ? BigInt(configObj[3]) : 0n);
            gracePeriod = configObj.gracePeriod !== undefined ? BigInt(configObj.gracePeriod) : (configObj[4] !== undefined ? BigInt(configObj[4]) : 0n);
          } else if (Array.isArray(configObj)) {
            frequency = BigInt(configObj[3]);
            gracePeriod = BigInt(configObj[4]);
          }
        }

        // Only process Daily Speedrun Circles (frequency <= 86400 seconds)
        if (frequency > 86400n) continue;

        if (now >= nextDeadline) {
          const markedMissedAddrs: string[] = [];

          // First check and mark missed any active member who hasn't contributed past grace period
          for (const addr of memberAddrs) {
            const memberAddr = addr as `0x${string}`;
            const hasContributed = await publicClient.readContract({
              address: SAVINGS_CIRCLE_ADDRESS,
              abi: SAVINGS_CIRCLE_ABI,
              functionName: 'hasContributedThisCycle',
              args: [BigInt(i), memberAddr],
            }) as boolean;

            const mStatusData: any = await publicClient.readContract({
              address: SAVINGS_CIRCLE_ADDRESS,
              abi: SAVINGS_CIRCLE_ABI,
              functionName: 'getMemberStatus',
              args: [BigInt(i), memberAddr],
            });
            const mStatus = Number(mStatusData[3]); // status: 0 = Active, 1 = Skipped, 2 = Removed, 3 = Exited

            if (mStatus === 0 && !hasContributed) {
              if (now >= nextDeadline + gracePeriod) {
                // Trigger markMissed on-chain
                try {
                  const gasPrice = await publicClient.getGasPrice();
                  const hash = await walletClient.writeContract({
                    address: SAVINGS_CIRCLE_ADDRESS,
                    abi: SAVINGS_CIRCLE_ABI,
                    functionName: 'markMissed',
                    args: [BigInt(i), memberAddr],
                    gasPrice,
                  });
                  await publicClient.waitForTransactionReceipt({ hash });
                  markedMissedAddrs.push(addr);

                  // Deduct trust score (-50) and increment missed contributions count
                  try {
                    const targetAddr = addr.toLowerCase();
                    const { data: profile } = await supabaseAdmin
                      .from('user_profiles')
                      .select('trust_score, missed_contributions')
                      .eq('wallet_address', targetAddr)
                      .maybeSingle();

                    const currentScore = profile?.trust_score ?? 680;
                    const currentMissed = profile?.missed_contributions ?? 0;
                    const newScore = Math.max(300, currentScore - 50);

                    await supabaseAdmin
                      .from('user_profiles')
                      .update({
                        trust_score: newScore,
                        missed_contributions: currentMissed + 1,
                      })
                      .eq('wallet_address', targetAddr);
                  } catch (dbErr) {
                    console.error(`Failed to update trust score for missed member ${addr}:`, dbErr);
                  }
                } catch (markErr: any) {
                  console.error(`Failed to mark missed for circle ${i}, member ${addr}:`, markErr);
                }
              }
            }
          }

          // Then check if the pot is ready for payout distribution
          let allContributed = true;
          for (const addr of memberAddrs) {
            const memberAddr = addr as `0x${string}`;
            const mStatusData: any = await publicClient.readContract({
              address: SAVINGS_CIRCLE_ADDRESS,
              abi: SAVINGS_CIRCLE_ABI,
              functionName: 'getMemberStatus',
              args: [BigInt(i), memberAddr],
            });
            const mStatus = Number(mStatusData[3]); // 0 = Active

            if (mStatus === 0) {
              const hasContributed = await publicClient.readContract({
                address: SAVINGS_CIRCLE_ADDRESS,
                abi: SAVINGS_CIRCLE_ABI,
                functionName: 'hasContributedThisCycle',
                args: [BigInt(i), memberAddr],
              }) as boolean;
              if (!hasContributed) {
                allContributed = false;
                break;
              }
            }
          }

          if (allContributed) {
            try {
              const gasPrice = await publicClient.getGasPrice();
              const hash = await walletClient.writeContract({
                address: SAVINGS_CIRCLE_ADDRESS,
                abi: SAVINGS_CIRCLE_ABI,
                functionName: 'distribute',
                args: [BigInt(i)],
                gasPrice,
              });
              await publicClient.waitForTransactionReceipt({ hash });
              results.push({
                circleId: i,
                name,
                action: 'distributed',
                markedMissed: markedMissedAddrs,
                txHash: hash,
              });
            } catch (distErr: any) {
              results.push({
                circleId: i,
                name,
                action: 'failed_distribute',
                markedMissed: markedMissedAddrs,
                error: distErr.shortMessage || distErr.message,
              });
            }
          } else {
            results.push({
              circleId: i,
              name,
              action: 'waiting_for_contributions_or_grace_period',
              markedMissed: markedMissedAddrs,
            });
          }
        }
      } catch (err: any) {
        results.push({
          circleId: i,
          action: 'error',
          error: err.message,
        });
      }
    }

    return NextResponse.json({ ok: true, processed: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
