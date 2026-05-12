'use client';
import { useWallet } from '@/context/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { address, cUSDBalance, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ padding: '24px 16px', display: 'flex', 
                  flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
      
      {/* Wallet section */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em',
          textTransform: 'uppercase', margin: '0 0 12px'
        }}>Wallet</h2>
        
        <div style={{
          background: '#161616', border: '1px solid #2C2C2C',
          borderRadius: '16px', overflow: 'hidden'
        }}>
          {/* Address row */}
          <div style={{
            padding: '16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #2C2C2C'
          }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', 
                          color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>
                Address
              </p>
              <p style={{ margin: 0, fontSize: '13px',
                          color: '#F7F3EC', fontFamily: 'DM Mono, monospace' }}>
                {address?.slice(0,10)}...{address?.slice(-8)}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || '');
                alert('Address copied!');
              }}
              style={{
                background: 'transparent',
                border: '1px solid #2C2C2C',
                borderRadius: '8px', padding: '6px 12px',
                color: '#8A8A8A', fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif', cursor: 'pointer'
              }}
            >
              Copy
            </button>
          </div>

          {/* Balance row */}
          <div style={{
            padding: '16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', color: '#8A8A8A',
                           fontFamily: 'DM Sans, sans-serif' }}>
              cUSD Balance
            </span>
            <span style={{ fontSize: '16px', fontWeight: '600',
                           color: '#00C896', fontFamily: 'DM Mono, monospace' }}>
              {cUSDBalance} cUSD
            </span>
          </div>
        </div>
      </section>

      {/* Receive section */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em',
          textTransform: 'uppercase', margin: '0 0 12px'
        }}>Receive cUSD</h2>
        <div style={{
          background: '#161616', border: '1px solid #2C2C2C',
          borderRadius: '16px', padding: '20px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '12px'
        }}>
          {/* QR code of user's own address */}
          <div style={{ background: '#FFF', padding: '12px', borderRadius: '12px' }}>
            {mounted && address && (
              <QRCodeSVG 
                value={address}
                size={160}
                level="M"
              />
            )}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#F7F3EC',
                      fontFamily: 'DM Mono, monospace', wordBreak: 'break-all',
                      textAlign: 'center', maxWidth: '240px' }}>
            {address}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#4A4A4A',
                      fontFamily: 'DM Mono, monospace', textAlign: 'center' }}>
            Share your address to receive cUSD
          </p>
        </div>
      </section>

      {/* App info */}
      <section>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px', fontWeight: '600',
          color: '#4A4A4A', letterSpacing: '0.08em',
          textTransform: 'uppercase', margin: '0 0 12px'
        }}>About</h2>
        <div style={{
          background: '#161616', border: '1px solid #2C2C2C',
          borderRadius: '16px', overflow: 'hidden'
        }}>
          {[
            ['App', 'Split v1.0'],
            ['Network', 'Celo Mainnet'],
            ['Token', 'cUSD'],
          ].map(([label, value], i, arr) => (
            <div key={label} style={{
              padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between',
              borderBottom: i < arr.length - 1 ? '1px solid #2C2C2C' : 'none'
            }}>
              <span style={{ fontSize: '14px', color: '#8A8A8A',
                             fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
              <span style={{ fontSize: '14px', color: '#F7F3EC',
                             fontFamily: 'DM Sans, sans-serif' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Disconnect button */}
      <button
        onClick={() => {
          if (window.confirm('Disconnect your wallet?')) {
            disconnect();
          }
        }}
        style={{
          width: '100%', height: '52px',
          background: 'rgba(255,92,92,0.08)',
          border: '1px solid rgba(255,92,92,0.3)',
          borderRadius: '100px',
          color: '#FF5C5C',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px', fontWeight: '600',
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        Disconnect Wallet
      </button>

      <p style={{
        textAlign: 'center', fontSize: '12px',
        color: '#2C2C2C', fontFamily: 'DM Mono, monospace',
        margin: 0
      }}>
        Split · Built on Celo · Open Source
      </p>
    </div>
  );
}
