import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import UploadDatasetPage from './pages/UploadDatasetPage';
import AlertsPage from './pages/AlertsPage';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/monitoring"
            element={
              <AppLayout>
                <LiveMonitoringPage />
              </AppLayout>
            }
          />
          <Route
            path="/upload"
            element={
              <AppLayout>
                <UploadDatasetPage />
              </AppLayout>
            }
          />
          <Route
            path="/alerts"
            element={
              <AppLayout>
                <AlertsPage />
              </AppLayout>
            }
          />
          {/* Redirect /metrics or any unknown routes to Security Dashboard */}
          <Route path="/metrics" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
