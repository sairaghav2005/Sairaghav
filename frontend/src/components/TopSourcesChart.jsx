import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopSourcesChart({ data }) {
  return (
    <div className="glass-panel p-5 h-80 flex flex-col">
      <div className="mb-2">
        <h3 className="text-slate-900 font-bold text-sm">Top Malicious Sources</h3>
        <p className="text-xs text-slate-500 mt-0.5">Frequent offensive originators</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis dataKey="ip" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
