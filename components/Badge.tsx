import React from 'react';
import { ItemRarity, DemandRating, PriceTrend } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';

interface RarityBadgeProps {
  rarity: ItemRarity;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const styles: Record<ItemRarity, { bg: string; text: string; border: string; glow: string }> = {
    Common: {
      bg: 'bg-zinc-800/80',
      text: 'text-zinc-300',
      border: 'border-zinc-700',
      glow: '',
    },
    Uncommon: {
      bg: 'bg-emerald-950/70',
      text: 'text-emerald-400',
      border: 'border-emerald-700/60',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    },
    Rare: {
      bg: 'bg-blue-950/70',
      text: 'text-blue-400',
      border: 'border-blue-700/60',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    },
    Epic: {
      bg: 'bg-purple-950/70',
      text: 'text-purple-300',
      border: 'border-purple-600/60',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    },
    Legendary: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
      border: 'border-amber-500/70',
      glow: 'shadow-[0_0_14px_rgba(245,158,11,0.25)]',
    },
    Mythic: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-400',
      border: 'border-rose-500/80',
      glow: 'shadow-[0_0_16px_rgba(244,63,94,0.3)]',
    },
  };

  const style = styles[rarity] || styles.Common;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wide uppercase ${style.bg} ${style.text} ${style.border} ${style.glow} ${sizeClasses}`}
    >
      {rarity}
    </span>
  );
}

interface DemandBadgeProps {
  demand: DemandRating;
}

export function DemandBadge({ demand }: DemandBadgeProps) {
  const styles: Record<DemandRating, { color: string; icon?: boolean }> = {
    Low: { color: 'text-zinc-400 bg-zinc-800/60 border-zinc-700' },
    Medium: { color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/50' },
    High: { color: 'text-amber-400 bg-amber-950/50 border-amber-800/50' },
    Extreme: { color: 'text-rose-400 bg-rose-950/60 border-rose-800/60', icon: true },
  };

  const current = styles[demand] || styles.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${current.color}`}
    >
      {current.icon && <Flame className="w-3 h-3 text-rose-400 animate-pulse" />}
      Demand: {demand}
    </span>
  );
}

interface TrendBadgeProps {
  trend: PriceTrend;
  showLabel?: boolean;
}

export function TrendBadge({ trend, showLabel = true }: TrendBadgeProps) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded text-xs font-medium">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        {showLabel && 'Trending Up'}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2 py-0.5 rounded text-xs font-medium">
        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
        {showLabel && 'Trending Down'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-xs font-medium">
      <Minus className="w-3 h-3 text-zinc-400" />
      {showLabel && 'Stable'}
    </span>
  );
}
