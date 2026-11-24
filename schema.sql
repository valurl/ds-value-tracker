-- ==============================================================================
-- Dinosaur Simulator (Roblox) Skin Value & Trading Tracker Database Schema
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
  is_admin boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger to create profile upon new Supabase user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id),
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false)
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
-- 2. ITEMS TABLE (Dinosaur Simulator Skins with Point Valuations)
-- ------------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  base_dinosaur text not null, -- e.g. 'Megavore', 'Barosaurus', 'Tyrannosaurus Rex'
  category text not null,      -- 'Limited', 'Event', 'Albino / Melanistic', 'Golden / Diamond', 'Plush / Toy', 'Gamepass / Robux', 'Obtainable / Shop'
  rarity text not null default 'Rare', -- 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'
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
-- 3. TRADE LISTINGS TABLE (Skin-for-Skin Player Listings)
-- ------------------------------------------------------------------------------
create table if not exists public.trade_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  listing_type text not null default 'sell' check (listing_type in ('sell', 'buy')),
  item_quantity integer default 1 check (item_quantity > 0),
  requested_price numeric(12, 2) check (requested_price >= 0), -- estimated reference point value
  requested_items text, -- optional text description of wishlist skins
  offered_skin_ids text[] default '{}',
  looking_for_skin_ids text[] default '{}',
  looking_for_type text default 'any', -- 'specific' or 'any'
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 4. TRADE OFFERS TABLE (Skin Counter-Offers on Listings)
-- ------------------------------------------------------------------------------
create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.trade_listings(id) on delete cascade,
  offerer_id uuid not null references public.profiles(id) on delete cascade,
  offered_price numeric(12, 2) check (offered_price >= 0), -- calculated total point value of offered skins
  offered_items text, -- description of offered skins
  offered_skin_ids text[] default '{}',
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now() not null,
  responded_at timestamptz
);

-- Indexes for performance
create index if not exists idx_items_category on public.items(category);
create index if not exists idx_items_base_dinosaur on public.items(base_dinosaur);
create index if not exists idx_trade_listings_status on public.trade_listings(status);
create index if not exists idx_trade_listings_item_id on public.trade_listings(item_id);
create index if not exists idx_trade_offers_listing_id on public.trade_offers(listing_id);
create index if not exists idx_trade_offers_status on public.trade_offers(status);

-- ------------------------------------------------------------------------------
-- 5. ANTI-MANIPULATION ROLLING MEDIAN SKIN VALUE CALCULATION
-- ------------------------------------------------------------------------------
create or replace function public.calculate_item_rolling_median(p_item_id uuid)
returns numeric as $$
declare
  v_median numeric;
  v_count integer;
  v_base numeric;
