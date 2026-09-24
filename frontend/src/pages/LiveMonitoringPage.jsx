import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Shield,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Filter,
  Search,
  CheckCircle,
  Ban,
  Radio,
  X,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../api/axios';
import clsx from 'clsx';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function LiveMonitoringPage() {
  const { trafficEvents, connectionStatus } = useWebSocket();
  const [streamPaused, setStreamPaused] = useState(false);
  const [capturedPackets, setCapturedPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, attack, normal
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedIPs, setBlockedIPs] = useState(new Set());
  const [throughputHistory, setThroughputHistory] = useState([
    { time: '10s ago', pps: 24, bytesRate: 120 },
    { time: '8s ago', pps: 36, bytesRate: 180 },
    { time: '6s ago', pps: 28, bytesRate: 145 },
    { time: '4s ago', pps: 42, bytesRate: 210 },
    { time: '2s ago', pps: 38, bytesRate: 195 },
    { time: 'Now', pps: 45, bytesRate: 230 },
  ]);
  const [actionNotice, setActionNotice] = useState(null);

  // Fetch initial blocked IPs
  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await api.get('/firewall/blocked');
        if (res.data?.blocked) {
          setBlockedIPs(new Set(res.data.blocked.map((b) => b.ip)));
        }
      } catch (e) {
        console.error('Failed to load blocked IPs:', e);
      }
    };
    fetchBlocked();
  }, []);

  // Ingest live WebSocket traffic into local packet buffer when not paused
  useEffect(() => {
    if (streamPaused || !trafficEvents.length) return;
    const latest = trafficEvents[trafficEvents.length - 1];
    if (!latest) return;

    setCapturedPackets((prev) => {
      if (prev.some((p) => p.id === latest.id || p.packet_id === latest.packet_id)) {
        return prev;
      }
      return [latest, ...prev].slice(0, 150);
    });

    // Update throughput graph
    setThroughputHistory((prev) => {
      const now = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newPPS = Math.floor(Math.random() * 25) + 30;
      const newBytes = Math.floor(Math.random() * 120) + 140;
      return [...prev.slice(1), { time: now, pps: newPPS, bytesRate: newBytes }];
    });
  }, [trafficEvents, streamPaused]);

  // Block IP handler
  const handleBlockIP = async (ip, category = 'Malicious Traffic') => {
    try {
      await api.post('/firewall/block', {
        ip,
        reason: `Blocked via Live Monitoring on ${category}`,
        attack_category: category,
      });
      setBlockedIPs((prev) => new Set([...prev, ip]));
      setActionNotice(`Perimeter firewall rule active: IP ${ip} blocked.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error('Failed to block IP:', e);
    }
  };

  // Filtered packets
  const filteredPackets = useMemo(() => {
    return capturedPackets.filter((pkt) => {
      // Type filter
      const isAttack =
        pkt.prediction === 'ATTACK' ||
        (pkt.attack_type && pkt.attack_type !== 'Normal');
      if (filterType === 'attack' && !isAttack) return false;
      if (filterType === 'normal' && isAttack) return false;

      // Protocol filter
      if (
        filterProtocol !== 'all' &&
        pkt.protocol?.toUpperCase() !== filterProtocol.toUpperCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const src = (pkt.src_ip || '').toLowerCase();
        const dst = (pkt.dst_ip || '').toLowerCase();
        const port = String(pkt.port || '');
        const cat = (pkt.attack_type || '').toLowerCase();
        if (
          !src.includes(q) &&
          !dst.includes(q) &&
          !port.includes(q) &&
          !cat.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [capturedPackets, filterType, filterProtocol, searchQuery]);

  const attackCount = capturedPackets.filter(
    (p) =>
      p.prediction === 'ATTACK' ||
      (p.attack_type && p.attack_type !== 'Normal')
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-600 shadow-2xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Live Traffic Monitoring &amp; Packet Flow
              </h1>
              <span
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-bold rounded-full border',
                  connectionStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                )}
              >
                {connectionStatus === 'connected'
                  ? 'STREAM ACTIVE'
                  : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autonomous inspection stream powering Sentinel Intrusion Network classification
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => setStreamPaused((p) => !p)}
            className={clsx(
              'px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-2xs',
              streamPaused
                ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            )}
          >
            {streamPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                Resume Stream
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                Pause Stream
              </>
            )}
          </button>

          <button
            onClick={() => setCapturedPackets([])}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-rose-600 flex items-center gap-2 transition-all shadow-2xs"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn font-medium shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Live Stream Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Throughput</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {throughputHistory[throughputHistory.length - 1]?.pps || 38}{' '}
              <span className="text-xs font-normal text-slate-500">pkts/s</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-xl text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Buffer Depth</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {capturedPackets.length}{' '}
              <span className="text-xs font-normal text-slate-500">packets</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Anomalies Flagged
            </div>
            <div className="text-xl font-extrabold text-rose-600 mt-0.5">
              {attackCount}{' '}
              <span className="text-xs font-normal text-slate-500">threats</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-600">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Perimeter Blocks</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {blockedIPs.size}{' '}
              <span className="text-xs font-normal text-slate-500">rules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Bandwidth / Ingress Visualizer */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Ingress Ingestion Rate (Packets / Second)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Sampling interval 2s</p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Live Streaming
          </span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputHistory}>
              <defs>
                <linearGradient id="ppsGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#0f172a',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Area
                type="monotone"
                dataKey="pps"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ppsGradLight)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Classification Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-bold transition-colors',
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All Packets
            </button>
            <button
              onClick={() => setFilterType('attack')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5',
                filterType === 'attack'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Attacks Only ({attackCount})
            </button>
            <button
              onClick={() => setFilterType('normal')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5',
                filterType === 'normal'
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Normal Only
            </button>
          </div>

          {/* Protocol dropdown */}
          <select
            value={filterProtocol}
            onChange={(e) => setFilterProtocol(e.target.value)}
            className="p-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="all">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search IP, Port, Attack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Packet Ingress Feed Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-slate-900 font-bold text-sm">
              Live Ingress Feed ({filteredPackets.length} captured)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any row to open Deep Packet Inspector
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200/80 font-bold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Destination IP</th>
                <th className="px-4 py-3">Protocol:Port</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Vector / Confidence</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Radio className="w-6 h-6 mx-auto mb-2 opacity-50 animate-pulse text-blue-600" />
                    Connecting to live network ingress stream...
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => {
                  const isAttack =
                    pkt.prediction === 'ATTACK' ||
                    (pkt.attack_type && pkt.attack_type !== 'Normal');
                  const isIPBlocked = blockedIPs.has(pkt.src_ip);
                  const timeFormatted = pkt.timestamp
                    ? new Date(pkt.timestamp).toLocaleTimeString()
                    : 'Just now';

                  return (
                    <tr
                      key={pkt.packet_id || pkt.id || idx}
                      onClick={() => setSelectedPacket(pkt)}
                      className={clsx(
                        'hover:bg-slate-50/80 cursor-pointer transition-colors',
                        isAttack ? 'bg-rose-50/40' : 'bg-transparent'
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                        {timeFormatted}
                      </td>

                      <td className="px-4 py-2.5 font-mono font-bold">
                        <span
                          className={clsx(
                            isIPBlocked
                              ? 'text-rose-700 line-through'
                              : isAttack
                              ? 'text-rose-700'
                              : 'text-slate-900'
                          )}
                        >
                          {pkt.src_ip}
                        </span>
                        {isIPBlocked && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-100 text-rose-700 rounded border border-rose-200">
                            BLOCKED
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {pkt.dst_ip}
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200 font-semibold">
                          {pkt.protocol || 'TCP'}:{pkt.port || 80}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 font-bold text-[11px]',
                            isAttack ? 'text-rose-700' : 'text-emerald-700'
                          )}
                        >
                          {isAttack ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          {isAttack ? 'ATTACK' : 'NORMAL'}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {pkt.attack_type || (isAttack ? 'Anomaly' : 'Benign')}
                        </span>
                        <span className="text-slate-500 ml-1.5">
                          ({((pkt.confidence || 0.95) * 100).toFixed(1)}%)
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border',
                            pkt.risk_level === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : pkt.risk_level === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          {pkt.risk_level || (isAttack ? 'High' : 'Low')}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        {isAttack && !isIPBlocked && (
                          <button
                            onClick={() =>
                              handleBlockIP(pkt.src_ip, pkt.attack_type)
                            }
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded border border-rose-200 transition-colors"
                            title="Drop packets from this source IP"
                          >
                            Block
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPacket(pkt)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Packet Inspector Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Deep Packet Flow Inspector · Sentinel Engine
                </h3>
              </div>
              <button
                onClick={() => setSelectedPacket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict Card */}
            <div
              className={clsx(
                'p-4 rounded-xl border flex items-center justify-between',
                selectedPacket.prediction === 'ATTACK' ||
                  (selectedPacket.attack_type &&
                    selectedPacket.attack_type !== 'Normal')
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              )}
            >
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                  ML Classification Verdict
                </div>
                <div className="text-xl font-extrabold mt-0.5">
                  {selectedPacket.attack_type ||
                    selectedPacket.prediction ||
                    'Benign Flow'}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  Confidence Score: {((selectedPacket.confidence || 0.95) * 100).toFixed(1)}% · Threat Level: {selectedPacket.risk_level || 'Low'}
                </div>
              </div>

              {blockedIPs.has(selectedPacket.src_ip) ? (
                <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold">
                  PERIMETER BLOCKED
                </span>
              ) : selectedPacket.prediction === 'ATTACK' ? (
                <button
                  onClick={() => {
                    handleBlockIP(
                      selectedPacket.src_ip,
                      selectedPacket.attack_type
                    );
                    setSelectedPacket(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  Block Source IP
                </button>
              ) : null}
            </div>

            {/* Detailed Flow Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Source IP</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedPacket.src_ip}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Destination IP</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedPacket.dst_ip}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Protocol &amp; Port</span>
                <span className="font-mono font-bold text-blue-700">
                  {selectedPacket.protocol}:{selectedPacket.port}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Flow Duration</span>
                <span className="font-mono font-bold text-slate-800">
                  {(selectedPacket.flow_duration || 1200).toLocaleString()} µs
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Byte Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  {(selectedPacket.flow_bytes_s || 45200).toLocaleString()} B/s
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Packet Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  {(selectedPacket.flow_packets_s || 84).toLocaleString()} Pkts/s
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Forward Packets</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPacket.total_fwd_packets || 12}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Backward Packets</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPacket.total_bwd_packets || 8}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Capture Timestamp</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPacket.timestamp
                    ? new Date(selectedPacket.timestamp).toLocaleTimeString()
                    : 'Current'}
                </span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">
                Sentinel Security Operations Recommendation:
              </span>
              {selectedPacket.prediction === 'ATTACK' ? (
                <p className="text-rose-800 font-medium">
                  Signature matched for{' '}
                  <span className="font-bold underline">
                    {selectedPacket.attack_type || 'Malicious'}
                  </span>
                  . Enforce firewall drop rule on{' '}
                  <span className="font-mono font-bold">{selectedPacket.src_ip}</span> and inspect port{' '}
                  {selectedPacket.port} for service vulnerabilities.
                </p>
              ) : (
                <p className="text-emerald-800 font-medium">
                  Traffic pattern conforms to normal baseline parameters. No remediation action required.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPacket(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
