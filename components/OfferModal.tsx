'use client';

import React, { useState, useEffect } from 'react';
import { TradeListing, Item } from '@/lib/types';
import { getItems } from '@/lib/queries/items';
import { createOffer } from '@/lib/queries/offers';
import { getCurrentUserProfile } from '@/lib/queries/profiles';
import { calculateWfl } from '@/lib/queries/trades';
import { WflBadge, formatPoints, RarityBadge } from './Badge';
import { X, ArrowRightLeft, Sparkles, AlertCircle, Scale, Check } from 'lucide-react';
import Link from 'next/link';

interface OfferModalProps {
  listing: TradeListing;
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted: () => void;
}

export function OfferModal({ listing, isOpen, onClose, onOfferSubmitted }: OfferModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedSkinIds, setSelectedSkinIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getItems().then(fetched => setItems(fetched));
    getCurrentUserProfile().then(p => setUser(p));
  }, []);

  if (!isOpen) return null;

  // Calculate Point Values
  const offeredSkins = items.filter(i => selectedSkinIds.includes(i.id));
  const myOfferedTotal = offeredSkins.reduce((sum, s) => sum + s.current_value, 0);

  // Receiving skins total
  const receivingTotal = listing.offered_total_value || listing.requested_price || 0;

  // W/F/L calculation for the offerer (giving myOfferedTotal, receiving receivingTotal)
  const { verdict, diff, percent } = calculateWfl(myOfferedTotal, receivingTotal);

  const toggleSkinSelection = (id: string) => {
    if (selectedSkinIds.includes(id)) {
      setSelectedSkinIds(selectedSkinIds.filter(s => s !== id));
    } else {
      setSelectedSkinIds([...selectedSkinIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to make trade offers.');
      return;
    }

    if (user.id === listing.user_id) {
      setError('You cannot make an offer on your own trade listing.');
      return;
    }

    if (selectedSkinIds.length === 0) {
      setError('Please select at least 1 skin to offer.');
      return;
    }

    try {
      setLoading(true);
      await createOffer({
        listing_id: listing.id,
        offerer_id: user.id,
        offered_skin_ids: selectedSkinIds,
        notes: notes.trim() || undefined,
      });

      onOfferSubmitted();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit skin offer';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Offer Skins for Trade</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target Listing Target */}
          <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">You Are Bidding On:</span>
              <span className="font-mono text-emerald-400 font-bold">
                Value: {formatPoints(receivingTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(listing.offered_skins || [listing.item]).map((skin, i) => (
                <span
                  key={skin?.id || i}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-medium flex items-center gap-1.5"
                >
                  <span>{skin?.name}</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    ({skin ? formatPoints(skin.current_value) : ''})
                  </span>
                </span>
              ))}
            </div>
            {listing.requested_items && (
              <p className="text-xs text-cyan-400 pt-1 border-t border-zinc-800/60">
                Seller Wishlist: {listing.requested_items}
              </p>
            )}
          </div>

          {/* Live W/F/L Calculation Box */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Trade Balance (W/F/L):
              </span>
              <WflBadge verdict={verdict} diff={diff} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
              <div className="bg-zinc-900/60 p-2 rounded-xl">
                <span className="text-zinc-400 block text-[11px]">You Give (Skins):</span>
                <span className="font-bold text-white text-sm">
                  {myOfferedTotal.toLocaleString()} Pts
                </span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded-xl">
                <span className="text-zinc-400 block text-[11px]">You Receive (Skins):</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {receivingTotal.toLocaleString()} Pts
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center justify-between">
              <span>Sign in with your trader account to submit offers.</span>
              <Link href="/login" className="px-3 py-1 bg-amber-500 text-zinc-950 font-bold rounded-lg">
                Sign In
              </Link>
            </div>
          )}

          {/* Select Skins to Offer */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Select Skins to Offer ({selectedSkinIds.length} selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-zinc-800 rounded-2xl bg-zinc-950/80">
              {items.map(skin => {
                const isSelected = selectedSkinIds.includes(skin.id);
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => toggleSkinSelection(skin.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-zinc-400">[{skin.base_dinosaur}]</span>
                        <RarityBadge rarity={skin.rarity} size="sm" />
                      </div>
                      <h5 className="font-bold text-xs text-white truncate mt-0.5">{skin.name}</h5>
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        {skin.current_value.toLocaleString()} Pts
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-zinc-950' : 'border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
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
              placeholder="e.g. Willing to add smaller event skin if needed..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 px-6 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || selectedSkinIds.length === 0 || !user}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Send Skin Offer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
