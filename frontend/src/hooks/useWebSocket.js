import { useEffect, useRef, useState, useCallback } from 'react';

export default function useWebSocket({ onMetrics, onPipeline, onAlert }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
    };

    ws.onmessage = (e) => {
      try {
        const { type, payload } = JSON.parse(e.data);
        if (type === 'metrics_update') onMetrics?.(payload);
        if (type === 'pipeline_update') onPipeline?.(payload);
        if (type === 'alert_new') onAlert?.(payload);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [onMetrics, onPipeline, onAlert]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { connected };
}
