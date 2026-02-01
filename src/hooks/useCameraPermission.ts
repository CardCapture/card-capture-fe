import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

const CAMERA_PERMISSION_KEY = 'camera_permission_granted';

export function useCameraPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
      setHasPermission(true);
      return true;
    } catch (error) {
      logger.error('Error checking camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const requestPermission = async () => {
    return checkPermission();
  };

  const clearPermission = () => {
    localStorage.removeItem(CAMERA_PERMISSION_KEY);
    setHasPermission(null);
  };

  return {
    hasPermission,
    checkPermission,
    requestPermission,
    clearPermission
  };
} 