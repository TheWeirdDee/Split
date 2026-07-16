"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { usePredictions } from "@/hooks/usePredictions";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { AmountDisplay } from "@/components/common/AmountDisplay";
import { 
  TrendingUp, 
  Plus, 
  Clock, 
  User, 
  Trophy, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  X,
  Sparkles
} from "lucide-react";

interface GroupPredictionsProps {
  groupId: string;
}

type CustomDurationUnit = 'minutes' | 'hours' | 'days';

const DURATION_MULTIPLIERS: Record<CustomDurationUnit, number> = {
  minutes: 60,
  hours: 60 * 60,
  days: 24 * 60 * 60,
};

const resolveDurationSeconds = (
  duration: string,
  customDuration: string,
  customDurationUnit: CustomDurationUnit,
): number | null => {
  if (duration !== 'custom') {
    const seconds = Number(duration);
    return Number.isSafeInteger(seconds) && seconds >= 60 ? seconds : null;
  }

  const value = Number(customDuration);
  const seconds = Math.floor(value * DURATION_MULTIPLIERS[customDurationUnit]);
  return Number.isFinite(value) && value > 0 && Number.isSafeInteger(seconds) && seconds >= 60
    ? seconds
    : null;
};

const formatRemainingTime = (seconds: number): string => {
  if (seconds >= 86400) {
    const days = Math.ceil(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};

export const GroupPredictions = ({ groupId }: GroupPredictionsProps) => {
  const { address } = useWallet();
  const {
    predictions,
    loading,
    actionLoading,
    createPrediction,
    placeBet,
    resolvePrediction,
    claimWinnings,
  } = usePredictions(groupId);

  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create Form State
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState("86400"); // 1 day default
  const [customDuration, setCustomDuration] = useState("");
  const [customDurationUnit, setCustomDurationUnit] = useState<CustomDurationUnit>('hours');

  // Bet Form State per Market
  const [betAmounts, setBetAmounts] = useState<{ [marketId: string]: string }>({});
  const [now, setNow] = useState(0);

  useEffect(() => {
    const updateNow = () => setNow(Math.floor(Date.now() / 1000));
    const initialTimer = window.setTimeout(updateNow, 0);
    const interval = window.setInterval(updateNow, 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      const dur = resolveDurationSeconds(duration, customDuration, customDurationUnit);
      if (!dur) {
        alert('Enter a custom duration of at least 1 minute.');
        return;
      }

      const isCreated = await createPrediction(question, dur);
      if (isCreated) {
        setQuestion("");
        setDuration('86400');
        setCustomDuration('');
        setCustomDurationUnit('hours');
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Failed to create prediction: " + (err as Error).message);
    }
  };

  const handlePlaceBet = async (marketId: string, isYes: boolean) => {
    const amountStr = betAmounts[marketId];
    const amount = parseFloat(amountStr || "0");
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    try {
      await placeBet(marketId, isYes, amount);
      setBetAmounts({ ...betAmounts, [marketId]: "" });
    } catch (err) {
      alert("Failed to place bet: " + (err as Error).message);
    }
  };

  const handleResolve = async (marketId: string, outcome: number) => {
    const confirmMsg = 
      outcome === 1 
        ? "Are you sure you want to resolve this as YES?" 
        : outcome === 2 
          ? "Are you sure you want to resolve this as NO?" 
          : "Are you sure you want to CANCEL this market?";
    
    if (!confirm(confirmMsg)) return;

    try {
      await resolvePrediction(marketId, outcome);
    } catch (err) {
      alert("Failed to resolve prediction: " + (err as Error).message);
    }
  };

  const handleClaim = async (marketId: string) => {
    try {
      await claimWinnings(marketId);
      alert("Winnings claimed successfully!");
    } catch (err) {
      alert("Failed to claim winnings: " + (err as Error).message);
    }
  };

  // Filter Predictions
  const filteredPredictions = predictions.filter((p) => {
    const isClosed = now > 0 && now >= p.endTime;
    const isMarketActive = !p.resolved && !isClosed;

    if (activeTab === "active") {
      return isMarketActive;
    } else if (activeTab === "resolved") {
      return p.resolved;
    }
    return true;
  });

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header card with glassmorphism */}
      <div 
        style={{
          background: "linear-gradient(135deg, rgba(0,200,150,0.06) 0%, rgba(0,200,150,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "24px",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 220px' }}>
          <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            Social Micro-Bets
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Place micro-bets in usdm on group outcomes and test your intuition!
          </p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-full shadow-lg hover:shadow-brand/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Bet
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["all", "active", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize ${
              activeTab === tab 
                ? "border-brand text-brand" 
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
          <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">Fetching prediction markets...</span>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-border border-dashed rounded-2xl p-8 gap-4">
          <HelpCircle className="w-12 h-12 text-text-muted" />
          <div>
            <h3 className="font-semibold text-text-primary">No bets found</h3>
            <p className="text-sm text-text-secondary mt-1">
              {activeTab === "all" 
                ? "No prediction markets have been created in this group yet." 
                : `No ${activeTab} predictions in this group.`}
            </p>
          </div>
          {activeTab === "all" && (
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Launch the First Prediction
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-w-0">
          {filteredPredictions.map((market) => {
            const isClosed = now > 0 && now >= market.endTime;
            const totalBets = market.totalYesPool + market.totalNoPool;
            const yesPercent = totalBets > 0 ? Math.round((market.totalYesPool / totalBets) * 100) : 50;
            const noPercent = totalBets > 0 ? 100 - yesPercent : 50;

            const userAddress = address?.toLowerCase();
            const isCreator = userAddress === market.creator;
            const hasVoted = (market.userYesBet ?? 0) > 0 || (market.userNoBet ?? 0) > 0;
            const hasWinningBet = market.outcome === 1 ? (market.userYesBet ?? 0) > 0 : market.outcome === 2 ? (market.userNoBet ?? 0) > 0 : market.outcome === 3 && hasVoted;

            return (
              <div 
                key={market.id}
                style={{
                  background: "#161616",
                  border: "1px solid #2C2C2C",
                  borderRadius: "20px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  position: "relative",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {/* Badge Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{isCreator ? "You created" : `By ${market.creator.slice(0, 6)}...${market.creator.slice(-4)}`}</span>
                  </div>
                  
                  {/* Status Badge */}
                  <span 
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      market.resolved
                        ? market.outcome === 1 
                          ? "bg-money-positive/10 text-money-positive" 
                          : market.outcome === 2 
                            ? "bg-orange-500/10 text-orange-500" 
                            : "bg-text-muted/10 text-text-muted"
                        : isClosed 
                          ? "bg-yellow-500/10 text-yellow-500" 
                          : "bg-brand/10 text-brand"
                    }`}
                  >
                    {market.resolved 
                      ? market.outcome === 1 
                        ? "YES Won" 
                        : market.outcome === 2 
                          ? "NO Won" 
                          : "Cancelled"
                      : isClosed 
                        ? "Awaiting Resolution" 
                        : "Active"}
                  </span>
                </div>

                {/* Question */}
                <h3 className="font-display font-bold text-text-primary text-base leading-snug break-words min-w-0">
                  {market.question}
                </h3>

                {/* Time Display */}
                {!market.resolved && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {isClosed 
                        ? "Closed" 
                        : now === 0
                          ? "Checking deadline..."
                          : `Closes in ${formatRemainingTime(market.endTime - now)}`}
                    </span>
                  </div>
                )}

                {/* Pools & ratio display */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>YES Pool ({yesPercent}%)</span>
                    <span>NO Pool ({noPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden flex">
                    <div style={{ width: `${yesPercent}%` }} className="bg-brand h-full" />
                    <div style={{ width: `${noPercent}%` }} className="bg-orange-500 h-full" />
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-text-primary">
                    <AmountDisplay amount={market.totalYesPool} />
                    <AmountDisplay amount={market.totalNoPool} />
                  </div>
                </div>

                {/* User Bets Summary */}
                {hasVoted && (
                  <div className="bg-surface-2/40 border border-border/50 rounded-xl p-3 flex flex-wrap justify-between items-center gap-2 text-xs min-w-0">
                    <span className="text-text-secondary">Your Bet:</span>
                    <span className="font-medium text-text-primary flex items-center gap-1">
                      {market.userYesBet && market.userYesBet > 0 ? (
                        <>
                          <span className="text-brand font-bold">YES</span> 
                          <AmountDisplay amount={market.userYesBet} size="sm" />
                        </>
                      ) : null}
                      {market.userNoBet && market.userNoBet > 0 ? (
                        <>
                          <span className="text-orange-500 font-bold">NO</span> 
                          <AmountDisplay amount={market.userNoBet} size="sm" />
                        </>
                      ) : null}
                    </span>
                  </div>
                )}

                {/* Action Panels */}
                <div className="pt-2 mt-auto border-t border-border/40 space-y-3">
                  {/* Scenario A: Market is Active & open for betting */}
                  {!market.resolved && !isClosed && !hasVoted && (
                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Bet amount..."
                          value={betAmounts[market.id] || ""}
                          onChange={(e) => setBetAmounts({ ...betAmounts, [market.id]: e.target.value })}
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="h-10 text-sm px-3 rounded-lg py-1 focus:border-brand"
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          className="border border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand text-xs font-semibold py-2 rounded-xl"
                          onClick={() => handlePlaceBet(market.id, true)}
                          loading={actionLoading}
                        >
                          Bet YES
                        </Button>
                        <Button
                          variant="ghost"
                          className="border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 text-xs font-semibold py-2 rounded-xl"
                          onClick={() => handlePlaceBet(market.id, false)}
                          loading={actionLoading}
                        >
                          Bet NO
                        </Button>
                      </div>
                    </div>
                  )}

                  {!market.resolved && !isClosed && hasVoted && (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-medium text-brand">
                      <Check className="h-4 w-4" /> Bet locked in — one bet per prediction.
                    </div>
                  )}

                  {/* Scenario B: Awaiting Resolution & Caller is Creator */}
                  {!market.resolved && isClosed && isCreator && (
                    <div className="space-y-2">
                      <div className="text-xs text-yellow-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        As the creator, please resolve this:
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          variant="primary"
                          className="text-xs py-1.5 px-1 bg-brand text-bg hover:bg-brand-dark"
                          onClick={() => handleResolve(market.id, 1)}
                          loading={actionLoading}
                        >
                          YES Won
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-xs py-1.5 px-1 bg-orange-500 hover:bg-orange-600 text-text-primary"
                          onClick={() => handleResolve(market.id, 2)}
                          loading={actionLoading}
                        >
                          NO Won
                        </Button>
                        <Button
                          variant="outline"
                          className="text-xs py-1.5 px-1 hover:bg-surface-2 text-text-primary border-border"
                          onClick={() => handleResolve(market.id, 3)}
                          loading={actionLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Scenario C: Resolved & user won & hasn't claimed yet */}
                  {market.resolved && hasWinningBet && !market.hasClaimed && (
                    <Button
                      variant="primary"
                      className="w-full bg-brand text-bg flex items-center gap-1.5 justify-center py-2"
                      onClick={() => handleClaim(market.id)}
                      loading={actionLoading}
                    >
                      <Trophy className="w-4 h-4" /> Claim Winnings
                    </Button>
                  )}

                  {/* Scenario D: Resolved & user won & already claimed */}
                  {market.resolved && hasWinningBet && market.hasClaimed && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-money-positive py-1">
                      <Check className="w-4 h-4" /> Winnings Claimed
                    </div>
                  )}

                  {/* Scenario E: Resolved & user lost */}
                  {market.resolved && hasVoted && !hasWinningBet && (
                    <div className="text-center text-xs text-text-muted py-1 flex items-center justify-center gap-1">
                      <X className="w-3.5 h-3.5" /> Better luck next time!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BET MODAL */}
      {isModalOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(13,13,13,0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "440px",
              maxHeight: "calc(100dvh - 40px)",
              overflowY: "auto",
              background: "#161616",
              border: "1px solid #2C2C2C",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxSizing: "border-box",
            }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> Create New Bet
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="The Prediction Question"
                placeholder="e.g. Will Ada lose her passport on this trip?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
                  Betting Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="3600">1 hour</option>
                  <option value="86400">1 day</option>
                  <option value="259200">3 days</option>
                  <option value="604800">1 week</option>
                  <option value="custom">Custom duration</option>
                </select>
                {duration === 'custom' && (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 pt-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="1"
                      placeholder="Duration"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="min-w-0 w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-brand"
                      required
                    />
                    <select
                      value={customDurationUnit}
                      onChange={(e) => setCustomDurationUnit(e.target.value as CustomDurationUnit)}
                      className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-text-primary focus:outline-none focus:border-brand"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={actionLoading}
                >
                  Launch Bet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
