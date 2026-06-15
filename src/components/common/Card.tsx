import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Surface container. When given an `onClick` it becomes an interactive control:
 * it exposes `role="button"`, is focusable, and activates on Enter/Space so it
 * is operable by keyboard, not just mouse/touch.
 */
export const Card = ({ children, className, onClick, style }: CardProps) => {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
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
