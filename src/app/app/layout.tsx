'use client';
import { useWallet } from '@/context/WalletContext';
import { AppHeader } from '@/components/app/AppHeader';
import { BottomNav } from '@/components/app/BottomNav';

export default function AppLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { isConnected } = useWallet();

  // No chrome when not connected
  if (!isConnected) {
    return <>{children}</>;
  }

  return (
    <div style={{
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0D0D0D',
      position: 'relative',
      borderLeft: '1px solid #2C2C2C',
      borderRight: '1px solid #2C2C2C',
    }}>
      <AppHeader />
      <main style={{
        paddingTop: '56px',
        paddingBottom: '80px',
        minHeight: '100vh',
      }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
