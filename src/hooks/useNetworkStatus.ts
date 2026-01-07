import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network, type ConnectionStatus } from '@capacitor/network';

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
  });

  const updateNetworkState = useCallback((status: ConnectionStatus) => {
    setNetworkState({
      isOnline: status.connected,
      connectionType: status.connectionType,
    });
  }, []);

  useEffect(() => {
    // For native platforms, use Capacitor Network plugin
    if (Capacitor.isNativePlatform()) {
      // Get initial status
      Network.getStatus().then(updateNetworkState);

      // Listen for changes
      const listener = Network.addListener('networkStatusChange', updateNetworkState);

      return () => {
        listener.then(l => l.remove());
      };
    } else {
      // For web, use browser APIs
      const handleOnline = () => {
        setNetworkState(prev => ({ ...prev, isOnline: true }));
      };

      const handleOffline = () => {
        setNetworkState(prev => ({ ...prev, isOnline: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [updateNetworkState]);

  return networkState;
}
