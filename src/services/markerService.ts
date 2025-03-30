import { Marker, MarkerFormData } from '../types/types';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

class MarkerService {
  private ws: WebSocket | null = null;
  private markers: Marker[] = [];
  private subscribers: ((markers: Marker[]) => void)[] = [];
  private readonly MAX_MARKERS = 1000;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'markers') {
          this.markers = message.data;
          this.notifySubscribers();
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      setTimeout(() => this.initializeWebSocket(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
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

      // The WebSocket connection will handle updating the markers array
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

      // The WebSocket connection will handle updating the markers array
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
    this.markers = [];
  }
}

export const markerService = new MarkerService();

