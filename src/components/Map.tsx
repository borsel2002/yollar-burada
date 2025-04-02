import React, { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';
import { getDistance } from 'geolib';
import { 
  Coordinates, 
  ReferencePointStore, 
  MarkerMetadata, 
  Marker as MarkerType, 
  ReferencePoint,
  MarkerFormData,
  markerCategories,
  CategoryColor
} from '../types/types';
import { useUserLocation } from '../hooks/useUserLocation';
import MarkerForm from './MarkerForm';
import CategoryLegend from './CategoryLegend';
import { markerService } from '../services/markerService';
import type { FeatureCollection, LineString } from 'geojson';
import maplibregl from 'maplibre-gl';
import MarkerPopupComponent from './MarkerPopup';

const MapWrapper = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  z-index: 1000;
  padding: 20px;
  text-align: center;
  line-height: 1.6;

  p {
    margin: 10px 0;
  }
`;

const ErrorMessage = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4444;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
`;

const MarkerPopup = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  max-width: 280px;
  min-width: 220px;
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  
  @media (max-width: 768px) {
    max-width: 260px;
    min-width: 200px;
    padding: 12px;
    bottom: 25px;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    
    @media (max-width: 768px) {
      font-size: 15px;
      margin: 0 0 10px 0;
    }
  }

  p {
    margin: 8px 0;
    font-size: 14px;
    line-height: 1.4;
    
    @media (max-width: 768px) {
      font-size: 13px;
      margin: 6px 0;
    }
  }

  button {
    margin-top: 12px;
    padding: 6px 12px;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    
    @media (max-width: 768px) {
      margin-top: 10px;
      padding: 8px 12px;
      font-size: 14px;
    }
    
    &:hover {
      background-color: #ff2222;
    }
  }

  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid white;
  }
`;

const StatusMessage = styled.div`
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  z-index: 1000;
  font-size: 14px;
  max-width: 90%;
  text-align: center;
  
  @media (max-width: 768px) {
    bottom: 60px;
    max-width: 95%;
    font-size: 13px;
    padding: 8px 12px;
  }
`;

const LocationButton = styled.button`
  background: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
  font-size: 16px;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #f0f0f0;
  }
`;

const ControlContainer = styled.div`
  position: absolute;
  top: 120px; 
  right: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const InstructionMessage = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  z-index: 1000;
  font-size: 14px;
  max-width: 80%;
  text-align: center;
  pointer-events: none;
  opacity: 0.8;
  
  @media (max-width: 768px) {
    bottom: 15px;
    max-width: 95%;
    font-size: 12px;
    padding: 6px 12px;
  }
