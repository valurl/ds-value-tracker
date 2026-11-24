import { Item, TradeListing, TradeOffer, CompletedTradeRecord, Profile } from './types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-001',
    username: 'DragonLord99',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DragonLord',
    reputation: 98,
    created_at: '2026-01-15T12:00:00Z',
  },
  {
    id: 'user-002',
    username: 'MysticTrader',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MysticTrader',
    reputation: 112,
    created_at: '2026-02-10T14:30:00Z',
  },
  {
    id: 'user-003',
    username: 'AstralMerchant',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstralMerchant',
    reputation: 145,
    created_at: '2026-03-01T09:15:00Z',
  },
  {
    id: 'user-demo',
    username: 'HeroTrader_You',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=HeroTrader',
    reputation: 100,
    created_at: '2026-11-20T10:00:00Z',
  },
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-1',
    name: 'Dragon Slayer Greatsword',
    category: 'Weapon',
    rarity: 'Mythic',
    description: 'Forged in dragonfire with an edge that cuts through ancient scales.',
    base_value: 8500,
    current_value: 8950,
    demand_rating: 'Extreme',
    trend: 'up',
    trade_count: 14,
    image_url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'item-2',
    name: 'Aegis of the Astral Void',
    category: 'Armor',
    rarity: 'Legendary',
    description: 'Heavy cosmic shield radiating protective starlight wards.',
    base_value: 5200,
    current_value: 5100,
    demand_rating: 'High',
    trend: 'down',
    trade_count: 8,
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'item-3',
    name: 'Phoenix Feather Cloak',
    category: 'Armor',
    rarity: 'Epic',
    description: 'Grants the wearer sudden bursts of flame step and slow fall.',
    base_value: 2400,
    current_value: 2450,
    demand_rating: 'High',
    trend: 'up',
    trade_count: 22,
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'item-4',
    name: 'Chrono Shard',
    category: 'Artifact',
    rarity: 'Legendary',
    description: 'A crystallized fragment of warped time. Used to rewind enchantments.',
    base_value: 6800,
    current_value: 7150,
    demand_rating: 'Extreme',
    trend: 'up',
    trade_count: 19,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: 'item-5',
    name: 'Shadowstep Daggers',
    category: 'Weapon',
    rarity: 'Rare',
    description: 'Dual daggers laced with nocturnal poison, favored by rogues.',
    base_value: 950,
    current_value: 920,
    demand_rating: 'Medium',
    trend: 'down',
    trade_count: 35,
    image_url: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'item-6',
    name: 'Nebula Drake Horn',
    category: 'Material',
    rarity: 'Epic',
    description: 'Harvested from celestial drakes, a key ingredient for high tier runes.',
    base_value: 1800,
    current_value: 1800,
    demand_rating: 'Medium',
    trend: 'stable',
    trade_count: 11,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-06T00:00:00Z',
  },
  {
    id: 'item-7',
    name: 'Elixir of Infinite Vigor',
    category: 'Consumable',
    rarity: 'Rare',
    description: 'Temporarily boosts stamina recovery by 300% for 20 minutes.',
    base_value: 350,
    current_value: 365,
    demand_rating: 'High',
    trend: 'up',
    trade_count: 48,
    image_url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-07T00:00:00Z',
  },
  {
    id: 'item-8',
    name: 'Spectral Steed Whistle',
    category: 'Mount',
    rarity: 'Mythic',
    description: 'Summons an ethereal mount that traverses both land and open water.',
    base_value: 12500,
    current_value: 12200,
    demand_rating: 'Extreme',
    trend: 'down',
    trade_count: 6,
    image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'item-9',
    name: 'Rune of True Sight',
    category: 'Artifact',
    rarity: 'Epic',
    description: 'Reveals hidden chests, cloaked enemies, and illusionary walls.',
    base_value: 2100,
    current_value: 2150,
    demand_rating: 'Medium',
    trend: 'up',
    trade_count: 16,
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-09T00:00:00Z',
  },
  {
    id: 'item-10',
    name: 'Titanium Ingot Bundle x50',
    category: 'Material',
    rarity: 'Common',
    description: 'Bulk refined metal for guild fortress renovations and weapons.',
    base_value: 450,
    current_value: 450,
    demand_rating: 'Low',
    trend: 'stable',
    trade_count: 64,
    image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-01-10T00:00:00Z',
  },
];

