import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  ShieldAlert,
  Search,
  RefreshCw,
  FileText,
  Database,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const DEMO_CSV_ROWS = [
  {
    Flow_Duration: '1420',
    Total_Fwd_Packets: '4',
    Total_Backward_Packets: '2',
    Flow_Bytes_s: '4200',
    Flow_Packets_s: '120',
    Destination_Port: '80',
    Protocol: 'TCP',
    Source_IP: '192.168.1.105',
    Destination_IP: '10.0.0.1',
    Label: 'BENIGN',
  },
  {
    Flow_Duration: '89000',
    Total_Fwd_Packets: '480',
    Total_Backward_Packets: '12',
    Flow_Bytes_s: '850000',
    Flow_Packets_s: '6400',
    Destination_Port: '80',
    Protocol: 'TCP',
    Source_IP: '185.220.101.5',
    Destination_IP: '10.0.0.15',
    Label: 'DDoS',
  },
  {
    Flow_Duration: '650',
    Total_Fwd_Packets: '2',
    Total_Backward_Packets: '0',
    Flow_Bytes_s: '120',
    Flow_Packets_s: '3070',
    Destination_Port: '22',
    Protocol: 'TCP',
    Source_IP: '45.33.32.156',
    Destination_IP: '10.0.0.22',
    Label: 'PortScan',
  },
  {
    Flow_Duration: '2400',
    Total_Fwd_Packets: '12',
    Total_Backward_Packets: '10',
    Flow_Bytes_s: '15400',
    Flow_Packets_s: '450',
    Destination_Port: '443',
    Protocol: 'TCP',
    Source_IP: '192.168.1.44',
    Destination_IP: '10.0.0.5',
    Label: 'BENIGN',
  },
  {
    Flow_Duration: '45000',
    Total_Fwd_Packets: '140',
    Total_Backward_Packets: '60',
    Flow_Bytes_s: '24000',
    Flow_Packets_s: '1200',
    Destination_Port: '21',
    Protocol: 'TCP',
    Source_IP: '103.251.167.20',
    Destination_IP: '10.0.0.4',
    Label: 'FTP-Patator',
  },
  {
    Flow_Duration: '320',
    Total_Fwd_Packets: '1',
    Total_Backward_Packets: '0',
    Flow_Bytes_s: '64',
    Flow_Packets_s: '3120',
    Destination_Port: '3389',
    Protocol: 'TCP',
    Source_IP: '172.16.0.44',
    Destination_IP: '10.0.0.19',
    Label: 'PortScan',
  },
  {
    Flow_Duration: '1850',
    Total_Fwd_Packets: '8',
    Total_Backward_Packets: '6',
    Flow_Bytes_s: '9200',
    Flow_Packets_s: '320',
    Destination_Port: '53',
    Protocol: 'UDP',
    Source_IP: '192.168.1.99',
    Destination_IP: '10.0.0.1',
    Label: 'BENIGN',
  },
  {
    Flow_Duration: '120000',
    Total_Fwd_Packets: '620',
    Total_Backward_Packets: '24',
    Flow_Bytes_s: '1200000',
    Flow_Packets_s: '7800',
    Destination_Port: '8080',
    Protocol: 'TCP',
    Source_IP: '91.240.118.172',
    Destination_IP: '10.0.0.12',
    Label: 'DoS-Slowloris',
  },
  {
    Flow_Duration: '3200',
    Total_Fwd_Packets: '15',
    Total_Backward_Packets: '12',
    Flow_Bytes_s: '18000',
    Flow_Packets_s: '410',
    Destination_Port: '443',
    Protocol: 'TCP',
    Source_IP: '192.168.1.112',
    Destination_IP: '10.0.0.8',
    Label: 'BENIGN',
  },
  {
    Flow_Duration: '95000',
    Total_Fwd_Packets: '210',
    Total_Backward_Packets: '40',
    Flow_Bytes_s: '420000',
    Flow_Packets_s: '2500',
    Destination_Port: '8080',
    Protocol: 'TCP',
    Source_IP: '89.248.163.12',
    Destination_IP: '10.0.0.2',
    Label: 'Infiltration',
  },
];

const COLORS = {
  DoS: '#ef4444',
  Probe: '#f59e0b',
  R2L: '#8b5cf6',
  U2R: '#e11d48',
  Normal: '#10b981',
};

