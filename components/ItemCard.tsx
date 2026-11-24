import React from 'react';
import Link from 'next/link';
import { Item } from '@/lib/types';
import { RarityBadge, CategoryBadge, DemandBadge, TrendBadge, formatPoints } from './Badge';
import { ArrowRightLeft, History, Shield, Sparkles } from 'lucide-react';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const diff = item.current_value - item.base_value;
  const pct = item.base_value > 0 ? (diff / item.base_value) * 100 : 0;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div className="group relative bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col">
      {/* Top Banner & Image Preview */}
      <div className="relative h-48 w-full bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800/80">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
            <span className="text-4xl">🦖</span>
            <span className="text-xs font-mono">No Image</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 flex-wrap">
          <RarityBadge rarity={item.rarity} />
          <CategoryBadge category={item.category} />
        </div>

        {/* Floating Demand / Trend */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <DemandBadge demand={item.demand_rating} />
          <TrendBadge trend={item.trend} />
        </div>
      </div>

      {/* Item Body Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mb-1">
            <span>Dino:</span>
            <span className="font-bold text-zinc-200">{item.base_dinosaur}</span>
          </div>

          <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description || 'Dinosaur Simulator skin tracked by player trading consensus.'}
          </p>
        </div>

        {/* Price & Valuation Section in Points */}
        <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Point Value:</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-lg font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{item.current_value.toLocaleString()}</span>
              <span className="text-xs font-normal text-zinc-400 font-mono">Pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-xs">
            <span className="text-zinc-400 font-mono">Starting Baseline:</span>
            <span className="font-mono text-zinc-300">{item.base_value.toLocaleString()} Pts</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Market Shift:</span>
            <span
              className={`font-semibold ${
                isPositive
                  ? 'text-emerald-400'
                  : isNegative
                  ? 'text-rose-400'
                  : 'text-zinc-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {diff.toLocaleString()} Pts ({isPositive ? '+' : ''}
              {pct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Trade stats and link to trading hub */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono">
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>{item.trade_count} Settled Swaps</span>
          </div>

          <Link
            href={`/trades?item=${encodeURIComponent(item.id)}`}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <span>Skin Trades</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
