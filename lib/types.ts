export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type ItemCategory =
  | 'Limited'
  | 'Event'
  | 'Albino / Melanistic'
  | 'Golden / Diamond'
  | 'Plush / Toy'
  | 'Gamepass / Robux'
  | 'Obtainable / Shop';

export type DemandRating = 'Low' | 'Medium' | 'High' | 'Extreme';
export type PriceTrend = 'up' | 'down' | 'stable';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  reputation: number;
  is_admin?: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  base_dinosaur: string;
  category: ItemCategory;
  rarity: ItemRarity;
  image_url?: string;
  description?: string;
  base_value: number; // in Points
  current_value: number; // in Points
  demand_rating: DemandRating;
  trend: PriceTrend;
  trade_count: number;
  last_traded_at?: string;
  created_at: string;
}

export type WflVerdict = 'win' | 'fair' | 'loss' | 'open';

export interface TradeListing {
  id: string;
  user_id: string;
  item_id: string;
  listing_type: 'sell' | 'buy';
  item_quantity: number;
  requested_price?: number;
  requested_items?: string;
  offered_skin_ids?: string[];
  offered_skins?: Item[];
  looking_for_skin_ids?: string[];
  looking_for_skins?: Item[];
  looking_for_type?: 'specific' | 'any';
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations:
  item?: Item;
  user?: Profile;
  offers_count?: number;
  // Computed values:
  offered_total_value?: number;
  looking_for_total_value?: number;
  wfl_verdict?: WflVerdict;
  wfl_diff?: number;
}

export interface TradeOffer {
  id: string;
  listing_id: string;
  offerer_id: string;
  offered_price?: number; // total calculated point value of offered skins
  offered_items?: string;
  offered_skin_ids?: string[];
  offered_skins?: Item[];
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at?: string;
  // Relations:
  offerer?: Profile;
  listing?: TradeListing;
  // Computed values:
  offered_total_value?: number;
  wfl_verdict?: WflVerdict;
  wfl_diff?: number;
}

export interface CompletedTradeRecord {
  id: string;
  listing_id: string;
  item_id: string;
  item_name: string;
  base_dinosaur?: string;
  item_rarity: ItemRarity;
  item_category: ItemCategory;
  item_image?: string;
  seller_username: string;
  buyer_username: string;
  settled_price: number; // in Points
  offered_items?: string;
  settled_at: string;
  previous_item_value: number;
  new_item_value: number;
  value_change_percent: number;
}
