'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Item, ItemCategory, ItemRarity } from '@/lib/types';
import { getItems, filterAndSortItems } from '@/lib/queries/items';
import { ItemCard } from '@/components/ItemCard';
import { formatPoints } from '@/components/Badge';
import {
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Scale,
  RotateCcw,
  History,
  Layers,
  Flame,
} from 'lucide-react';

const CATEGORIES: (ItemCategory | 'All')[] = [
  'All',
  'Limited',
  'Event',
  'Albino / Melanistic',
  'Golden / Diamond',
  'Plush / Toy',
  'Gamepass / Robux',
  'Obtainable / Shop',
];

const BASE_DINOSAURS = [
  'All',
  'Megavore',
  'Barosaurus',
  'Tyrannosaurus Rex',
  'Giganotosaurus',
  'Spinosaurus',
  'Brachiosaurus',
  'Mosasaurus',
  'Ankylosaurus',
  'Balaur',
  'Triceratops',
  'Carnotaurus',
];

export default function SkinValueListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [selectedBaseDino, setSelectedBaseDino] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'demand' | 'trades' | 'name'>(
    'value_desc'
  );

  useEffect(() => {
    getItems()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching skins:', err);
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    return filterAndSortItems(items, {
      search,
      category: selectedCategory,
      baseDinosaur: selectedBaseDino,
      sortBy,
    });
  }, [items, search, selectedCategory, selectedBaseDino, sortBy]);

  const totalMarketCap = useMemo(() => {
    return items.reduce((acc, i) => acc + i.current_value, 0);
  }, [items]);

  const mostTraded = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.trade_count - a.trade_count)[0];
  }, [items]);

  const topGainer = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.current_value - a.current_value)[0];
  }, [items]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedBaseDino('All');
    setSortBy('value_desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
            <span className="text-sm">🦖</span>
            <span>Roblox Dinosaur Simulator Community Trading Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Dinosaur Simulator{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Skin Value Tracker
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Community-driven skin point valuations and player-to-player trade hub for Dinosaur Simulator.
            Evaluate <strong>Win, Fair, or Loss (W/F/L)</strong> skin swaps with anti-manipulation rolling median consensus.
            <em> Note: This is an independent skin valuation tracker—not an in-game store.</em>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/trades"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
            >
              <span>Explore Player Skin Trades</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/completed"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
            >
              <History className="w-4 h-4 text-zinc-400" />
              <span>Completed Skin Swaps</span>
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Cards in Points */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Total Skin Market</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
              {formatPoints(totalMarketCap)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Cumulative Points Valuation</div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Tracked Skins</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
              {items.length} Skins
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Limiteds, Events, Plushies</div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Most Traded</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 truncate">
              {mostTraded?.name || 'Loading...'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              {mostTraded?.trade_count || 0} Settled Swaps
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Highest Valued</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 truncate">
              {topGainer?.name || 'Loading...'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
              {topGainer ? formatPoints(topGainer.current_value) : '0 Pts'} (Extreme Demand)
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Dinosaur Simulator skins by name, dinosaur, category, or rarity..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Base Dino filter & Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Dino:</span>
              <select
                value={selectedBaseDino}
                onChange={e => setSelectedBaseDino(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
              >
                {BASE_DINOSAURS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
              >
                <option value="value_desc">Highest Point Value</option>
                <option value="value_asc">Lowest Point Value</option>
                <option value="trades">Most Traded Volume</option>
                <option value="demand">Highest Demand Rating</option>
                <option value="name">Name (A - Z)</option>
              </select>
            </div>

            {(search || selectedCategory !== 'All' || selectedBaseDino !== 'All' || sortBy !== 'value_desc') && (
              <button
                onClick={handleResetFilters}
                title="Reset filters"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-400 font-mono flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skins Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Dinosaur Simulator Skins</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {filteredItems.length} {filteredItems.length === 1 ? 'skin' : 'skins'}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8 space-y-3">
            <span className="text-4xl block">🦖</span>
            <h3 className="text-lg font-bold text-white">No dinosaur skins match your filters</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Try adjusting your search query, base dinosaur, or category filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Community Skin Trading Clarification Callout */}
      <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-white text-base">
            How does Skin-for-Skin Valuation work in DS?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Players in Dinosaur Simulator trade skin-for-skin directly. Point valuations represent market consensus calculated from verified accepted trade swaps using rolling median analysis.
            When negotiating trades, compare the total Point Value of both sides to verify if a deal is a <strong>Win, Fair, or Loss (W/F/L)</strong>!
          </p>
        </div>
        <Link
          href="/trades"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          Check Live Trades
        </Link>
      </div>
    </div>
  );
}