`;

const radiusLayer: LayerProps = {
  id: 'radius-line',
  type: 'line',
  paint: {
    'line-color': '#0080ff',
    'line-width': 2,
    'line-opacity': 0.5,
    'line-dasharray': [2, 2]
  }
};

const MapComponent: React.FC = () => {
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const { location: userLocation, error: locationError, loading: locationLoading, permissionStatus } = useUserLocation();
  const [referencePoint, setReferencePoint] = useState<ReferencePoint | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!userLocation) return;

    try {
      const newReferencePoint: ReferencePoint = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusMeters: 1000
      };

      ReferencePointStore.set(newReferencePoint);
      setReferencePoint(newReferencePoint);
    } catch (error) {
      console.error('Reference point error:', error);
      setMapError('Failed to set reference point');
    }
  }, [userLocation]);

  useEffect(() => {
    const loadGlobalMarkers = async () => {
      try {
        const globalMarkers = markerService.getMarkers();
        setMarkers(globalMarkers);
      } catch (error) {
        console.error('Error loading global markers:', error);
        setMapError('Failed to load global markers');
      }
    };

    loadGlobalMarkers();
  }, []);

  useEffect(() => {
    const unsubscribe = markerService.subscribeToMarkers((updatedMarkers) => {
      setMarkers(updatedMarkers);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Current state:', {
        userLocation,
        locationError,
        locationLoading,
        permissionStatus,
        referencePoint,
        mapError
      });
    }
  }, [userLocation, locationError, locationLoading, permissionStatus, referencePoint, mapError]);

  useEffect(() => {
    if (locationLoading) {
      setStatusMessage('Konum alınıyor...');
    } else if (locationError) {
      setStatusMessage(locationError);
    } else if (mapError) {
      setStatusMessage(mapError);
    } else if (userLocation) {
      setStatusMessage(`Konum alındı: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`);
    } else {
      setStatusMessage('');
    }
  }, [locationLoading, locationError, mapError, userLocation]);

  const getRemainingTime = (marker: MarkerType): string => {
    // If no expiration time, return empty string
    if (!marker.expiresAt) return 'Süresiz';
    
    const currentTime = new Date().getTime();
    const expiresAt = new Date(marker.expiresAt).getTime();
    const remainingMs = expiresAt - currentTime;

    if (remainingMs <= 0) {
      return 'Süresi doldu';
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} saat ${minutes} dakika`;
  };

  const canDeleteMarker = (markerId: string): boolean => {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return false;
    
    // For security purposes, all markers can be deleted in this implementation
    return true;
  };

  const handleDeleteMarker = useCallback(async (markerId: string) => {
    try {
      await markerService.removeMarker(markerId);
      setSelectedMarker(null);
      setStatusMessage('İşaretleme noktası başarıyla silindi');
    } catch (error) {
      console.error('Error removing marker:', error);
      setMapError('İşaretleme noktası silinirken bir hata oluştu');
    }
  }, []);

  const handleMapDoubleClick = useCallback((event: any) => {
    if (!referencePoint) return;

    const clickedCoords: Coordinates = {
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng
    };

    const distance = getDistance(
      { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
      clickedCoords
    );

    if (distance <= 1000) {
      setPendingCoordinates(clickedCoords);
      setShowMarkerForm(true);
    } else {
      setStatusMessage('İşaretleme noktası konumunuzdan en fazla 1km uzaklıkta olabilir.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  }, [referencePoint]);

  const handleMapClick = useCallback(() => {
    // Close marker popup if open
    if (selectedMarker) {
      setSelectedMarker(null);
    }
    
    // Close marker form if open
    if (showMarkerForm) {
      setShowMarkerForm(false);
      setPendingCoordinates(null);
    }
  }, [selectedMarker, showMarkerForm]);

  const handleMarkerSubmit = async (metadata: MarkerMetadata) => {
    if (!pendingCoordinates) return;

    try {
      // Validate coordinates
      if (!pendingCoordinates.latitude || !pendingCoordinates.longitude) {
        throw new Error('Invalid coordinates');
      }

      // Validate metadata
      if (!metadata.name || !metadata.category) {
        throw new Error('Invalid metadata');
      }

      // Create marker form data
      const formData: MarkerFormData = {
        coordinates: pendingCoordinates,
        metadata: metadata
      };

      // Add marker to global service
      await markerService.addMarker(formData);
      
      setShowMarkerForm(false);
      setPendingCoordinates(null);
      setStatusMessage('İşaretleme noktası başarıyla eklendi');
    } catch (error) {
      console.error('Error adding marker:', error);
      setMapError('İşaretleme noktası eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Clear any partial data
      setShowMarkerForm(false);
      setPendingCoordinates(null);
    }
  };

  const handleMapLoad = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Map loaded successfully');
    }
    setMapError(null);
  };

  const handleMapError = (error: any) => {
    console.error('Map loading error:', error);
    setMapError('Failed to load map. Please check your internet connection and try again.');
  };

  const getMarkerColor = (category: string): string => {
    const categoryConfig = markerCategories.find((cat: CategoryColor) => cat.id === category);
    return categoryConfig ? categoryConfig.color : '#808080'; // Default to gray if category not found
  };

  const getMarkerZIndex = (category: string): number => {
    // Prioritize markers by category - danger group has highest priority
    switch (category) {
      case 'accident':
        return 100; // Highest priority
      case 'hazard':
        return 90;
      case 'expensive_gas':
        return 80;
      case 'police':
        return 70;
      case 'camera':
        return 60;
      case 'roadwork':
        return 50;
      case 'traffic':
        return 40;
      case 'garbage_truck':
        return 30;
      case 'other':
        return 10; // Lowest priority
      default:
        return 10;
    }
  };

  const handleGoToUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15
      });
    }
  }, [userLocation]);

  useEffect(() => {
    let pressTimer: NodeJS.Timeout | null = null;
    let startCoords: { x: number, y: number } | null = null;
    const mapElement = document.querySelector('.maplibregl-map');
    
    if (!mapElement) return;
    
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as unknown as TouchEvent;
      if (touchEvent.touches.length !== 1) return;
      
      startCoords = {
        x: touchEvent.touches[0].clientX,
        y: touchEvent.touches[0].clientY
      };
      
      pressTimer = setTimeout(() => {
        if (!mapRef.current || !startCoords) return;
        
        const lngLat = mapRef.current.unproject([startCoords.x, startCoords.y]);
        
        handleMapDoubleClick({
          lngLat: {
            lat: lngLat.lat,
            lng: lngLat.lng
          }
        });
      }, 800); // 800ms long press
    };
    
    const handleTouchEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      startCoords = null;
    };
    
    const handleTouchMove = (e: Event) => {
      const touchEvent = e as unknown as TouchEvent;
      if (!startCoords || !pressTimer) return;
      
      const moveThreshold = 10; // pixels
      const currentX = touchEvent.touches[0].clientX;
      const currentY = touchEvent.touches[0].clientY;
      
      const deltaX = Math.abs(currentX - startCoords.x);
      const deltaY = Math.abs(currentY - startCoords.y);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    
    mapElement.addEventListener('touchstart', handleTouchStart);
    mapElement.addEventListener('touchend', handleTouchEnd);
    mapElement.addEventListener('touchcancel', handleTouchEnd);
    mapElement.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      mapElement.removeEventListener('touchstart', handleTouchStart);
      mapElement.removeEventListener('touchend', handleTouchEnd);
      mapElement.removeEventListener('touchcancel', handleTouchEnd);
      mapElement.removeEventListener('touchmove', handleTouchMove);
      
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }, [handleMapDoubleClick, mapRef]);

  if (locationLoading) {
    let message;
    switch (permissionStatus) {
      case 'prompt':
        message = (
          <>
            <p>Konum izni verilmesi bekleniyor...</p>
            <p>Lütfen tarayıcınızın konum izni isteğini onaylayın.</p>
            <p>Konum izni vermezseniz, varsayılan konum kullanılacaktır.</p>
          </>
        );
        break;
      case 'denied':
        message = (
          <>
            <p>Konum izni reddedildi.</p>
            <p>IP tabanlı konum veya varsayılan konum kullanılacak...</p>
          </>
        );
        break;
      case 'unsupported':
        message = (
          <>
            <p>Tarayıcınız konum hizmetlerini desteklemiyor.</p>
            <p>IP tabanlı konum veya varsayılan konum kullanılacak...</p>
          </>
        );
        break;
      default:
        message = (
          <>
            <p>Konum alınıyor...</p>
            <p>Lütfen bekleyin.</p>
          </>
        );
    }
    return (
      <LoadingOverlay>
        <div style={{ textAlign: 'center' }}>
          {message}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#0080ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      </LoadingOverlay>
    );
  }

  if (locationError) {
    return <ErrorMessage>{locationError}</ErrorMessage>;
  }

  if (!referencePoint) {
    return <LoadingOverlay>Harita yükleniyor... Lütfen bekleyin.</LoadingOverlay>;
  }

  if (mapError) {
    return <ErrorMessage>{mapError}</ErrorMessage>;
  }

  // Helper function to generate circle coordinates
  function generateCircleCoordinates(centerLng: number, centerLat: number, radiusMeters: number): [number, number][] {
    const points = 360; // Number of points to create a smooth circle
    const coordinates: [number, number][] = [];
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      
      // Calculate point at 1km distance
      const lat = centerLat + (radiusMeters / 111320) * Math.cos(angle);
      const lng = centerLng + (radiusMeters / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push([lng, lat]);
    }
    
    return coordinates;
  }

  const radiusGeoJSON: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: generateCircleCoordinates(
            referencePoint?.longitude || 0,
            referencePoint?.latitude || 0,
            1000 // 1km radius
          )
        }
      }
    ]
  };

  return (
    <MapWrapper>
      <Map
        ref={mapRef}
        mapLib={import('maplibre-gl')}
        initialViewState={{
          longitude: referencePoint?.longitude || 0,
          latitude: referencePoint?.latitude || 0,
          zoom: 15
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={{
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: [
                'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: ' Stadia Maps, OpenMapTiles, OpenStreetMap contributors',
              maxzoom: 19
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        }}
        onClick={handleMapClick}
        onDblClick={handleMapDoubleClick}
        onLoad={handleMapLoad}
        onError={handleMapError}
        reuseMaps
        preserveDrawingBuffer
      >
        <NavigationControl position="top-right" />
        
        {/* Radius line */}
        {referencePoint && (
          <Source id="radius" type="geojson" data={radiusGeoJSON}>
            <Layer {...radiusLayer} />
          </Source>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#0080ff',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                transform: 'translate(-12px, -12px)'
              }}
            />
          </Marker>
        )}

        {/* Other markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.coordinates.longitude}
            latitude={marker.coordinates.latitude}
            anchor="bottom"
          >
            <div
              style={{ 
                cursor: 'pointer',
                position: 'relative',
                zIndex: getMarkerZIndex(marker.metadata.category)
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedMarker(marker);
              }}
            >
              <svg
                height="24"
                viewBox="0 0 24 24"
                width="24"
                style={{
                  fill: getMarkerColor(marker.metadata.category),
                  stroke: 'white',
                  strokeWidth: 2,
                  transform: 'translate(-12px, -24px)',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                }}
              >
                <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
              </svg>
            </div>
            {selectedMarker?.id === marker.id && (
              <div style={{ position: 'absolute', zIndex: 3 }}>
                <MarkerPopupComponent
                  marker={marker}
                  onClose={() => setSelectedMarker(null)}
                  onDelete={handleDeleteMarker}
                  canDelete={canDeleteMarker(marker.id)}
                  remainingTime={getRemainingTime(marker)}
                />
              </div>
            )}
          </Marker>
        ))}
      </Map>
      {statusMessage && (
        <StatusMessage>
          {statusMessage}
        </StatusMessage>
      )}
      {showMarkerForm && (
        <MarkerForm
          onSubmit={handleMarkerSubmit}
          onCancel={() => {
            setShowMarkerForm(false);
            setPendingCoordinates(null);
          }}
        />
      )}
      <CategoryLegend />
      <ControlContainer>
        <LocationButton 
          onClick={handleGoToUserLocation}
          disabled={!userLocation || locationLoading}
          title={locationError || 'Konumuma Git'}
        >
          {locationLoading ? '...' : '📍'}
        </LocationButton>
      </ControlContainer>
      <InstructionMessage>
        <p>Haritaya işaret eklemek için çift tıklayın veya mobilde uzun basın.</p>
      </InstructionMessage>
    </MapWrapper>
  );
};

export default MapComponent;
