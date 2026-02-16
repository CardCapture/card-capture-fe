import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

interface OfflineBannerProps {
  className?: string;
}

function formatPendingSummary(cardCount: number, qrCount: number): string {
  const parts: string[] = [];
  if (cardCount > 0) parts.push(`${cardCount} card${cardCount !== 1 ? 's' : ''}`);
  if (qrCount > 0) parts.push(`${qrCount} QR scan${qrCount !== 1 ? 's' : ''}`);
  return parts.join(' and ');
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, pendingQRCount, syncStatus, triggerSync } = useOfflineQueue();

  const totalPending = pendingCount + pendingQRCount;

  // Don't show anything if online and nothing pending
  if (isOnline && totalPending === 0) {
    return null;
  }

  // Show syncing status
  if (isOnline && syncStatus.isSyncing) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Syncing... {syncStatus.progress}%
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

  // Show pending items when online
  if (isOnline && totalPending > 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatPendingSummary(pendingCount, pendingQRCount)} pending sync
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
        {totalPending > 0
          ? `${formatPendingSummary(pendingCount, pendingQRCount)} will sync when you're back online`
          : 'Scans will be saved and synced when you reconnect'
        }
      </p>
    </div>
  );
};

export default OfflineBanner;
