/* eslint-disable no-console */
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const KEYS_CSV = path.join(process.cwd(), 'private', 'scripts', 'divine-keys.csv');

function usage() {
  console.log('Usage:');
  console.log('  TOPUP_KEY=<private_key> ts-node --project tsconfig.json scripts/topup-celo.ts [amount=0.05] [threshold=0.03]');
  process.exit(1);
}

if (!process.env.TOPUP_KEY) usage();

const amountArg = process.argv[2] || '0.05';
const thresholdArg = process.argv[3] || '0.03';

function toWeiDecimal(s: string) {
  const parts = s.split('.');
  const intPart = BigInt(parts[0] || '0');
  const frac = (parts[1] || '').padEnd(18, '0').slice(0, 18);
  const fracBig = BigInt(frac);
  return intPart * BigInt(1_000_000_000_000_000_000) + fracBig;
}

const AMOUNT_WEI = toWeiDecimal(amountArg);
const THRESHOLD_WEI = toWeiDecimal(thresholdArg);

async function main() {
  const raw = String(await readFile(KEYS_CSV, 'utf8'));
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('index,'));

  const publicClient = createPublicClient({ chain: celo, transport: http(RPC_URL) });
  const funderKey = process.env.TOPUP_KEY!.startsWith('0x') ? process.env.TOPUP_KEY! : `0x${process.env.TOPUP_KEY!}`;
  const account = privateKeyToAccount(funderKey as Hex);
  const funder = account.address as Address;
  const walletClient = createWalletClient({ account, chain: celo, transport: http(RPC_URL) });

  const funderBal = await publicClient.getBalance({ address: funder });
  console.log('Funder:', funder, 'balance:', formatEther(funderBal), 'CELO');

  const candidates: Address[] = [];
  for (const line of lines) {
    const parts = line.split(',').map((s) => s.trim());
    const privateKeyRaw = parts[2];
    if (!privateKeyRaw) continue;
    let privateKey = (privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`) as Hex;
    if (privateKey.length === 68) privateKey = privateKey.slice(0, 66) as Hex;
    try {
      const acct = privateKeyToAccount(privateKey);
      const addr = acct.address as Address;
      const bal = await publicClient.getBalance({ address: addr });
      if (bal < THRESHOLD_WEI) candidates.push(addr);
    } catch (err: any) {
      console.warn('Skipping line, invalid private key or derivation failed:', err?.message || err);
      continue;
    }
  }

  console.log('Wallets below threshold:', candidates.length);
  if (candidates.length === 0) return;

  const gasBufferPerTx = toWeiDecimal('0.001');
  const required = AMOUNT_WEI * BigInt(candidates.length) + gasBufferPerTx * BigInt(candidates.length);
  if (funderBal < required) {
    console.error('Funder balance too low for full distribution. Required approx (CELO):', formatEther(required));
    console.error('Funder balance (CELO):', formatEther(funderBal));
    process.exit(1);
  }
  // Manage nonce explicitly to avoid "nonce too low" errors when sending multiple txs
  let nonce = Number(await publicClient.getTransactionCount({ address: funder }));

  for (const to of candidates) {
    try {
      console.log('Sending', amountArg, 'CELO ->', to, 'nonce=', nonce);
      const txHash = await (walletClient as any).sendTransaction({ to: to as Address, value: AMOUNT_WEI, nonce });
      console.log('tx:', txHash);
      nonce++;
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Failed sending to', to, msg);
      if (/nonce too low|lower than the current nonce|nonce provided for the transaction is lower/i.test(msg)) {
        // refresh nonce and retry once
        try {
          nonce = Number(await publicClient.getTransactionCount({ address: funder }));
          console.log('Refreshed nonce, retrying with nonce=', nonce);
          const txHash = await (walletClient as any).sendTransaction({ to: to as Address, value: AMOUNT_WEI, nonce });
          console.log('tx (retry):', txHash);
          nonce++;
        } catch (err2: any) {
          console.error('Retry failed for', to, err2?.message || err2);
        }
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
