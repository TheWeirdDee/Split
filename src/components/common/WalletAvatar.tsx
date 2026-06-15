import React from 'react';
import { cn } from '@/lib/utils';

interface WalletAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic identicon for a wallet address: a colored circle (hue derived
 * from the address) showing the address's first character. Renders a pulsing
 * placeholder while the address is missing. Exposed as a labelled `img`.
 */
export const WalletAvatar = ({ address, size = 36, className }: WalletAvatarProps) => {
  if (!address) return <div style={{ width: size, height: size }} className="rounded-full bg-surface-2 animate-pulse" />;

  const seed = address.toLowerCase();
  const hue = parseInt(seed.slice(2, 8), 16) % 360;
  const initial = address.slice(2, 3).toUpperCase();

  return (
    <div
      role="img"
      aria-label={`Avatar for ${address.slice(0, 6)}…${address.slice(-4)}`}
      className={cn("flex items-center justify-center rounded-full text-white font-bold clash-display shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${hue}, 65%, 45%)`,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
};
