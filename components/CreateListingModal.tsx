'use client';

import React, { useState, useEffect } from 'react';
import { Item } from '@/lib/types';
import { getItems } from '@/lib/queries/items';
import { createListing } from '@/lib/queries/trades';
import { getDemoCurrentUser } from '@/lib/queries/profiles';
import { PlusCircle, X, Coins, AlertCircle } from 'lucide-react';

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
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || '');
  const [listingType, setListingType] = useState<'sell' | 'buy'>('sell');
  const [quantity, setQuantity] = useState<number>(1);
  const [requestedPrice, setRequestedPrice] = useState<string>('');
  const [requestedItems, setRequestedItems] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItems().then(fetched => {
      setItems(fetched);
      if (initialItemId && !selectedItemId) {
        setSelectedItemId(initialItemId);
      } else if (!selectedItemId && fetched.length > 0) {
        setSelectedItemId(fetched[0].id);
      }
    });
  }, [initialItemId, selectedItemId]);

  const selectedItem = items.find(i => i.id === selectedItemId);

  // Auto-populate asking price with current rolling median value if empty
  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const item = items.find(i => i.id === id);
    if (item && !requestedPrice) {
      setRequestedPrice(item.current_value.toString());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedItemId) {
      setError('Please select an item to list.');
      return;
    }

    const priceNum = requestedPrice ? parseFloat(requestedPrice) : undefined;
    if ((priceNum === undefined || isNaN(priceNum) || priceNum <= 0) && !requestedItems.trim()) {
      setError('Please specify either an asking gold price or barter item requests.');
      return;
    }

    try {
      setLoading(true);
      const currentUser = getDemoCurrentUser();

      await createListing({
        user_id: currentUser.id,
        item_id: selectedItemId,
        listing_type: listingType,
        item_quantity: quantity || 1,
        requested_price: priceNum,
        requested_items: requestedItems.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onListingCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-lg">Post New Trade Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Listing Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setListingType('sell')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  listingType === 'sell'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                WTS (Want To Sell)
              </button>
              <button
                type="button"
                onClick={() => setListingType('buy')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  listingType === 'buy'
                    ? 'bg-cyan-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                WTB (Want To Buy)
              </button>
            </div>

            {/* Select Item */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Target Item
              </label>
              <select
                value={selectedItemId}
                onChange={e => handleItemSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.rarity}] {item.name} ({item.current_value.toLocaleString()} G)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected item preview */}
            {selectedItem && (
              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-400">Current Market Median Value:</span>
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  {selectedItem.current_value.toLocaleString()} G
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>

              {/* Asking Price */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Asking Price (Gold)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={requestedPrice}
                  onChange={e => setRequestedPrice(e.target.value)}
                  placeholder="e.g. 8950"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Wishlist / Barter items */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Barter Items / Wishlist (Optional)
              </label>
              <input
                type="text"
                value={requestedItems}
                onChange={e => setRequestedItems(e.target.value)}
                placeholder="e.g. Chrono Shard + 1,000 Gold or Titanium"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Listing Notes & Details
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Mention enchants, durability, server location, or preferred trade hours..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm resize-none"
              />
            </div>

            {/* Actions */}
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
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? 'Publishing...' : 'Publish Listing'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
