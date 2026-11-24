-- ==============================================================================
-- Dinosaur Simulator (Roblox) Admin & Skin Schema Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bpanaklzsyiwtxdcaupm/sql/new
-- ==============================================================================

-- 1. Add is_admin column to profiles
alter table public.profiles
add column if not exists is_admin boolean default false not null;

-- 2. Add base_dinosaur column to items table
alter table public.items
add column if not exists base_dinosaur text default 'Generic' not null;

-- 3. Add skin-for-skin fields to trade listings and offers if not already present
alter table public.trade_listings
add column if not exists offered_skin_ids text[] default '{}',
add column if not exists looking_for_skin_ids text[] default '{}',
add column if not exists looking_for_type text default 'any'; -- 'specific' or 'any'

alter table public.trade_offers
add column if not exists offered_skin_ids text[] default '{}';

-- 4. Update Row-Level Security (RLS) policies for items table
-- Only admins can insert, update, or delete Dinosaur Simulator skins
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

-- 5. Helper function for admins to promote/demote other users
create or replace function public.set_user_admin(p_username text, p_is_admin boolean)
returns boolean as $$
declare
  v_caller_is_admin boolean;
begin
  -- Check if caller is admin
  select is_admin into v_caller_is_admin
  from public.profiles
  where id = auth.uid();

  if v_caller_is_admin is not true then
    raise exception 'Unauthorized: Only admins can promote or demote users.';
  end if;

  update public.profiles
  set is_admin = p_is_admin
  where lower(username) = lower(p_username);

  return found;
end;
$$ language plpgsql security definer;

-- 6. Grant current user admin role (Replace with your actual username/email to seed your admin status)
-- UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
