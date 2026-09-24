import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Radio,
  Upload,
  AlertTriangle,
  LogOut,
  User,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import SentinelLogo from './SentinelLogo';
import clsx from 'clsx';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionStatus } = useWebSocket();

  const links = [
    { name: 'Security Dashboard', path: '/', icon: Shield },
    { name: 'Live Monitoring', path: '/monitoring', icon: Radio },
    { name: 'Upload Dataset', path: '/upload', icon: Upload },
    { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Classy Sentinel Intrusion Network Logo */}
          <Link to="/" className="flex items-center gap-2">
            <SentinelLogo />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1.5">
              {links.map(({ name, path, icon: Icon }) => (
                <Link
                  key={name}
                  to={path}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    location.pathname === path
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </Link>
              ))}
            </div>
          </div>

          {/* User & Live status */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-full border border-slate-200/80"
              title={`WebSocket status: ${connectionStatus}`}
            >
              <div
                className={clsx(
                  'w-2 h-2 rounded-full',
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                )}
              />
              <span className="hidden sm:inline font-mono font-semibold text-[11px] text-slate-700">
                {connectionStatus === 'connected' ? 'LIVE FEED' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300/80 flex items-center justify-center text-slate-600 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold hidden sm:inline text-slate-800">
                {user?.username || 'SecOps Admin'}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
