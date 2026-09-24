import React from 'react';
import clsx from 'clsx';

export default function StatCard({ title, value, icon: Icon, trend, color = 'accent' }) {
  const colorMap = {
    accent: 'text-blue-600 bg-blue-50 border-blue-200/80',
    danger: 'text-rose-600 bg-rose-50 border-rose-200/80',
    warning: 'text-amber-600 bg-amber-50 border-amber-200/80',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
  };

  const selectedColor = colorMap[color] || colorMap.accent;

  return (
    <div className="glass-panel p-5 flex flex-col justify-between transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <div className={clsx("p-2 rounded-lg border", selectedColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded", trend === 'up' ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50')}>
            {trend === 'up' ? '↑ Alert' : '↓ Safe'}
          </span>
        )}
      </div>
    </div>
  );
}
