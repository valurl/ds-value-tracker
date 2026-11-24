-- ==============================================================================
-- Game Economy & Item Value Tracker Database Schema
-- Fully compatible and idempotent for Supabase Postgres
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Public user profiles linked to Supabase Auth)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  reputation integer default 100 check (reputation >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger to create profile upon new Supabase user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. ITEMS TABLE (Game items with tracked economic values)
-- ------------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null, -- 'Weapon', 'Armor', 'Artifact', 'Consumable', 'Mount', 'Material'
  rarity text not null,   -- 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'
  image_url text,
  description text,
  base_value numeric(12, 2) not null check (base_value >= 0),
  current_value numeric(12, 2) not null check (current_value >= 0),
  demand_rating text default 'Medium' check (demand_rating in ('Low', 'Medium', 'High', 'Extreme')),
  trend text default 'stable' check (trend in ('up', 'down', 'stable')),
  trade_count integer default 0 check (trade_count >= 0),
  last_traded_at timestamptz,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 3. TRADE LISTINGS TABLE (Active and past trade listings)
-- ------------------------------------------------------------------------------
create table if not exists public.trade_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  listing_type text not null default 'sell' check (listing_type in ('sell', 'buy')),
  item_quantity integer default 1 check (item_quantity > 0),
  requested_price numeric(12, 2) check (requested_price >= 0),
  requested_items text, -- optional item wishlist for barter trades
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 4. TRADE OFFERS TABLE (Offers made against a listing)
-- ------------------------------------------------------------------------------
create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.trade_listings(id) on delete cascade,
  offerer_id uuid not null references public.profiles(id) on delete cascade,
  offered_price numeric(12, 2) check (offered_price >= 0),
  offered_items text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now() not null,
  responded_at timestamptz
);

-- Indexes for optimal lookup and sorting performance
create index if not exists idx_items_category on public.items(category);
create index if not exists idx_items_rarity on public.items(rarity);
create index if not exists idx_trade_listings_status on public.trade_listings(status);
create index if not exists idx_trade_listings_item_id on public.trade_listings(item_id);
create index if not exists idx_trade_offers_listing_id on public.trade_offers(listing_id);
create index if not exists idx_trade_offers_status on public.trade_offers(status);

-- ------------------------------------------------------------------------------
-- 5. ANTI-MANIPULATION ROLLING MEDIAN VALUE CALCULATION
-- ------------------------------------------------------------------------------
-- Calculates rolling median over the last N (up to 10) settled trade prices.
-- When fewer than 3 trades exist, anchor with base_value seeds to prevent 1-trade manipulation.
create or replace function public.calculate_item_rolling_median(p_item_id uuid)
returns numeric as $$
declare
  v_median numeric;
  v_count integer;
  v_base numeric;
