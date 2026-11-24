'use client';

import React, { useState, useEffect } from 'react';
import { TradeListing, TradeOffer, Profile } from '@/lib/types';
import { RarityBadge } from './Badge';
import { getOffersForListing, acceptOffer, rejectOffer } from '@/lib/queries/offers';
import { cancelListing } from '@/lib/queries/trades';
import {
  Coins,
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

  const isOwner = currentUser?.id === listing.user_id;

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
  const acceptedOffer = offers.find(o => o.status === 'accepted');

  const handleAcceptOffer = async (offer: TradeOffer) => {
    if (!currentUser) return;
    try {
      setActionLoading(offer.id);
      const res = await acceptOffer(offer.id, listing.id, currentUser.id);
      if (res.success && onOfferAcceptedNotice) {
        onOfferAcceptedNotice({
          itemName: listing.item?.name || 'Item',
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

  // Compare asking price to market median value
  const marketVal = listing.item?.current_value || 0;
  const askingPrice = listing.requested_price || 0;
  const priceDiff = askingPrice - marketVal;
  const pricePct = marketVal > 0 ? (priceDiff / marketVal) * 100 : 0;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-zinc-700">
      <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-5">
        {/* Item Thumbnail & Basic Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 overflow-hidden">
            {listing.item?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.item.image_url}
                alt={listing.item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Package className="w-8 h-8" />
              </div>
            )}
            {listing.item_quantity > 1 && (
              <span className="absolute bottom-1 right-1 bg-zinc-900/90 text-zinc-200 text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                x{listing.item_quantity}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {listing.item?.rarity && <RarityBadge rarity={listing.item.rarity} size="sm" />}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  listing.listing_type === 'sell'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {listing.listing_type === 'sell' ? 'WTS' : 'WTB'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {listing.item?.category}
              </span>
            </div>

            <h3 className="font-bold text-white text-base sm:text-lg truncate">
              {listing.item?.name || 'Unnamed Item'}
            </h3>

            {/* Poster profile */}
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${listing.user_id}`}
                alt={listing.user?.username || 'Trader'}
                className="w-5 h-5 rounded-full border border-zinc-700"
              />
              <span className="text-zinc-200 font-medium">@{listing.user?.username || 'Trader'}</span>
              <span className="text-zinc-400 flex items-center gap-0.5 font-mono">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Rep: {listing.user?.reputation ?? 100}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Notes / Wishlist */}
            {(listing.requested_items || listing.notes) && (
              <div className="mt-3 text-xs bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 space-y-1">
                {listing.requested_items && (
                  <p className="text-cyan-300">
                    <strong>Wishlist/Barter:</strong> {listing.requested_items}
                  </p>
                )}
                {listing.notes && (
                  <p className="text-zinc-400 italic">&ldquo;{listing.notes}&rdquo;</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Offer Actions */}
        <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-zinc-800/80 pt-4 md:pt-0 md:pl-6 shrink-0 md:w-64 space-y-3">
          <div>
            <div className="text-xs text-zinc-400 font-mono md:text-right">Asking Price:</div>
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xl md:justify-end">
              <Coins className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <span>{listing.requested_price ? listing.requested_price.toLocaleString() : 'Open Barter'}</span>
              {listing.requested_price && <span className="text-xs text-zinc-400 font-mono">G</span>}
            </div>

            {listing.requested_price && marketVal > 0 && (
              <div className="text-[11px] font-mono md:text-right text-zinc-400">
                Market: {marketVal.toLocaleString()} G (
                <span className={priceDiff > 0 ? 'text-amber-400' : priceDiff < 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                  {priceDiff > 0 ? '+' : ''}{pricePct.toFixed(1)}%
                </span>
                )
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="w-full space-y-2">
            {listing.status === 'completed' ? (
              <div className="w-full py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Trade Completed</span>
              </div>
            ) : listing.status === 'cancelled' ? (
              <div className="w-full py-2 px-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Ban className="w-4 h-4" />
                <span>Listing Cancelled</span>
              </div>
            ) : isOwner ? (
              <div className="space-y-2 w-full">
                <button
                  onClick={() => setShowOffers(!showOffers)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    Offers ({pendingOffers.length} Pending)
                  </span>
                  {showOffers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleCancelListing}
                  className="w-full text-center text-xs text-rose-400 hover:text-rose-300 transition-colors py-1"
                >
                  Cancel Listing
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenOfferModal(listing)}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Make Trade Offer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Owner Offers Drawer */}
      {isOwner && showOffers && (
        <div className="border-t border-zinc-800 bg-zinc-950/70 p-5 space-y-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>Incoming Offers</span>
            <span className="text-amber-400 font-mono text-[11px]">
              Only you (the seller) can accept offers
            </span>
          </h4>

          {offers.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center italic">
              No offers received yet for this listing.
            </p>
          ) : (
            <div className="space-y-2.5">
              {offers.map(offer => {
                const isPending = offer.status === 'pending';
                const isAccepted = offer.status === 'accepted';
                const isRejected = offer.status === 'rejected';

                return (
                  <div
                    key={offer.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isAccepted
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                        : isRejected
                        ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400 opacity-60'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          @{offer.offerer?.username || 'Trader'}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Rep: {offer.offerer?.reputation ?? 100}
                        </span>
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

                      <div className="flex items-center gap-3 text-xs">
                        {offer.offered_price && (
                          <span className="text-amber-400 font-bold font-mono flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            {offer.offered_price.toLocaleString()} G
                          </span>
                        )}
                        {offer.offered_items && (
                          <span className="text-cyan-300">
                            + {offer.offered_items}
                          </span>
                        )}
                      </div>

                      {offer.notes && (
                        <p className="text-[11px] text-zinc-400 italic">
                          &ldquo;{offer.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Owner Action Buttons (Accept / Reject) */}
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          disabled={actionLoading === offer.id}
                          onClick={() => handleAcceptOffer(offer)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Offer</span>
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
