import React from 'react';
import clsx from 'clsx';

export default function StatCard({ title, value, icon: Icon, trend, color = 'accent' }) {
  const colorMap = {
    accent: 'text-accent bg-accent/10 border-accent/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    success: 'text-success bg-success/10 border-success/20',
  };

  const selectedColor = colorMap[color] || colorMap.accent;

  return (
    <div className="glass-panel p-6 flex flex-col justify-between hover:bg-slate-800/80 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <div className={clsx("p-2 rounded-lg border", selectedColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-100">{value}</span>
        {trend && (
          <span className={clsx("text-xs font-semibold", trend === 'up' ? 'text-success' : 'text-danger')}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
}
