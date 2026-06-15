import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupIconProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Renders a group's icon by name: a lucide-react icon when `name` matches one,
 * otherwise the raw string treated as an emoji (legacy data). The emoji
 * fallback is exposed as an `img` with a label so it isn't read character by
 * character by assistive tech.
 */
export const GroupIcon: React.FC<GroupIconProps> = ({ name, className, size = 24 }) => {
  // Check if it's a valid Lucide icon name
  const Icon = (LucideIcons as any)[name];

  if (Icon) {
    return <Icon className={className} size={size} />;
  }

  // Fallback to emoji if it's not a Lucide icon (for legacy data)
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("flex items-center justify-center", className)}
      style={{ fontSize: size * 0.8 }}
    >
      {name}
    </span>
  );
};
