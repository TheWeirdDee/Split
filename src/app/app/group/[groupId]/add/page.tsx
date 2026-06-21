"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { CategoryPicker } from '@/components/app/CategoryPicker';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { useGroup } from '@/hooks/useGroups';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { buildGasParams } from '@/lib/gas';
import { cn, truncateAddress } from '@/lib/utils';
import { parseEther } from 'viem';
import { celo } from 'viem/chains';
import { createNotificationSafe } from '@/lib/notifications';
import { ReceiptScanner } from '@/components/groups/ReceiptScanner';
import { Camera, Loader2, ScanLine } from 'lucide-react';

function parseCSV(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
  const values = lines[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
  
  const result: Record<string, string> = {};
  headers.forEach((header, index) => {
    if (values[index] !== undefined) {
      result[header] = values[index];
    }
  });
  return result;
}

function getSplitAmountsWei(
  totalAmountWei: bigint,
  splitWith: string[],
  splitType: 'equal' | 'percentage' | 'share' | 'exact',
  splitValues: Record<string, string>
): bigint[] {
  if (splitWith.length === 0) return [];

  if (splitType === 'percentage') {
    let sumWei = 0n;
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const pct = parseFloat(splitValues[addr] || '0');
      const bps = BigInt(Math.round(pct * 100));
      const amt = (totalAmountWei * bps) / 10000n;
      sumWei += amt;
      return amt;
    });
  }

  if (splitType === 'share') {
    const shares = splitWith.map(addr => parseFloat(splitValues[addr] || '1'));
    const totalShares = shares.reduce((a, b) => a + b, 0);
    if (totalShares <= 0) {
      const memberCount = BigInt(splitWith.length);
      const baseShare = totalAmountWei / memberCount;
      const remainder = totalAmountWei % memberCount;
      return splitWith.map((_, index) => index < remainder ? baseShare + 1n : baseShare);
    }
    let sumWei = 0n;
    const totalSharesBps = BigInt(Math.round(totalShares * 100));
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const sh = parseFloat(splitValues[addr] || '1');
      const shBps = BigInt(Math.round(sh * 100));
      const amt = (totalAmountWei * shBps) / totalSharesBps;
      sumWei += amt;
      return amt;
    });
  }

  if (splitType === 'exact') {
    let sumWei = 0n;
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const val = splitValues[addr] || '0';
      const amt = parseEther(val || '0');
      sumWei += amt;
      return amt;
    });
  }

  const memberCount = BigInt(splitWith.length);
  const baseShare = totalAmountWei / memberCount;
  const remainder = totalAmountWei % memberCount;
  return splitWith.map((_, index) => index < remainder ? baseShare + 1n : baseShare);
}

