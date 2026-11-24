'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  User,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  Database,
  Layers,
  Lock,
} from 'lucide-react';
import { getCurrentUserProfile } from '@/lib/queries/profiles';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);

  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
    getCurrentUserProfile().then(p => {
      setUser(p);
    });
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Skins & Values', icon: Layers },
    { href: '/trades', label: 'Trade Hub (W/F/L)', icon: ArrowRightLeft },
    { href: '/completed', label: 'Completed Trades', icon: CheckCircle2 },
    // Admin link only rendered if user is admin!
    ...(user?.is_admin ? [{ href: '/admin', label: 'Admin Panel', icon: Lock, adminOnly: true }] : []),
    { href: '/login', label: user ? 'Account' : 'Sign In', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">🦖</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">
                  DS VALUE
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ROBLOX
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-1 font-mono">
                Dinosaur Simulator Skin & Trade Hub
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isAdminLink = (link as any).adminOnly;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? isAdminLink
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : isAdminLink
                      ? 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-800/40'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (isAdminLink ? 'text-rose-400' : 'text-emerald-400') : 'text-zinc-400'}`} />
                  {link.label}
                  {isAdminLink && (
                    <span className="text-[9px] font-bold px-1 rounded bg-rose-500/20 text-rose-300">
                      ADMIN
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / User & Status */}
          <div className="hidden md:flex items-center gap-4">
            {/* Supabase Status Indicator */}
            <div
              title={
                supabaseActive
                  ? 'Connected to live Supabase Postgres'
                  : 'Running in Local Sandbox mode (Provide Supabase credentials in .env.local)'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                supabaseActive
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-zinc-900/90 text-zinc-400 border-zinc-700/60'
              }`}
            >
              <Database className={`w-3 h-3 ${supabaseActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>{supabaseActive ? 'Supabase Live' : 'Sandbox Mode'}</span>
            </div>

            {/* User Profile Pill or Login Button */}
            {user ? (
              <Link
                href="/login"
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-7 h-7 rounded-full bg-zinc-800 border border-emerald-500/40"
                />
                <div className="text-left text-xs">
                  <div className="font-semibold text-zinc-200 leading-tight flex items-center gap-1">
                    {user.username}
                    {user.is_admin ? (
                      <span className="text-[9px] font-bold px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Admin
                      </span>
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Rep: {user.reputation}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-zinc-800 bg-zinc-950/95 space-y-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">
              {supabaseActive ? 'Supabase Connected' : 'Sandbox Storage'}
            </span>
            {user ? (
              <span className="text-xs text-emerald-400 font-mono">
                @{user.username} {user.is_admin ? '(Admin)' : ''}
              </span>
            ) : (
              <Link href="/login" className="text-xs text-emerald-400 font-bold">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
