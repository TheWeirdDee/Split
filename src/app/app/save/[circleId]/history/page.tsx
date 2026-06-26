"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { useWallet } from '@/context/WalletContext';
import { SAVINGS_CIRCLE_ADDRESS, SAVINGS_CIRCLE_ABI } from '@/lib/contract';
import { decodeEventLog, formatEther } from 'viem';
import { 
  History, Calendar, ArrowLeft, ExternalLink, 
  PiggyBank, CheckCircle2, UserPlus, Gift, 
  AlertTriangle, ShieldAlert, Ban, ShieldCheck 
} from 'lucide-react';

export default function HistoryPage() {
  const { circleId } = useParams() as { circleId: string };
  const { publicClient } = useWallet();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnchainLogs = useCallback(async () => {
    if (!publicClient || !circleId || !SAVINGS_CIRCLE_ADDRESS) {
      // Missing client/config: don't leave the page stuck on its spinner.
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Circle ID padded to 32 bytes (64 hex characters) to match topics[1]
      const circleIdHex = '0x' + BigInt(circleId).toString(16).padStart(64, '0');

      // Fetch all event logs from the SavingsCircle contract address
      const allLogs = await publicClient.getLogs({
        address: SAVINGS_CIRCLE_ADDRESS,
        fromBlock: 0n,
        toBlock: 'latest',
      });

    
      const filteredLogs = allLogs.filter((log: any) => 
        log.topics[1] && log.topics[1].toLowerCase() === circleIdHex.toLowerCase()
      );

      // Fetch block data for timestamps (parallelized)
      const mappedLogs = await Promise.all(
        filteredLogs.map(async (log: any) => {
          let eventName = '';
          let args: any = {};

          try {
            const decoded = decodeEventLog({
              abi: SAVINGS_CIRCLE_ABI,
              data: log.data,
              topics: log.topics,
            });
            eventName = decoded.eventName;
            args = decoded.args;
          } catch (e) {
            console.error('Failed to decode event log:', e);
          }

          // Get timestamp
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const timestamp = Number(block.timestamp) * 1000;

          return {
            txHash: log.transactionHash,
            eventName,
            args,
            timestamp,
          };
        })
      );

      // Sort logs by timestamp desc (newest first)
      mappedLogs.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(mappedLogs);
    } catch (err) {
      console.error('Failed to fetch circle history logs:', err);
    } finally {
      setLoading(false);
    }
  }, [circleId, publicClient]);

  useEffect(() => {
    fetchOnchainLogs();
  }, [fetchOnchainLogs]);

  const getEventMeta = (log: any) => {
    switch (log.eventName) {
      case 'CircleCreated':
        return {
          title: 'Circle Created',
          body: `Circle was deployed on Celo by ${log.args.creator.slice(0, 6)}...${log.args.creator.slice(-4)}`,
          color: 'text-brand bg-brand-dim',
          icon: PiggyBank
        };
      case 'MemberJoined':
        return {
          title: 'New Member Joined',
          body: `${log.args.member.slice(0, 6)}...${log.args.member.slice(-4)} joined the circle`,
          color: 'text-blue-400 bg-blue-500/10',
          icon: UserPlus
        };
      case 'ContributionMade':
        return {
          title: 'Contribution Deposited',
          body: `${log.args.member.slice(0, 6)}...${log.args.member.slice(-4)} contributed ${Number(formatEther(log.args.amount)).toFixed(2)} usdm (Cycle #${Number(log.args.cycle) + 1})`,
          color: 'text-green-400 bg-green-500/10',
          icon: CheckCircle2
        };
      case 'PayoutSent':
        return {
          title: 'Payout Distributed',
          body: `${log.args.recipient.slice(0, 6)}...${log.args.recipient.slice(-4)} received the pot payout of ${Number(formatEther(log.args.amount)).toFixed(2)} usdm`,
          color: 'text-yellow-400 bg-yellow-500/10',
          icon: Gift
        };
      case 'MemberMissed':
        return {
          title: 'Contribution Missed',
          body: `${log.args.member.slice(0, 6)}...${log.args.member.slice(-4)} missed a contribution (Cycle #${Number(log.args.cycle) + 1})`,
          color: 'text-orange-400 bg-orange-500/10',
          icon: AlertTriangle
        };
      case 'MemberRemoved':
        return {
          title: 'Member Removed',
          body: `${log.args.member.slice(0, 6)}...${log.args.member.slice(-4)} was removed due to rules violation (Refund: ${Number(formatEther(log.args.refundAmount)).toFixed(2)} usdm)`,
          color: 'text-red-400 bg-red-500/10',
          icon: ShieldAlert
        };
      case 'MemberExited':
        return {
          title: 'Member Exited',
          body: `${log.args.member.slice(0, 6)}...${log.args.member.slice(-4)} exited the circle (Refund: ${Number(formatEther(log.args.refundAmount)).toFixed(2)} usdm)`,
          color: 'text-text-secondary bg-surface',
          icon: Ban
        };
      case 'CircleDissolved':
        return {
          title: 'Circle Dissolved',
          body: `Circle was dissolved by creator ${log.args.dissolvedBy.slice(0, 6)}...${log.args.dissolvedBy.slice(-4)}`,
          color: 'text-red-500 bg-red-500/10',
          icon: ShieldAlert
        };
      case 'CircleCompleted':
        return {
          title: 'Circle Completed',
          body: 'All rotation cycles or goals have been completed!',
          color: 'text-brand bg-brand-dim border border-brand/20',
          icon: ShieldCheck
        };
      default:
        return {
          title: log.eventName,
          body: 'Onchain contract event log triggered',
          color: 'text-text-secondary bg-surface',
          icon: History
        };
    }
  };

  return (
    <>
      <AppHeader />
      
      <div className="px-6 pt-24 pb-32 space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/app/save/${circleId}`}>
            <button
              type="button"
              aria-label="Back to circle"
              className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary transition-all hover:bg-surface cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </Link>
          <div className="space-y-0.5">
            <h2 className="clash-display font-bold text-xl text-text-primary">Onchain History</h2>
            <p className="text-xs text-text-secondary">Verifiable audit trail on Celo Mainnet</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-secondary">Retrieving block data & logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-3xl text-text-secondary text-sm">
            No transaction logs recorded yet for this circle.
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in relative pl-4 border-l-2 border-border/50 ml-2">
            {logs.map((log, index) => {
              const meta = getEventMeta(log);
              const Icon = meta.icon;
              const dateStr = new Date(log.timestamp).toLocaleString();

              return (
                <div key={index} className="relative space-y-2 group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[25px] top-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-4 border-[#0D0D0D] ${meta.color.split(' ')[0]} bg-[#0D0D0D]`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-surface space-y-2 hover:border-text-secondary transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-text-primary">{meta.title}</h4>
                      </div>
                      
                      <a
                        href={`https://celoscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View transaction on Celoscan"
                        className="text-text-secondary hover:text-brand transition-colors p-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">{meta.body}</p>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-brand/5 border border-brand/20 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">
            This history timeline is computed in real-time from event logs emitted by contract <span className="font-mono text-brand text-[10px]">{SAVINGS_CIRCLE_ADDRESS.slice(0, 10)}...{SAVINGS_CIRCLE_ADDRESS.slice(-8)}</span> on Celo.
          </p>
        </div>
      </div>
    </>
  );
}
