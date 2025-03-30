export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ReferencePoint extends Coordinates {
  radiusMeters: number;
}

export type MarkerCategory = 'hazard' | 'accident' | 'roadwork' | 'traffic' | 'police' | 'camera' | 'other';

export interface MarkerMetadata {
  name: string;
  category: MarkerCategory;
  description?: string;
}

export interface Marker {
  id: string;
  coordinates: Coordinates;
  metadata: MarkerMetadata;
  timestamp: string;
  proof: string;
  creatorId: string;
}

export interface MarkerFormData {
  coordinates: Coordinates;
  metadata: MarkerMetadata;
}

export interface CategoryColor {
  id: MarkerCategory;
  name: string;
  color: string;
  group: string;
}

export const markerCategories: CategoryColor[] = [
  { id: 'hazard', name: 'Tehlike', color: '#FF4444', group: 'danger' },
  { id: 'accident', name: 'Kaza', color: '#FF4500', group: 'danger' },
  { id: 'roadwork', name: 'Yol Çalışması', color: '#FFA500', group: 'warning' },
  { id: 'traffic', name: 'Trafik', color: '#FFD700', group: 'warning' },
  { id: 'police', name: 'Polis', color: '#0000FF', group: 'info' },
  { id: 'camera', name: 'Kamera', color: '#4169E1', group: 'info' },
  { id: 'other', name: 'Diğer', color: '#808080', group: 'secondary' }
];

export class ReferencePointStore {
  private static referencePoint: ReferencePoint | null = null;

  static set(point: ReferencePoint) {
    this.referencePoint = point;
  }

  static get(): ReferencePoint | null {
    return this.referencePoint;
  }
}
