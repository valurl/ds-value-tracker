# Valoria — Game Trading Economy & Item Value Tracker

A modular **Next.js (App Router) + Tailwind CSS + Supabase** web application for real-time game item valuations, live market listings, counter-offers, and transaction ledgers.

## 🌟 Core Features

- **Anti-Manipulation Rolling Median Consensus**:
  - Unlike naive averages, Valoria prevents single-trade price manipulation (e.g. an attacker selling an item to their own alt for 1,000,000 Gold).
  - Item valuations are automatically recalculated upon accepted trades using a rolling median of historical transactions.
  - Low-volume/new items are anchored with baseline seeds so rogue trades cannot skew the market price before consensus is established.
- **Complete Row-Level Security (RLS)**:
  - **Public Read**: Anyone can browse items, trade listings, and offers for transparency.
  - **Authenticated Posting**: Logged-in players can post listings and submit offers.
  - **Owner-Exclusive Acceptance**: Only the listing creator can accept or reject offers.
- **Modular Architecture**:
  - `/lib/supabase.ts`: Supabase client setup with connection detection and graceful fallback.
  - `/lib/queries/`: Modular query layer for `items`, `trades`, `offers`, and `profiles`.
  - `/components/`: Reusable UI components (`Navbar`, `Footer`, `ItemCard`, `TradeListingCard`, `OfferModal`, `CreateListingModal`, `Badge`, `NotificationBanner`).
  - `/app/`: 4 App Router pages (`/`, `/trades`, `/completed`, `/login`).
  - `schema.sql`: Full Postgres schema with tables, indexes, triggers, rolling median functions, RLS policies, and seed data.

---

## 🧭 Application Pages

1. **`/` (Item Value List)**
   - Live searchable and filterable database of game items.
   - Filter by Rarity (Common → Mythic) and Category (Weapon, Armor, Artifact, Consumable, Mount, Material).
   - Sort by Current Value, Trade Volume, Demand Rating, or Name.
   - Real-time price deviation against baseline with trend indicators.
2. **`/trades` (Live Trading Hub)**
   - Real-time feed of player listings (`WTS` - Want to Sell / `WTB` - Want to Buy).
   - Post new trade listings with gold prices, item wishlists, and trader notes.
   - Make offers on listings with Gold or barter items.
   - Listing owners can review incoming counter-offers and accept or reject them. Accepting an offer immediately triggers the rolling median calculation!
3. **`/completed` (Completed Trades History)**
   - Complete ledger of settled transactions.
   - Displays settlement prices, involved traders, and exact mathematical impact on the item's rolling median market value.
4. **`/login` (Trader Profile & Authentication)**
   - Email/password Sign In and Account Registration.
   - Displays trader reputation, verified badges, and trade history.
   - Includes demo player switcher to easily test buyer and seller workflows in local sandbox mode.

---

## 🛠️ Supabase Database Setup

1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and execute the contents of [`schema.sql`](./schema.sql).
4. In your Supabase Dashboard, go to **Project Settings > API**.
5. Copy your **Project URL** and **anon public API Key**.
6. Open [`.env.local`](./.env.local) and add your keys:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

*(Note: The app also includes an interactive local sandbox mode that works out-of-the-box before keys are configured).*

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
