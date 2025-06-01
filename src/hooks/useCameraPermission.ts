import { useState, useEffect } from 'react';

const CAMERA_PERMISSION_KEY = 'camera_permission_granted';

export function useCameraPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    try {
      // First try to get actual camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
        setHasPermission(true);
        setIsChecking(false);
        return true;
      } catch (e) {
        // If we can't get camera access, check stored permission
        const storedPermission = localStorage.getItem(CAMERA_PERMISSION_KEY) === 'true';
        
        // Check actual permission status if available
        let permissionStatus: PermissionStatus | undefined;
        if (navigator.permissions) {
          try {
            permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          } catch (e) {
            // Some browsers don't support the permissions API
            console.log('Permissions API not supported');
          }
        }

        // If we have stored permission or explicit granted status, we're good
        if (storedPermission || permissionStatus?.state === 'granted') {
          setHasPermission(true);
          setIsChecking(false);
          return true;
        }

        // If we have explicit denied status, we're not good
        if (permissionStatus?.state === 'denied') {
          setHasPermission(false);
          setIsChecking(false);
          return false;
        }

        // Otherwise, we need to request permission
        setHasPermission(false);
        setIsChecking(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
      setIsChecking(false);
      return false;
    }
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately since we just needed it for permission
      stream.getTracks().forEach(track => track.stop());
      
      // Store the permission
      localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const clearPermission = () => {
    localStorage.removeItem(CAMERA_PERMISSION_KEY);
    setHasPermission(null);
  };

  return {
    hasPermission,
    isChecking,
    checkPermission,
    requestPermission,
    clearPermission
  };
} 