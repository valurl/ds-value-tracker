'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';
import {
  getCurrentUserProfile,
  signInUser,
  signUpUser,
  signOutUser,
} from '@/lib/queries/profiles';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  LogOut,
  Sparkles,
  Database,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [supabaseActive, setSupabaseActive] = useState(false);

  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUserProfile();
    setCurrentUser(user);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        const res = await signUpUser(email, password, username);
        if (!res.success) {
          setError(res.error || 'Failed to create account.');
        } else {
          setSuccessMsg('Account created successfully! Welcome to Dinosaur Simulator Trader.');
          await loadCurrentUser();
        }
      } else {
        const res = await signInUser(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to sign in.');
        } else {
          setSuccessMsg('Signed in successfully!');
          await loadCurrentUser();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setSuccessMsg('Signed out successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dinosaur Simulator Trader Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Trader Account & Profile
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto">
          Sign in to post Dinosaur Simulator skin trade listings, evaluate W/F/L deals, and submit counter-offers.
        </p>
      </div>

      {/* Backend Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
          supabaseActive
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${supabaseActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <span>
            <strong>Authentication Backend:</strong>{' '}
            {supabaseActive
              ? 'Connected to Live Supabase Postgres'
              : 'Local Sandbox Authentication Mode'}
          </span>
        </div>
        <span className="font-mono text-[11px] hidden sm:inline">
          {supabaseActive ? 'Supabase Auth' : 'Local Sandbox'}
        </span>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {currentUser ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt={currentUser.username}
                  className="w-16 h-16 rounded-2xl border-2 border-emerald-500/50 bg-zinc-950"
                />
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    {currentUser.username}
                    {currentUser.is_admin ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ADMIN
                      </span>
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                  </h3>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    ID: {currentUser.id}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Trader Reputation: {currentUser.reputation} Pts
                  </div>
                </div>
              </div>

              {currentUser.is_admin && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-rose-300">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Administrator Privileges Active</span>
                  </div>
                  <Link
                    href="/admin"
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Admin Panel
                  </Link>
                </div>
              )}

              <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Status:</span>
                  <span className="text-emerald-400 font-bold">Verified DS Trader</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Role:</span>
                  <span className="text-zinc-200">
                    {currentUser.is_admin ? 'Database Admin' : 'Community Trader'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Joined:</span>
                  <span className="text-zinc-200 font-mono">
                    {new Date(currentUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/trades')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-md transition-all"
                >
                  <span>Go to Trade Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sign In / Sign Up Tabs */}
              <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isSignUp ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isSignUp ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Roblox / Trader Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. RexMaster_Roblox"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="trader@roblox.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Register Trader Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
