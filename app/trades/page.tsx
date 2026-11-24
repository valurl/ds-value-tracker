'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TradeListing, Profile } from '@/lib/types';
import { getActiveListings } from '@/lib/queries/trades';
import { getCurrentUserProfile, getDemoCurrentUser } from '@/lib/queries/profiles';
import { TradeListingCard } from '@/components/TradeListingCard';
import { CreateListingModal } from '@/components/CreateListingModal';
import { OfferModal } from '@/components/OfferModal';
import { NotificationBanner } from '@/components/NotificationBanner';
import {
  ArrowRightLeft,
  PlusCircle,
  Search,
  Filter,
  Sparkles,
  ShieldAlert,
  Coins,
  RefreshCw,
} from 'lucide-react';

function TradesHubContent() {
  const searchParams = useSearchParams();
  const filterItemId = searchParams.get('item');

  const [listings, setListings] = useState<TradeListing[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sell' | 'buy'>('all');
  const [myListingsOnly, setMyListingsOnly] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [offerModalListing, setOfferModalListing] = useState<TradeListing | null>(null);

  // Notification for accepted trades & rolling median updates
  const [tradeNotice, setTradeNotice] = useState<{
    itemName: string;
    oldValue: number;
    newValue: number;
    settledPrice: number;
    trend: 'up' | 'down' | 'stable';
  } | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getActiveListings();
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUserProfile().then(p => {
      if (p) setCurrentUser(p);
      else setCurrentUser(getDemoCurrentUser());
    });
    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (filterItemId && l.item_id !== filterItemId) return false;
      if (typeFilter !== 'all' && l.listing_type !== typeFilter) return false;
      if (myListingsOnly && currentUser && l.user_id !== currentUser.id) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const itemName = l.item?.name.toLowerCase() || '';
        const username = l.user?.username.toLowerCase() || '';
        const notes = l.notes?.toLowerCase() || '';
        return itemName.includes(q) || username.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [listings, filterItemId, typeFilter, myListingsOnly, currentUser, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Notice */}
      {tradeNotice && (
        <NotificationBanner
          type="success"
          title={`Trade Accepted & Item Value Updated!`}
          message={`Accepted offer for ${tradeNotice.itemName} at ${tradeNotice.settledPrice.toLocaleString()} G. Anti-manipulation rolling median adjusted item value from ${tradeNotice.oldValue.toLocaleString()} G to ${tradeNotice.newValue.toLocaleString()} G (Trend: ${tradeNotice.trend.toUpperCase()}).`}
          onClose={() => setTradeNotice(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Live Trading Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Post sell or buy requests, inspect counter-offers, and trade securely under Postgres Row-Level Security policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchListings}
            title="Refresh listings"
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Trade Listing</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings by item name, trader, or notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type filter */}
          <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('sell')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'sell' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              WTS Only
            </button>
            <button
              onClick={() => setTypeFilter('buy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                typeFilter === 'buy' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              WTB Only
            </button>
          </div>

          {/* My Listings Toggle */}
          <button
            onClick={() => setMyListingsOnly(!myListingsOnly)}
            className={`px-3 py-2 rounded-xl border transition-all ${
              myListingsOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
            }`}
          >
            My Listings ({listings.filter(l => currentUser && l.user_id === currentUser.id).length})
          </button>

          {filterItemId && (
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('item');
                window.history.replaceState({}, '', url.toString());
                window.location.reload();
              }}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-amber-400 hover:text-white border border-zinc-700"
            >
              Clear Item Filter ✕
            </button>
          )}
        </div>
      </div>

      {/* RLS Enforcement Notice */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Enforced by Postgres RLS:</strong> Anyone can browse listings and offers. Only logged-in users can place bids. <em>Only the listing creator</em> can accept an offer.
          </span>
        </div>
        <span className="font-mono text-zinc-400 hidden sm:inline">
          Listing Owner Protection Active
        </span>
      </div>

      {/* Listings Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Active Listings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {filteredListings.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800 p-8 space-y-4">
            <Coins className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No active listings found</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              {myListingsOnly
                ? "You haven't posted any active trade listings yet. Click 'Post Trade Listing' above to get started!"
                : 'Be the first trader to post an item listing or create a buy request!'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Post First Listing
            </button>
          </div>
        ) : (
          filteredListings.map(listing => (
            <TradeListingCard
              key={listing.id}
              listing={listing}
              currentUser={currentUser}
              onOpenOfferModal={l => setOfferModalListing(l)}
              onRefresh={fetchListings}
              onOfferAcceptedNotice={notice => setTradeNotice(notice)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <CreateListingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onListingCreated={fetchListings}
        initialItemId={filterItemId || undefined}
      />

      {offerModalListing && (
        <OfferModal
          listing={offerModalListing}
          isOpen={Boolean(offerModalListing)}
          onClose={() => setOfferModalListing(null)}
          onOfferSubmitted={fetchListings}
        />
      )}
    </div>
  );
}

export default function TradesHubPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-zinc-400">
          Loading trading hub...
        </div>
      }
    >
      <TradesHubContent />
    </Suspense>
  );
}
