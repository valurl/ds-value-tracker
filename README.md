# DS Value Tracker — Dinosaur Simulator (Roblox) Skin Value & Trading Hub

A modular **Next.js (App Router) + Tailwind CSS + Supabase** web application tailored for Roblox Dinosaur Simulator skin valuations, player-to-player skin swaps, and real-time Win / Fair / Loss (W/F/L) trade evaluation.

> [!NOTE]
> **Community Disclaimer**: This is an independent skin valuation and player-to-player trading tracker—**not an in-game store** where users spend points to purchase items. All values represent market consensus in **Points (Pts)** derived from verified player exchanges.

---

## 🌟 Core Features

- **Dinosaur Simulator Skin Valuations**:
  - Skin values displayed in **Points** (e.g. `89,000 Points` or `89K Pts`).
  - Dinosaur Simulator categories: `Limited`, `Event`, `Albino / Melanistic`, `Golden / Diamond`, `Plush / Toy`, `Gamepass / Robux`, and `Obtainable / Shop`.
  - Skin fields: Skin Name, Base Dinosaur (e.g. `Megavore`, `Barosaurus`, `Tyrannosaurus Rex`), Category, Image URL, Point Value, Demand Score, and Trend.
- **Player-to-Player Skin Trading & W/F/L Balance**:
  - Direct Skin-for-Skin trade listings (`Offering: [Skins]` ⇄ `Looking For: [Skins or Open Offers]`).
  - Real-time **Win / Fair / Loss (W/F/L)** calculation based on total cumulative Point Values.
  - Counter-offers let players offer their own skins (no point balance payments).
- **Anti-Manipulation Rolling Median Consensus**:
  - When an offer is accepted by the listing owner, the rolling median algorithm recalculates point values over the last 10 settled trades to prevent single-trade spikes.
  - Low-volume skins are anchored with baseline seeds to maintain stability.
- **Role-Based Admin Control (`/admin`)**:
  - Protected by Postgres Row-Level Security: only profiles with `is_admin = true` can insert, update, or delete skins.
  - Accessible only to administrators (dynamically shown in the navbar).
  - Add new skins, update existing point values, delete retired skins, and promote/demote other users to admin.

---

## 🧭 Application Pages

1. **`/` (Skin Point Values List)**
   - Searchable and filterable catalog of Dinosaur Simulator skins.
   - Filter by Skin Category and Base Dinosaur.
   - Sort by Highest Point Value, Most Traded, Demand Rating, or Name.
2. **`/trades` (Live Skin Trading Hub)**
   - Feed of player-to-player skin trade listings.
   - Live W/F/L badges showing whether a trade is a Win, Fair (±10%), or Loss.
   - Post new skin-for-skin listings with multi-skin selection.
   - Submit skin counter-offers with live W/F/L preview.
   - Owner-only offer acceptance drawer.
3. **`/completed` (Completed Skin Trades Ledger)**
   - Ledger of completed skin swaps showing settled point values and rolling median impact.
4. **`/login` (Trader Account)**
   - Real Supabase authentication (email/password sign in and registration).
   - View profile, Roblox username, trader reputation, and admin status.
5. **`/admin` (Protected Admin Panel)**
   - Only accessible to users with `is_admin = true`.
   - Add new Dinosaur Simulator skins.
   - Edit skin point values and delete skins.
   - Promote or demote admins by username.

---

## 🛠️ Supabase Database Setup

1. For new projects, run [`schema.sql`](./schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/bpanaklzsyiwtxdcaupm/sql/new).
2. For existing projects, run [`admin_migration.sql`](./admin_migration.sql) to add the `is_admin` column and admin RLS policies.
3. Configure your API keys in [`.env.local`](./.env.local):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://bpanaklzsyiwtxdcaupm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

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