begin
  select coalesce(base_value, 0) into v_base from public.items where id = p_item_id;

  -- Count valid accepted completed trades for this skin
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
  if (tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted') then
    new.responded_at := now();

    select item_id into v_item_id
    from public.trade_listings
    where id = new.listing_id;

    update public.trade_listings
    set status = 'completed',
        updated_at = now()
    where id = new.listing_id;

    update public.trade_offers
    set status = 'rejected',
        responded_at = now()
    where listing_id = new.listing_id
      and id <> new.id
      and status = 'pending';

    select current_value into v_old_value
    from public.items
    where id = v_item_id;

    v_new_value := public.calculate_item_rolling_median(v_item_id);

    if v_new_value > v_old_value then
      v_new_trend := 'up';
    elsif v_new_value < v_old_value then
      v_new_trend := 'down';
    else
      v_new_trend := 'stable';
    end if;

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
-- Anyone can view skins (read-only community values)
drop policy if exists "Items are publicly viewable by everyone" on public.items;
create policy "Items are publicly viewable by everyone"
  on public.items for select
  using (true);

-- STRICT RLS RULE: Only users where is_admin = true can insert, update, or delete skins
drop policy if exists "Authenticated users can create items" on public.items;
drop policy if exists "Authenticated users can update items" on public.items;
drop policy if exists "Only admins can insert items" on public.items;
drop policy if exists "Only admins can update items" on public.items;
drop policy if exists "Only admins can delete items" on public.items;

create policy "Only admins can insert items"
  on public.items for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Only admins can update items"
  on public.items for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Only admins can delete items"
  on public.items for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

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

drop policy if exists "Only listing owner can accept/reject offers, offerer can cancel" on public.trade_offers;
create policy "Only listing owner can accept/reject offers, offerer can cancel"
  on public.trade_offers for update
  using (
    exists (
      select 1 from public.trade_listings l
      where l.id = trade_offers.listing_id and l.user_id = auth.uid()
    )
    or
    (
      offerer_id = auth.uid() and status = 'pending'
    )
  );

drop policy if exists "Offerers can delete their pending offer" on public.trade_offers;
create policy "Offerers can delete their pending offer"
  on public.trade_offers for delete
  using (offerer_id = auth.uid() and status = 'pending');

-- ------------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (AUTHENTIC DINOSAUR SIMULATOR SKINS)
-- ------------------------------------------------------------------------------
insert into public.items (name, base_dinosaur, category, rarity, description, base_value, current_value, demand_rating, trend, trade_count, image_url)
values
  ('Cherry Blossom Megavore', 'Megavore', 'Limited', 'Mythic', 'Legendary spring exclusive skin featuring delicate sakura blossoms drifting around a colossal Megavore.', 85000.00, 89000.00, 'Extreme', 'up', 18, 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=600&auto=format&fit=crop&q=80'),
  ('Candy Cane Barosaurus', 'Barosaurus', 'Event', 'Legendary', 'Holiday festive skin with spiraling crimson and peppermint stripes along an elongated neck.', 42000.00, 41500.00, 'High', 'down', 24, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80'),
  ('Pitch Black Tyrannosaurus', 'Tyrannosaurus Rex', 'Albino / Melanistic', 'Epic', 'Ultra-rare melanistic Tyrannosaurus with pitch black scales and piercing amber eyes.', 18500.00, 19200.00, 'High', 'up', 32, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'),
  ('Diamond Giganotosaurus', 'Giganotosaurus', 'Golden / Diamond', 'Mythic', 'Pure crystalline diamond structure that refracts natural sunlight into dazzling prisms.', 65000.00, 68000.00, 'Extreme', 'up', 15, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'),
  ('Golden Spinosaurus', 'Spinosaurus', 'Golden / Diamond', 'Legendary', 'Shimmering 24K gilded Spinosaurus with lustrous spine sail and golden claws.', 28000.00, 27500.00, 'Medium', 'down', 41, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'),
  ('Plush Brachiosaurus', 'Brachiosaurus', 'Plush / Toy', 'Epic', 'Stitched fabric toy skin with button eyes and soft seams, one of the most beloved plushies in DS.', 35000.00, 36500.00, 'High', 'up', 29, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80'),
  ('Retro Mosasaurus', 'Mosasaurus', 'Gamepass / Robux', 'Rare', 'Vibrant neon synthwave colorway with 80s grid patterns across the aquatic apex predator.', 12000.00, 12000.00, 'Medium', 'stable', 27, 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=600&auto=format&fit=crop&q=80'),
  ('Cybernetic Ankylosaurus', 'Ankylosaurus', 'Event', 'Epic', 'Heavy armored plating with glowing neon green power circuits and an reinforced titanium tail club.', 22500.00, 23000.00, 'High', 'up', 36, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'),
  ('Ghost Balaur', 'Balaur', 'Limited', 'Mythic', 'Ethereal translucent spirit raptor with ghostly particle mist and floating spectral feathers.', 95000.00, 98500.00, 'Extreme', 'up', 12, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80'),
  ('Albino Triceratops', 'Triceratops', 'Albino / Melanistic', 'Rare', 'Pale alabaster frill and horns with soft pink accents, a staple collector trophy.', 6500.00, 6500.00, 'Low', 'stable', 55, 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=80'),
  ('Inferno Carnotaurus', 'Carnotaurus', 'Obtainable / Shop', 'Rare', 'Smoldering magma cracks and volcanic ash trails surging along a swift horned Carnotaurus.', 4200.00, 4100.00, 'Medium', 'down', 63, 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80')
on conflict (name) do nothing;
