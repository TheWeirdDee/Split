import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Labeled text input with inline error display. The label is associated with
 * the field and, when `error` is set, the input reports `aria-invalid` and is
 * described by the error text so assistive tech announces the validation state.
 */
export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors",
          error && "border-money-negative",
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-money-negative ml-1">{error}</p>
      )}
    </div>
  );
};
