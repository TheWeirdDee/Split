"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', icon: Home, href: '/app' },
    { label: 'Activity', icon: List, href: '/app/activity' },
    { label: 'Settings', icon: Settings, href: '/app/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] glass z-50 flex items-center justify-around px-6 max-w-[430px] mx-auto border-t border-border pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== '/app' && pathname.startsWith(tab.href));
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-brand" : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
