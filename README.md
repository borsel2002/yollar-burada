# Secure Private Marker Map

A privacy-focused web application for securely marking locations without exposing coordinates to servers or third parties.

## Features

- 🔒 **Privacy First**: All location data is encrypted client-side
- 📍 **Location Validation**: Markers must be within 1km of user's location
- 🗺️ **Platform-Specific Maps**:
  - iOS: Apple Maps
  - Android: Google Maps
  - Others: MapLibre GL
- 🏷️ **Marker Categories**: Organize markers by type (hazard, point of interest, etc.)
- 📝 **Encrypted Notes**: Add private notes to markers
- ⚡ **Zero-Knowledge Proofs**: Validate marker placement without revealing coordinates

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Google Maps API key (required for Android)

3. Start the development server:
   ```bash
   npm start
   ```

## Security Features

- End-to-end encryption using Web Crypto API (AES-256-GCM)
- Zero-knowledge proofs for location validation
- No server-side storage of plaintext coordinates
- Client-side key management
- No personal data collection

## Usage

1. Allow location access when prompted
2. Click anywhere within the 1km radius to place a marker
3. Fill in marker details:
   - Name
   - Category
   - Optional description
4. Marker data is encrypted before storage

## Technical Stack

- React with TypeScript
- MapLibre GL / Google Maps / Apple Maps
- Web Crypto API for encryption
- Geolib for distance calculations

## Privacy Considerations

- All location data is encrypted before leaving the device
- The server never receives plaintext coordinates
- No tracking or analytics
- No personal identifiers stored

## License

MIT