export const INITIAL_LISTINGS: TradeListing[] = [
  {
    id: 'listing-1',
    user_id: 'user-001',
    item_id: 'item-1',
    listing_type: 'sell',
    item_quantity: 1,
    requested_price: 9100,
    requested_items: 'Will also consider Chrono Shard + 2,000 gold',
    notes: 'Max tier durability with dragon flame glow enchant!',
    status: 'active',
    created_at: '2026-11-23T14:00:00Z',
    updated_at: '2026-11-23T14:00:00Z',
  },
  {
    id: 'listing-2',
    user_id: 'user-002',
    item_id: 'item-4',
    listing_type: 'sell',
    item_quantity: 1,
    requested_price: 7200,
    notes: 'Unopened pristine Chrono Shard ready for high-level guild crafting.',
    status: 'active',
    created_at: '2026-11-23T16:20:00Z',
    updated_at: '2026-11-23T16:20:00Z',
  },
  {
    id: 'listing-3',
    user_id: 'user-003',
    item_id: 'item-3',
    listing_type: 'sell',
    item_quantity: 1,
    requested_price: 2450,
    requested_items: 'Looking for Shadowstep Daggers + gold diff',
    notes: 'Fast response, online right now in Valoria Hub.',
    status: 'active',
    created_at: '2026-11-23T18:45:00Z',
    updated_at: '2026-11-23T18:45:00Z',
  },
  {
    id: 'listing-4',
    user_id: 'user-demo',
    item_id: 'item-5',
    listing_type: 'sell',
    item_quantity: 2,
    requested_price: 920,
    notes: 'Selling my twin daggers to buy materials. Open to direct offers!',
    status: 'active',
    created_at: '2026-11-23T19:10:00Z',
    updated_at: '2026-11-23T19:10:00Z',
  },
];

export const INITIAL_OFFERS: TradeOffer[] = [
  {
    id: 'offer-1',
    listing_id: 'listing-1',
    offerer_id: 'user-002',
    offered_price: 8900,
    offered_items: 'Titanium Ingot Bundle x50',
    notes: 'Offering quick cash + materials right now',
    status: 'pending',
    created_at: '2026-11-23T15:10:00Z',
  },
  {
    id: 'offer-2',
    listing_id: 'listing-4',
    offerer_id: 'user-001',
    offered_price: 900,
    notes: 'Can trade immediately',
    status: 'pending',
    created_at: '2026-11-23T19:30:00Z',
  },
];

export const INITIAL_COMPLETED_TRADES: CompletedTradeRecord[] = [
  {
    id: 'comp-1',
    listing_id: 'listing-old-1',
    item_id: 'item-1',
    item_name: 'Dragon Slayer Greatsword',
    item_rarity: 'Mythic',
    item_category: 'Weapon',
    item_image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80',
    seller_username: 'DragonLord99',
    buyer_username: 'MysticTrader',
    settled_price: 8950,
    settled_at: '2026-11-23T12:00:00Z',
    previous_item_value: 8800,
    new_item_value: 8950,
    value_change_percent: 1.7,
  },
  {
    id: 'comp-2',
    listing_id: 'listing-old-2',
    item_id: 'item-8',
    item_name: 'Spectral Steed Whistle',
    item_rarity: 'Mythic',
    item_category: 'Mount',
    item_image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    seller_username: 'AstralMerchant',
    buyer_username: 'HeroTrader_You',
    settled_price: 12200,
    offered_items: 'Chrono Shard + 5,000 Gold',
    settled_at: '2026-11-22T21:40:00Z',
    previous_item_value: 12500,
    new_item_value: 12200,
    value_change_percent: -2.4,
  },
  {
    id: 'comp-3',
    listing_id: 'listing-old-3',
    item_id: 'item-4',
    item_name: 'Chrono Shard',
    item_rarity: 'Legendary',
    item_category: 'Artifact',
    item_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    seller_username: 'MysticTrader',
    buyer_username: 'DragonLord99',
    settled_price: 7150,
    settled_at: '2026-11-22T18:15:00Z',
    previous_item_value: 7000,
    new_item_value: 7150,
    value_change_percent: 2.14,
  },
  {
    id: 'comp-4',
    listing_id: 'listing-old-4',
    item_id: 'item-3',
    item_name: 'Phoenix Feather Cloak',
    item_rarity: 'Epic',
    item_category: 'Armor',
    item_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    seller_username: 'AstralMerchant',
    buyer_username: 'HeroTrader_You',
    settled_price: 2450,
    settled_at: '2026-11-21T14:30:00Z',
    previous_item_value: 2400,
    new_item_value: 2450,
    value_change_percent: 2.08,
  },
];

// Rolling Median Anti-Manipulation Algorithm
export function calculateRollingMedian(
  baseValue: number,
  recentTradePrices: number[]
): number {
  if (recentTradePrices.length === 0) {
    return baseValue;
  }

  let pricesToConsider: number[] = [];

  if (recentTradePrices.length >= 3) {
    // Take up to 10 most recent trades
    pricesToConsider = [...recentTradePrices].slice(0, 10);
  } else {
    // When volume is low (<3 trades), anchor with base_value seeds to prevent 1-trade manipulation
    pricesToConsider = [...recentTradePrices.slice(0, 10), baseValue, baseValue];
  }

  // Sort ascending
  pricesToConsider.sort((a, b) => a - b);

  const n = pricesToConsider.length;
  if (n === 0) return baseValue;

  const mid = Math.floor(n / 2);
  let median: number;
  if (n % 2 !== 0) {
    median = pricesToConsider[mid];
  } else {
    median = (pricesToConsider[mid - 1] + pricesToConsider[mid]) / 2;
  }

  return Math.round(median * 100) / 100;
}
