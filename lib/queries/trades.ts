import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TradeListing, CompletedTradeRecord } from '@/lib/types';
import { INITIAL_LISTINGS, INITIAL_COMPLETED_TRADES, INITIAL_PROFILES } from '@/lib/demoStore';
import { getItems } from './items';

const LISTINGS_STORAGE_KEY = 'ds_trade_listings_cache';
const COMPLETED_STORAGE_KEY = 'ds_completed_trades_cache';

export function getLocalListings(): TradeListing[] {
  if (typeof window === 'undefined') return INITIAL_LISTINGS;
  try {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(INITIAL_LISTINGS));
      return INITIAL_LISTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LISTINGS;
  }
}

export function saveLocalListings(listings: TradeListing[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
  } catch (e) {
    console.error('Failed to save listings locally:', e);
  }
}

export function getLocalCompletedTrades(): CompletedTradeRecord[] {
  if (typeof window === 'undefined') return INITIAL_COMPLETED_TRADES;
  try {
    const raw = localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(INITIAL_COMPLETED_TRADES));
      return INITIAL_COMPLETED_TRADES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMPLETED_TRADES;
  }
}

export function saveLocalCompletedTrades(trades: CompletedTradeRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save completed trades locally:', e);
  }
}

export async function getActiveListings(): Promise<TradeListing[]> {
  const items = await getItems();

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trade_listings')
      .select(`
        *,
        item:items(*),
        user:profiles(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getActiveListings error:', error);
      return attachListingRelations(getLocalListings().filter(l => l.status === 'active'), items);
    }

    return (data as TradeListing[]) || [];
  }

  return attachListingRelations(getLocalListings().filter(l => l.status === 'active'), items);
}

export async function getCompletedTrades(): Promise<CompletedTradeRecord[]> {
  if (isSupabaseConfigured()) {
    // In Supabase, completed trades can be queried from accepted offers + listings
    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        id,
        listing_id,
        offered_price,
        offered_items,
        responded_at,
        created_at,
        listing:trade_listings(
          id,
          requested_price,
          user:profiles!trade_listings_user_id_fkey(username),
          item:items(*)
        ),
        offerer:profiles!trade_offers_offerer_id_fkey(username)
      `)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false });

    if (error || !data) {
      console.error('Supabase getCompletedTrades error, using fallback:', error);
      return getLocalCompletedTrades();
    }

    // Map to CompletedTradeRecord format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: CompletedTradeRecord[] = data.map((d: any) => {
      const price = d.offered_price ?? d.listing?.requested_price ?? 0;
      const currentVal = d.listing?.item?.current_value ?? price;
      const baseVal = d.listing?.item?.base_value ?? price;
      const diff = currentVal - baseVal;
      const pct = baseVal > 0 ? (diff / baseVal) * 100 : 0;

      return {
        id: d.id,
        listing_id: d.listing_id,
        item_id: d.listing?.item?.id || '',
        item_name: d.listing?.item?.name || 'Unknown Item',
        item_rarity: d.listing?.item?.rarity || 'Common',
        item_category: d.listing?.item?.category || 'Weapon',
        item_image: d.listing?.item?.image_url,
        seller_username: d.listing?.user?.username || 'Trader',
        buyer_username: d.offerer?.username || 'Buyer',
        settled_price: price,
        offered_items: d.offered_items,
        settled_at: d.responded_at || d.created_at,
        previous_item_value: baseVal,
        new_item_value: currentVal,
        value_change_percent: Math.round(pct * 10) / 10,
      };
    });

    if (records.length > 0) return records;
    return getLocalCompletedTrades();
  }

  return getLocalCompletedTrades();
}

export async function createListing(payload: {
  user_id: string;
  item_id: string;
  listing_type: 'sell' | 'buy';
  item_quantity: number;
  requested_price?: number;
  requested_items?: string;
  notes?: string;
}): Promise<TradeListing> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trade_listings')
      .insert({
        ...payload,
        status: 'active',
      })
      .select(`
        *,
        item:items(*),
        user:profiles(*)
      `)
      .single();

    if (error) {
      console.error('Supabase createListing error:', error);
      throw error;
    }
    return data;
  }

  // Local storage creation
  const items = await getItems();
  const listings = getLocalListings();
  const newListing: TradeListing = {
    id: 'listing-' + Date.now(),
    user_id: payload.user_id,
    item_id: payload.item_id,
    listing_type: payload.listing_type,
    item_quantity: payload.item_quantity || 1,
    requested_price: payload.requested_price,
    requested_items: payload.requested_items,
    notes: payload.notes,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newListing, ...listings];
  saveLocalListings(updated);

  const [attached] = attachListingRelations([newListing], items);
  return attached;
}

export async function cancelListing(listingId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('trade_listings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase cancelListing error:', error);
      return false;
    }
    return true;
  }

  const listings = getLocalListings();
  const idx = listings.findIndex(l => l.id === listingId && l.user_id === userId);
  if (idx !== -1) {
    listings[idx].status = 'cancelled';
    listings[idx].updated_at = new Date().toISOString();
    saveLocalListings(listings);
    return true;
  }
  return false;
}

// Relation helper
function attachListingRelations(listings: TradeListing[], items: import('@/lib/types').Item[]): TradeListing[] {
  return listings.map(l => {
    const item = items.find(i => i.id === l.item_id);
    const user = INITIAL_PROFILES.find(p => p.id === l.user_id) || {
      id: l.user_id,
      username: 'Trader_' + l.user_id.slice(-4),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${l.user_id}`,
      reputation: 100,
      created_at: new Date().toISOString(),
    };
    return {
      ...l,
      item,
      user,
    };
  });
}
