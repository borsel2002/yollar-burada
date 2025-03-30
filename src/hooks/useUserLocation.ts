import { useState, useEffect } from 'react';
import { Coordinates } from '../types/types';

// Default coordinates (Istanbul, Turkey)
const DEFAULT_COORDINATES: Coordinates = {
  latitude: 41.0082,
  longitude: 28.9784
};

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseUserLocationResult {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionStatus;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum hizmetlerini desteklemiyor.');
      setLoading(false);
      setPermissionStatus('unsupported');
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setError(null);
      setLoading(false);
      setPermissionStatus('granted');
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'Konum alınamadı.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Konum izni reddedildi.';
          setPermissionStatus('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Konum bilgisi mevcut değil.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Konum isteği zaman aşımına uğradı.';
          break;
        default:
          errorMessage = 'Bilinmeyen bir hata oluştu.';
      }
      setError(errorMessage);
      setLoading(false);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then(permissionStatus => {
        setPermissionStatus(permissionStatus.state as PermissionStatus);
        
        if (permissionStatus.state === 'granted') {
          navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
        } else if (permissionStatus.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
        } else {
          setError('Konum izni reddedildi.');
          setLoading(false);
        }
      })
      .catch(() => {
        // If permissions API is not supported, try to get location directly
        navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
      });

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading, permissionStatus };
}
