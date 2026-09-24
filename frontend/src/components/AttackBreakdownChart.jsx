import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  'DoS': '#ef4444',
  'Probe': '#f59e0b',
  'R2L': '#8b5cf6',
  'U2R': '#e11d48',
  'Normal': '#10b981'
};

export default function AttackBreakdownChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="glass-panel p-5 h-80 flex flex-col">
      <div className="mb-2">
        <h3 className="text-slate-900 font-bold text-sm">Attack Vector Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">Classification by signature profile</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#3b82f6'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
