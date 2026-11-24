'use client';

import React, { useState } from 'react';
import { TradeListing } from '@/lib/types';
import { createOffer } from '@/lib/queries/offers';
import { getDemoCurrentUser } from '@/lib/queries/profiles';
import { X, Coins, Sparkles, AlertCircle } from 'lucide-react';

interface OfferModalProps {
  listing: TradeListing;
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted: () => void;
}

export function OfferModal({ listing, isOpen, onClose, onOfferSubmitted }: OfferModalProps) {
  const [offeredPrice, setOfferedPrice] = useState<string>(
    listing.requested_price ? listing.requested_price.toString() : ''
  );
  const [offeredItems, setOfferedItems] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = offeredPrice ? parseFloat(offeredPrice) : undefined;
    if ((priceNum === undefined || isNaN(priceNum) || priceNum <= 0) && !offeredItems.trim()) {
      setError('Please provide an offered gold price or barter items.');
      return;
    }

    try {
      setLoading(true);
      const currentUser = getDemoCurrentUser();

      if (currentUser.id === listing.user_id) {
        setError('You cannot make an offer on your own listing.');
        setLoading(false);
        return;
      }

      await createOffer({
        listing_id: listing.id,
        offerer_id: currentUser.id,
        offered_price: priceNum,
        offered_items: offeredItems.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onOfferSubmitted();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit offer';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-lg">Submit Trade Offer</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Snapshot */}
        <div className="p-6 space-y-5">
          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 flex items-center gap-3">
            {listing.item?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.item.image_url}
                alt={listing.item.name}
                className="w-12 h-12 rounded-lg object-cover border border-zinc-700"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{listing.item?.name}</h4>
              <p className="text-xs text-zinc-400">
                Seller: <span className="text-zinc-200">@{listing.user?.username}</span> • Asking:{' '}
                <span className="text-amber-400 font-semibold font-mono">
                  {listing.requested_price ? `${listing.requested_price.toLocaleString()} G` : 'Open Offer'}
                </span>
              </p>
              {listing.requested_items && (
                <p className="text-xs text-cyan-400 mt-0.5 truncate">
                  Wishlist: {listing.requested_items}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Offered Gold */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Offered Gold Value (G)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={offeredPrice}
                  onChange={e => setOfferedPrice(e.target.value)}
                  placeholder="e.g. 8500"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-500 font-mono">GOLD</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Settled trade prices update the item&apos;s rolling median economy value.
              </p>
            </div>

            {/* Offered Barter Items */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Offered Items / Barter Goods (Optional)
              </label>
              <input
                type="text"
                value={offeredItems}
                onChange={e => setOfferedItems(e.target.value)}
                placeholder="e.g. Chrono Shard x1 + 50 Titanium Ingots"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Message to Seller (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Can trade right now at Valoria Plaza..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Send Offer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
