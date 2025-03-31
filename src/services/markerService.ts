import { Marker, MarkerFormData } from '../types/types';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

export class MarkerService {
  private ws: WebSocket | null = null;
  private markers: Marker[] = [];
  private subscribers: ((markers: Marker[]) => void)[] = [];
  private readonly MAX_MARKERS = 1000;
  private deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.connectWebSocket();
  }

  private getOrCreateDeviceId(): string {
    const storedId = localStorage.getItem('deviceId');
    if (storedId) {
      return storedId;
    }
    const newId = crypto.randomUUID();
    localStorage.setItem('deviceId', newId);
    return newId;
  }

  private connectWebSocket() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data); // Debug log

        if (data.type === 'markers') {
          // Ensure data.data is an array
          if (!Array.isArray(data.data)) {
            console.error('Invalid markers data received:', data);
            return;
          }

          // Filter out expired markers
          const currentTime = new Date().getTime();
          this.markers = data.data.filter((marker: Marker) => {
            if (!marker || !marker.expiresAt) {
              console.warn('Invalid marker data:', marker);
              return false;
            }
            const expiresAt = new Date(marker.expiresAt).getTime();
            return currentTime < expiresAt;
          });
          this.notifySubscribers();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.error('Raw message:', event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      setTimeout(() => this.connectWebSocket(), 5000);
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
        proof: '0x', // Placeholder for proof
        creatorId: this.deviceId,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
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
      const marker = this.markers.find(m => m.id === markerId);
      if (!marker) {
        throw new Error('Marker not found');
      }

      // Check if the marker has expired
      const currentTime = new Date().getTime();
      const expiresAt = new Date(marker.expiresAt).getTime();
      if (currentTime >= expiresAt) {
        throw new Error('Marker has expired');
      }

      // Check if the current device is the creator
      if (marker.creatorId !== this.deviceId) {
        throw new Error('Only the creator can remove this marker');
      }

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

  canRemoveMarker(markerId: string): boolean {
    const marker = this.markers.find(m => m.id === markerId);
    if (!marker) return false;

    // Check if the marker has expired
    const currentTime = new Date().getTime();
    const expiresAt = new Date(marker.expiresAt).getTime();
    if (currentTime >= expiresAt) return true;

    // Check if the current device is the creator
    return marker.creatorId === this.deviceId;
  }

  getMarkers(): Marker[] {
    // Filter out expired markers
    const currentTime = new Date().getTime();
    return this.markers.filter(marker => {
      const expiresAt = new Date(marker.expiresAt).getTime();
      return currentTime < expiresAt;
    });
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