export default function UploadDatasetPage() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [ingestedStatus, setIngestedStatus] = useState(null);

  // Parse CSV text
  const parseCSVText = (text) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^["']|["']$/g, ''));
    setColumns(headers);

    const rows = lines.slice(1).map((line) => {
      const values = line
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i] : '';
      });
      return obj;
    });

    setParsedData(rows);
    setAnalysisResults(null);
    setIngestedStatus(null);
  };

  // Handle file input
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseCSVText(content);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Load preset demo dataset
  const handleLoadDemo = () => {
    setFile({ name: 'cicids2017_sample_traffic.csv', size: 14200 });
    setColumns(Object.keys(DEMO_CSV_ROWS[0]));
    setParsedData(DEMO_CSV_ROWS);
    setAnalysisResults(null);
    setIngestedStatus(null);
  };

  // Run classification model
  const handleRunAnalysis = async () => {
    if (!parsedData.length) return;
    setAnalyzing(true);
    try {
      const res = await api.post('/dataset/analyze', {
        records: parsedData,
      });
      setAnalysisResults(res.data);
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Export results as CSV
  const handleExportCSV = () => {
    if (!analysisResults?.results?.length) return;

    const headers = [
      'Record_ID',
      'Source_IP',
      'Destination_IP',
      'Protocol',
      'Dest_Port',
      'Prediction',
      'Attack_Type',
      'Confidence',
      'Risk_Level',
      'Flow_Bytes_s',
      'Flow_Packets_s',
    ];

    const csvLines = [headers.join(',')];
    analysisResults.results.forEach((r) => {
      csvLines.push(
        [
          r.record_id,
          r.src_ip,
          r.dst_ip,
          r.protocol,
          r.dest_port,
          r.prediction,
          r.attack_type,
          r.confidence,
          r.risk_level,
          r.flow_bytes_s,
          r.flow_packets_s,
        ].join(',')
      );
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_classified_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ingest attacks into live dashboard alerts
  const handleIngestAlerts = async () => {
    if (!analysisResults?.results) return;

    const attacksToIngest = analysisResults.results
      .filter((r) => r.prediction === 'ATTACK')
      .map((r) => ({
        timestamp: new Date().toISOString(),
        time: new Date().toISOString(),
        src_ip: r.src_ip,
        dst_ip: r.dst_ip,
        attack_category: r.attack_type,
        severity: r.risk_level === 'High' ? 'CRITICAL' : 'HIGH',
        confidence: r.confidence,
      }));

    if (!attacksToIngest.length) {
      setIngestedStatus('No attacks in dataset to ingest.');
      return;
    }

    try {
      const res = await api.post('/alerts/ingest', {
        alerts: attacksToIngest,
      });
      setIngestedStatus(
        `Successfully ingested ${res.data.ingested} threats into Sentinel Intrusion Dashboard!`
      );
    } catch (e) {
      console.error('Failed to ingest alerts:', e);
      setIngestedStatus('Failed to ingest alerts.');
    }
  };

  // Filtered analysis results
  const filteredResults = (analysisResults?.results || []).filter((r) => {
    if (typeFilter !== 'ALL' && r.prediction !== typeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const ip = (r.src_ip || '').toLowerCase();
      const type = (r.attack_type || '').toLowerCase();
      if (!ip.includes(q) && !type.includes(q)) return false;
    }
    return true;
  });

  const chartPieData = analysisResults?.summary?.attack_breakdown
    ? Object.entries(analysisResults.summary.attack_breakdown).map(
        ([name, value]) => ({ name, value })
      )
    : [];

  const riskBarData = analysisResults?.summary?.risk_breakdown
    ? Object.entries(analysisResults.summary.risk_breakdown).map(
        ([risk, count]) => ({ risk, count })
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-600 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Dataset Ingestion &amp; Batch ML Classification
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Upload raw network traffic CSV datasets (CICIDS, NSL-KDD, or custom flows) to run full intrusion analysis
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLoadDemo}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/80 transition-all flex items-center gap-2 whitespace-nowrap shadow-2xs"
        >
          <Database className="w-4 h-4" />
          Load Benchmark Sample Dataset
        </button>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Upload CSV Traffic Dataset
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Accepts CSV files with network flow headers (duration, packet counts, bytes rate, protocol, and ports).
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                Choose CSV or drag &amp; drop
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                .csv format up to 20MB
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {file && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 truncate">
                {file.name}
              </div>
              <div className="text-slate-500 flex justify-between">
                <span>{parsedData.length} records parsed</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={!parsedData.length || analyzing}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Classifying Network Flows...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute Sentinel NIDS ({parsedData.length} rows)
              </>
            )}
          </button>
        </div>

        {/* Dataset Schema & Preview */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Dataset Schema &amp; Data Preview
              </h2>
              {parsedData.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  Showing first {Math.min(parsedData.length, 6)} rows
                </span>
              )}
            </div>

            {parsedData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-lg bg-slate-50/50">
                <Database className="w-8 h-8 opacity-40 mb-2 text-slate-400" />
                <p className="text-xs text-slate-500">No dataset loaded yet.</p>
                <button
                  onClick={handleLoadDemo}
                  className="mt-3 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  Load sample benchmark dataset <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase sticky top-0 border-b border-slate-200 font-bold">
                    <tr>
                      {columns.slice(0, 7).map((col) => (
                        <th key={col} className="px-3 py-2 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedData.slice(0, 6).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {columns.slice(0, 7).map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2 text-slate-800 whitespace-nowrap"
                          >
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {columns.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">
                Detected Features:
              </span>
              {columns.slice(0, 8).map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                >
                  {c}
                </span>
              ))}
              {columns.length > 8 && (
                <span className="text-slate-400">
                  +{columns.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results View */}
      {analysisResults && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Message if Ingested */}
          {ingestedStatus && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{ingestedStatus}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Total Analyzed
                </span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {analysisResults.summary.total.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Normal Traffic
                </span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {analysisResults.summary.normal.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Detected Attacks
                </span>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {analysisResults.summary.attacks.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Attack Infiltration Rate
                </span>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">
                  {analysisResults.summary.attack_rate}
                </div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Attack Types */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Classification Breakdown by Vector
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartPieData}
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {chartPieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[entry.name] || '#3b82f6'}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        color: '#0f172a',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={32}
                      formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Risk Levels */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Threat Risk Level Stratification
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="risk" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        color: '#0f172a',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Action Bar & Results Table */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Classified Flow Records ({filteredResults.length})
                </h3>
              </div>

              <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setTypeFilter('ALL')}
                    className={clsx(
                      'px-2.5 py-1 rounded font-bold transition-colors',
                      typeFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600'
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTypeFilter('ATTACK')}
                    className={clsx(
                      'px-2.5 py-1 rounded font-bold transition-colors',
                      typeFilter === 'ATTACK'
                        ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                        : 'text-slate-600'
                    )}
                  >
                    Attacks
                  </button>
                  <button
                    onClick={() => setTypeFilter('NORMAL')}
                    className={clsx(
                      'px-2.5 py-1 rounded font-bold transition-colors',
                      typeFilter === 'NORMAL'
                        ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200'
                        : 'text-slate-600'
                    )}
                  >
                    Normal
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter IP or Vector..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>

                <button
                  onClick={handleIngestAlerts}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Ingest into Dashboard
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase sticky top-0 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Source IP</th>
                    <th className="px-3 py-2.5">Dest IP</th>
                    <th className="px-3 py-2.5">Proto:Port</th>
                    <th className="px-3 py-2.5">Prediction</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Confidence</th>
                    <th className="px-3 py-2.5">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredResults.map((row) => (
                    <tr
                      key={row.record_id}
                      className={clsx(
                        'hover:bg-slate-50',
                        row.prediction === 'ATTACK'
                          ? 'bg-rose-50/40'
                          : 'bg-transparent'
                      )}
                    >
                      <td className="px-3 py-2 text-slate-400">{row.record_id}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {row.src_ip}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{row.dst_ip}</td>
                      <td className="px-3 py-2">
                        {row.protocol}:{row.dest_port}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={clsx(
                            'font-bold inline-flex items-center gap-1',
                            row.prediction === 'ATTACK'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          )}
                        >
                          {row.prediction === 'ATTACK' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {row.prediction}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-sans font-medium text-slate-800">
                        {row.attack_type}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {((row.confidence || 0.95) * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border',
                            row.risk_level === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : row.risk_level === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
