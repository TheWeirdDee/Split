import Link from 'next/link';
import { formatAmount } from '@/lib/utils';
import { deserializeQuickSplit, QuickSplitPayload } from '@/lib/quicksplit';

interface SplitPageProps {
  params: {
    id: string;
  };
}

const renderDebt = (debt: { from: string; to: string; amount: number }) => (
  <div key={`${debt.from}-${debt.to}`} className="rounded-2xl border border-[#2C2C2C] bg-[#111111] p-5">
    <p className="text-sm text-[#8A8A8A]">{debt.from} owes</p>
    <div className="mt-2 flex items-center justify-between gap-4">
      <span className="font-semibold text-[#f5f0e8]">{debt.to}</span>
      <span className="dm-mono text-[#00C896]">{formatAmount(debt.amount)} cUSD</span>
    </div>
  </div>
);

export default function SplitResultPage({ params }: SplitPageProps) {
  const data = deserializeQuickSplit(params.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] px-6 py-20">
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#242424] bg-[#111111] p-10 text-center">
          <h1 className="clash-display font-bold text-4xl mb-6">Invalid split result</h1>
          <p className="text-[#8A8A8A] mb-8">The link is malformed or the encoded split data could not be read.</p>
          <Link href="/">
            <button className="rounded-2xl bg-[#00C896] px-6 py-3 text-black font-semibold">Return home</button>
          </Link>
        </div>
      </div>
    );
  }

  const debts = data.people
    .filter((name) => name !== data.paidBy)
    .map((name) => ({
      from: name,
      to: data.paidBy,
      amount: data.equalSplit ? data.total / data.people.length : data.customAmounts[name] ?? 0,
    }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] px-6 py-20">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="rounded-3xl border border-[#242424] bg-[#111111] p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="dm-mono text-[10px] uppercase tracking-[0.24em] text-[#00C896] font-semibold">Quick Split result</p>
              <h1 className="clash-display font-bold text-4xl mt-3">{data.paidBy} paid the bill</h1>
            </div>
            <div className="rounded-2xl bg-[#0d0d0d] border border-[#1f1f1f] px-6 py-4 text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#8A8A8A]">Total amount</p>
              <p className="clash-display font-bold text-3xl text-[#00C896]">{formatAmount(data.total)} cUSD</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#0d0d0d] border border-[#1f1f1f] p-6">
              <p className="text-sm text-[#8A8A8A] uppercase tracking-[0.2em] mb-3">People</p>
              <div className="space-y-2">
                {data.people.map((person) => (
                  <div key={person} className="flex items-center justify-between text-sm text-[#f5f0e8]">
                    <span>{person}</span>
                    <span className={person === data.paidBy ? 'text-[#00C896]' : 'text-[#8A8A8A]'}>{person === data.paidBy ? 'Paid' : 'Owes'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#0d0d0d] border border-[#1f1f1f] p-6">
              <p className="text-sm text-[#8A8A8A] uppercase tracking-[0.2em] mb-3">Split type</p>
              <p className="text-lg font-semibold">{data.equalSplit ? 'Equal split' : 'Custom split'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {debts.map((debt) => renderDebt(debt))}
        </div>

        <div className="rounded-3xl border border-[#242424] bg-[#111111] p-8 text-center">
          <p className="text-sm text-[#8A8A8A] mb-3">Ready to settle this onchain?</p>
          <Link href="/app/create">
            <button className="rounded-2xl bg-[#00C896] px-8 py-4 text-black font-semibold">Create a Group</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
