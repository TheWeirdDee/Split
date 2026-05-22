'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const tabs = [
    {
      href: '/app',
      label: 'Home',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke={active ? '#00C896' : '#4A4A4A'} strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
    },
    {
      href: '/app/notifications',
      label: 'Alerts',
      badge: unreadCount,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke={active ? '#00C896' : '#4A4A4A'} strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      href: '/app/activity',
      label: 'Activity',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke={active ? '#00C896' : '#4A4A4A'} strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
        </svg>
      ),
    },
    {
      href: '/app/settings',
      label: 'Settings',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke={active ? '#00C896' : '#4A4A4A'} strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      height: '64px',
      background: 'rgba(13,13,13,0.97)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid #2C2C2C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 4px',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
      boxSizing: 'border-box',
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href ||
          (tab.href !== '/app' && pathname?.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              textDecoration: 'none', padding: '8px 16px',
              borderRadius: '12px', position: 'relative',
              background: isActive ? 'rgba(0,200,150,0.08)' : 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <div style={{ position: 'relative' }}>
              {tab.icon(isActive)}
              {tab.badge && tab.badge > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-6px',
                  background: '#FF5C5C', borderRadius: '100px',
                  minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', color: '#fff',
                  fontFamily: 'DM Sans, sans-serif', padding: '0 4px',
                  border: '2px solid #0D0D0D',
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </div>
              )}
            </div>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '10px', fontWeight: '500',
              color: isActive ? '#00C896' : '#4A4A4A',
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
