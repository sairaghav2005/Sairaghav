import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrafficChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg text-xs">
          <p className="text-slate-500 font-semibold mb-1">{label}</p>
          <p className="text-blue-600 font-bold">Normal Traffic: {payload[0].value.toLocaleString()} pkts</p>
          <p className="text-rose-600 font-bold">Malicious Traffic: {payload[1].value.toLocaleString()} pkts</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-5 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-slate-900 font-bold text-sm">
            Network Ingress Flow &amp; Threat Volume
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time throughput comparison over time</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
            <span className="text-slate-600 font-medium">Normal Flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span className="text-slate-600 font-medium">Attack Ingress</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="normal" stroke="#2563eb" fillOpacity={1} fill="url(#colorNormal)" strokeWidth={2} />
            <Area type="monotone" dataKey="malicious" stroke="#ef4444" fillOpacity={1} fill="url(#colorMalicious)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
