import React, { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, Target } from 'lucide-react';
import StatCard from '../components/StatCard';
import TrafficChart from '../components/TrafficChart';
import AttackBreakdownChart from '../components/AttackBreakdownChart';
import TopSourcesChart from '../components/TopSourcesChart';
import AlertsTable from '../components/AlertsTable';
import SimulatorControl from '../components/SimulatorControl';
import api from '../api/axios';
import { useWebSocket } from '../context/WebSocketContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const { alertEvents } = useWebSocket();

  const fetchStats = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/alerts?page=1&page_size=10'),
      ]);
      setStats(statsRes.data);
      setRecentAlerts(alertsRes.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayAlerts = React.useMemo(() => {
    const combined = [...(alertEvents || []), ...(recentAlerts || [])];
    const seen = new Set();
    const unique = [];

    for (const item of combined) {
      const key =
        item.id ||
        `${item.src_ip || item.source_ip}-${item.timestamp || item.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique.slice(0, 10);
  }, [recentAlerts, alertEvents]);

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Loading Security Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimulatorControl />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Traffic"
          value={(stats.total_traffic || 0).toLocaleString()}
          icon={Activity}
          color="accent"
        />
        <StatCard
          title="Total Alerts"
          value={(stats.total_alerts || 0).toLocaleString()}
          icon={Shield}
          color="warning"
        />
        <StatCard
          title="Critical Alerts"
          value={(stats.critical_alerts || 0).toLocaleString()}
          icon={AlertTriangle}
          color="danger"
          trend={stats.critical_alerts > 0 ? 'up' : null}
        />
        <StatCard
          title="Model Accuracy"
          value={`${((stats.model_accuracy || 0) * 100).toFixed(1)}%`}
          icon={Target}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart data={stats.timeline || []} />
        </div>
        <div className="lg:col-span-1">
          <AttackBreakdownChart data={stats.attack_breakdown || {}} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TopSourcesChart data={stats.top_sources || []} />
        </div>
        <div className="lg:col-span-2">
          <AlertsTable
            alerts={displayAlerts}
            compact={true}
            onStatusUpdate={fetchStats}
          />
        </div>
      </div>
    </div>
  );
}