export default function AddExpensePage() {
  const { groupId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const wallet = useWallet();
  const { requireConnection } = wallet;
  const walletRef = React.useRef(wallet);
  
  React.useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { address } = wallet;
  const { members } = useGroup(groupId as string);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [payer, setPayer] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'share' | 'exact'>('equal');
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Logging Expense...');
  const [prefilledFromRun, setPrefilledFromRun] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseCSV(text);
      if (!parsed) {
        alert('Invalid or empty CSV file.');
        return;
      }

      const desc = parsed.description || parsed.item || parsed.title || '';
      const amt = parsed.amount || parsed.price || parsed.cost || '';
      const cat = parsed.category || parsed.type || 'other';
      const pyr = parsed.payer || parsed.paid_by || '';
      const sType = parsed.split_type || 'equal';

      if (desc) setDescription(desc);
      if (amt) setAmount(amt);
      if (cat) {
        setCategory(cat.toLowerCase());
      }
      if (pyr) {
        const matchedMember = members.find(
          (m) => m.wallet_address.toLowerCase() === pyr.toLowerCase() ||
                 m.display_name?.toLowerCase() === pyr.toLowerCase()
        );
        if (matchedMember) {
          setPayer(matchedMember.wallet_address.toLowerCase());
        }
      }
      if (['equal', 'percentage', 'share', 'exact'].includes(sType.toLowerCase())) {
        setSplitType(sType.toLowerCase() as any);
      }

      alert('CSV successfully parsed and populated the expense form!');
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (groupId && (groupId as string).startsWith('local-')) {
      if (members.length > 0 && !payer) {
        setPayer(members[0].wallet_address.toLowerCase());
      }
      if (members.length > 0 && splitWith.length === 0) {
        setSplitWith(members.map((m) => m.wallet_address.toLowerCase()));
      }
      return;
    }

    if (address && !payer) setPayer(address.toLowerCase());
    if (members.length > 0 && splitWith.length === 0) {
      setSplitWith(members.map((m) => m.wallet_address.toLowerCase()));
    }
  }, [address, members, payer, splitWith.length, groupId]);

  useEffect(() => {
    const loadRecurringDraft = async () => {
      if (!runId || prefilledFromRun) return;

      const { data, error } = await supabase
        .from('recurring_expense_runs')
        .select('*, recurring_expense_rules(*)')
        .eq('id', runId)
        .maybeSingle();

      if (error || !data?.recurring_expense_rules) {
        console.error('Unable to load recurring draft:', error);
        return;
      }

      const rule = data.recurring_expense_rules as any;
      setDescription(rule.description || '');
      setAmount(String(rule.amount || ''));
      setCategory(rule.category || 'other');
      setPayer((rule.payer_address || '').toLowerCase());
      setSplitWith((rule.participant_addresses || []).map((item: string) => item.toLowerCase()));
      setPrefilledFromRun(true);
    };

    loadRecurringDraft();
  }, [runId, prefilledFromRun]);

  // Validation logic
  useEffect(() => {
    setValidationError('');
    if (!amount || splitWith.length === 0) return;

    // Reject non-numeric, zero, or negative totals before they reach parseEther
    // (which would otherwise throw and fail the submit silently).
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setValidationError('Enter a valid amount greater than 0');
      return;
    }

    if (splitType === 'percentage') {
      const percentages = splitWith.map(addr => parseFloat(splitValues[addr] || '0'));
      const totalPercent = percentages.reduce((a, b) => a + b, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setValidationError(`Total percentage must equal 100% (currently ${totalPercent.toFixed(1)}%)`);
      }
    } else if (splitType === 'share') {
      const shares = splitWith.map(addr => parseFloat(splitValues[addr] || '1'));
      const totalShares = shares.reduce((a, b) => a + b, 0);
      if (totalShares <= 0) {
        setValidationError('Total shares must be greater than 0');
      }
    } else if (splitType === 'exact') {
      const exacts = splitWith.map(addr => parseFloat(splitValues[addr] || '0'));
      const totalExact = exacts.reduce((a, b) => a + b, 0);
      if (Math.abs(totalExact - parseFloat(amount)) > 0.001) {
        setValidationError(`Total split amount must equal total expense of ${amount} cUSD (currently ${totalExact.toFixed(2)} cUSD)`);
      }
    }
  }, [amount, splitWith, splitType, splitValues]);

  const handleSubmit = async () => {
    if (groupId && (groupId as string).startsWith('local-')) {
      if (!description || !amount || !payer || splitWith.length === 0 || validationError) return;
      setLoading(true);
      try {
        const totalAmountNum = parseFloat(amount);
        const totalAmountWei = parseEther(amount);
        const splitAmountsWei = getSplitAmountsWei(totalAmountWei, splitWith, splitType, splitValues);

        const expenseId = 'local-exp-' + Date.now();
        const newExpense = {
          id: expenseId,
          group_id: groupId,
          description: description,
          category: category,
          attachment_url: attachmentPreview || '',
          total_amount: totalAmountNum,
          paid_by: payer.toLowerCase(),
          created_by: address ? address.toLowerCase() : 'local-user',
          created_at: new Date().toISOString(),
          status: 'active'
        };

        const newSplits = splitWith.map((addr, idx) => ({
          id: `${expenseId}-${addr.toLowerCase()}`,
          expense_id: expenseId,
          wallet_address: addr.toLowerCase(),
          amount: (Number(splitAmountsWei[idx]) / 1e18).toString(),
          is_payer: addr.toLowerCase() === payer.toLowerCase()
        }));

        const allExpenses = JSON.parse(localStorage.getItem('split_local_expenses') || '[]');
        const allSplits = JSON.parse(localStorage.getItem('split_local_splits') || '[]');

        localStorage.setItem('split_local_expenses', JSON.stringify([...allExpenses, newExpense]));
        localStorage.setItem('split_local_splits', JSON.stringify([...allSplits, ...newSplits]));

        router.push(`/app/group/${groupId}`);
      } catch (err) {
        console.error('Adding local expense failed:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    const { address: walletAddr, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!walletAddr || !description || !amount || !payer || splitWith.length === 0 || validationError) return;
    setLoading(true);

    try {
      let attachmentUrl = '';
      if (attachmentFile) {
        setLoadingText('Uploading attachment...');
        try {
          // Attempt to ensure bucket exists
          try {
            await supabase.storage.createBucket('receipts', { public: true });
          } catch (_) {}

          const fileExt = attachmentFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `${groupId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, attachmentFile);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);

          attachmentUrl = publicUrlData.publicUrl;
        } catch (uploadErr) {
          console.error('Failed to upload image to Supabase storage:', uploadErr);
          // Fallback to Data URL for small files, otherwise mock/placeholder URL
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(attachmentFile);
            });
            const base64Data = await base64Promise;
            if (base64Data.length < 60000) {
              attachmentUrl = base64Data;
            } else {
              attachmentUrl = URL.createObjectURL(attachmentFile);
            }
          } catch (_) {
            attachmentUrl = '';
          }
        }
      }

      const totalAmountNum = parseFloat(amount);
      const totalAmountWei = parseEther(amount);
      const splitAmounts = getSplitAmountsWei(totalAmountWei, splitWith, splitType, splitValues);
      const splitMembers = splitWith.map(addr => addr as `0x${string}`);
      const descriptionWithMeta = `${description} |cat:${category}${attachmentUrl ? ` |img:${attachmentUrl}` : ''}`;

      const gasParams = await buildGasParams(publicClient, isMiniPay);

      setLoadingText('Logging Expense...');
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_ABI,
        functionName: 'addExpense',
        args: [BigInt(groupId as string), totalAmountWei, descriptionWithMeta, splitMembers, splitAmounts],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });

      const creatorName =
        members.find((m) => m.wallet_address.toLowerCase() === address?.toLowerCase())?.display_name ||
        'Someone';

      const targetMembers = splitWith.filter(
        (memberAddress) => memberAddress.toLowerCase() !== address?.toLowerCase()
      );

      if (targetMembers.length > 0) {
        await Promise.all(
          targetMembers.map((memberAddress) =>
            createNotificationSafe({
              userAddress: memberAddress.toLowerCase(),
              groupId: groupId as string,
              type: 'expense',
              title: 'New Expense',
              body: `${creatorName} added an expense for ${totalAmountNum.toFixed(2)} cUSD`,
              actor: address?.toLowerCase(),
              actionUrl: `/app/group/${groupId}`,
            }).catch((error) => {
              console.error('Error creating notification:', error);
            })
          )
        );
      }

      if (isRecurring && !runId) {
        setLoadingText('Saving Recurring Rule...');
        // Match the recurring_expense_rules schema used by the recurring page /
        // useRecurringCheck (created_by, cadence, day_of_week/day_of_month,
        // start_date). The previous columns (creator_address/frequency/
        // next_run_date) don't exist, so the insert failed silently.
        const today = new Date();
        const cadence = recurringFrequency === 'weekly' ? 'weekly' : 'monthly';
        const { error: ruleError } = await supabase.from('recurring_expense_rules').insert({
          group_id: groupId,
          created_by: address?.toLowerCase(),
          amount: totalAmountNum,
          description: description.trim(),
          category: category,
          payer_address: payer,
          participant_addresses: splitWith,
          cadence,
          day_of_week: cadence === 'weekly' ? today.getDay() : null,
          day_of_month: cadence === 'monthly' ? today.getDate() : null,
          start_date: today.toISOString().split('T')[0],
          is_active: true,
        });
        if (ruleError) console.error('Error saving recurring rule:', ruleError);
      }

      if (runId) {
        const { error: runError } = await supabase
          .from('recurring_expense_runs')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', runId);
        if (runError) console.error('Error marking recurring run as processed:', runError);
      }

      router.push(`/app/group/${groupId}`);
    } catch (err) {
      console.error('Adding expense failed:', err);
      alert('Failed to add expense onchain.');
    } finally {
      setLoading(false);
      setLoadingText('Logging Expense...');
    }
  };

  const toggleMember = (addr: string) => {
    setSplitWith((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  };

  return (
    <>
      <AppHeader />

      <div className="px-6 pt-24 pb-12 space-y-10 animate-fade-in">
        {showScanner ? (
          <ReceiptScanner
            members={members}
            currentUserAddress={address || undefined}
            onScanComplete={(total, merch, splits, file) => {
              setAmount(total);
              setDescription(`Receipt from ${merch}`);
              setSplitType('exact');
              setSplitValues(splits);
              setAttachmentFile(file);
              setAttachmentPreview(URL.createObjectURL(file));
              
              const assignedMembers = Object.keys(splits).filter(addr => parseFloat(splits[addr]) > 0);
              if (assignedMembers.length > 0) {
                setSplitWith(assignedMembers);
              }
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        ) : (
          <div className="space-y-10 animate-fade-in">
            {/* CSV Importer Section */}
        <div className="bg-[#121212] border border-[#2C2C2C] p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider text-[#00C896]">Spreadsheet Import</span>
            <span className="text-[10px] text-text-muted">CSV Format</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Quickly fill this form by uploading a CSV. Columns supported: <code>description,amount,category,payer,split_type</code>
          </p>
          <label className="flex items-center justify-center gap-2 border border-dashed border-[#2C2C2C] hover:border-[#00C896]/40 bg-[#161616] rounded-xl p-3 cursor-pointer transition-colors text-xs text-[#8A8A8A]">
            <span>Upload CSV Spreadsheet</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
          </label>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Description"
                placeholder="What was it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="cursor-pointer bg-surface-2 hover:bg-brand/10 hover:border-brand/40 border border-border rounded-xl p-3 h-[46px] w-[46px] flex items-center justify-center text-brand transition-colors shrink-0"
              title="Scan Receipt"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Category</label>
            <CategoryPicker selectedId={category} onSelect={setCategory} />
          </div>

          <div className="bg-surface border border-border p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Make this a recurring expense?</span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  isRecurring ? "bg-brand" : "bg-surface-2 border border-border"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-bg absolute top-1 transition-all",
                  isRecurring ? "left-6" : "left-1 bg-text-muted"
                )} />
              </button>
            </div>
            
            {isRecurring && (
              <div className="flex gap-2 animate-fade-in pt-2">
                {(['weekly', 'monthly', 'yearly']).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setRecurringFrequency(freq)}
                    className={cn(
                      "flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all border",
                      recurringFrequency === freq 
                        ? "bg-brand/10 text-brand border-brand/30" 
                        : "bg-surface-2 text-text-secondary border-transparent hover:border-border"
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Amount (cUSD)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-3xl dm-mono text-brand focus:outline-none focus:border-brand transition-colors"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">cUSD</span>
            </div>
          </div>

          {/* Receipt Attachment UI */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Receipt Image (Optional)</label>
            <div className="flex flex-col gap-3">
              {attachmentPreview ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#2C2C2C]">
                  <img src={attachmentPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentFile(null);
                      setAttachmentPreview('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-[#2C2C2C] hover:border-brand/40 bg-surface-2/30 rounded-xl p-4 cursor-pointer transition-colors">
                  <Camera className="w-6 h-6 text-[#8A8A8A] mb-1" />
                  <span className="text-xs text-[#8A8A8A]">Upload receipt image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Paid by</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {members.map((m) => (
                <button
                  key={m.wallet_address}
                  onClick={() => setPayer(m.wallet_address.toLowerCase())}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all",
                    payer === m.wallet_address.toLowerCase() ? "bg-brand text-bg border-brand" : "bg-surface border-border text-text-secondary"
                  )}
                >
                  {m.wallet_address.toLowerCase() === address?.toLowerCase() ? 'You' : truncateAddress(m.wallet_address)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Split with</label>
              <span className="text-xs font-semibold capitalize text-brand">{splitType} split</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => (
                <button
                  key={m.wallet_address}
                  onClick={() => toggleMember(m.wallet_address.toLowerCase())}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    splitWith.includes(m.wallet_address.toLowerCase()) ? "bg-surface-2 border-brand" : "bg-surface border-border opacity-60"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", splitWith.includes(m.wallet_address.toLowerCase()) ? "bg-brand border-brand" : "border-text-muted")}>
                    {splitWith.includes(m.wallet_address.toLowerCase()) && <div className="w-1.5 h-1.5 bg-bg rounded-full" />}
                  </div>
                  <span className="text-xs font-medium truncate">
                    {m.wallet_address.toLowerCase() === address?.toLowerCase() ? 'You' : truncateAddress(m.wallet_address)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Split Type</label>
            <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
              {(['equal', 'percentage', 'share', 'exact'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
                    splitType === type ? "bg-brand text-bg shadow-sm" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Split Values Inputs */}
          {splitType !== 'equal' && splitWith.length > 0 && (
            <div className="space-y-3 bg-surface border border-border p-4 rounded-2xl animate-slide-down">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Custom Split Details</span>
              <div className="space-y-3">
                {splitWith.map((addr) => {
                  const m = members.find((mem) => mem.wallet_address.toLowerCase() === addr);
                  const name = addr === address?.toLowerCase() ? 'You' : (m?.display_name || truncateAddress(addr));
                  return (
                    <div key={addr} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium truncate flex-1">{name}</span>
                      <div className="relative flex items-center w-32">
                        <input
                          type="number"
                          placeholder={splitType === 'percentage' ? '0' : splitType === 'share' ? '1' : '0.00'}
                          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-right pr-10 dm-mono text-brand focus:outline-none focus:border-brand"
                          value={splitValues[addr] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitValues(prev => ({ ...prev, [addr]: val }));
                          }}
                        />
                        <span className="absolute right-3 text-[10px] font-bold text-text-muted select-none">
                          {splitType === 'percentage' ? '%' : splitType === 'share' ? 'sh' : 'cUSD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="p-3 bg-money-negative/10 border border-money-negative/20 text-money-negative text-xs rounded-xl font-medium animate-shake">
            {validationError}
          </div>
        )}

        <div className="pt-4 space-y-4">
          <div className="bg-surface-2 p-4 rounded-2xl border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Splitting:</span>
              <span className="text-sm font-semibold capitalize text-brand">{splitType} split</span>
            </div>
            {splitType === 'equal' ? (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Each pays:</span>
                <span className="text-xl dm-mono font-bold text-text-primary">
                  {amount && splitWith.length > 0 ? (parseFloat(amount) / splitWith.length).toFixed(2) : '0.00'} cUSD
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 pt-2 border-t border-border/50 max-h-48 overflow-y-auto">
                {splitWith.map((addr) => {
                  const m = members.find((mem) => mem.wallet_address.toLowerCase() === addr);
                  const name = addr === address?.toLowerCase() ? 'You' : (m?.display_name || truncateAddress(addr));
                  
                  let shareStr = '0.00';
                  if (amount && splitWith.length > 0) {
                    const totalWei = parseEther(amount);
                    const amountsWei = getSplitAmountsWei(totalWei, splitWith, splitType, splitValues);
                    const index = splitWith.indexOf(addr);
                    if (index !== -1 && amountsWei[index] !== undefined) {
                      shareStr = (Number(amountsWei[index]) / 1e18).toFixed(2);
                    }
                  }
                  return (
                    <div key={addr} className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary truncate pr-4">{name}</span>
                      <span className="dm-mono text-text-primary font-semibold">{shareStr} cUSD</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full h-16 text-lg font-bold rounded-2xl"
            disabled={!description || !amount || splitWith.length === 0 || !!validationError}
            onClick={() => groupId && (groupId as string).startsWith('local-') ? handleSubmit() : requireConnection(handleSubmit)}
            loading={loading}
          >
            {loading ? loadingText : 'Log Expense'}
          </Button>
        </div>
          </div>
        )}
      </div>
    </>
  );
}
