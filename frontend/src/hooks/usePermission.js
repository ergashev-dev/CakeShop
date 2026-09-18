import { useState, useCallback } from 'react';

/**
 * Hook to manage permissions (location, camera, microphone, notification).
 * Never forces permission and cleanly handles denied, granted, and prompt states.
 */
export function usePermission() {
  const [permissionState, setPermissionState] = useState({
    location: 'prompt', // 'prompt' | 'granted' | 'denied' | 'unavailable'
    camera: 'prompt',
    microphone: 'prompt',
    notification:
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'prompt',
  });

  // 1. Request Geolocation
  const requestLocation = useCallback((options = { enableHighAccuracy: true, timeout: 10000 }) => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        setPermissionState((prev) => ({ ...prev, location: 'unavailable' }));
        return reject(new Error('unavailable'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionState((prev) => ({ ...prev, location: 'granted' }));
          resolve(position);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState((prev) => ({ ...prev, location: 'denied' }));
            reject(new Error('denied'));
          } else {
            setPermissionState((prev) => ({ ...prev, location: 'not_found' }));
            reject(new Error('not_found'));
          }
        },
        options
      );
    });
  }, []);

  // 2. Request Camera
  const requestCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('unavailable');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Release stream immediately after permission check
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState((prev) => ({ ...prev, camera: 'granted' }));
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState((prev) => ({ ...prev, camera: 'denied' }));
        throw new Error('denied');
      }
      throw err;
    }
  }, []);

  // 3. Request Microphone (Voice Search)
  const requestMicrophone = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('unavailable');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState((prev) => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState((prev) => ({ ...prev, microphone: 'denied' }));
        throw new Error('denied');
      }
      throw err;
    }
  }, []);

  // 4. Request Notifications
  const requestNotification = useCallback(async () => {
    if (!('Notification' in window)) {
      setPermissionState((prev) => ({ ...prev, notification: 'unavailable' }));
      throw new Error('unavailable');
    }
    try {
      const permission = await Notification.requestPermission();
      setPermissionState((prev) => ({ ...prev, notification: permission }));
      if (permission === 'granted') {
        return true;
      } else {
        throw new Error(permission);
      }
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    permissionState,
    requestLocation,
    requestCamera,
    requestMicrophone,
    requestNotification,
  };
}

export default usePermission;
