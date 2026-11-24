'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Scale, RefreshCw } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 mt-auto py-10 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦖</span>
              <span className="font-bold text-white tracking-wider">DS VALUE TRACKER</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                Roblox Dinosaur Simulator
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              A community skin valuation and player-to-player trading hub for Dinosaur Simulator.
              This is <strong>not a shop or currency store</strong>—it is an independent market guide to evaluate Win, Fair, and Loss (W/F/L) trades between players.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-lg max-w-md">
              <Scale className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Point Valuation Engine:</strong> Skin values are mathematically tracked via rolling median consensus of accepted player-to-player skin swaps to avoid fake spike manipulation.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">Community Hub</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Skin Point Values
                </Link>
              </li>
              <li>
                <Link href="/trades" className="hover:text-emerald-400 transition-colors">
                  Player Skin Trades (W/F/L)
                </Link>
              </li>
              <li>
                <Link href="/completed" className="hover:text-emerald-400 transition-colors">
                  Completed Skin Swaps
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Trader Profile / Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">Skin Economy</h4>
            <ul className="space-y-2 text-sm font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Player-to-Player Only
              </li>
              <li className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                Rolling Median Valuations
              </li>
              <li>Values in Points (Pts)</li>
              <li>Win / Fair / Loss (W/F/L) Calculator</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© 2026 Dinosaur Simulator Value Tracker. Unofficial fan utility for Roblox Dinosaur Simulator.</p>
          <div className="flex gap-4">
            <span className="text-zinc-400">Values updated by community skin trades</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
