/**
 * Online Status Hook
 * Provides real-time online/offline status and sync utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { dataSync } from '../services/dataSync';

interface OnlineStatusState {
  isOnline: boolean;
  lastOnlineAt: Date | null;
  pendingActions: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

export function useOnlineStatus(userId?: string) {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: navigator.onLine,
    lastOnlineAt: navigator.onLine ? new Date() : null,
    pendingActions: 0,
    syncStatus: 'idle',
  });

  // Check pending actions count
  const checkPendingActions = useCallback(async () => {
    const actions = await offlineStorage.getPendingActions();
    const sessions = await offlineStorage.getPendingSessions();
    setState((prev) => ({
      ...prev,
      pendingActions: actions.length + sessions.length,
    }));
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = dataSync.onSyncStatusChange((status) => {
      setState((prev) => ({ ...prev, syncStatus: status }));

      // Refresh pending actions count after sync
      if (status === 'success' || status === 'error') {
        checkPendingActions();
      }
    });

    return unsubscribe;
  }, [checkPendingActions]);

  // Check pending actions on mount and when online
  useEffect(() => {
    checkPendingActions();
  }, [checkPendingActions, state.isOnline]);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!userId || !state.isOnline) return;

    setState((prev) => ({ ...prev, syncStatus: 'syncing' }));
    const result = await dataSync.syncAll(userId);

    setState((prev) => ({
      ...prev,
      syncStatus: result.success ? 'success' : 'error',
    }));

    await checkPendingActions();
    return result;
  }, [userId, state.isOnline, checkPendingActions]);

  return {
    ...state,
    sync,
    checkPendingActions,
  };
}

// Simple hook for just the online status
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
