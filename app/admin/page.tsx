'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Item, ItemCategory, DemandRating, Profile } from '@/lib/types';
import { getItems, createSkin, updateSkin, deleteSkin } from '@/lib/queries/items';
import { getCurrentUserProfile, getAllProfiles, setUserAdminStatus } from '@/lib/queries/profiles';
import { RarityBadge, CategoryBadge, DemandBadge, formatPoints } from '@/components/Badge';
import {
  Lock,
  PlusCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
} from 'lucide-react';

const CATEGORIES: ItemCategory[] = [
  'Limited',
  'Event',
  'Albino / Melanistic',
  'Golden / Diamond',
  'Plush / Toy',
  'Gamepass / Robux',
  'Obtainable / Shop',
];

const BASE_DINOSAURS = [
  'Megavore',
  'Barosaurus',
  'Tyrannosaurus Rex',
  'Giganotosaurus',
  'Spinosaurus',
  'Brachiosaurus',
  'Mosasaurus',
  'Ankylosaurus',
  'Balaur',
  'Triceratops',
  'Carnotaurus',
  'Pteranodon',
  'Dilophosaurus',
  'Stegosaurus',
  'Velociraptor',
];

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'add_skin' | 'manage_skins' | 'manage_users'>('add_skin');

  // Skins state
  const [skins, setSkins] = useState<Item[]>([]);
  const [skinSearch, setSkinSearch] = useState('');
  const [loadingSkins, setLoadingSkins] = useState(false);

  // Users state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Skin Form state
  const [skinName, setSkinName] = useState('');
  const [baseDino, setBaseDino] = useState(BASE_DINOSAURS[0]);
  const [category, setCategory] = useState<ItemCategory>('Limited');
  const [pointValue, setPointValue] = useState('');
  const [demandRating, setDemandRating] = useState<DemandRating>('High');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submittingSkin, setSubmittingSkin] = useState(false);

  // Edit skin modal state
  const [editingSkin, setEditingSkin] = useState<Item | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDemand, setEditDemand] = useState<DemandRating>('Medium');

  useEffect(() => {
    getCurrentUserProfile().then(user => {
      setCurrentUser(user);
      setLoadingUser(false);
      if (user?.is_admin) {
        loadSkins();
        loadProfiles();
      }
    });
  }, []);

  const loadSkins = async () => {
    setLoadingSkins(true);
    const data = await getItems();
    setSkins(data);
    setLoadingSkins(false);
  };

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    const data = await getAllProfiles();
    setProfiles(data);
    setLoadingProfiles(false);
  };

  const handleAddSkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinName.trim() || !pointValue) {
      setNotice({ type: 'error', message: 'Skin Name and Point Value are required.' });
      return;
    }

    try {
      setSubmittingSkin(true);
      await createSkin({
        name: skinName.trim(),
        base_dinosaur: baseDino,
        category,
        base_value: parseFloat(pointValue) || 1000,
        demand_rating: demandRating,
        image_url: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
      });

      setNotice({ type: 'success', message: `Skin "${skinName}" added successfully!` });
      setSkinName('');
      setPointValue('');
      setImageUrl('');
      setDescription('');
      await loadSkins();
    } catch (err: unknown) {
      setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add skin' });
    } finally {
      setSubmittingSkin(false);
    }
  };

  const handleSaveEditSkin = async () => {
    if (!editingSkin) return;
    try {
      await updateSkin(editingSkin.id, {
        current_value: parseFloat(editPrice) || editingSkin.current_value,
        demand_rating: editDemand,
      });
      setNotice({ type: 'success', message: `Skin "${editingSkin.name}" updated!` });
      setEditingSkin(null);
      await loadSkins();
    } catch (err: unknown) {
      setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Update failed' });
    }
  };

  const handleDeleteSkin = async (skin: Item) => {
    if (!confirm(`Are you sure you want to delete skin "${skin.name}"?`)) return;
    try {
      await deleteSkin(skin.id);
      setNotice({ type: 'success', message: `Skin "${skin.name}" deleted.` });
      await loadSkins();
    } catch (err: unknown) {
      setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const handleToggleAdmin = async (profile: Profile) => {
    const newStatus = !profile.is_admin;
    const action = newStatus ? 'promote' : 'demote';
    if (!confirm(`Are you sure you want to ${action} @${profile.username} as admin?`)) return;

    try {
      const res = await setUserAdminStatus(profile.username, newStatus);
      if (res.success) {
        setNotice({ type: 'success', message: `Updated @${profile.username} admin status to: ${newStatus}` });
        await loadProfiles();
      } else {
        setNotice({ type: 'error', message: res.error || 'Failed to update user' });
      }
    } catch (err: unknown) {
      setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Error updating user' });
    }
  };

  // Access Control Guard
  if (loadingUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-zinc-400">
        Checking admin permissions...
      </div>
    );
  }

  if (!currentUser || !currentUser.is_admin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied: Admin Only</h1>
        <p className="text-sm text-zinc-400">
          This administration terminal is protected by PostgreSQL Row-Level Security. Only users with <code className="text-rose-400 bg-zinc-900 px-1 py-0.5 rounded">is_admin = true</code> in the profiles table can access this area.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  const filteredSkins = skins.filter(
    s =>
      s.name.toLowerCase().includes(skinSearch.toLowerCase()) ||
      s.base_dinosaur.toLowerCase().includes(skinSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(skinSearch.toLowerCase())
  );

  const filteredProfiles = profiles.filter(p =>
    p.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 sm:p-8 rounded-3xl border border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Lock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              DS Skin & Economy Admin Panel
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Authenticated Administrator: <strong className="text-rose-400">@{currentUser.username}</strong>. Protected by Supabase Row-Level Security.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>RLS is_admin = true</span>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('add_skin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'add_skin'
              ? 'bg-emerald-600 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Skin</span>
        </button>

        <button
          onClick={() => setActiveTab('manage_skins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'manage_skins'
              ? 'bg-emerald-600 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit & Delete Skins ({skins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manage_users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'manage_users'
              ? 'bg-emerald-600 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Manage Admin Permissions</span>
        </button>
      </div>

      {/* Tab 1: Add New Skin */}
      {activeTab === 'add_skin' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Add New Dinosaur Simulator Skin</span>
            </h2>
            <p className="text-xs text-zinc-400">
              New skins will immediately appear across the community value list, trade hub, and offer modals.
            </p>
          </div>

          <form onSubmit={handleAddSkin} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Skin Name
                </label>
                <input
                  type="text"
                  value={skinName}
                  onChange={e => setSkinName(e.target.value)}
                  placeholder="e.g. Cherry Blossom Megavore"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Base Dinosaur
                </label>
                <select
                  value={baseDino}
                  onChange={e => setBaseDino(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                >
                  {BASE_DINOSAURS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Starting Point Value (Pts)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={pointValue}
                  onChange={e => setPointValue(e.target.value)}
                  placeholder="e.g. 85000"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Demand Score
                </label>
                <select
                  value={demandRating}
                  onChange={e => setDemandRating(e.target.value as DemandRating)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mention event origin, animation glow, release year..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingSkin}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submittingSkin ? 'Saving Skin...' : 'Publish Skin to Economy'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Manage Skins (Edit / Delete) */}
      {activeTab === 'manage_skins' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <span>Existing Dinosaur Simulator Skins</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Update Point Valuations or remove retired skins.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={skinSearch}
                onChange={e => setSkinSearch(e.target.value)}
                placeholder="Search skins..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {loadingSkins ? (
            <p className="text-xs text-zinc-400">Loading skins...</p>
          ) : (
            <div className="divide-y divide-zinc-800 overflow-x-auto">
              {filteredSkins.map(skin => (
                <div
                  key={skin.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-zinc-950/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 overflow-hidden">
                      {skin.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={skin.image_url} alt={skin.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🦖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">{skin.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">[{skin.base_dinosaur}]</span>
                        <CategoryBadge category={skin.category} />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-0.5">
                        {skin.current_value.toLocaleString()} Pts • Demand: {skin.demand_rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingSkin(skin);
                        setEditPrice(skin.current_value.toString());
                        setEditDemand(skin.demand_rating);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Value</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSkin(skin)}
                      className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Manage Users & Admin Roles */}
      {activeTab === 'manage_users' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Admin Role Governance</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Promote or demote users to manage skin point valuations.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search username..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {loadingProfiles ? (
            <p className="text-xs text-zinc-400">Loading user list...</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredProfiles.map(p => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-zinc-950/40 px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`}
                      alt={p.username}
                      className="w-8 h-8 rounded-full border border-zinc-700"
                    />
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        @{p.username}
                        {p.is_admin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Rep: {p.reputation} • Joined {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    {p.is_admin ? (
                      <button
                        onClick={() => handleToggleAdmin(p)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Admin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleAdmin(p)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Make Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Skin Modal */}
      {editingSkin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">
              Edit Skin: <span className="text-emerald-400">{editingSkin.name}</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Point Value (Pts)
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Demand Score
              </label>
              <select
                value={editDemand}
                onChange={e => setEditDemand(e.target.value as DemandRating)}
                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingSkin(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditSkin}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
