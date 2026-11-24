'use client';

import React, { useState, useEffect } from 'react';
import { Item } from '@/lib/types';
import { getItems } from '@/lib/queries/items';
import { createListing, calculateWfl } from '@/lib/queries/trades';
import { getCurrentUserProfile } from '@/lib/queries/profiles';
import { RarityBadge, WflBadge, formatPoints } from './Badge';
import { PlusCircle, X, Sparkles, AlertCircle, Scale, Check } from 'lucide-react';
import Link from 'next/link';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: () => void;
  initialItemId?: string;
}

export function CreateListingModal({
  isOpen,
  onClose,
  onListingCreated,
  initialItemId,
}: CreateListingModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [offeredSkinIds, setOfferedSkinIds] = useState<string[]>([]);
  const [lookingForSkinIds, setLookingForSkinIds] = useState<string[]>([]);
  const [lookingForType, setLookingForType] = useState<'specific' | 'any'>('specific');
  const [requestedWishlist, setRequestedWishlist] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getItems().then(fetched => {
      setItems(fetched);
      if (initialItemId && !offeredSkinIds.includes(initialItemId)) {
        setOfferedSkinIds([initialItemId]);
      } else if (offeredSkinIds.length === 0 && fetched.length > 0) {
        setOfferedSkinIds([fetched[0].id]);
      }
    });
    getCurrentUserProfile().then(p => setUser(p));
  }, [initialItemId]);

  if (!isOpen) return null;

  const offeredSkins = items.filter(i => offeredSkinIds.includes(i.id));
  const offeredTotal = offeredSkins.reduce((sum, s) => sum + s.current_value, 0);

  const lookingForSkins = items.filter(i => lookingForSkinIds.includes(i.id));
  const lookingForTotal = lookingForSkins.reduce((sum, s) => sum + s.current_value, 0);

  // W/F/L for a respondent taking this trade (giving lookingFor, receiving offered)
  const { verdict, diff } = calculateWfl(lookingForTotal, offeredTotal);

  const toggleOfferedSkin = (id: string) => {
    if (offeredSkinIds.includes(id)) {
      if (offeredSkinIds.length > 1) {
        setOfferedSkinIds(offeredSkinIds.filter(s => s !== id));
      }
    } else {
      setOfferedSkinIds([...offeredSkinIds, id]);
    }
  };

  const toggleLookingForSkin = (id: string) => {
    if (lookingForSkinIds.includes(id)) {
      setLookingForSkinIds(lookingForSkinIds.filter(s => s !== id));
    } else {
      setLookingForSkinIds([...lookingForSkinIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to publish trade listings.');
      return;
    }

    if (offeredSkinIds.length === 0) {
      setError('Please select at least 1 skin you are offering.');
      return;
    }

    if (lookingForType === 'specific' && lookingForSkinIds.length === 0) {
      setError('Please select target skins you are looking for, or choose "Open to Offers".');
      return;
    }

    try {
      setLoading(true);
      await createListing({
        user_id: user.id,
        item_id: offeredSkinIds[0],
        offered_skin_ids: offeredSkinIds,
        looking_for_skin_ids: lookingForType === 'specific' ? lookingForSkinIds : [],
        looking_for_type: lookingForType,
        requested_items: requestedWishlist.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onListingCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish skin trade listing';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Post Skin-for-Skin Trade</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center justify-between">
              <span>You must be signed in to post trade listings.</span>
              <Link href="/login" className="px-3 py-1 bg-amber-500 text-zinc-950 font-bold rounded-lg">
                Sign In
              </Link>
            </div>
          )}

          {/* Trade Balance Preview */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Live Trade Value Balance (W/F/L):
              </span>
              <WflBadge
                verdict={lookingForType === 'any' ? 'open' : verdict}
                diff={lookingForType === 'any' ? undefined : diff}
                size="md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80 text-xs font-mono">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-emerald-900/40">
                <span className="text-emerald-400 block text-[11px] font-bold">Your Offered Skins Value:</span>
                <span className="font-extrabold text-white text-base">
                  {offeredTotal.toLocaleString()} Pts
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {offeredSkins.length} skin(s) selected
                </span>
              </div>

              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-cyan-900/40">
                <span className="text-cyan-400 block text-[11px] font-bold">Requested Skins Value:</span>
                <span className="font-extrabold text-white text-base">
                  {lookingForType === 'any' ? 'Open Offers' : `${lookingForTotal.toLocaleString()} Pts`}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {lookingForType === 'any' ? 'Any fair offer' : `${lookingForSkins.length} skin(s) targeted`}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Select Offered Skins */}
          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
              1. Skins You Are Offering (Click to select multiple)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 border border-zinc-800 rounded-2xl bg-zinc-950/80">
              {items.map(skin => {
                const isSelected = offeredSkinIds.includes(skin.id);
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => toggleOfferedSkin(skin.id)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="flex items-center gap-1">
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

          {/* 2. Looking For Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider">
                2. Skins You Are Looking For
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLookingForType('specific')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    lookingForType === 'specific' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Specific Skins
                </button>
                <button
                  type="button"
                  onClick={() => setLookingForType('any')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    lookingForType === 'any' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Open to Offers
                </button>
              </div>
            </div>

            {lookingForType === 'specific' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 border border-zinc-800 rounded-2xl bg-zinc-950/80">
                {items.map(skin => {
                  const isSelected = lookingForSkinIds.includes(skin.id);
                  return (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => toggleLookingForSkin(skin.id)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-zinc-400">[{skin.base_dinosaur}]</span>
                          <RarityBadge rarity={skin.rarity} size="sm" />
                        </div>
                        <h5 className="font-bold text-xs text-white truncate mt-0.5">{skin.name}</h5>
                        <span className="font-mono text-xs text-cyan-400 font-bold">
                          {skin.current_value.toLocaleString()} Pts
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-cyan-500 border-cyan-400 text-zinc-950' : 'border-zinc-700 bg-zinc-950'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={requestedWishlist}
                onChange={e => setRequestedWishlist(e.target.value)}
                placeholder="Describe your wishlist (e.g. Any fair limiteds or plushies around 40K Pts)..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:outline-none text-white text-sm"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Trader Notes / Roblox Server Info
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Active on DS right now, add my Roblox user to trade..."
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
            disabled={loading || offeredSkinIds.length === 0 || !user}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : 'Publish Skin Trade'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
