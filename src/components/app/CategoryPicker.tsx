"use client";

import React from 'react';
import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';
import { GroupIcon } from '../common/GroupIcon';

interface CategoryPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Grid of selectable expense categories. The active category is styled with its
 * accent color and reports `aria-pressed` so the selection is conveyed to
 * assistive tech, not just visually.
 */
export const CategoryPicker = ({ selectedId, onSelect }: CategoryPickerProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          aria-pressed={selectedId === cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
            selectedId === cat.id 
              ? "" 
              : "bg-surface border-border text-text-secondary hover:border-text-muted"
          )}
          style={selectedId === cat.id ? {
            borderColor: cat.color,
            color: cat.color,
            backgroundColor: `${cat.color}15`,
          } : undefined}
        >
          <GroupIcon name={cat.iconName} size={24} className="mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wider">{cat.label}</span>
        </button>
      ))}
    </div>
  );
};
