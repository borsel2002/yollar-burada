import { useState, useEffect } from 'react';
import { Coordinates } from '../types/types';

// Default coordinates (Istanbul, Turkey)
const DEFAULT_COORDINATES: Coordinates = {
  latitude: 41.0082,
  longitude: 28.9784
};

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const getLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get GPS location
        const getGPSLocation = () => {
          return new Promise<Coordinates>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation is not supported by your browser'));
              return;
            }

            timeoutId = setTimeout(() => {
              reject(new Error('GPS location request timed out'));
            }, 10000); // 10 second timeout

            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timeoutId);
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              (error) => {
                clearTimeout(timeoutId);
                reject(error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          });
        };

        // Try to get GPS location first
        try {
          const gpsLocation = await getGPSLocation();
          setLocation(gpsLocation);
          setPermissionStatus('granted');
        } catch (gpsError) {
          console.log('GPS location failed, trying IP-based location:', gpsError);
          setError('GPS konumu alınamadı. IP tabanlı konum deneniyor...');

          // If GPS fails, try IP-based location
          try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) {
              throw new Error('IP location service failed');
            }
            const data = await response.json();
            setLocation({
              latitude: data.latitude,
              longitude: data.longitude
            });
            setError(null);
          } catch (ipError) {
            console.log('IP location failed, using default location:', ipError);
            setError('IP tabanlı konum alınamadı. Varsayılan konum kullanılacak.');
            setLocation(DEFAULT_COORDINATES);
          }
        }
      } catch (error) {
        console.error('Location error:', error);
        setError('Konum alınamadı. Varsayılan konum kullanılacak.');
        setLocation(DEFAULT_COORDINATES);
      } finally {
        setLoading(false);
      }
    };

    // Check permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          setPermissionStatus(permissionStatus.state as 'prompt' | 'granted' | 'denied');
          
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state as 'prompt' | 'granted' | 'denied');
          };
        })
        .catch(() => {
          setPermissionStatus('unsupported');
        });
    }

    getLocation();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    location,
    error,
    loading,
    permissionStatus
  };
}
