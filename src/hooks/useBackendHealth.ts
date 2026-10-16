import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient';

export type HealthStatus = 'checking' | 'online' | 'offline';

export interface BackendHealth {
  status: HealthStatus;
  uptime: string | null;
  environment: string | null;
  lastChecked: Date | null;
  isOnline: boolean;
  check: () => Promise<void>;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

export function useBackendHealth(): BackendHealth {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [uptime, setUptime] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const data = await apiClient.checkHealth();
      if (data?.status === 'ok') {
        setStatus('online');
        setUptime(data.uptime ?? null);
        setEnvironment(data.environment ?? null);
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    check();

    timerRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);

  return {
    status,
    uptime,
    environment,
    lastChecked,
    isOnline: status === 'online',
    check,
  };
}
