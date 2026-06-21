import { CUSD_ADDRESS } from './contract';

/**
 * Celo gas parameters for a contract write.
 *
 * Project gas rule (see memory/AGENTS notes): `gasPrice` is always set in CELO.
 * `feeCurrency` is cUSD ONLY for MiniPay, which holds no native CELO and pays
 * gas in cUSD; regular wallets pay gas in CELO so `feeCurrency` stays undefined.
 *
 * Centralised here so every write path (create group/expense/settle, savings
 * circle actions, sync) uses identical, correct gas handling.
 */
export async function buildGasParams(
  publicClient: { getGasPrice: () => Promise<bigint> },
  isMiniPay: boolean
): Promise<{ gasPrice: bigint; feeCurrency?: `0x${string}` }> {
  const gasPrice = await publicClient.getGasPrice();
  return {
    gasPrice,
    feeCurrency: isMiniPay ? (CUSD_ADDRESS as `0x${string}`) : undefined,
  };
}
