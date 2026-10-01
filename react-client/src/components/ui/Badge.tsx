'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-lg border backdrop-blur-md ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
