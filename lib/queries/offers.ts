import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TradeOffer, CompletedTradeRecord } from '@/lib/types';
import { INITIAL_OFFERS, INITIAL_PROFILES, calculateRollingMedian } from '@/lib/demoStore';
import { getItems, saveLocalItems } from './items';
import {
  getLocalListings,
  saveLocalListings,
  getLocalCompletedTrades,
  saveLocalCompletedTrades,
} from './trades';

const OFFERS_STORAGE_KEY = 'ds_trade_offers_cache';

export function getLocalOffers(): TradeOffer[] {
  if (typeof window === 'undefined') return INITIAL_OFFERS;
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(INITIAL_OFFERS));
      return INITIAL_OFFERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_OFFERS;
  }
}

export function saveLocalOffers(offers: TradeOffer[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (e) {
    console.error('Failed to save offers locally:', e);
  }
}

export async function getOffersForListing(listingId: string): Promise<TradeOffer[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        offerer:profiles(*)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getOffersForListing error:', error);
      return attachOfferProfiles(getLocalOffers().filter(o => o.listing_id === listingId));
    }
    return (data as TradeOffer[]) || [];
  }

  return attachOfferProfiles(getLocalOffers().filter(o => o.listing_id === listingId));
}

export async function createOffer(payload: {
  listing_id: string;
  offerer_id: string;
  offered_price?: number;
  offered_items?: string;
  notes?: string;
}): Promise<TradeOffer> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trade_offers')
      .insert({
        ...payload,
        status: 'pending',
      })
      .select(`
        *,
        offerer:profiles(*)
      `)
      .single();

    if (error) {
      console.error('Supabase createOffer error:', error);
      throw error;
    }
    return data;
  }

  // Local storage creation
  const offers = getLocalOffers();
  const newOffer: TradeOffer = {
    id: 'offer-' + Date.now(),
    listing_id: payload.listing_id,
    offerer_id: payload.offerer_id,
    offered_price: payload.offered_price,
    offered_items: payload.offered_items,
    notes: payload.notes,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const updated = [newOffer, ...offers];
  saveLocalOffers(updated);

  const [attached] = attachOfferProfiles([newOffer]);
  return attached;
}

/**
 * Accept an offer:
 * 1. Checks that caller is the listing owner (RLS rule in Supabase, and verified locally).
 * 2. Marks the offer as 'accepted'.
 * 3. Marks the listing as 'completed'.
 * 4. Rejects other pending offers on the same listing.
 * 5. Triggers rolling median calculation to update item's current_value without single-trade manipulation.
 */
