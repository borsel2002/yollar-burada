import React, { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
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
  padding: 12px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  max-width: 200px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
  }

  p {
    margin: 4px 0;
    font-size: 14px;
  }
`;

const StatusMessage = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
  font-size: 14px;
  max-width: 80%;
  text-align: center;
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

  const handleMapClick = useCallback((event: any) => {
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
      alert('İşaretleme noktası konumunuzdan en fazla 1km uzaklıkta olabilir.');
    }
  }, [referencePoint]);

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

  const handleGoToUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15
      });
    }
  }, [userLocation]);

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
              attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap contributors'
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
              style={{ cursor: 'pointer' }}
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
              <MarkerPopup>
                <h3>{marker.metadata.name}</h3>
                <p><strong>Kategori:</strong> {marker.metadata.category}</p>
                {marker.metadata.description && (
                  <p><strong>Açıklama:</strong> {marker.metadata.description}</p>
                )}
                <p><strong>Eklenme Tarihi:</strong> {new Date(marker.timestamp).toLocaleString('tr-TR')}</p>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await markerService.removeMarker(marker.id);
                      setSelectedMarker(null);
                      setStatusMessage('İşaretleme noktası başarıyla silindi');
                    } catch (error) {
                      console.error('Error removing marker:', error);
                      setMapError('İşaretleme noktası silinirken bir hata oluştu');
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Sil
                </button>
              </MarkerPopup>
            )}
          </Marker>
        ))}
      </Map>
      {statusMessage && <StatusMessage>{statusMessage}</StatusMessage>}
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
    </MapWrapper>
  );
};

const LocationButton = styled.button`
  background: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  font-size: 18px;

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
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

export default MapComponent;
