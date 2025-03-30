export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ReferencePoint extends Coordinates {
  radiusMeters: number;
}

export type MarkerCategory = 'hazard' | 'incident' | 'service' | 'poi' | 'other';

export interface MarkerMetadata {
  name: string;
  category: MarkerCategory;
  description?: string;
}

export interface Marker {
  id: string;
  encryptedCoordinates: string;
  encryptedMetadata: string;
  timestamp: string;
  proof: string;
}

export class ReferencePointStore {
  private static referencePoint: ReferencePoint | null = null;

  static set(point: ReferencePoint) {
    this.referencePoint = point;
  }

  static get(): ReferencePoint | null {
    return this.referencePoint;
  }
}
