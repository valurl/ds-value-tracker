'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TradeListing, Profile, WflVerdict } from '@/lib/types';
import { getActiveListings } from '@/lib/queries/trades';
import { getCurrentUserProfile } from '@/lib/queries/profiles';
import { TradeListingCard } from '@/components/TradeListingCard';
import { CreateListingModal } from '@/components/CreateListingModal';
import { OfferModal } from '@/components/OfferModal';
import { NotificationBanner } from '@/components/NotificationBanner';
import {
  ArrowRightLeft,
  PlusCircle,
  Search,
  RefreshCw,
  Scale,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function TradesHubContent() {
  const searchParams = useSearchParams();
  const filterItemId = searchParams.get('item');

  const [listings, setListings] = useState<TradeListing[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [wflFilter, setWflFilter] = useState<WflVerdict | 'all'>('all');
  const [myListingsOnly, setMyListingsOnly] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [offerModalListing, setOfferModalListing] = useState<TradeListing | null>(null);

  // Notification for accepted trades
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
      setCurrentUser(p);
    });
    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (filterItemId && l.item_id !== filterItemId && !(l.offered_skin_ids || []).includes(filterItemId)) {
        return false;
      }
      if (wflFilter !== 'all' && l.wfl_verdict !== wflFilter) return false;
      if (myListingsOnly && currentUser && l.user_id !== currentUser.id) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const itemName = l.item?.name.toLowerCase() || '';
        const username = l.user?.username.toLowerCase() || '';
        const notes = l.notes?.toLowerCase() || '';
        const wishlist = l.requested_items?.toLowerCase() || '';
        const skinsList = (l.offered_skins || []).map(s => s.name.toLowerCase()).join(' ');
        return (
          itemName.includes(q) ||
          username.includes(q) ||
          notes.includes(q) ||
          wishlist.includes(q) ||
          skinsList.includes(q)
        );
      }
      return true;
    });
  }, [listings, filterItemId, wflFilter, myListingsOnly, currentUser, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Notice */}
      {tradeNotice && (
        <NotificationBanner
          type="success"
          title={`Skin Trade Accepted & Point Value Adjusted!`}
          message={`Accepted trade for ${tradeNotice.itemName} at ${tradeNotice.settledPrice.toLocaleString()} Pts. Community rolling median updated skin point value from ${tradeNotice.oldValue.toLocaleString()} Pts to ${tradeNotice.newValue.toLocaleString()} Pts (Trend: ${tradeNotice.trend.toUpperCase()}).`}
          onClose={() => setTradeNotice(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Player Skin Trading Hub (W/F/L)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Skin-for-skin trading between Dinosaur Simulator players. View real-time Win / Fair / Loss balances before making offers.
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Skin Trade</span>
          </button>
        </div>
      </div>

      {/* Filters & W/F/L Toggles */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by skin name, base dino, trader, or wishlist..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* W/F/L filter pills */}
          <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setWflFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                wflFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setWflFilter('win')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                wflFilter === 'win' ? 'bg-emerald-600 text-zinc-950 shadow-md' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              🔥 Win
            </button>
            <button
              onClick={() => setWflFilter('fair')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                wflFilter === 'fair' ? 'bg-cyan-600 text-zinc-950 shadow-md' : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              ⚖️ Fair
            </button>
            <button
              onClick={() => setWflFilter('open')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                wflFilter === 'open' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Open Offers
            </button>
          </div>

          {/* My Listings Toggle */}
          {currentUser && (
            <button
              onClick={() => setMyListingsOnly(!myListingsOnly)}
              className={`px-3 py-2 rounded-xl border transition-all ${
                myListingsOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
              }`}
            >
              My Listings ({listings.filter(l => l.user_id === currentUser.id).length})
            </button>
          )}

          {filterItemId && (
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('item');
                window.history.replaceState({}, '', url.toString());
                window.location.reload();
              }}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-emerald-400 hover:text-white border border-zinc-700"
            >
              Clear Skin Filter ✕
            </button>
          )}
        </div>
      </div>

      {/* RLS & W/F/L Notice */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Win / Fair / Loss (W/F/L):</strong> Computed by comparing the cumulative Point Values of offered skins vs requested skins. Deals within ±10% margin are classified as <strong>Fair</strong>.
          </span>
        </div>
        <span className="font-mono text-zinc-400 shrink-0">
          Owner-Only Acceptance Enforced
        </span>
      </div>

      {/* Listings Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Active Skin Trades</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {filteredListings.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 space-y-4">
            <span className="text-4xl block">🦖</span>
            <h3 className="text-lg font-bold text-white">No active skin listings found</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              {myListingsOnly
                ? "You haven't posted any active skin trade listings yet."
                : 'Be the first player to post a skin swap listing!'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Post First Skin Trade
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
          Loading Dinosaur Simulator Trading Hub...
        </div>
      }
    >
      <TradesHubContent />
    </Suspense>
  );
}
