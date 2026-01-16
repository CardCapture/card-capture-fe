import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

interface OfflineBannerProps {
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, syncStatus, triggerSync } = useOfflineQueue();

  // Don't show anything if online and no pending cards
  if (isOnline && pendingCount === 0) {
    return null;
  }

  // Show syncing status
  if (isOnline && syncStatus.isSyncing) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Syncing cards... {syncStatus.progress}%
          </span>
        </div>
        {syncStatus.currentCard && (
          <p className="text-xs text-blue-600 mt-1 ml-6">
            Uploading card for {syncStatus.currentCard.eventName}
          </p>
        )}
      </div>
    );
  }

  // Show pending cards when online
  if (isOnline && pendingCount > 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">
              {pendingCount} card{pendingCount !== 1 ? 's' : ''} pending sync
            </span>
          </div>
          <button
            onClick={triggerSync}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors"
          >
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  // Show offline banner
  return (
    <div className={`bg-gray-100 border border-gray-300 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 text-gray-700">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You're offline
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1 ml-6">
        {pendingCount > 0
          ? `${pendingCount} card${pendingCount !== 1 ? 's' : ''} will sync when you're back online`
          : 'Cards will be saved and synced when you reconnect'
        }
      </p>
    </div>
  );
};

export default OfflineBanner;
