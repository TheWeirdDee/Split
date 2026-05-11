import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card = ({ children, className, onClick, style }: CardProps) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "bg-surface border border-border rounded-2xl p-4 transition-all",
        onClick && "cursor-pointer hover:border-brand-dark active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
};
