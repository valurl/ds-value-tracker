import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Item, ItemCategory, ItemRarity } from '@/lib/types';
import { INITIAL_ITEMS } from '@/lib/demoStore';

const STORAGE_KEY = 'ds_items_cache';

function getLocalItems(): Item[] {
  if (typeof window === 'undefined') return INITIAL_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ITEMS;
  }
}

export function saveLocalItems(items: Item[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items to local storage:', e);
  }
}

export async function getItems(): Promise<Item[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('current_value', { ascending: false });

    if (error) {
      console.error('Supabase getItems error:', error);
      return getLocalItems();
    }
    return data || [];
  }

  return getLocalItems();
}

export async function getItemById(id: string): Promise<Item | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase getItemById error:', error);
      return getLocalItems().find(item => item.id === id) || null;
    }
    return data;
  }

  return getLocalItems().find(item => item.id === id) || null;
}

export async function updateItemValue(
  id: string,
  newValue: number,
  newTrend: 'up' | 'down' | 'stable'
): Promise<Item | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('items')
      .update({
        current_value: newValue,
        trend: newTrend,
        last_traded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateItemValue error:', error);
    } else if (data) {
      return data;
    }
  }

  // Local fallback
  const items = getLocalItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = {
      ...items[idx],
      current_value: newValue,
      trend: newTrend,
      trade_count: items[idx].trade_count + 1,
      last_traded_at: new Date().toISOString()
    };
    saveLocalItems(items);
    return items[idx];
  }
  return null;
}

export interface ItemFilterOptions {
  search?: string;
  category?: ItemCategory | 'All';
  rarity?: ItemRarity | 'All';
  sortBy?: 'value_desc' | 'value_asc' | 'demand' | 'trades' | 'name';
}

export function filterAndSortItems(items: Item[], options: ItemFilterOptions): Item[] {
  let filtered = [...items];

  if (options.search?.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.rarity.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }

  if (options.category && options.category !== 'All') {
    filtered = filtered.filter(item => item.category === options.category);
  }

  if (options.rarity && options.rarity !== 'All') {
    filtered = filtered.filter(item => item.rarity === options.rarity);
  }

  switch (options.sortBy) {
    case 'value_desc':
      filtered.sort((a, b) => b.current_value - a.current_value);
      break;
    case 'value_asc':
      filtered.sort((a, b) => a.current_value - b.current_value);
      break;
    case 'trades':
      filtered.sort((a, b) => b.trade_count - a.trade_count);
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'demand': {
      const rank: Record<string, number> = { Extreme: 4, High: 3, Medium: 2, Low: 1 };
      filtered.sort((a, b) => (rank[b.demand_rating] || 0) - (rank[a.demand_rating] || 0));
      break;
    }
    default:
      filtered.sort((a, b) => b.current_value - a.current_value);
  }

  return filtered;
}
