import React, { useState, useEffect } from 'react';
import AlertsTable from '../components/AlertsTable';
import api from '../api/axios';
import { Filter, Search } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    severity: '',
    attack_category: '',
    status: '',
    search: '',
  });

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        page,
        page_size: 20,
        ...filters,
      });
      const res = await api.get(`/alerts?${params}`);
      setAlerts(res.data.alerts);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base">
              Sentinel Incident Filter &amp; Log
            </h2>
            <p className="text-xs text-slate-500">
              Filter recorded threat signatures and triage active alerts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            name="severity"
            onChange={handleFilterChange}
            value={filters.severity}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:outline-none focus:border-blue-600 block p-2 font-medium"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            name="status"
            onChange={handleFilterChange}
            value={filters.status}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:outline-none focus:border-blue-600 block p-2 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="search"
              placeholder="Search IP or Category..."
              onChange={handleFilterChange}
              value={filters.search}
              className="pl-9 p-2 bg-white border border-slate-300 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-blue-600 w-full md:w-60"
            />
          </div>
        </div>
      </div>

      <AlertsTable alerts={alerts} onStatusUpdate={fetchAlerts} />

      {/* Pagination */}
      <div className="flex justify-between items-center px-2">
        <span className="text-xs text-slate-500 font-medium">
          Showing {total > 0 ? (page - 1) * 20 + 1 : 0} to{' '}
          {Math.min(page * 20, total)} of {total} alerts
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
          >
            Previous
          </button>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
