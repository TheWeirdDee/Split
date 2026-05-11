"use client";

import React from 'react';
import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const CategoryPicker = ({ selectedId, onSelect }: CategoryPickerProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
            selectedId === cat.id 
              ? "bg-brand-dim border-brand text-brand" 
              : "bg-surface border-border text-text-secondary hover:border-text-muted"
          )}
        >
          <span className="text-2xl mb-1">{cat.emoji}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider">{cat.label}</span>
        </button>
      ))}
    </div>
  );
};
