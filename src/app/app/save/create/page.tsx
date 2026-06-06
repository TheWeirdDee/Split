"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useWallet } from '@/context/WalletContext';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { parseEther } from 'viem';
import { PiggyBank, ShieldCheck, ArrowRight, ArrowLeft, Settings, Info } from 'lucide-react';

export default function CreateCirclePage() {
  const router = useRouter();
  const { address } = useWallet();
  const { createCircle, txLoading } = useSavingsCircle();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<number>(0); // 0 = Rotating, 1 = Goal
  const [contribution, setContribution] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [customDays, setCustomDays] = useState('3');
  const [maxMembers, setMaxMembers] = useState('5');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDeadlineDays, setGoalDeadlineDays] = useState('30');
  const [graceHours, setGraceHours] = useState('24');
  const [maxMissed, setMaxMissed] = useState(2);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleCreate = async () => {
    if (!address || !name || !contribution) return;

    try {
      const parsedContribution = parseEther(contribution);
      
      // Calculate frequency in seconds
      let freqSecs = BigInt(604800); // 1 week default
      if (frequencyType === 'daily') freqSecs = BigInt(86400);
      else if (frequencyType === 'monthly') freqSecs = BigInt(2592000);
      else if (frequencyType === 'custom') freqSecs = BigInt(Number(customDays) * 86400);

      // Grace period in seconds
      const graceSecs = BigInt(Number(graceHours) * 3600);

      // Configuration settings based on mode
      let targetGoalVal = BigInt(0);
      let goalDeadlineTimestamp = BigInt(0);
      let limitMembers = BigInt(0);

      if (mode === 1) { // Goal mode
        targetGoalVal = parseEther(goalAmount);
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + Number(goalDeadlineDays));
        goalDeadlineTimestamp = BigInt(Math.floor(deadlineDate.getTime() / 1000));
      } else { // Rotating mode
        limitMembers = BigInt(maxMembers);
      }

      // Default values: maxCycles (0 = unlimited/natural), reminder lead time (1 hour = 3600s)
      const maxCyclesVal = BigInt(0);
      const reminderLeadSecs = BigInt(3600);

      const result = await createCircle(
        name,
        mode,
        parsedContribution,
        freqSecs,
        graceSecs,
        maxMissed,
        limitMembers,
        maxCyclesVal,
        targetGoalVal,
        goalDeadlineTimestamp,
        reminderLeadSecs
      );

      // On successful creation, go back to the save dashboard
      router.push('/app/save');
    } catch (err) {
      console.error('Failed to deploy savings circle onchain:', err);
      alert('Transaction failed. Make sure you have enough CELO for gas and try again.');
    }
  };

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid =
    mode === 0
      ? contribution.trim().length > 0 && Number(maxMembers) > 1
      : contribution.trim().length > 0 && goalAmount.trim().length > 0 && Number(goalDeadlineDays) > 0;

  return (
    <>
      <AppHeader />
      
      <div className="px-6 pt-24 pb-48 space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand">
            <PiggyBank className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Step {step} of 4</span>
          </div>
          <h2 className="clash-display font-bold text-2xl text-text-primary">Create a Savings Circle</h2>
        </div>

        {/* STEP 1: Basic configuration */}
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <Input
              label="Circle Name"
              placeholder="e.g. Rent Pool, Holiday Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="space-y-3">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Savings Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode(0)}
                  className={`p-5 rounded-3xl border-2 text-left space-y-2 transition-all ${
                    mode === 0
                      ? 'bg-brand/5 border-brand shadow-lg shadow-brand/5'
                      : 'bg-surface border-border hover:border-text-muted'
                  }`}
                >
                  <div className={`font-bold ${mode === 0 ? 'text-brand' : 'text-text-primary'}`}>Rotating Payout</div>
                  <div className="text-xs text-text-secondary">
                    Each cycle, one member gets the entire pot. Cycle rotates until everyone receives.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode(1)}
                  className={`p-5 rounded-3xl border-2 text-left space-y-2 transition-all ${
                    mode === 1
                      ? 'bg-purple-500/5 border-purple-500 shadow-lg shadow-purple-500/5'
                      : 'bg-surface border-border hover:border-text-muted'
                  }`}
                >
                  <div className={`font-bold ${mode === 1 ? 'text-purple-400' : 'text-text-primary'}`}>Shared Goal</div>
                  <div className="text-xs text-text-secondary">
                    Everyone contributes toward a target pot. Creator distributes once goal is reached.
                  </div>
                </button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-2 mt-8 cursor-pointer disabled:opacity-50"
              disabled={!isStep1Valid}
              onClick={handleNext}
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Contribution settings */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <Input
              label="Contribution Size (cUSD)"
              placeholder="e.g. 10"
              type="number"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
            />

            <div className="space-y-3">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {['daily', 'weekly', 'monthly', 'custom'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFrequencyType(type as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold capitalize border transition-all ${
                      frequencyType === type
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {frequencyType === 'custom' && (
              <Input
                label="Days between payments"
                placeholder="e.g. 3"
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              />
            )}

            {mode === 0 ? (
              <Input
                label="Maximum Members Limit"
                placeholder="e.g. 5"
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            ) : (
              <>
                <Input
                  label="Target Goal Size (cUSD)"
                  placeholder="e.g. 100"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
                <Input
                  label="Goal Deadline (Days from now)"
                  placeholder="e.g. 30"
                  type="number"
                  value={goalDeadlineDays}
                  onChange={(e) => setGoalDeadlineDays(e.target.value)}
                />
              </>
            )}

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                className="w-1/3 h-12 border border-border text-text-primary hover:bg-surface font-bold rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                className="w-2/3 h-12 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                disabled={!isStep2Valid}
                onClick={handleNext}
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Rules Configuration */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-3">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Grace Period</label>
              <div className="grid grid-cols-3 gap-3">
                {['12', '24', '48'].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setGraceHours(hrs)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                      graceHours === hrs
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    {hrs} Hours
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary flex items-start gap-1">
                <Info className="w-3.5 h-3.5 mt-0.5 text-brand shrink-0" />
                Members have this long after the deadline to contribute before they can be marked missed.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Max Missed Allowed</label>
              <div className="flex gap-4 items-center">
                {[1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMaxMissed(val)}
                    className={`w-12 h-12 rounded-full font-bold border transition-all flex items-center justify-center ${
                      maxMissed === val
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary">
                Members exceeding this count will be removed from the circle and refunded proportionally.
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                className="w-1/3 h-12 border border-border text-text-primary hover:bg-surface font-bold rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                className="w-2/3 h-12 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleNext}
              >
                Review Configuration
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Deploy */}
        {step === 4 && (
          <div className="space-y-8 animate-slide-up">
            <div className="p-6 border border-border rounded-3xl bg-surface space-y-6">
              <h3 className="clash-display font-bold text-lg text-text-primary pb-3 border-b border-border/50">
                Circle Settings Summary
              </h3>

              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Name</span>
                  <div className="font-bold text-text-primary">{name}</div>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Savings Mode</span>
                  <div className="font-bold text-text-primary">{mode === 0 ? 'Rotating Payout' : 'Shared Goal'}</div>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Contribution size</span>
                  <div className="font-bold text-brand">{contribution} cUSD</div>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Cadence</span>
                  <div className="font-bold text-text-primary capitalize">{frequencyType}</div>
                </div>
                {mode === 0 ? (
                  <div>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Max members</span>
                    <div className="font-bold text-text-primary">{maxMembers} members</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider">Target goal</span>
                      <div className="font-bold text-purple-400">{goalAmount} cUSD</div>
                    </div>
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider">Deadline</span>
                      <div className="font-bold text-text-primary">{goalDeadlineDays} Days</div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Grace period</span>
                  <div className="font-bold text-text-primary">{graceHours} Hours</div>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Max missed</span>
                  <div className="font-bold text-text-primary">{maxMissed} misses</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand/5 border border-brand/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary">
                  These settings will be permanently written to the smart contract on Celo. They cannot be altered after creation.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="w-1/3 h-12 border border-border text-text-primary hover:bg-surface font-bold rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                onClick={handleBack}
                disabled={txLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                className="w-2/3 h-12 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                onClick={handleCreate}
                loading={txLoading}
              >
                {txLoading ? 'Deploying Onchain...' : 'Deploy Circle'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
