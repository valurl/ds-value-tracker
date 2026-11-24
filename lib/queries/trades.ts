import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TradeListing, CompletedTradeRecord, Item, WflVerdict } from '@/lib/types';
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

// -----------------------------------------------------------------------------
// W/F/L (WIN / FAIR / LOSS) CALCULATION HELPER
// -----------------------------------------------------------------------------
export function calculateWfl(
  givingValue: number,
  receivingValue: number
): { verdict: WflVerdict; diff: number; percent: number } {
  if (givingValue <= 0 || receivingValue <= 0) {
    return { verdict: 'open', diff: 0, percent: 0 };
  }

  const diff = receivingValue - givingValue;
  const percent = (diff / givingValue) * 100;

  let verdict: WflVerdict = 'fair';
  if (percent >= 10) {
    verdict = 'win';
  } else if (percent <= -10) {
    verdict = 'loss';
  } else {
    verdict = 'fair';
  }

  return { verdict, diff, percent: Math.round(percent * 10) / 10 };
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

    return attachListingRelations((data as TradeListing[]) || [], items);
  }

  return attachListingRelations(getLocalListings().filter(l => l.status === 'active'), items);
}

export async function getCompletedTrades(): Promise<CompletedTradeRecord[]> {
  if (isSupabaseConfigured()) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: CompletedTradeRecord[] = data.map((d: any) => {
      const pts = d.offered_price ?? d.listing?.requested_price ?? 0;
      const currentVal = d.listing?.item?.current_value ?? pts;
      const baseVal = d.listing?.item?.base_value ?? pts;
      const diff = currentVal - baseVal;
      const pct = baseVal > 0 ? (diff / baseVal) * 100 : 0;

      return {
        id: d.id,
        listing_id: d.listing_id,
        item_id: d.listing?.item?.id || '',
        item_name: d.listing?.item?.name || 'Unknown Skin',
        base_dinosaur: d.listing?.item?.base_dinosaur || 'Dinosaur',
        item_rarity: d.listing?.item?.rarity || 'Rare',
        item_category: d.listing?.item?.category || 'Limited',
        item_image: d.listing?.item?.image_url,
        seller_username: d.listing?.user?.username || 'Trader',
        buyer_username: d.offerer?.username || 'Buyer',
        settled_price: pts,
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
  offered_skin_ids: string[];
  looking_for_skin_ids: string[];
  looking_for_type: 'specific' | 'any';
  requested_items?: string;
  notes?: string;
}): Promise<TradeListing> {
  const items = await getItems();

  // Calculate offered and requested total Point values
  const offeredSkins = items.filter(i => payload.offered_skin_ids.includes(i.id));
  const offeredTotal = offeredSkins.reduce((sum, s) => sum + s.current_value, 0);

  const lookingForSkins = items.filter(i => payload.looking_for_skin_ids.includes(i.id));
  const lookingForTotal = lookingForSkins.reduce((sum, s) => sum + s.current_value, 0);

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trade_listings')
      .insert({
        user_id: payload.user_id,
        item_id: payload.item_id,
        listing_type: 'sell',
        item_quantity: payload.offered_skin_ids.length || 1,
        offered_skin_ids: payload.offered_skin_ids,
        looking_for_skin_ids: payload.looking_for_skin_ids,
        looking_for_type: payload.looking_for_type,
        requested_price: offeredTotal,
        requested_items: payload.requested_items,
        notes: payload.notes,
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
    return attachListingRelations([data as TradeListing], items)[0];
  }

  // Local storage creation
  const listings = getLocalListings();
  const newListing: TradeListing = {
    id: 'listing-' + Date.now(),
    user_id: payload.user_id,
    item_id: payload.item_id,
    listing_type: 'sell',
    item_quantity: payload.offered_skin_ids.length || 1,
    offered_skin_ids: payload.offered_skin_ids,
    looking_for_skin_ids: payload.looking_for_skin_ids,
    looking_for_type: payload.looking_for_type,
    requested_price: offeredTotal,
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

// -----------------------------------------------------------------------------
// RELATIONS & W/F/L ATTACHMENT
// -----------------------------------------------------------------------------
function attachListingRelations(listings: TradeListing[], items: Item[]): TradeListing[] {
  const profiles = INITIAL_PROFILES;

  return listings.map(l => {
    // Resolve primary item
    const primaryItem = items.find(i => i.id === l.item_id);

    // Resolve multi-skin lists
    const offeredIds = l.offered_skin_ids && l.offered_skin_ids.length > 0
      ? l.offered_skin_ids
      : [l.item_id];

    const offeredSkins = items.filter(i => offeredIds.includes(i.id));
    const offeredTotal = offeredSkins.reduce((acc, s) => acc + s.current_value, 0);

    const lookingForIds = l.looking_for_skin_ids || [];
    const lookingForSkins = items.filter(i => lookingForIds.includes(i.id));
    const lookingForTotal = lookingForSkins.reduce((acc, s) => acc + s.current_value, 0);

    // Calculate W/F/L for a respondent taking this trade (giving lookingFor, receiving offered)
    let verdict: WflVerdict = 'open';
    let diff = 0;

    if (l.looking_for_type === 'specific' && lookingForTotal > 0 && offeredTotal > 0) {
      const wfl = calculateWfl(lookingForTotal, offeredTotal);
      verdict = wfl.verdict;
      diff = wfl.diff;
    }

    const user = l.user || profiles.find(p => p.id === l.user_id) || {
      id: l.user_id,
      username: 'DinoTrader_' + l.user_id.slice(-4),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${l.user_id}`,
      reputation: 100,
      is_admin: false,
      created_at: new Date().toISOString(),
    };

    return {
      ...l,
      item: primaryItem || offeredSkins[0],
      user,
      offered_skin_ids: offeredIds,
      offered_skins: offeredSkins,
      looking_for_skin_ids: lookingForIds,
      looking_for_skins: lookingForSkins,
      offered_total_value: offeredTotal,
      looking_for_total_value: lookingForTotal,
      wfl_verdict: verdict,
      wfl_diff: diff,
    };
  });
}
