import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import api from '../api/axios';

export default function SimulatorControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/simulator/status');
        setIsRunning(res.data.running);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, []);

  const toggleSimulator = async () => {
    setLoading(true);
    try {
      if (isRunning) {
        await api.post('/simulator/stop');
      } else {
        await api.post('/simulator/start');
      }
      setIsRunning(!isRunning);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-2.5 px-3.5 border border-slate-200/90 shadow-card rounded-xl flex items-center gap-3.5 fixed top-20 right-4 sm:right-8 z-40">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span className="text-xs font-semibold text-slate-700">Traffic Ingress</span>
      </div>
      <button
        onClick={toggleSimulator}
        disabled={loading}
        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${
          isRunning
            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        {isRunning ? 'Pause Sim' : 'Live Sim'}
      </button>
    </div>
  );
}
