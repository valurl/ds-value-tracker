'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';
import {
  getCurrentUserProfile,
  signInUser,
  signUpUser,
  signOutUser,
  setDemoCurrentUser,
} from '@/lib/queries/profiles';
import { INITIAL_PROFILES } from '@/lib/demoStore';
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
  Users,
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
          setSuccessMsg('Account created successfully! Welcome to Valoria.');
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
    loadCurrentUser();
  };

  const handleSwitchDemoUser = (profile: Profile) => {
    setDemoCurrentUser(profile);
    setCurrentUser(profile);
    setSuccessMsg(`Switched active player to @${profile.username}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trader Authentication & Profile</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Valoria Trader Account
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto">
          Sign in to post trade listings, submit offers, and verify transactions with Row-Level Security protection.
        </p>
      </div>

      {/* Connection Mode Banner */}
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
            <strong>Auth Backend:</strong>{' '}
            {supabaseActive
              ? 'Connected to Live Supabase Postgres'
              : 'Running in Sandbox Mode (Add NEXT_PUBLIC_SUPABASE_URL and KEY in .env.local for live cloud sync)'}
          </span>
        </div>
        <span className="font-mono text-[11px] hidden sm:inline">
          {supabaseActive ? 'Supabase Auth' : 'Demo Local Auth'}
        </span>
      </div>

      {/* Messages */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Auth Form / Active Profile */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {currentUser ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt={currentUser.username}
                  className="w-16 h-16 rounded-2xl border-2 border-amber-500/50 bg-zinc-950"
                />
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    {currentUser.username}
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </h3>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    ID: {currentUser.id}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Reputation Score: {currentUser.reputation} / 150
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Trading Status:</span>
                  <span className="text-emerald-400 font-bold">Verified Trader</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Type:</span>
                  <span className="text-zinc-200">Merchant Tier</span>
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-sm shadow-md transition-all"
                >
                  <span>Go to Trading Hub</span>
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
                    !isSignUp ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isSignUp ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Trader Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. ShadowKnight"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
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
                      placeholder="trader@valoria.io"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Register Trader Account' : 'Sign In to Valoria'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sandbox Switcher & Testing Guide */}
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-lg">Switch Demo Trader Persona</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly toggle between different player accounts to test both sides of a trade: post as one player, switch personas to submit counter-offers, and switch back to accept offers and verify rolling median price updates!
            </p>

            <div className="space-y-2.5 pt-2">
              {INITIAL_PROFILES.map(profile => {
                const isActive = currentUser?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleSwitchDemoUser(profile)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                        alt={profile.username}
                        className="w-9 h-9 rounded-xl border border-zinc-700"
                      />
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1">
                          @{profile.username}
                          {isActive && <span className="text-[10px] text-amber-400 font-mono">(Active)</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Reputation: {profile.reputation}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-zinc-400 hover:text-white">
                      {isActive ? 'Current' : 'Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
