import { Marker } from '../types/types';
import { clearSensitiveData } from '../crypto/encryption';

const API_URL = 'http://localhost:3001/api';

class MarkerService {
  private markers: Marker[] = [];
  private subscribers: ((markers: Marker[]) => void)[] = [];
  private readonly MAX_MARKERS = 1000;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadMarkers();
    this.setupPeriodicSync();
  }

  private async loadMarkers() {
    try {
      const response = await fetch(`${API_URL}/markers`);
      if (!response.ok) throw new Error('Failed to load markers');
      const markers = await response.json();
      this.markers = markers.filter(this.isValidMarker);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error loading markers:', error);
      this.clearAllMarkers();
    }
  }

  private setupPeriodicSync() {
    setInterval(() => {
      this.loadMarkers();
    }, this.SYNC_INTERVAL);
  }

  async addMarker(marker: Marker) {
    try {
      if (!this.isValidMarker(marker)) {
        throw new Error('Invalid marker data');
      }

      const response = await fetch(`${API_URL}/markers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marker),
      });

      if (!response.ok) throw new Error('Failed to add marker');
      
      const newMarker = await response.json();
      this.markers.push(newMarker);
      
      if (this.markers.length > this.MAX_MARKERS) {
        this.markers = this.markers.slice(-this.MAX_MARKERS);
      }
      
      this.notifySubscribers();
    } catch (error) {
      console.error('Error adding marker:', error);
      throw error;
    }
  }

  async removeMarker(markerId: string) {
    try {
      const response = await fetch(`${API_URL}/markers/${markerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove marker');
      
      this.markers = this.markers.filter(marker => marker.id !== markerId);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error removing marker:', error);
      throw error;
    }
  }

  private isValidMarker(marker: Marker): boolean {
    try {
      if (!marker || !marker.id || !marker.encryptedCoordinates || !marker.encryptedMetadata || !marker.timestamp || !marker.proof) {
        return false;
      }

      const coords = JSON.parse(marker.encryptedCoordinates);
      if (!coords.latitude || !coords.longitude) {
        return false;
      }

      const metadata = JSON.parse(marker.encryptedMetadata);
      if (!metadata.name || !metadata.category) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating marker:', error);
      return false;
    }
  }

  getMarkers(): Marker[] {
    return [...this.markers];
  }

  subscribeToMarkers(callback: (markers: Marker[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getMarkers()));
  }

  clearAllMarkers() {
    this.markers = [];
    this.notifySubscribers();
  }

  reset() {
    this.clearAllMarkers();
    clearSensitiveData();
  }
}

export const markerService = new MarkerService();

