import { celo as viemCelo } from 'viem/chains';

// Single source of truth for the app's chain. Re-exported so feature code can
// import from '@/constants/chains' without depending on viem's path directly,
// making a future chain swap (e.g. Alfajores testnet) a one-line change here.
export const celo = viemCelo;