begin
  select coalesce(base_value, 0) into v_base from public.items where id = p_item_id;

  -- Count valid accepted completed trades for this item
  select count(*) into v_count
  from (
    select coalesce(o.offered_price, l.requested_price) as trade_price
    from public.trade_offers o
    join public.trade_listings l on o.listing_id = l.id
    where l.item_id = p_item_id
      and o.status = 'accepted'
      and coalesce(o.offered_price, l.requested_price) is not null
      and coalesce(o.offered_price, l.requested_price) > 0
    order by coalesce(o.responded_at, o.created_at) desc
    limit 10
  ) recent_count;

  if v_count >= 3 then
    -- Established trade history: Compute rolling median over the last up to 10 trades
    with recent_trades as (
      select coalesce(o.offered_price, l.requested_price) as trade_price
      from public.trade_offers o
      join public.trade_listings l on o.listing_id = l.id
      where l.item_id = p_item_id
        and o.status = 'accepted'
        and coalesce(o.offered_price, l.requested_price) is not null
        and coalesce(o.offered_price, l.requested_price) > 0
      order by coalesce(o.responded_at, o.created_at) desc
      limit 10
    )
    select percentile_cont(0.5) within group (order by trade_price)
    into v_median
    from recent_trades;
  else
    -- Low volume/new item: Anchor median with base_value seeds to prevent 1-trade manipulation
    with recent_trades as (
      select coalesce(o.offered_price, l.requested_price) as trade_price
      from public.trade_offers o
      join public.trade_listings l on o.listing_id = l.id
      where l.item_id = p_item_id
        and o.status = 'accepted'
        and coalesce(o.offered_price, l.requested_price) is not null
        and coalesce(o.offered_price, l.requested_price) > 0
      order by coalesce(o.responded_at, o.created_at) desc
      limit 10
    ),
    anchored_trades as (
      select trade_price from recent_trades
      union all
      select v_base as trade_price
      union all
      select v_base as trade_price
    )
    select percentile_cont(0.5) within group (order by trade_price)
    into v_median
    from anchored_trades;
  end if;

  return round(coalesce(v_median, v_base, 0)::numeric, 2);
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------------------
-- 6. TRIGGER: AUTOMATIC VALUE & STATUS UPDATES ON ACCEPTING OFFERS
-- ------------------------------------------------------------------------------
create or replace function public.process_accepted_trade_offer()
returns trigger as $$
declare
  v_item_id uuid;
  v_old_value numeric;
  v_new_value numeric;
  v_new_trend text;
