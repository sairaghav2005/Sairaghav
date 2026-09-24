import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrafficChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border-slate-700/50">
          <p className="text-slate-300 text-sm mb-1">{label}</p>
          <p className="text-accent font-medium text-sm">Normal: {payload[0].value}</p>
          <p className="text-danger font-medium text-sm">Malicious: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-4 h-80 flex flex-col">
      <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
        Traffic Flow Overview
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="normal" stroke="#22d3ee" fillOpacity={1} fill="url(#colorNormal)" strokeWidth={2} />
            <Area type="monotone" dataKey="malicious" stroke="#ef4444" fillOpacity={1} fill="url(#colorMalicious)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
