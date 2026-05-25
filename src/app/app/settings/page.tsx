'use client';
import { useWallet } from '@/context/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/common/Toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Check, Edit3, Trash2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAddressBook } from '@/hooks/useAddressBook';

export default function SettingsPage() {
  const { address, cUSDBalance, disconnect } = useWallet();
  const { profile, updateDisplayName } = useProfile();
  const { preferences, updatePreferences } = useNotificationPreferences();
  const { entries, upsertEntry, deleteEntry } = useAddressBook();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [contactAddress, setContactAddress] = useState('');
  const [contactNickname, setContactNickname] = useState('');
  const [addingContact, setAddingContact] = useState(false);

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

  const updatePref = async (key: string, value: boolean | string) => {
    setSavingPrefs(true);
    try {
      await updatePreferences({ [key]: value } as any);
      showToast('Preference updated.', 'success');
    } catch {
      showToast('Failed to update preference.', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactAddress.startsWith('0x') || !contactNickname.trim()) {
      showToast('Enter a valid wallet and nickname.', 'error');
      return;
    }
    setAddingContact(true);
    try {
      await upsertEntry(contactAddress, contactNickname);
      showToast('Contact saved.', 'success');
      setContactAddress('');
      setContactNickname('');
    } catch {
      showToast('Failed to save contact.', 'error');
    } finally {
      setAddingContact(false);
    }
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

      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Your Profile
        </h2>

        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', overflow: 'hidden' }}>
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

          {profile && (
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Daily streak</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#00C896', fontFamily: 'Clash Display, sans-serif' }}>
                {profile.streak_count ?? 0} days
              </span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Notifications
        </h2>
        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            ['allow_reminders', 'Payment reminders'],
            ['allow_expense_updates', 'Expense updates'],
            ['allow_group_updates', 'Group updates'],
            ['allow_messages', 'Chat messages'],
            ['allow_settlements', 'Settlements'],
          ].map(([key, label], index, arr) => (
            <div key={key} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: index < arr.length - 1 ? '1px solid #2C2C2C' : 'none' }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
              <button
                onClick={() => updatePref(key, !(preferences as any)?.[key])}
                disabled={savingPrefs}
                style={{
                  width: '42px', height: '24px', borderRadius: '999px', border: '1px solid #2C2C2C',
                  background: (preferences as any)?.[key] ? '#00C896' : '#1F1F1F',
                  color: (preferences as any)?.[key] ? '#000' : '#B0B0B0',
                  fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {(preferences as any)?.[key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}

          <div style={{ padding: '14px 16px', borderTop: '1px solid #2C2C2C' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Quiet hours</span>
              <button
                onClick={() => updatePref('quiet_hours_enabled', !preferences?.quiet_hours_enabled)}
                style={{
                  width: '42px', height: '24px', borderRadius: '999px', border: '1px solid #2C2C2C',
                  background: preferences?.quiet_hours_enabled ? '#00C896' : '#1F1F1F',
                  color: preferences?.quiet_hours_enabled ? '#000' : '#B0B0B0',
                  fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {preferences?.quiet_hours_enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="time"
                value={preferences?.quiet_hours_start || '22:00'}
                onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                className="time-input w-full rounded-xl border border-[#2C2C2C] bg-[#0D0D0D] px-3 py-2 text-xs text-[#F7F3EC]"
              />
              <input
                type="time"
                value={preferences?.quiet_hours_end || '07:00'}
                onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                className="time-input w-full rounded-xl border border-[#2C2C2C] bg-[#0D0D0D] px-3 py-2 text-xs text-[#F7F3EC]"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Address Book
        </h2>
        <div style={{ background: '#161616', border: '1px solid #2C2C2C', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            placeholder="Contact wallet address"
            className="w-full rounded-xl border border-[#2C2C2C] bg-[#0D0D0D] px-3 py-2 text-sm text-[#F7F3EC]"
          />
          <input
            value={contactNickname}
            onChange={(e) => setContactNickname(e.target.value)}
            placeholder="Nickname"
            className="w-full rounded-xl border border-[#2C2C2C] bg-[#0D0D0D] px-3 py-2 text-sm text-[#F7F3EC]"
          />
          <button
            onClick={handleAddContact}
            disabled={addingContact}
            style={{
              width: '100%', height: '40px', borderRadius: '10px',
              border: 'none', background: '#00C896', color: '#000',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            }}
          >
            {addingContact ? 'Saving...' : 'Save Contact'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            {entries.length === 0 ? (
              <p style={{ margin: 0, color: '#8A8A8A', fontSize: '12px' }}>No contacts yet.</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D0D0D', border: '1px solid #2C2C2C', borderRadius: '10px', padding: '8px 10px' }}>
                  <div>
                    <p style={{ margin: 0, color: '#F7F3EC', fontSize: '13px', fontWeight: 600 }}>{entry.nickname}</p>
                    <p style={{ margin: 0, color: '#8A8A8A', fontSize: '11px' }}>{entry.contact_address.slice(0, 8)}...{entry.contact_address.slice(-6)}</p>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    style={{ border: 'none', background: 'transparent', color: '#FF5C5C', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

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
