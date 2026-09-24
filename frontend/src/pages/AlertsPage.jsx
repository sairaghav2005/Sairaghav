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
    search: ''
  });

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        page,
        page_size: 20,
        ...filters
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
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Filter className="w-5 h-5" />
          <h2>Filter Alerts</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select name="severity" onChange={handleFilterChange} value={filters.severity} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-accent focus:border-accent block p-2">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          
          <select name="status" onChange={handleFilterChange} value={filters.status} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-accent focus:border-accent block p-2">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              name="search"
              placeholder="Search IP or Category..."
              onChange={handleFilterChange}
              value={filters.search}
              className="pl-9 p-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-accent focus:border-accent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <AlertsTable alerts={alerts} onStatusUpdate={fetchAlerts} />

      <div className="flex justify-between items-center px-4">
        <span className="text-sm text-slate-400">
          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} alerts
        </span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 glass-panel text-sm text-slate-300 hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={page * 20 >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 glass-panel text-sm text-slate-300 hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
