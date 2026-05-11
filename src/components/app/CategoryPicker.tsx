"use client";

import React from 'react';
import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';
import { GroupIcon } from '../common/GroupIcon';

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
              ? "bg-brand/10 border-brand text-brand" 
              : "bg-surface border-border text-text-secondary hover:border-text-muted"
          )}
        >
          <GroupIcon name={cat.iconName} size={24} className="mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wider">{cat.label}</span>
        </button>
      ))}
    </div>
  );
};
