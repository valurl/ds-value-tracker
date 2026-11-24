'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Scale, RefreshCw } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 mt-auto py-10 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white tracking-wider">VALORIA VALUE TRACKER</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md">
              Real-time trading economy, price discovery, and anti-manipulation item valuation for MMORPGs and online games.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-lg max-w-md">
              <Scale className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Anti-Manipulation Guard:</strong> Prices are regulated via rolling median consensus over historical settled trades to safeguard against false outlier spikes.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Item Value Tracker
                </Link>
              </li>
              <li>
                <Link href="/trades" className="hover:text-amber-400 transition-colors">
                  Live Trading Hub
                </Link>
              </li>
              <li>
                <Link href="/completed" className="hover:text-amber-400 transition-colors">
                  Completed Transactions
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors">
                  Trader Profile / Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2 text-sm font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Row-Level Security (RLS)
              </li>
              <li className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Rolling Median Triggers
              </li>
              <li>Next.js App Router & Tailwind</li>
              <li>Supabase Postgres Database</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© 2026 Valoria Game Economy. Powered by Supabase & Next.js.</p>
          <div className="flex gap-4">
            <span className="text-zinc-400">Protected by Postgres RLS Policies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

