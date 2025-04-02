import React, { useEffect, useState, useCallback, useRef } from 'react';
import MapLibreMap, { 
  Marker as MapLibreMarker, 
  NavigationControl, 
  ScaleControl,
  GeolocateControl,
  Source,
  Layer,
  AttributionControl
} from 'react-map-gl/maplibre';
import type { LayerProps, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled, { createGlobalStyle } from 'styled-components';
import { getDistance } from 'geolib';
import { useTheme } from '../context/ThemeContext';
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
import MarkerPopup from './MarkerPopup';
// Using unicode icons instead of react-icons

const MapWrapper = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  touch-action: manipulation; /* Improves touch handling */
  overflow: hidden;
`;

const LoadingOverlay = styled.div<{ darkMode: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ darkMode }) => darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};
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

const StatusMessage = styled.div`
  position: fixed;
  bottom: 110px; /* Adjusted to be above the category buttons */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  z-index: 1000;
  font-size: 14px;
  max-width: 80%;
  text-align: center;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const radiusLayer: LayerProps = {
  id: 'radius-line',
  type: 'line',
  paint: {
    'line-color': '#007AFF', /* Apple Maps blue */
    'line-width': 2,
    'line-opacity': 0.5,
    'line-dasharray': [2, 2]
  }
};

// Apple Maps style fill layer for radius
const radiusFillLayer: LayerProps = {
  id: 'radius-fill',
  type: 'fill',
  paint: {
    'fill-color': '#007AFF',
    'fill-opacity': 0.05
  }
};

const MapComponent: React.FC = () => {
  const { darkMode } = useTheme();
  const [showLegend, setShowLegend] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [holdPosition, setHoldPosition] = useState<{x: number, y: number} | null>(null);
  const [previewMarker, setPreviewMarker] = useState<Coordinates | null>(null);
  const [showHoldIndicator, setShowHoldIndicator] = useState(false);
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
    } else {
      // Don't show coordinates when location is obtained
      setStatusMessage('');
    }
  }, [locationLoading, locationError, mapError, userLocation]);

  // Handle mouse/touch down - start the hold timer
  const handleMapMouseDown = useCallback((event: any) => {
    if (!referencePoint || holdTimer) return;
    
    // Get coordinates
    const coords: Coordinates = {
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng
    };
    
    // Check if within radius
    const distance = getDistance(
      { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
      coords
    );
    
    if (distance <= 1000) {
      // Set position for preview
      setHoldPosition({x: event.point.x, y: event.point.y});
      
      // Start timer for hold detection (500ms = half second)
      const timer = setTimeout(() => {
        setPreviewMarker(coords);
        setShowHoldIndicator(true);
        
        // After showing the indicator, wait a bit more before showing the form
        setTimeout(() => {
          setPendingCoordinates(coords);
          setShowMarkerForm(true);
          setShowHoldIndicator(false);
          setPreviewMarker(null);
        }, 400); // Short delay for animation
      }, 500);
      
      setHoldTimer(timer);
    }
  }, [referencePoint, holdTimer]);
  
  // Handle mouse/touch up - clear the timer if the hold wasn't long enough
  const handleMapMouseUp = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setHoldPosition(null);
    setShowHoldIndicator(false);
  }, [holdTimer]);
  
  // Handle mouse/touch move - cancel the operation if the user moves too much
  const handleMapMouseMove = useCallback((event: any) => {
    if (holdPosition && holdTimer) {
      const dx = event.point.x - holdPosition.x;
      const dy = event.point.y - holdPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved more than 10 pixels, cancel the hold
      if (distance > 10) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
        setHoldPosition(null);
        setShowHoldIndicator(false);
      }
    }
  }, [holdPosition, holdTimer]);

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

  const getRemainingTime = (marker: MarkerType): string => {
    const currentTime = new Date().getTime();
    const expiresAt = new Date(marker.expiresAt).getTime();
    const remainingMs = expiresAt - currentTime;

    if (remainingMs <= 0) {
      return 'Süresi doldu';
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMarkerClick = async (marker: MarkerType) => {
    setSelectedMarker(marker);
  };

  const handleDeleteMarker = async () => {
    if (!selectedMarker) return;

    try {
      await markerService.removeMarker(selectedMarker.id);
      setSelectedMarker(null);
      setStatusMessage('Marker başarıyla silindi');
    } catch (error) {
      setMapError('Marker silinirken bir hata oluştu');
      console.error('Error deleting marker:', error);
    }
  };

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
      <LoadingOverlay darkMode={darkMode}>
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
    return <LoadingOverlay darkMode={darkMode}>Harita yükleniyor... Lütfen bekleyin.</LoadingOverlay>;
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
      <MapLibreMap
        ref={mapRef}
        mapLib={maplibregl}
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
                darkMode 
                  ? 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
                  : 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors, © CARTO'
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
        onMouseDown={handleMapMouseDown}
        onTouchStart={handleMapMouseDown}
        onMouseUp={handleMapMouseUp}
        onTouchEnd={handleMapMouseUp}
        onMouseMove={handleMapMouseMove}
        onTouchMove={handleMapMouseMove}
        onLoad={handleMapLoad}
        onError={handleMapError}
        touchZoomRotate={true}
        touchPitch={true}
        dragRotate={true}
        reuseMaps
        preserveDrawingBuffer
        attributionControl={false}
      >
        <AttributionControl position="bottom-left" compact={true} />
        
        {/* Radius line and fill */}
        {referencePoint && (
          <Source id="radius" type="geojson" data={radiusGeoJSON}>
            <Layer {...radiusFillLayer} />
            <Layer {...radiusLayer} />
          </Source>
        )}

        {/* User location marker with Apple Maps style */}
        {userLocation && (
          <MapLibreMarker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#007AFF', /* Apple Maps blue */
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 8px rgba(0,0,0,0.3)',
                transform: 'translate(-12px, -12px)',
                position: 'relative',
              }}
            >
              {/* Pulsing animation ring - Apple Maps style */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid rgba(0, 122, 255, 0.5)',
                  animation: 'pulse 2s infinite',
                }}
              />
            </div>
          </MapLibreMarker>
        )}

        {/* Other markers */}
        {markers.map((marker) => (
          <MapLibreMarker
            key={marker.id}
            longitude={marker.coordinates.longitude}
            latitude={marker.coordinates.latitude}
            anchor="bottom"
          >
            <div
              style={{ cursor: 'pointer' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleMarkerClick(marker);
              }}
            >
              {/* Apple Maps style pin marker */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: 'translate(-12px, -30px)',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: getMarkerColor(marker.metadata.category),
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    border: '2px solid white',
                  }}
                >
                  {/* Category Icon based on marker type */}
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                    {marker.metadata.category === 'hazard' && '⚠️'}
                    {marker.metadata.category === 'accident' && '🚧'}
                    {marker.metadata.category === 'roadwork' && '🚜'}
                    {marker.metadata.category === 'traffic' && '🚦'}
                    {marker.metadata.category === 'police' && '👮'}
                    {marker.metadata.category === 'camera' && '📷'}
                    {marker.metadata.category === 'garbage' && '🚛'}
                    {marker.metadata.category === 'expensive' && '💰'}
                    {marker.metadata.category === 'other' && '❓'}
                  </span>
                </div>
                <div
                  style={{
                    width: '12px',
                    height: '6px',
                    backgroundColor: getMarkerColor(marker.metadata.category),
                    clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                    marginTop: '-2px',
                  }}
                />
              </div>
            </div>
            {selectedMarker?.id === marker.id && (
              <MarkerPopup
                marker={marker}
                onClose={() => setSelectedMarker(null)}
                onDelete={handleDeleteMarker}
                canDelete={markerService.canRemoveMarker(marker.id)}
                remainingTime={getRemainingTime(marker)}
              />
            )}
          </MapLibreMarker>
        ))}
        {/* Hold/drop animation indicator */}
        {showHoldIndicator && previewMarker && (
          <MapLibreMarker
            longitude={previewMarker.longitude}
            latitude={previewMarker.latitude}
            anchor="bottom"
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#007AFF',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              border: '2px solid white',
              animation: 'markerDrop 0.4s ease-out',
              transform: 'translate(-15px, -15px)',
              position: 'relative',
              zIndex: 1000
            }}>
              <span style={{ color: 'white', fontSize: '18px' }}>📍</span>
            </div>
          </MapLibreMarker>
        )}
      </MapLibreMap>
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
      {/* Mobile-optimized controls with Apple Maps style */}
      <MobileCategoryBar />
      <ControlContainer>
        <AppleStyleButton 
          onClick={handleGoToUserLocation}
          disabled={!userLocation || locationLoading}
          title={locationError || 'Konumuma Git'}
          style={{ marginBottom: '10px' }}
        >
          <span style={{ fontSize: '22px', color: '#007AFF' }}>📍</span>
        </AppleStyleButton>
        <AppleStyleButton
          onClick={() => mapRef.current?.resetNorthPitch()}
          title="Kuzeye Döndür"
        >
          <span style={{ fontSize: '22px', color: '#007AFF' }}>🧭</span>
        </AppleStyleButton>
      </ControlContainer>
      
      {/* Toggle for CategoryLegend with Apple Maps style */}
      <LegendToggle onClick={() => setShowLegend(!showLegend)}>
        <span style={{ fontSize: '22px', color: '#007AFF' }}>📊</span>
      </LegendToggle>
      
      {showLegend && <CategoryLegend />}
    </MapWrapper>
  );
};

