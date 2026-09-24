import React from 'react';
import clsx from 'clsx';
import { Eye, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/axios';

export default function AlertsTable({
  alerts = [],
  compact = false,
  onStatusUpdate,
}) {
  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200/90 font-bold';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200/90 font-bold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200/90 font-bold';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/90 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 font-bold';
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'investigating':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-slate-900 font-bold text-sm">Security Incidents &amp; Alerts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated detection log from Sentinel NIDS</p>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {alerts.length} logged incidents
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200/80 font-bold">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Source IP</th>
              {!compact && <th className="px-4 py-3">Dest IP</th>}
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              {!compact && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <tr>
                <td
                  colSpan={compact ? 5 : 7}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No active incidents recorded
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
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500">
                      {formattedTime}
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {src}
                    </td>

                    {!compact && (
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {dst}
                      </td>
                    )}

                    <td className="px-4 py-3 font-medium text-slate-800">
                      {alert.attack_category || alert.category || 'Malicious'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-[10px] rounded uppercase border inline-block',
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
                          'text-[11px] rounded px-2 py-1 outline-none font-semibold cursor-pointer border',
                          getStatusStyle(alert.status)
                        )}
                      >
                        <option value="new">New</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>

                    {!compact && (
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-slate-400 hover:text-blue-600 p-1"
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
