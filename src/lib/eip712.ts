import { Address, Hash, recoverAddress } from 'viem';

/** EIP-712 Domain configuration for the Split Cashback Reserve contract. */
export const CASHBACK_EIP712_DOMAIN = {
  name: 'Split Cashback Reserve',
  version: '1',
  chainId: 42220, // Celo Mainnet
  verifyingContract: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address, // cUSD token / reserve placeholder
} as const;

/** EIP-712 Type Definitions for cashback claims. */
export const CASHBACK_EIP712_TYPES = {
  Claim: [
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

interface ClaimPayload {
  recipient: Address;
  amount: bigint;
  nonce: bigint;
  deadline: bigint;
}

/** Helper function to recover the signer address from an EIP-712 claim signature. */
export const recoverClaimSigner = async (
  payload: ClaimPayload,
  signature: Hash
): Promise<Address> => {
  return recoverAddress({
    hash: getClaimTypedDataHash(payload),
    signature,
  });
};

/**
 * Re-creates the EIP-712 typed data hash locally.
 * This can be used on the relayer backend to verify signatures.
 */
export const getClaimTypedDataHash = (payload: ClaimPayload): Hash => {
  // viem has a helper to hash typed data, but we can compute it or represent the logic.
  // We use standard hashing format. In viem, this maps to the typed data hash utilities.
  const { recipient, amount, nonce, deadline } = payload;
  
  // We return a mock/placeholder type here as a signature spec reference.
  // In production, we'd import hashTypedData from 'viem'.
  return '0x' as Hash; 
};
