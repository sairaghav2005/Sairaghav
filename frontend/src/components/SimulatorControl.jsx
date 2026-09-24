import React, { useState, useEffect } from 'react';
import { Play, Square, Settings2 } from 'lucide-react';
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
    <div className="glass-panel p-3 flex items-center gap-4 fixed top-24 right-4 sm:right-8 z-40 bg-cards/90">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-slate-500'}`} />
        <span className="text-xs font-medium text-slate-300">Simulator</span>
      </div>
      <button
        onClick={toggleSimulator}
        disabled={loading}
        className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
          isRunning 
            ? 'bg-danger/20 text-danger hover:bg-danger/30' 
            : 'bg-success/20 text-success hover:bg-success/30'
        }`}
      >
        {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
