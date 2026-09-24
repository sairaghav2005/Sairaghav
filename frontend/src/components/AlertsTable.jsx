import React from 'react';
import clsx from 'clsx';
import { Eye } from 'lucide-react';
import api from '../api/axios';

export default function AlertsTable({
  alerts = [],
  compact = false,
  onStatusUpdate,
}) {
  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-danger/20 text-danger border-danger/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse-slow';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'LOW':
        return 'bg-success/20 text-success border-success/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-accent/10 text-accent';
      case 'investigating':
        return 'bg-warning/10 text-warning';
      case 'resolved':
        return 'bg-success/10 text-success';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!id || typeof id !== 'number') return;
    try {
      await api.patch(`/alerts/${id}`, { status: newStatus });
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="glass-panel overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
        <h3 className="text-slate-200 font-semibold">Recent Alerts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Source IP</th>
              {!compact && <th className="px-4 py-3">Dest IP</th>}
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              {!compact && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td
                  colSpan={compact ? 5 : 7}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No alerts found
                </td>
              </tr>
            ) : (
              alerts.map((alert, index) => {
                const src = alert.src_ip || alert.source_ip || 'N/A';
                const dst = alert.dst_ip || alert.dest_ip || 'N/A';
                const timeStr = alert.timestamp || alert.time;
                const formattedTime = timeStr
                  ? new Date(timeStr).toLocaleTimeString()
                  : 'Just now';

                return (
                  <tr
                    key={alert.id || `alert-${index}`}
                    className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{src}</td>
                    {!compact && (
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {dst}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {alert.attack_category || alert.category || 'Malicious'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded border',
                          getSeverityStyle(alert.severity)
                        )}
                      >
                        {alert.severity || 'medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={alert.status || 'new'}
                        onChange={(e) =>
                          handleStatusChange(alert.id, e.target.value)
                        }
                        className={clsx(
                          'text-xs rounded px-2 py-1 outline-none border-none cursor-pointer appearance-none bg-slate-800',
                          getStatusStyle(alert.status)
                        )}
                      >
                        <option value="new">New</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    {!compact && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          className="text-slate-400 hover:text-accent p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
