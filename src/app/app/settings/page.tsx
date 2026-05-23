'use client';
import { useWallet } from '@/context/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/common/Toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Check, Edit3, User } from 'lucide-react';

export default function SettingsPage() {
  const { address, cUSDBalance, disconnect } = useWallet();
  const { profile, loading: profileLoading, updateDisplayName } = useProfile();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateDisplayName(displayName);
      showToast('Display name updated!', 'success');
      setEditingName(false);
    } catch {
      showToast('Failed to save name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || '').then(() => {
      showToast('Address copied!', 'success');
    }).catch(() => {
      showToast('Could not copy address.', 'error');
    });
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>

      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        title="Disconnect Wallet"
        message="Are you sure you want to disconnect your wallet?"
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        danger
        onConfirm={() => { setShowDisconnectConfirm(false); disconnect(); }}
        onCancel={() => setShowDisconnectConfirm(false)}
      />

      {/* Profile section */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Your Profile
        </h2>

        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Display name row */}
          <div style={{ padding: '16px', borderBottom: '1px solid #2C2C2C' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingName ? '12px' : 0 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Display Name</p>
                {!editingName && (
                  <p style={{ margin: 0, fontSize: '15px', color: '#F7F3EC', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                    {profile?.display_name || <span style={{ color: '#4A4A4A', fontStyle: 'italic', fontWeight: '400' }}>Not set</span>}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingName(!editingName)}
                style={{
                  background: 'transparent', border: '1px solid #2C2C2C',
                  borderRadius: '8px', padding: '6px 12px',
                  color: '#8A8A8A', fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  touchAction: 'manipulation',
                }}
              >
                <Edit3 style={{ width: '12px', height: '12px' }} />
                {editingName ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingName && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name (e.g. Divine)"
                  maxLength={32}
                  style={{
                    flex: 1, height: '44px', background: '#0D0D0D',
                    border: '1px solid #2C2C2C', borderRadius: '10px',
                    padding: '0 12px', color: '#F7F3EC', fontSize: '15px',
                    outline: 'none', fontFamily: 'DM Sans, sans-serif',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  style={{
                    width: '44px', height: '44px', background: '#00C896',
                    border: 'none', borderRadius: '10px', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}
                >
                  <Check style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            )}
          </div>

          {/* Streak row */}
          {profile && (
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Daily streak</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#00C896', fontFamily: 'Clash Display, sans-serif' }}>
                🔥 {profile.streak_count ?? 0} days
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Wallet section */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Wallet
        </h2>

        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2C2C2C' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Address</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#F7F3EC', fontFamily: 'DM Mono, monospace' }}>
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </p>
            </div>
            <button
              onClick={handleCopyAddress}
              style={{
                background: 'transparent', border: '1px solid #2C2C2C',
                borderRadius: '8px', padding: '6px 12px',
                color: '#8A8A8A', fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              Copy
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>cUSD Balance</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#00C896', fontFamily: 'DM Mono, monospace' }}>
              {(isNaN(parseFloat(cUSDBalance)) ? '0.00' : parseFloat(cUSDBalance).toFixed(2))} cUSD
            </span>
          </div>
        </div>
      </section>

      {/* Receive section */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Receive cUSD
        </h2>
        <div style={{
          background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px',
          padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <div style={{ background: '#FFF', padding: '12px', borderRadius: '12px' }}>
            {mounted && address && <QRCodeSVG value={address} size={160} level="M" />}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#F7F3EC', fontFamily: 'DM Mono, monospace', wordBreak: 'break-all', textAlign: 'center', maxWidth: '240px' }}>
            {address}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#4A4A4A', fontFamily: 'DM Mono, monospace', textAlign: 'center' }}>
            Share your address to receive cUSD
          </p>
        </div>
      </section>

      {/* App info */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          About
        </h2>
        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', overflow: 'hidden' }}>
          {[['App', 'Split v1.1'], ['Network', 'Celo Mainnet'], ['Token', 'cUSD']].map(([label, value], i, arr) => (
            <div key={label} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: i < arr.length - 1 ? '1px solid #2C2C2C' : 'none' }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
              <span style={{ fontSize: '14px', color: '#F7F3EC', fontFamily: 'DM Sans, sans-serif' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Disconnect */}
      <button
        onClick={() => setShowDisconnectConfirm(true)}
        style={{
          width: '100%', height: '52px',
          background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)',
          borderRadius: '100px', color: '#FF5C5C',
          fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: '600',
          cursor: 'pointer', marginTop: '8px', touchAction: 'manipulation',
        }}
      >
        Disconnect Wallet
      </button>

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#2C2C2C', fontFamily: 'DM Mono, monospace', margin: 0 }}>
        Split · Built on Celo · Open Source
      </p>
    </div>
  );
}
