'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CompletedTradeRecord } from '@/lib/types';
import { getCompletedTrades } from '@/lib/queries/trades';
import { RarityBadge } from '@/components/Badge';
import {
  CheckCircle2,
  Coins,
  History,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowRight,
  ShieldCheck,
  Scale,
  RefreshCw,
} from 'lucide-react';

export default function CompletedTradesPage() {
  const [trades, setTrades] = useState<CompletedTradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCompletedTrades();
      setTrades(data);
    } catch (err) {
      console.error('Failed to load completed trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTrades = useMemo(() => {
    if (!search.trim()) return trades;
    const q = search.toLowerCase().trim();
    return trades.filter(
      t =>
        t.item_name.toLowerCase().includes(q) ||
        t.seller_username.toLowerCase().includes(q) ||
        t.buyer_username.toLowerCase().includes(q) ||
        t.item_category.toLowerCase().includes(q)
    );
  }, [trades, search]);

  // Aggregate stats
  const totalSettledGold = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.settled_price || 0), 0);
  }, [trades]);

  const largestTrade = useMemo(() => {
    if (trades.length === 0) return null;
    return [...trades].sort((a, b) => b.settled_price - a.settled_price)[0];
  }, [trades]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Completed Trades Ledger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Verified historical settlements feeding the mathematical rolling median price discovery algorithm.
            </p>
          </div>

          <button
            onClick={loadData}
            title="Refresh history"
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Ledger Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
            <span className="text-xs font-mono text-zinc-400">Total Settled Volume:</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1 font-mono flex items-center gap-1.5">
              <Coins className="w-5 h-5 fill-amber-400/20" />
              <span>{totalSettledGold.toLocaleString()} G</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              Direct gold transaction liquidity
            </span>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
            <span className="text-xs font-mono text-zinc-400">Settled Transactions:</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono flex items-center gap-1.5">
              <History className="w-5 h-5 text-cyan-400" />
              <span>{trades.length} Settled</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              100% verified by listing owners
            </span>
          </div>

          <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
            <span className="text-xs font-mono text-zinc-400">Peak Transaction:</span>
            <div className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {largestTrade?.item_name || 'None'}
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
              {largestTrade?.settled_price.toLocaleString()} G
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search completed trades by item name, seller, buyer, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
          />
        </div>
        <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
          Showing {filteredTrades.length} records
        </span>
      </div>

      {/* Trades History Table & Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800 p-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No completed trade records match</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Completed trades will appear here as listing owners accept offers in the Live Trading Hub.
            </p>
            <Link
              href="/trades"
              className="inline-block mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold text-xs transition-colors"
            >
              Go to Trading Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrades.map(trade => {
              const isPositiveChange = trade.value_change_percent > 0;
              const isNegativeChange = trade.value_change_percent < 0;

              return (
                <div
                  key={trade.id}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Item info */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 overflow-hidden">
                      {trade.item_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={trade.item_image}
                          alt={trade.item_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          Item
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RarityBadge rarity={trade.item_rarity} size="sm" />
                        <span className="text-[11px] font-mono text-zinc-400">
                          {trade.item_category}
                        </span>
                        <span className="text-[11px] text-zinc-400">•</span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(trade.settled_at).toLocaleDateString()} at{' '}
                          {new Date(trade.settled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base truncate mt-0.5">
                        {trade.item_name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                        <span>
                          Seller: <strong className="text-zinc-200">@{trade.seller_username}</strong>
                        </span>
                        <span className="text-zinc-400">→</span>
                        <span>
                          Buyer: <strong className="text-zinc-200">@{trade.buyer_username}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settled Price */}
                  <div className="text-left md:text-right shrink-0">
                    <span className="text-[11px] text-zinc-400 font-mono block">Settled Amount:</span>
                    <div className="flex items-center md:justify-end gap-1.5 text-amber-400 font-extrabold text-lg font-mono">
                      <Coins className="w-4 h-4 fill-amber-400/20" />
                      <span>{trade.settled_price.toLocaleString()} G</span>
                    </div>
                    {trade.offered_items && (
                      <span className="text-xs text-cyan-400 block max-w-xs truncate">
                        + {trade.offered_items}
                      </span>
                    )}
                  </div>

                  {/* Rolling Median Impact */}
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 shrink-0 md:w-56 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-amber-400" />
                        Rolling Median:
                      </span>
                      <span
                        className={`flex items-center font-bold ${
                          isPositiveChange
                            ? 'text-emerald-400'
                            : isNegativeChange
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {isPositiveChange ? <TrendingUp className="w-3 h-3 mr-0.5" /> : null}
                        {isNegativeChange ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
                        {isPositiveChange ? '+' : ''}
                        {trade.value_change_percent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400 line-through">
                        {trade.previous_item_value.toLocaleString()} G
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="font-bold text-white">
                        {trade.new_item_value.toLocaleString()} G
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
