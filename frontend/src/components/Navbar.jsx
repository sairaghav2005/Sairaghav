import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, AlertTriangle, Target, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import clsx from 'clsx';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionStatus } = useWebSocket();

  const links = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
    { name: 'Metrics', path: '/metrics', icon: Target },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-slate-700/50 rounded-none bg-cards/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 text-accent">
            <Shield className="w-8 h-8" />
            <span className="font-bold text-xl tracking-wider text-slate-100">NIDS<span className="text-accent">DASH</span></span>
          </div>

          <div className="hidden md:block">
            <div className="flex items-baseline space-x-4">
              {links.map(({ name, path, icon: Icon }) => (
                <Link
                  key={name}
                  to={path}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                    location.pathname === path
                      ? 'bg-slate-800 text-accent'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400" title={`WS Status: ${connectionStatus}`}>
              <div className={clsx(
                "w-2.5 h-2.5 rounded-full",
                connectionStatus === 'connected' ? 'bg-success animate-pulse-slow' : 'bg-danger'
              )} />
              <span className="hidden sm:inline">Live</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-300 border-l border-slate-700 pl-4">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-accent transition-colors rounded-full hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
