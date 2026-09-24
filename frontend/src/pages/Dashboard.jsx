import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Target,
  Ban,
  Radio,
  Upload,
  CheckCircle,
  ArrowUpRight,
  ShieldCheck,
  Unlock,
  X,
  Flame,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import TrafficChart from '../components/TrafficChart';
import AttackBreakdownChart from '../components/AttackBreakdownChart';
import AlertsTable from '../components/AlertsTable';
import SimulatorControl from '../components/SimulatorControl';
import SentinelLogo from '../components/SentinelLogo';
import api from '../api/axios';
import { useWebSocket } from '../context/WebSocketContext';
import clsx from 'clsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [blockedIPsList, setBlockedIPsList] = useState([]);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockingInProgress, setBlockingInProgress] = useState(false);
  const { alertEvents } = useWebSocket();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes, blockedRes] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/alerts?page=1&page_size=10'),
        api.get('/firewall/blocked'),
      ]);
      setStats(statsRes.data);
      setRecentAlerts(alertsRes.data.alerts || []);
      setBlockedIPsList(blockedRes.data.blocked || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleBlockIP = async (ip, category = 'Malicious Threat') => {
    setBlockingInProgress(true);
    try {
      await api.post('/firewall/block', {
        ip,
        reason: `Blocked from Security Dashboard on ${category}`,
        attack_category: category,
      });
      await fetchDashboardData();
    } catch (e) {
      console.error('Failed to block IP:', e);
    } finally {
      setBlockingInProgress(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      await api.post('/firewall/unblock', { ip });
      await fetchDashboardData();
    } catch (e) {
      console.error('Failed to unblock IP:', e);
    }
  };

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
    return unique.slice(0, 8);
  }, [recentAlerts, alertEvents]);

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 flex items-center gap-3 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Connecting to Sentinel Intrusion Network...
        </div>
      </div>
    );
  }

  const criticalCount = stats.critical_alerts || 0;
  const threatLevel =
    criticalCount > 3 ? 'CRITICAL' : criticalCount > 0 ? 'ELEVATED' : 'GUARDED';

  const threatColor =
    threatLevel === 'CRITICAL'
      ? 'text-rose-700 border-rose-300 bg-rose-50'
      : threatLevel === 'ELEVATED'
      ? 'text-amber-700 border-amber-300 bg-amber-50'
      : 'text-emerald-700 border-emerald-300 bg-emerald-50';

  return (
    <div className="space-y-6">
      <SimulatorControl />

      {/* Sentinel Command Center Header */}
      <div className="glass-panel p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-gradient-to-r from-white via-white to-blue-50/40">
        <div className="flex items-center gap-4">
          <SentinelLogo size="large" showText={false} />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
                Sentinel Intrusion Network
              </h1>
              <span
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-extrabold rounded-full border',
                  threatColor
                )}
              >
                THREAT POSTURE: {threatLevel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autonomous Cybersecurity Sentinel · Real-Time Deep Packet Inspection &amp; Intrusion Defense
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
          <Link
            to="/monitoring"
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Radio className="w-3.5 h-3.5" />
            Live Packet Feed
          </Link>

          <Link
            to="/upload"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Upload Dataset
          </Link>

          <button
            onClick={() => setShowBlockedModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            Firewall Rules ({blockedIPsList.length})
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Network Flows"
          value={(stats.total_traffic || 0).toLocaleString()}
          icon={Activity}
          color="accent"
        />
        <StatCard
          title="Security Incidents"
          value={(stats.total_alerts || 0).toLocaleString()}
          icon={Shield}
          color="warning"
        />
        <StatCard
          title="Critical Active Threats"
          value={(stats.critical_alerts || 0).toLocaleString()}
          icon={AlertTriangle}
          color="danger"
          trend={stats.critical_alerts > 0 ? 'up' : null}
        />
        <StatCard
          title="Detection Model Accuracy"
          value={`${((stats.model_accuracy || 0.985) * 100).toFixed(1)}%`}
          icon={Target}
          color="success"
        />
      </div>

      {/* Traffic Trends & Attack Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart data={stats.timeline || []} />
        </div>
        <div className="lg:col-span-1">
          <AttackBreakdownChart data={stats.attack_breakdown || {}} />
        </div>
      </div>

      {/* Top Threats & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Threat Actors with 1-click Firewall Block */}
        <div className="lg:col-span-1 glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Active Threat Actors (Source IPs)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                1-Click Mitigation
              </span>
            </div>

            <div className="space-y-2.5">
              {(stats.top_sources || []).map((source) => {
                const isBlocked =
                  source.isBlocked ||
                  blockedIPsList.some((b) => b.ip === source.ip);

                return (
                  <div
                    key={source.ip}
                    className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                        {source.ip}
                        {isBlocked && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-rose-100 text-rose-700 border border-rose-300">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {source.count} malicious signatures detected
                      </div>
                    </div>

                    <div>
                      {isBlocked ? (
                        <button
                          onClick={() => handleUnblockIP(source.ip)}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockIP(source.ip)}
                          disabled={blockingInProgress}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Block
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/monitoring"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 font-semibold"
            >
              Inspect live ingress stream <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Incident Triage Table */}
        <div className="lg:col-span-2">
          <AlertsTable
            alerts={displayAlerts}
            compact={true}
            onStatusUpdate={fetchDashboardData}
          />
        </div>
      </div>

      {/* Blocked IPs Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Boundary Firewall - Active IP Blocks ({blockedIPsList.length})
                </h3>
              </div>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Network traffic originating from these IP addresses is dropped at the ingress filter:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {blockedIPsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No IP addresses currently restricted.
                </div>
              ) : (
                blockedIPsList.map((item) => (
                  <div
                    key={item.ip}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">
                        {item.ip}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.reason} · {new Date(item.blockedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUnblockIP(item.ip)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowBlockedModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
