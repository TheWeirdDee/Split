"use client";

import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

interface ChatTabProps {
  messages: any[];
  messagesLoading: boolean;
  getMemberDisplayName: (walletAddress: string) => string;
  address?: string | null;
  isReadOnly: boolean;
  requireConnection: (action: () => void) => void;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  isSendingMessage: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatTab({
  messages,
  messagesLoading,
  getMemberDisplayName,
  address,
  isReadOnly,
  requireConnection,
  newMessage,
  setNewMessage,
  handleSendMessage,
  isSendingMessage,
  chatEndRef,
}: ChatTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <MessageCircle style={{ width: '16px', height: '16px', color: '#00C896' }} />
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: '600', fontSize: '14px', color: '#F7F3EC', margin: 0 }}>
          Group Chat
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A8A8A', margin: 0 }}>
          · {messages.length} messages
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messagesLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ height: '64px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : messages.length > 0 ? (
          messages.map((msg: any) => {
            const senderName = getMemberDisplayName(msg.sender);
            const isOwn = msg.sender.toLowerCase() === address?.toLowerCase();
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                {!isOwn && (
                  <span style={{
                    fontSize: '11px', color: '#00C896', marginBottom: '4px',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: '600', paddingLeft: '4px',
                  }}>
                    {senderName}
                  </span>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: isOwn ? 'rgba(0,200,150,0.12)' : '#1A1A1A',
                  border: `1px solid ${isOwn ? 'rgba(0,200,150,0.25)' : '#2C2C2C'}`,
                  borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 14px',
                  overflow: 'hidden',
                }}>
                  <p style={{
                    fontSize: '14px', color: '#F7F3EC', margin: 0,
                    fontFamily: 'DM Sans, sans-serif', lineHeight: '1.5',
                  }}>
                    {msg.text}
                  </p>
                </div>
                <span style={{
                  fontSize: '10px', color: '#4A4A4A', marginTop: '3px',
                  fontFamily: 'DM Mono, monospace', paddingLeft: isOwn ? 0 : '4px',
                  paddingRight: isOwn ? '4px' : 0,
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            border: '1px dashed #2C2C2C', borderRadius: '20px',
            color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          }}>
            No messages yet. Say hello.
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {isReadOnly ? (
        <button
          onClick={() => requireConnection(() => {})}
          style={{
            width: '100%', padding: '14px',
            background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)',
            borderRadius: '16px', color: '#00C896',
            fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          Connect wallet to join the conversation
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                requireConnection(handleSendMessage);
              }
            }}
            rows={2}
            placeholder="Write a message..."
            style={{
              width: '100%', background: '#161616', border: '1px solid #2C2C2C',
              borderRadius: '16px', padding: '12px 14px', color: '#F7F3EC',
              fontSize: '14px', outline: 'none', resize: 'none',
              fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', lineHeight: '1.5',
            }}
          />
          <button
            onClick={() => requireConnection(handleSendMessage)}
            disabled={isSendingMessage || !newMessage.trim()}
            style={{
              width: '48px', height: '48px', flexShrink: 0,
              background: '#00C896', border: 'none', borderRadius: '14px',
              color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !newMessage.trim() ? 0.4 : 1,
            }}
          >
            <Send style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
