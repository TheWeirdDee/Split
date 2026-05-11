import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const GroupIcon: React.FC<GroupIconProps> = ({ name, className, size = 24 }) => {
  // Check if it's a valid Lucide icon name
  const Icon = (LucideIcons as any)[name];

  if (Icon) {
    return <Icon className={className} size={size} />;
  }

  // Fallback to emoji if it's not a Lucide icon (for legacy data)
  return (
    <span 
      className={cn("flex items-center justify-center", className)} 
      style={{ fontSize: size * 0.8 }}
    >
      {name}
    </span>
  );
};
