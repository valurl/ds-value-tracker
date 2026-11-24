'use client';

import React, { useState, useEffect } from 'react';
import { TradeListing, TradeOffer, Profile } from '@/lib/types';
import { RarityBadge, CategoryBadge, WflBadge, formatPoints } from './Badge';
import { getOffersForListing, acceptOffer, rejectOffer } from '@/lib/queries/offers';
import { cancelListing } from '@/lib/queries/trades';
import {
  ArrowRightLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Ban,
  Package,
  Scale,
  Plus,
} from 'lucide-react';

interface TradeListingCardProps {
  listing: TradeListing;
  currentUser: Profile | null;
  onOpenOfferModal: (listing: TradeListing) => void;
  onRefresh: () => void;
  onOfferAcceptedNotice?: (data: {
    itemName: string;
    oldValue: number;
    newValue: number;
    settledPrice: number;
    trend: 'up' | 'down' | 'stable';
  }) => void;
}

export function TradeListingCard({
  listing,
  currentUser,
  onOpenOfferModal,
  onRefresh,
  onOfferAcceptedNotice,
}: TradeListingCardProps) {
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [showOffers, setShowOffers] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOwner = Boolean(currentUser && currentUser.id === listing.user_id);

  const loadOffers = async () => {
    try {
      const data = await getOffersForListing(listing.id);
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers for listing:', err);
    }
  };

  useEffect(() => {
    if (listing.id) {
      loadOffers();
    }
  }, [listing.id]);

  const pendingOffers = offers.filter(o => o.status === 'pending');

  const handleAcceptOffer = async (offer: TradeOffer) => {
    if (!currentUser) return;
    try {
      setActionLoading(offer.id);
      const res = await acceptOffer(offer.id, listing.id, currentUser.id);
      if (res.success && onOfferAcceptedNotice) {
        onOfferAcceptedNotice({
          itemName: listing.item?.name || 'Skin',
          oldValue: res.oldValue,
          newValue: res.newValue,
          settledPrice: res.settledPrice,
          trend: res.trend,
        });
      }
      await loadOffers();
      onRefresh();
    } catch (err) {
      console.error('Failed to accept offer:', err);
      alert(err instanceof Error ? err.message : 'Error accepting offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!currentUser) return;
    try {
      setActionLoading(offerId);
      await rejectOffer(offerId, listing.id, currentUser.id);
      await loadOffers();
      onRefresh();
    } catch (err) {
      console.error('Failed to reject offer:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelListing = async () => {
    if (!currentUser || !confirm('Are you sure you want to cancel this listing?')) return;
    try {
      await cancelListing(listing.id, currentUser.id);
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel listing:', err);
    }
  };

  const offeredSkins = listing.offered_skins || (listing.item ? [listing.item] : []);
  const lookingForSkins = listing.looking_for_skins || [];
  const offeredTotal = listing.offered_total_value || listing.requested_price || 0;
  const lookingForTotal = listing.looking_for_total_value || 0;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg transition-all hover:border-zinc-700">
      {/* Listing Card Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* User Info */}
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${listing.user_id}`}
            alt={listing.user?.username || 'Trader'}
            className="w-6 h-6 rounded-full border border-zinc-700"
          />
          <span className="text-zinc-200 font-bold">@{listing.user?.username || 'DinoTrader'}</span>
          <span className="text-zinc-400 flex items-center gap-1 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Rep: {listing.user?.reputation ?? 100}
          </span>
          <span className="text-zinc-400">•</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
            <Clock className="w-3 h-3" />
            {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Trade Verdict Badge */}
        <div className="flex items-center gap-2">
          {listing.wfl_verdict && (
            <WflBadge verdict={listing.wfl_verdict} diff={listing.wfl_diff} size="sm" />
          )}
          <span className="font-mono text-zinc-400 text-[11px]">
            Skin-for-Skin Swap
          </span>
        </div>
      </div>

      {/* Main Trade Content: Offering vs Looking For */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Side A: OFFERING */}
        <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono uppercase text-emerald-400 tracking-wider">
                Offering Skins:
              </span>
              <span className="font-mono text-xs text-emerald-300 font-bold">
                Total: {formatPoints(offeredTotal)}
              </span>
            </div>

            <div className="space-y-2">
              {offeredSkins.map((skin, idx) => (
                <div
                  key={skin.id + idx}
                  className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-700 shrink-0 overflow-hidden">
                    {skin.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={skin.image_url} alt={skin.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">🦖</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-400">[{skin.base_dinosaur}]</span>
                      <RarityBadge rarity={skin.rarity} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-xs truncate mt-0.5">{skin.name}</h4>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 font-bold shrink-0">
                    {skin.current_value.toLocaleString()} Pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side B: LOOKING FOR */}
        <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono uppercase text-cyan-400 tracking-wider">
                Looking For:
              </span>
              {listing.looking_for_type === 'specific' && lookingForTotal > 0 && (
                <span className="font-mono text-xs text-cyan-300 font-bold">
                  Total: {formatPoints(lookingForTotal)}
                </span>
              )}
            </div>

            {listing.looking_for_type === 'specific' && lookingForSkins.length > 0 ? (
              <div className="space-y-2">
                {lookingForSkins.map((skin, idx) => (
                  <div
                    key={skin.id + idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800"
                  >
                    <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-700 shrink-0 overflow-hidden">
                      {skin.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={skin.image_url} alt={skin.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🦖</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-zinc-400">[{skin.base_dinosaur}]</span>
                        <RarityBadge rarity={skin.rarity} size="sm" />
                      </div>
                      <h4 className="font-bold text-white text-xs truncate mt-0.5">{skin.name}</h4>
                    </div>
                    <span className="font-mono text-xs text-cyan-400 font-bold shrink-0">
                      {skin.current_value.toLocaleString()} Pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 bg-zinc-900/70 rounded-xl border border-dashed border-zinc-700 text-center space-y-1">
                <Scale className="w-6 h-6 text-cyan-400 mx-auto opacity-80" />
                <p className="text-xs font-bold text-white">Open to Fair Skin Offers</p>
                <p className="text-[11px] text-zinc-400">
                  {listing.requested_items || 'Will consider equivalent point value limiteds, events, or plush skins.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes & Actions Footer */}
      <div className="px-5 pb-5 pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {listing.notes ? (
          <p className="text-xs text-zinc-400 italic line-clamp-1 flex-1">
            &ldquo;{listing.notes}&rdquo;
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {listing.status === 'completed' ? (
            <div className="py-2 px-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Skin Swap Completed</span>
            </div>
          ) : listing.status === 'cancelled' ? (
            <div className="py-2 px-4 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center gap-1.5">
              <Ban className="w-4 h-4" />
              <span>Listing Cancelled</span>
            </div>
          ) : isOwner ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowOffers(!showOffers)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Offers ({pendingOffers.length})</span>
                {showOffers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleCancelListing}
                className="text-xs text-rose-400 hover:text-rose-300 py-1 px-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenOfferModal(listing)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Make Skin Offer (W/F/L)</span>
            </button>
          )}
        </div>
      </div>

      {/* Owner Offers Drawer */}
      {isOwner && showOffers && (
        <div className="border-t border-zinc-800 bg-zinc-950/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Incoming Counter-Offers
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">
              Only you can accept offers on your listing
            </span>
          </div>

          {offers.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center italic">
              No skin offers received yet for this listing.
            </p>
          ) : (
            <div className="space-y-3">
              {offers.map(offer => {
                const isPending = offer.status === 'pending';
                const isAccepted = offer.status === 'accepted';
                const isRejected = offer.status === 'rejected';

                return (
                  <div
                    key={offer.id}
                    className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      isAccepted
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : isRejected
                        ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400 opacity-60'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs">
                          @{offer.offerer?.username || 'Trader'}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Rep: {offer.offerer?.reputation ?? 100}
                        </span>
                        {offer.wfl_verdict && (
                          <WflBadge verdict={offer.wfl_verdict} diff={offer.wfl_diff} size="sm" />
                        )}
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                            isAccepted
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : isRejected
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-amber-900/60 text-amber-300'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>

                      {/* Offered Skins Summary */}
                      <div className="text-xs text-zinc-300">
                        <span className="text-zinc-400">Offered Skins: </span>
                        <strong>{offer.offered_items || 'Skins specified in note'}</strong>
                        <span className="ml-2 font-mono text-emerald-400 font-bold">
                          ({offer.offered_total_value?.toLocaleString()} Pts)
                        </span>
                      </div>

                      {offer.notes && (
                        <p className="text-[11px] text-zinc-400 italic">
                          &ldquo;{offer.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Owner Action Buttons */}
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          disabled={actionLoading === offer.id}
                          onClick={() => handleAcceptOffer(offer)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Trade</span>
                        </button>
                        <button
                          disabled={actionLoading === offer.id}
                          onClick={() => handleRejectOffer(offer.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
