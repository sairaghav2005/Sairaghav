import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Search, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import ConfusionMatrix from '../components/ConfusionMatrix';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/stats/model-metrics');
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  if (!metrics) {
    return <div className="text-slate-400 mt-10">Loading model metrics...</div>;
  }

  const avgPrecision = Object.values(metrics.precision || {}).reduce((a, b) => a + b, 0) / (Object.keys(metrics.precision || {}).length || 1);
  const avgRecall = Object.values(metrics.recall || {}).reduce((a, b) => a + b, 0) / (Object.keys(metrics.recall || {}).length || 1);
  const avgF1 = Object.values(metrics.f1_score || {}).reduce((a, b) => a + b, 0) / (Object.keys(metrics.f1_score || {}).length || 1);

  const featureData = metrics.feature_importances?.slice(0, 15).sort((a,b) => b.importance - a.importance) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Accuracy" value={`${(metrics.accuracy * 100).toFixed(2)}%`} icon={Target} color="success" />
        <StatCard title="Avg Precision" value={`${(avgPrecision * 100).toFixed(2)}%`} icon={CheckCircle} color="accent" />
        <StatCard title="Avg Recall" value={`${(avgRecall * 100).toFixed(2)}%`} icon={Search} color="warning" />
        <StatCard title="Avg F1 Score" value={`${(avgF1 * 100).toFixed(2)}%`} icon={TrendingUp} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConfusionMatrix matrix={metrics.confusion_matrix} labels={metrics.class_labels} />
        
        <div className="glass-panel p-4 h-96 flex flex-col">
          <h3 className="text-slate-200 font-semibold mb-4 text-center">Top Feature Importances</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={60} />
                <RechartsTooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
