// MiniPay integration — single source of truth for detecting Opera MiniPay.
//
// MiniPay injects `window.ethereum.isMiniPay`. When present, a dApp should:
//   1. Detect it (this helper),
//   2. Auto-connect with no "Connect wallet" button (see WalletContext),
//   3. Pay gas in usdm via `feeCurrency` — MiniPay users hold no native CELO
//      (see lib/gas.ts `buildGasParams`).
//
// Centralised here so the MiniPay integration is explicit and used consistently
// across the wallet flow.

/** usdm on Celo Mainnet — MiniPay's gas fee currency. */
export const MINIPAY_FEE_CURRENCY = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as const;

/**
 * Returns true when running inside MiniPay. Pass a specific EIP-1193 provider to
 * check it, otherwise falls back to `window.ethereum`.
 */
export function detectMiniPay(provider?: { isMiniPay?: boolean } | null): boolean {
  const target =
    provider ?? (typeof window !== 'undefined' ? (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum : undefined);
  return !!target?.isMiniPay;
}