begin
  -- Only trigger when offer status transitions to 'accepted'
  if (tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted') then
    -- Record timestamp
    new.responded_at := now();

    -- Find target listing
    select item_id into v_item_id
    from public.trade_listings
    where id = new.listing_id;

    -- Mark the listing as completed
    update public.trade_listings
    set status = 'completed',
        updated_at = now()
    where id = new.listing_id;

    -- Automatically reject all other pending offers on this listing
    update public.trade_offers
    set status = 'rejected',
        responded_at = now()
    where listing_id = new.listing_id
      and id <> new.id
      and status = 'pending';

    -- Retrieve previous item value
    select current_value into v_old_value
    from public.items
    where id = v_item_id;

    -- Calculate newly updated rolling median value
    v_new_value := public.calculate_item_rolling_median(v_item_id);

    -- Calculate directional trend
    if v_new_value > v_old_value then
      v_new_trend := 'up';
    elsif v_new_value < v_old_value then
      v_new_trend := 'down';
    else
      v_new_trend := 'stable';
    end if;

    -- Update item's current value, trend, trade volume, and last traded date
    update public.items
    set current_value = v_new_value,
        trend = v_new_trend,
        trade_count = trade_count + 1,
        last_traded_at = now()
    where id = v_item_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_trade_offer_accepted on public.trade_offers;
create trigger on_trade_offer_accepted
  before update on public.trade_offers
  for each row execute function public.process_accepted_trade_offer();

-- ------------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.trade_listings enable row level security;
alter table public.trade_offers enable row level security;

-- PROFILES POLICIES
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ITEMS POLICIES
drop policy if exists "Items are publicly viewable by everyone" on public.items;
create policy "Items are publicly viewable by everyone"
  on public.items for select
  using (true);

drop policy if exists "Authenticated users can create items" on public.items;
create policy "Authenticated users can create items"
  on public.items for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update items" on public.items;
create policy "Authenticated users can update items"
  on public.items for update
  using (auth.role() = 'authenticated');

-- TRADE LISTINGS POLICIES
drop policy if exists "Listings are publicly viewable by everyone" on public.trade_listings;
create policy "Listings are publicly viewable by everyone"
  on public.trade_listings for select
  using (true);

drop policy if exists "Authenticated users can post listings" on public.trade_listings;
create policy "Authenticated users can post listings"
  on public.trade_listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Listing owners can update their listings" on public.trade_listings;
create policy "Listing owners can update their listings"
  on public.trade_listings for update
  using (auth.uid() = user_id);

drop policy if exists "Listing owners can delete their listings" on public.trade_listings;
create policy "Listing owners can delete their listings"
  on public.trade_listings for delete
  using (auth.uid() = user_id);

-- TRADE OFFERS POLICIES
drop policy if exists "Offers are publicly viewable by everyone" on public.trade_offers;
create policy "Offers are publicly viewable by everyone"
  on public.trade_offers for select
  using (true);

drop policy if exists "Authenticated users can post offers" on public.trade_offers;
create policy "Authenticated users can post offers"
  on public.trade_offers for insert
  with check (
    auth.uid() = offerer_id and
    auth.uid() <> (select user_id from public.trade_listings where id = listing_id)
  );

-- STRICT RLS RULE: Only listing owners can accept or reject offers,
-- or offerers can cancel their own pending offer
drop policy if exists "Only listing owner can accept/reject offers, offerer can cancel" on public.trade_offers;
create policy "Only listing owner can accept/reject offers, offerer can cancel"
  on public.trade_offers for update
  using (
    -- Listing owner can accept/reject
    exists (
      select 1 from public.trade_listings l
      where l.id = trade_offers.listing_id and l.user_id = auth.uid()
    )
    or
    -- Offerer can cancel their own pending offer
    (
      offerer_id = auth.uid() and status = 'pending'
    )
  );

drop policy if exists "Offerers can delete their pending offer" on public.trade_offers;
create policy "Offerers can delete their pending offer"
  on public.trade_offers for delete
  using (offerer_id = auth.uid() and status = 'pending');

-- ------------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (POPULAR GAME ITEMS & SAMPLE TRADES)
-- ------------------------------------------------------------------------------
insert into public.items (name, category, rarity, description, base_value, current_value, demand_rating, trend, trade_count, image_url)
values
  ('Dragon Slayer Greatsword', 'Weapon', 'Mythic', 'Forged in dragonfire with an edge that cuts through ancient scales.', 8500.00, 8950.00, 'Extreme', 'up', 14, 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400&auto=format&fit=crop&q=80'),
  ('Aegis of the Astral Void', 'Armor', 'Legendary', 'Heavy cosmic shield radiating protective starlight wards.', 5200.00, 5100.00, 'High', 'down', 8, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80'),
  ('Phoenix Feather Cloak', 'Armor', 'Epic', 'Grants the wearer sudden bursts of flame step and slow fall.', 2400.00, 2450.00, 'High', 'up', 22, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'),
  ('Chrono Shard', 'Artifact', 'Legendary', 'A crystallized fragment of warped time. Used to rewind enchantments.', 6800.00, 7150.00, 'Extreme', 'up', 19, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80'),
  ('Shadowstep Daggers', 'Weapon', 'Rare', 'Dual daggers laced with nocturnal poison, favored by rogues.', 950.00, 920.00, 'Medium', 'down', 35, 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400&auto=format&fit=crop&q=80'),
  ('Nebula Drake Horn', 'Material', 'Epic', 'Harvested from celestial drakes, a key ingredient for high tier runes.', 1800.00, 1800.00, 'Medium', 'stable', 11, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80'),
  ('Elixir of Infinite Vigor', 'Consumable', 'Rare', 'Temporarily boosts stamina recovery by 300% for 20 minutes.', 350.00, 365.00, 'High', 'up', 48, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=400&auto=format&fit=crop&q=80'),
  ('Spectral Steed Whistle', 'Mount', 'Mythic', 'Summons an ethereal mount that traverses both land and open water.', 12500.00, 12200.00, 'Extreme', 'down', 6, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80'),
  ('Rune of True Sight', 'Artifact', 'Epic', 'Reveals hidden chests, cloaked enemies, and illusionary walls.', 2100.00, 2150.00, 'Medium', 'up', 16, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80'),
  ('Titanium Ingot Bundle x50', 'Material', 'Common', 'Bulk refined metal for guild fortress renovations and weapons.', 450.00, 450.00, 'Low', 'stable', 64, 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=80')
on conflict (name) do nothing;
