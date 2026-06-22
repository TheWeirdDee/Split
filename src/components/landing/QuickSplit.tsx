"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Share2, UserCheck } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { serializeQuickSplit } from '@/lib/quicksplit';

const formatAmount = (value: number) => value.toFixed(2);

/**
 * Interactive landing demo: a wallet-free bill splitter. Lets visitors add
 * people, set who paid, split equally or with custom amounts, preview the
 * result, and hand off to the app via a shareable encoded link.
 */
export default function QuickSplit() {
  const router = useRouter();
  const [total, setTotal] = useState('');
  const [personName, setPersonName] = useState('');
  const [people, setPeople] = useState<string[]>(['You', 'Friend']);
  const [paidBy, setPaidBy] = useState('You');
  const [equalSplit, setEqualSplit] = useState(true);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const totalAmount = parseFloat(total || '0');
  const customTotal = useMemo(() => {
    if (equalSplit) return totalAmount;
    return people.reduce((sum, person) => sum + (parseFloat(customAmounts[person] || '0') || 0), 0);
  }, [customAmounts, equalSplit, people, totalAmount]);

  const isValidSplit = people.length > 1 && totalAmount > 0 && paidBy && (equalSplit || customTotal === totalAmount);
  const validationMessage = !people.length || people.length < 2
    ? 'Add at least two people.'
    : totalAmount <= 0
    ? 'Enter a total amount.'
    : !equalSplit && customTotal !== totalAmount
    ? 'Custom amounts must add up to the total.'
    : '';

  const shareable = useMemo(() => isValidSplit, [isValidSplit]);

  const handleShare = () => {
    if (!isValidSplit) return;

    const payload = {
      total: totalAmount,
      people,
      paidBy,
      equalSplit,
      customAmounts: people.reduce<Record<string, number>>((map, person) => {
        map[person] = parseFloat(customAmounts[person] || '0') || 0;
        return map;
      }, {}),
      createdAt: Date.now(),
    };

    const encoded = serializeQuickSplit(payload);
    router.push(`/split/${encoded}`);
  };

  const handleAddPerson = () => {
    const name = personName.trim();
    if (!name || people.includes(name)) return;
    setPeople((prev) => [...prev, name]);
    setPersonName('');
  };

  const expenses = useMemo(() => {
    const amount = parseFloat(total || '0');
    if (!amount || people.length < 2) return [];

    if (equalSplit) {
      const share = amount / people.length;
      return people
        .filter((name) => name !== paidBy)
        .map((name) => ({ from: name, to: paidBy, amount: share }));
    }

    return people
      .filter((name) => name !== paidBy)
      .map((name) => ({
        from: name,
        to: paidBy,
        amount: parseFloat(customAmounts[name] || '0') || 0,
      }));
  }, [people, total, paidBy, equalSplit, customAmounts]);

  return (
    <Card className="bg-[#111111] border-[#242424] p-6 lg:p-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="dm-mono text-[11px] uppercase tracking-[0.22em] text-[#00C896]">Quick Split</span>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase text-[#8A8A8A] tracking-[0.16em]">
                <UserCheck size={14} /> No wallet needed
              </div>
            </div>
            <h3 className="clash-display font-bold text-3xl text-[#f5f0e8]">Split the bill in seconds.</h3>
            <p className="text-sm text-[#8A8A8A] leading-[1.8]">Add names, choose who paid, and see exactly who owes how much.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-[#8A8A8A]">
              Total amount
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-2xl border border-[#2C2C2C] bg-[#0D0D0D] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="block text-sm text-[#8A8A8A]">
              Who paid?
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#2C2C2C] bg-[#0D0D0D] px-4 py-3 text-white outline-none"
              >
                {people.map((person) => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-[#8A8A8A]">
              Add a person
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-[#2C2C2C] bg-[#0D0D0D] px-4 py-3 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="rounded-2xl bg-[#00C896] px-4 py-3 text-black font-semibold"
                >
                  <Plus size={16} />
                </button>
              </div>
            </label>

            <div className="block text-sm text-[#8A8A8A]">
              Split type
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEqualSplit(true)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${equalSplit ? 'bg-[#00C896] text-black' : 'bg-[#171717] text-[#9A9A9A]'}`}
                >Equal</button>
                <button
                  type="button"
                  onClick={() => setEqualSplit(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${!equalSplit ? 'bg-[#00C896] text-black' : 'bg-[#171717] text-[#9A9A9A]'}`}
                >Custom</button>
              </div>
            </div>
          </div>

          {!equalSplit && (
            <div className="grid gap-3">
              {people.map((person) => (
                <label key={person} className="block text-sm text-[#8A8A8A]">
                  {person} owes
                  <input
                    type="number"
                    value={customAmounts[person] || ''}
                    onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [person]: e.target.value }))}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-[#2C2C2C] bg-[#0D0D0D] px-4 py-3 text-white outline-none"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#222222]">
            <button
              type="button"
              onClick={() => setShowResult(true)}
              disabled={!shareable}
              className="w-full rounded-2xl bg-[#00C896] px-4 py-3 text-black font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Calculate split
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#222222] bg-[#0D0D0D] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="dm-mono text-[10px] uppercase tracking-[0.22em] text-[#00C896]">Result preview</p>
                <h4 className="text-xl font-bold text-[#f5f0e8]">Who owes who</h4>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#161616] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#8A8A8A]"
                onClick={() => setShowResult(false)}
              >
                Reset
              </button>
            </div>

            {showResult && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map((item) => (
                  <div key={`${item.from}-${item.to}`} className="rounded-2xl border border-[#222222] bg-[#111111] p-4">
                    <p className="text-sm text-[#8A8A8A]">{item.from} owes</p>
                    <div className="mt-1 flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-[#f5f0e8]">{item.to}</span>
                      <span className="dm-mono text-[#00C896]">{formatAmount(item.amount)} cUSD</span>
                    </div>
                  </div>
                ))}
                {!isValidSplit && (
                  <div className="rounded-2xl bg-[#151515] border border-[#333333] p-4 text-sm text-[#ffb3b3]">
                    {validationMessage}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!shareable}
                  className="mt-4 w-full rounded-2xl bg-[#00C896] px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Share2 size={16} /> Generate shareable link
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 text-sm text-[#8A8A8A]">
                <p className="font-medium text-[#f5f0e8] mb-2">Live preview</p>
                <p>Add at least two people, enter a total, and choose who paid to see the split.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