const AppleStyleButton = styled.button`
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 4px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const ControlContainer = styled.div`
  position: absolute;
  bottom: 100px;
  right: 15px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  @media (max-height: 600px) {
    bottom: 80px;
  }
`;

const LegendToggle = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1000;
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Apple Maps style bottom category bar
const CategoryBarContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryButton = styled.button<{ color: string }>`
  background: white;
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 62px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  border-bottom: 3px solid ${props => props.color};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CategoryButtonIcon = styled.div<{ color: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
  color: white;
  font-weight: bold;
`;

const CategoryButtonText = styled.span`
  font-size: 10px;
  text-align: center;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

// Apple Maps style category bar at the bottom
const MobileCategoryBar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const handleCategorySelect = (categoryId: string) => {
    // In a real implementation, this would filter markers or perform an action
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };
  
  return (
    <CategoryBarContainer>
      {markerCategories.map(category => (
        <CategoryButton 
          key={category.id}
          color={category.color}
          onClick={() => handleCategorySelect(category.id)}
          style={selectedCategory === category.id ? { background: '#f0f0f0' } : {}}
        >
          <CategoryButtonIcon color={category.color}>
            {category.id === 'hazard' && '⚠️'}
            {category.id === 'accident' && '🚧'}
            {category.id === 'roadwork' && '🚜'}
            {category.id === 'traffic' && '🚦'}
            {category.id === 'police' && '👮'}
            {category.id === 'camera' && '📷'}
            {category.id === 'garbage' && '🚛'}
            {category.id === 'expensive' && '💰'}
            {category.id === 'other' && '❓'}
          </CategoryButtonIcon>
          <CategoryButtonText>{category.name}</CategoryButtonText>
        </CategoryButton>
      ))}
    </CategoryBarContainer>
  );
};

// Add global styles for Apple Maps animations
const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.7;
    }
    70% {
      transform: scale(1.2);
      opacity: 0;
    }
    100% {
      transform: scale(0.95);
      opacity: 0;
    }
  }
  
  @keyframes markerDrop {
    0% {
      transform: scale(0.5) translateY(-30px);
      opacity: 0;
    }
    50% {
      transform: scale(1.1) translateY(0);
      opacity: 1;
    }
    75% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes markerPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
  }
  
  * {
    box-sizing: border-box;
  }
`;

const MapComponentWithStyles = () => (
  <>
    <GlobalStyle />
    <MapComponent />
  </>
);

export default MapComponentWithStyles;
