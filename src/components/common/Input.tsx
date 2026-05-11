import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors",
          error && "border-money-negative",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-money-negative ml-1">{error}</p>
      )}
    </div>
  );
};
