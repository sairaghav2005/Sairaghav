import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [trafficEvents, setTrafficEvents] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    let timeoutId;
    let isSubscribed = true;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/live-feed`;

      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
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
          if (isSubscribed) {
            setConnectionStatus('disconnected');
            timeoutId = setTimeout(connect, 3000);
          }
        };

        ws.current.onerror = () => {
          if (isSubscribed) setConnectionStatus('error');
        };
      } catch (err) {
        if (isSubscribed) {
          setConnectionStatus('error');
          timeoutId = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (timeoutId) clearTimeout(timeoutId);
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
