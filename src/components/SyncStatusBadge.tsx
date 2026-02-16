import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Badge } from '@/components/ui/badge';

interface SyncStatusBadgeProps {
  className?: string;
  showWhenEmpty?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  className = '',
  showWhenEmpty = false,
}) => {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, pendingQRCount, syncStatus } = useOfflineQueue();
  const totalPending = pendingCount + pendingQRCount;

  // Syncing state
  if (syncStatus.isSyncing) {
    return (
      <Badge variant="secondary" className={`bg-blue-100 text-blue-700 ${className}`}>
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Syncing...
      </Badge>
    );
  }

  // Offline with pending items
  if (!isOnline && totalPending > 0) {
    return (
      <Badge variant="secondary" className={`bg-yellow-100 text-yellow-700 ${className}`}>
        <CloudOff className="h-3 w-3 mr-1" />
        {totalPending} pending
      </Badge>
    );
  }

  // Offline without pending cards
  if (!isOnline) {
    return (
      <Badge variant="secondary" className={`bg-gray-100 text-gray-600 ${className}`}>
        <CloudOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  }

  // Online with pending items (shouldn't happen often, sync should auto-trigger)
  if (totalPending > 0) {
    return (
      <Badge variant="secondary" className={`bg-yellow-100 text-yellow-700 ${className}`}>
        <Cloud className="h-3 w-3 mr-1" />
        {totalPending} to sync
      </Badge>
    );
  }

  // Online with nothing pending
  if (showWhenEmpty) {
    return (
      <Badge variant="secondary" className={`bg-green-100 text-green-700 ${className}`}>
        <Cloud className="h-3 w-3 mr-1" />
        Synced
      </Badge>
    );
  }

  return null;
};

export default SyncStatusBadge;
