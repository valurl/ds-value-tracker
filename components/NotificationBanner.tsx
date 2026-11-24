'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NotificationBannerProps {
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
}

export function NotificationBanner({ type, title, message, onClose }: NotificationBannerProps) {
  const styles = {
    success: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200',
    info: 'bg-cyan-950/80 border-cyan-700/80 text-cyan-200',
    error: 'bg-rose-950/80 border-rose-700/80 text-rose-200',
  }[type];

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
  }[type];

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md shadow-lg flex items-start gap-3 transition-all ${styles}`}>
      {icons}
      <div className="flex-1 text-sm">
        <h4 className="font-bold leading-tight">{title}</h4>
        <p className="mt-0.5 opacity-90 text-xs sm:text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
