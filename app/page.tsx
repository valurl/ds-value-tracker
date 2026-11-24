'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Item, ItemCategory, ItemRarity } from '@/lib/types';
import { getItems, filterAndSortItems } from '@/lib/queries/items';
import { ItemCard } from '@/components/ItemCard';
import {
  Search,
  Filter,
  Coins,
  ShieldCheck,
  TrendingUp,
  History,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Scale,
} from 'lucide-react';

const CATEGORIES: (ItemCategory | 'All')[] = [
  'All',
  'Weapon',
  'Armor',
  'Artifact',
  'Consumable',
  'Mount',
  'Material',
];

const RARITIES: (ItemRarity | 'All')[] = [
  'All',
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
];

export default function ItemValueListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'All'>('All');
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
        console.error('Error fetching items:', err);
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    return filterAndSortItems(items, {
      search,
      category: selectedCategory,
      rarity: selectedRarity,
      sortBy,
    });
  }, [items, search, selectedCategory, selectedRarity, sortBy]);

  // Aggregate Economy Stats
  const totalMarketCap = useMemo(() => {
    return items.reduce((acc, i) => acc + i.current_value, 0);
  }, [items]);

  const mostTraded = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.trade_count - a.trade_count)[0];
  }, [items]);

  const topGainer = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => (b.current_value - b.base_value) - (a.current_value - a.base_value))[0];
  }, [items]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedRarity('All');
    setSortBy('value_desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anti-Manipulation Economy Consensus Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Valoria Game Trading &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
              Item Value Tracker
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Transparent price discovery for in-game assets. Valuations are mathematically regulated
            via rolling median consensus over verified settled trades to prevent single-trade price
            manipulation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/trades"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all"
            >
              <span>Explore Live Trading Hub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/completed"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
            >
              <History className="w-4 h-4 text-zinc-400" />
              <span>Settled Trades History</span>
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Economy Index</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
              {totalMarketCap.toLocaleString()} <span className="text-xs text-amber-400 font-normal">G</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Sum of all tracked asset values</div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tracked Assets</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
              {items.length} Items
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Weapons, Armors, Artifacts</div>
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
              {mostTraded?.trade_count || 0} Settled Exchanges
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Top Valued</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 truncate">
              {topGainer?.name || 'Loading...'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
              {topGainer?.current_value.toLocaleString()} G (High Demand)
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items by name, rarity, category, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-zinc-400 whitespace-nowrap">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
            >
              <option value="value_desc">Highest Current Value</option>
              <option value="value_asc">Lowest Current Value</option>
              <option value="trades">Most Traded Volume</option>
              <option value="demand">Highest Demand Rating</option>
              <option value="name">Name (A - Z)</option>
            </select>

            {(search || selectedCategory !== 'All' || selectedRarity !== 'All' || sortBy !== 'value_desc') && (
              <button
                onClick={handleResetFilters}
                title="Reset filters"
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (Categories & Rarities) */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-mono flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rarity Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-mono shrink-0 mr-1">Rarity:</span>
            {RARITIES.map(rarity => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all font-medium ${
                  selectedRarity === rarity
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Item Value Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Tracked Item Values</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-8 space-y-3">
            <Coins className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No items match your criteria</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Try adjusting your search query, rarity selection, or category filters to explore the rest of the economy.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold text-xs transition-colors"
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

      {/* Educational Anti-Manipulation Callout */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-white text-base">
            How does Valoria prevent market price manipulation?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            In standard player economies, an attacker can create an artificial listing at an exorbitant price (e.g. 1,000,000 gold) and buy it with an alt account to trick value trackers.
            Valoria calculates a <strong>rolling median over verified settled trades</strong> (anchored with baseline seeds for low-volume items). A single fake transaction cannot shift the median, preserving accurate game-wide valuations.
          </p>
        </div>
        <Link
          href="/completed"
          className="shrink-0 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          View Settled Trade History
        </Link>
      </div>
    </div>
  );
}
