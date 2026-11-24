export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
export type ItemCategory = 'Weapon' | 'Armor' | 'Artifact' | 'Consumable' | 'Mount' | 'Material';
export type DemandRating = 'Low' | 'Medium' | 'High' | 'Extreme';
export type PriceTrend = 'up' | 'down' | 'stable';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  reputation: number;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  image_url?: string;
  description?: string;
  base_value: number;
  current_value: number;
  demand_rating: DemandRating;
  trend: PriceTrend;
  trade_count: number;
  last_traded_at?: string;
  created_at: string;
}

export interface TradeListing {
  id: string;
  user_id: string;
  item_id: string;
  listing_type: 'sell' | 'buy';
  item_quantity: number;
  requested_price?: number;
  requested_items?: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined relation fields:
  item?: Item;
  user?: Profile;
  offers_count?: number;
}

export interface TradeOffer {
  id: string;
  listing_id: string;
  offerer_id: string;
  offered_price?: number;
  offered_items?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at?: string;
  // Joined relation fields:
  offerer?: Profile;
  listing?: TradeListing;
}

export interface CompletedTradeRecord {
  id: string;
  listing_id: string;
  item_id: string;
  item_name: string;
  item_rarity: ItemRarity;
  item_category: ItemCategory;
  item_image?: string;
  seller_username: string;
  buyer_username: string;
  settled_price: number;
  offered_items?: string;
  settled_at: string;
  previous_item_value: number;
  new_item_value: number;
  value_change_percent: number;
}
