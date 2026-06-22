"use client";

import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Loader2, Check, X, User } from 'lucide-react';
import { cn, truncateAddress } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';

interface LineItem {
  id: string;
  description: string;
  price: number;
  assignedTo: string[]; // array of wallet addresses
}

interface ReceiptScannerProps {
  members: { wallet_address: string; display_name?: string | null }[];
  currentUserAddress?: string;
  onScanComplete: (totalAmount: string, merchant: string, splitValues: Record<string, string>, attachmentFile: File) => void;
  onClose: () => void;
}

/**
 * Two-step receipt splitter. Step 1 ("upload"): OCR a receipt photo with
 * Tesseract to extract merchant and line items. Step 2 ("assign"): assign each
 * item to members and emit the computed per-member split via `onScanComplete`.
 */
export function ReceiptScanner({ members, currentUserAddress, onScanComplete, onClose }: ReceiptScannerProps) {
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [merchant, setMerchant] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'assign'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setScanning(true);

    try {
      const ret = await Tesseract.recognize(selectedFile, 'eng');
      const text = ret.data.text;
      
      parseReceiptText(text);
      setStep('assign');
    } catch (err) {
      console.error('OCR failed', err);
      showToast('Failed to scan receipt. Please try a clearer photo.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedItems: LineItem[] = [];
    let detectedMerchant = '';

    // Simple heuristic for merchant (first few lines)
    const merchantRegex = /^[A-Za-z0-9\s&'-]{3,30}$/;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (merchantRegex.test(lines[i]) && !/total|date|tax|invoice/i.test(lines[i])) {
        detectedMerchant = lines[i];
        break;
      }
    }
    setMerchant(detectedMerchant || 'Unknown Merchant');

    // Simple heuristic for line items: description followed by a price
    const priceRegex = /(?:\$|cUSD)?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})$/i;
    
    lines.forEach((line, index) => {
      const match = line.match(priceRegex);
      if (match) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        // Exclude lines that look like totals
        if (price > 0 && !/total|subtotal|balance|change|due/i.test(line)) {
          const desc = line.replace(match[0], '').trim();
          if (desc.length > 2) {
            parsedItems.push({
              id: `item-${index}`,
              description: desc,
              price,
              assignedTo: []
            });
          }
        }
      }
    });

    setItems(parsedItems);
  };

  const toggleAssignment = (itemId: string, address: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedTo.includes(address);
        return {
          ...item,
          assignedTo: isAssigned 
            ? item.assignedTo.filter(a => a !== address)
            : [...item.assignedTo, address]
        };
      }
      return item;
    }));
  };

  const handleConfirm = () => {
    if (!file) return;

    let total = 0;
    const splitValues: Record<string, string> = {};

    items.forEach(item => {
      if (item.assignedTo.length > 0) {
        total += item.price;
        const splitAmount = item.price / item.assignedTo.length;
        
        item.assignedTo.forEach(addr => {
          const current = parseFloat(splitValues[addr] || '0');
          splitValues[addr] = (current + splitAmount).toFixed(2);
        });
      }
    });

    if (total === 0) {
      showToast('Please assign at least one item to continue.', 'error');
      return;
    }

    onScanComplete(total.toFixed(2), merchant, splitValues, file);
  };

  if (step === 'upload') {
    return (
      <div className="bg-[#121212] border border-brand p-6 rounded-2xl space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-brand">Itemized Receipt Scanner</h3>
          <button onClick={onClose} className="p-2 bg-surface-2 rounded-full text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Upload a receipt. We will extract the line items so you can assign exactly who ate what.
        </p>
        
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-brand/40 hover:border-brand bg-brand/5 rounded-xl p-8 cursor-pointer transition-colors">
          {scanning ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
              <span className="text-xs font-medium text-brand">Scanning receipt with AI...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-8 h-8 text-brand" />
              <span className="text-sm font-medium text-brand">Take Photo or Upload</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={scanning}
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-brand p-5 rounded-2xl space-y-5 animate-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Assign Items</h3>
          <p className="text-xs text-brand font-medium">{merchant}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-surface-2 rounded-full text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {items.length === 0 ? (
          <div className="text-center p-4 bg-surface-2 rounded-xl border border-border">
            <p className="text-xs text-text-muted">No items detected automatically.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-surface-2 p-3 rounded-xl border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-primary truncate pr-4">{item.description}</span>
                <span className="text-sm dm-mono font-bold text-brand">{item.price.toFixed(2)}</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1">
                {members.map(m => {
                  const addr = m.wallet_address.toLowerCase();
                  const isAssigned = item.assignedTo.includes(addr);
                  const isMe = addr === currentUserAddress?.toLowerCase();
                  const name = isMe ? 'You' : (m.display_name || truncateAddress(addr));
                  
                  return (
                    <button
                      key={addr}
                      onClick={() => toggleAssignment(item.id, addr)}
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border",
                        isAssigned 
                          ? "bg-brand/20 border-brand text-brand" 
                          : "bg-surface border-border text-text-muted hover:border-brand/40"
                      )}
                    >
                      <User className="w-3 h-3" />
                      {name}
                      {isAssigned && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-border flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>
          Rescan
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={items.length === 0 || !items.some(i => i.assignedTo.length > 0)}>
          Confirm Split
        </Button>
      </div>
    </div>
  );
}
