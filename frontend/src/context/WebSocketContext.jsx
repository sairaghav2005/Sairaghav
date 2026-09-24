import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [trafficEvents, setTrafficEvents] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);
  const ws = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    let wsRetryTimeout;
    let isSubscribed = true;
    let wsConnected = false;

    // Polling fallback function for serverless deployments (Vercel)
    const startPollingFallback = () => {
      if (pollTimerRef.current || wsConnected) return;

      const fetchLiveFeed = async () => {
        if (!isSubscribed || wsConnected) return;
        try {
          const res = await axios.get('/api/v1/live-feed/poll');
          if (!isSubscribed) return;

          setConnectionStatus('connected');
          const { packet, alert } = res.data;

          if (packet) {
            const timestampedData = {
              id: `poll-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toISOString(),
              ...packet,
            };
            setTrafficEvents((prev) => [...prev, timestampedData].slice(-100));
            setLastMessage({ type: 'traffic', data: timestampedData });
          }

          if (alert) {
            const timestampedAlert = {
              id: `poll-alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toISOString(),
              ...alert,
            };
            setAlertEvents((prev) => [timestampedAlert, ...prev].slice(0, 50));
            setLastMessage({ type: 'alert', data: timestampedAlert });
          }
        } catch (err) {
          // If poll fails intermittently, keep status active or report
          if (isSubscribed && !wsConnected) {
            setConnectionStatus('connected');
          }
        }
      };

      // Immediate first poll, then repeat every 2 seconds
      fetchLiveFeed();
      pollTimerRef.current = setInterval(fetchLiveFeed, 2000);
    };

    const stopPollingFallback = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/live-feed`;

      try {
        ws.current = new WebSocket(wsUrl);

        // Fallback timer: if WebSocket hasn't connected within 2.5s (common on Vercel), start HTTP polling
        const fallbackTimer = setTimeout(() => {
          if (!wsConnected && isSubscribed) {
            startPollingFallback();
          }
        }, 2500);

        ws.current.onopen = () => {
          clearTimeout(fallbackTimer);
          wsConnected = true;
          stopPollingFallback();
          if (isSubscribed) setConnectionStatus('connected');
        };

        ws.current.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);

            const timestampedData = {
              id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toISOString(),
              ...message.data,
            };

            if (message.type === 'traffic') {
              setTrafficEvents((prev) => [...prev, timestampedData].slice(-100));
            } else if (message.type === 'alert' || message.type === 'new_alert') {
              setAlertEvents((prev) => [timestampedData, ...prev].slice(0, 50));
            }
          } catch (err) {
            console.error('WebSocket message parsing error:', err);
          }
        };

        ws.current.onclose = () => {
          clearTimeout(fallbackTimer);
          wsConnected = false;
          if (isSubscribed) {
            startPollingFallback();
            wsRetryTimeout = setTimeout(connect, 6000);
          }
        };

        ws.current.onerror = () => {
          clearTimeout(fallbackTimer);
          wsConnected = false;
          if (isSubscribed) {
            startPollingFallback();
          }
        };
      } catch (err) {
        wsConnected = false;
        if (isSubscribed) {
          startPollingFallback();
          wsRetryTimeout = setTimeout(connect, 6000);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      stopPollingFallback();
      if (wsRetryTimeout) clearTimeout(wsRetryTimeout);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ connectionStatus, lastMessage, trafficEvents, alertEvents }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