export async function acceptOffer(
  offerId: string,
  listingId: string,
  callerUserId: string
): Promise<{
  success: boolean;
  oldValue: number;
  newValue: number;
  trend: 'up' | 'down' | 'stable';
  settledPrice: number;
}> {
  if (isSupabaseConfigured()) {
    // In Supabase, updating the offer's status to 'accepted' triggers the DB function `on_trade_offer_accepted`
    // which calculates rolling median, completes listing, rejects others, and updates item value atomically!
    const { data: updatedOffer, error } = await supabase
      .from('trade_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .eq('listing_id', listingId)
      .select('*, listing:trade_listings(*, item:items(*))')
      .single();

    if (error) {
      console.error('Supabase acceptOffer error:', error);
      throw error;
    }

    // Refresh updated item data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemData = (updatedOffer as any)?.listing?.item;
    return {
      success: true,
      oldValue: itemData?.base_value || 0,
      newValue: itemData?.current_value || 0,
      trend: itemData?.trend || 'stable',
      settledPrice: updatedOffer.offered_price || 0,
    };
  }

  // Local calculation & verification
  const listings = getLocalListings();
  const listing = listings.find(l => l.id === listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  // Strict ownership check
  if (listing.user_id !== callerUserId) {
    throw new Error('Unauthorized: Only the listing owner can accept offers.');
  }

  const offers = getLocalOffers();
  const targetOfferIndex = offers.findIndex(o => o.id === offerId && o.listing_id === listingId);
  if (targetOfferIndex === -1) {
    throw new Error('Offer not found');
  }

  const targetOffer = offers[targetOfferIndex];
  const settledPrice = targetOffer.offered_price || listing.requested_price || 0;

  // 1. Mark target offer accepted
  offers[targetOfferIndex] = {
    ...targetOffer,
    status: 'accepted',
    responded_at: new Date().toISOString(),
  };

  // 2. Reject other offers for this listing
  offers.forEach((o, i) => {
    if (o.listing_id === listingId && o.id !== offerId && o.status === 'pending') {
      offers[i] = {
        ...o,
        status: 'rejected',
        responded_at: new Date().toISOString(),
      };
    }
  });
  saveLocalOffers(offers);

  // 3. Mark listing completed
  const listingIndex = listings.findIndex(l => l.id === listingId);
  if (listingIndex !== -1) {
    listings[listingIndex] = {
      ...listings[listingIndex],
      status: 'completed',
      updated_at: new Date().toISOString(),
    };
    saveLocalListings(listings);
  }

  // 4. Update Item Rolling Median
  const items = await getItems();
  const itemIndex = items.findIndex(i => i.id === listing.item_id);
  let oldValue = 0;
  let newValue = 0;
  let newTrend: 'up' | 'down' | 'stable' = 'stable';

  if (itemIndex !== -1) {
    const item = items[itemIndex];
    oldValue = item.current_value;

    // Fetch all historical accepted trade prices for this item
    const completedTrades = getLocalCompletedTrades();
    const itemHistoricalPrices = completedTrades
      .filter(t => t.item_id === item.id)
      .map(t => t.settled_price);

    // Add this new trade to the price history
    const allRecentPrices = [settledPrice, ...itemHistoricalPrices];

    // Compute anti-manipulation rolling median
    newValue = calculateRollingMedian(item.base_value, allRecentPrices);

    if (newValue > oldValue) newTrend = 'up';
    else if (newValue < oldValue) newTrend = 'down';
    else newTrend = 'stable';

    items[itemIndex] = {
      ...item,
      current_value: newValue,
      trend: newTrend,
      trade_count: item.trade_count + 1,
      last_traded_at: new Date().toISOString(),
    };
    saveLocalItems(items);

    // 5. Record to completed trades
    const seller = INITIAL_PROFILES.find(p => p.id === listing.user_id)?.username || 'Seller';
    const buyer = INITIAL_PROFILES.find(p => p.id === targetOffer.offerer_id)?.username || 'Buyer';

    const diffPct = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0;
    const newRecord: CompletedTradeRecord = {
      id: 'comp-' + Date.now(),
      listing_id: listing.id,
      item_id: item.id,
      item_name: item.name,
      item_rarity: item.rarity,
      item_category: item.category,
      item_image: item.image_url,
      seller_username: seller,
      buyer_username: buyer,
      settled_price: settledPrice,
      offered_items: targetOffer.offered_items,
      settled_at: new Date().toISOString(),
      previous_item_value: oldValue,
      new_item_value: newValue,
      value_change_percent: Math.round(diffPct * 10) / 10,
    };

    saveLocalCompletedTrades([newRecord, ...completedTrades]);
  }

  return {
    success: true,
    oldValue,
    newValue,
    trend: newTrend,
    settledPrice,
  };
}

export async function rejectOffer(
  offerId: string,
  listingId: string,
  callerUserId: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('trade_offers')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .eq('listing_id', listingId);

    if (error) {
      console.error('Supabase rejectOffer error:', error);
      return false;
    }
    return true;
  }

  const listings = getLocalListings();
  const listing = listings.find(l => l.id === listingId);
  if (!listing || listing.user_id !== callerUserId) {
    throw new Error('Unauthorized');
  }

  const offers = getLocalOffers();
  const idx = offers.findIndex(o => o.id === offerId && o.listing_id === listingId);
  if (idx !== -1) {
    offers[idx] = {
      ...offers[idx],
      status: 'rejected',
      responded_at: new Date().toISOString(),
    };
    saveLocalOffers(offers);
    return true;
  }
  return false;
}

function attachOfferProfiles(offers: TradeOffer[]): TradeOffer[] {
  return offers.map(o => {
    const offerer = INITIAL_PROFILES.find(p => p.id === o.offerer_id) || {
      id: o.offerer_id,
      username: 'Trader_' + o.offerer_id.slice(-4),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${o.offerer_id}`,
      reputation: 100,
      created_at: new Date().toISOString(),
    };
    return {
      ...o,
      offerer,
    };
  });
}
