import { Marker, MarkerFormData } from '../types/types';

const API_URL = 'http://localhost:3001/api';

class MarkerService {
  private ws: WebSocket | null = null;
  private markers: Marker[] = [];
  private subscribers: ((markers: Marker[]) => void)[] = [];
  private readonly MAX_MARKERS = 1000;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.clearMarkers();
    this.setupPeriodicSync();
  }

  private async clearMarkers(): Promise<void> {
    try {
      await fetch(`${API_URL}/markers`, {
        method: 'DELETE'
      });
      this.markers = [];
    } catch (error) {
      console.error('Error clearing markers:', error);
    }
  }

  private async loadMarkers(): Promise<Marker[]> {
    try {
      const response = await fetch(`${API_URL}/markers`);
      if (!response.ok) {
        throw new Error('Failed to load markers');
      }
      this.markers = await response.json();
      return this.markers;
    } catch (error) {
      console.error('Error loading markers:', error);
      return [];
    }
  }

  private setupPeriodicSync() {
    setInterval(() => {
      this.loadMarkers();
    }, this.SYNC_INTERVAL);
  }

  async addMarker(formData: MarkerFormData): Promise<void> {
    try {
      const marker: Marker = {
        id: crypto.randomUUID(),
        coordinates: formData.coordinates,
        metadata: formData.metadata,
        timestamp: new Date().toISOString(),
        proof: crypto.randomUUID(),
        creatorId: crypto.randomUUID() // In a real app, this would be the user's ID
      };

      const response = await fetch(`${API_URL}/markers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marker),
      });

      if (!response.ok) {
        throw new Error('Failed to add marker');
      }

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

  async removeMarker(markerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/markers/${markerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove marker');
      }

      this.markers = this.markers.filter(marker => marker.id !== markerId);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error removing marker:', error);
      throw error;
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

  reset() {
    this.clearMarkers();
  }
}

export const markerService = new MarkerService();

