# Yollar Burada - Privacy-Focused Location Marker App

## 📖 Introduction

Yollar Burada ("Roads Here" in Turkish) is a privacy-focused web application that enables users to mark locations on a map without exposing their coordinates to any server or third party. The application is designed with privacy at its core, featuring client-side encryption, zero-knowledge proofs for location validation, and no collection of personal data.

## 🔍 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Security & Privacy](#-security--privacy)
- [Usage Guide](#-usage-guide)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔒 **Full Privacy**: All location data is processed and encrypted on the client-side
- 📍 **Proximity Validation**: Markers can only be placed within 1km of the user's location, validated with zero-knowledge proofs
- 🌓 **Dark/Light Mode**: Toggle between dark and light themes for comfortable use in any lighting condition
- 🗺️ **MapLibre Integration**: Using open-source MapLibre GL JS with multiple fallback tile sources
- 🏷️ **Categorized Markers**: Organize markers into categories (hazards, warnings, information, etc.)
- 📝 **Encrypted Notes**: Add private notes to markers that are encrypted before storage
- 🌐 **Offline Capability**: Basic functionality works offline with local storage
- 🔄 **Fallback Location**: Default coordinates (Istanbul) when geolocation fails or is denied
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 🧰 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Git

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/borsel2002/yollar-burada.git
   cd yollar-burada
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. Create a `.env` file in the root directory based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

2. Configure the environment variables in the `.env` file:
   ```
   REACT_APP_MAP_STYLE=https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png
   REACT_APP_DARK_MAP_STYLE=https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png
   REACT_APP_FALLBACK_MAP_STYLE=https://{a|b|c}.tile.openstreetmap.org/{z}/{x}/{y}.png
   REACT_APP_DEFAULT_LAT=41.0082
   REACT_APP_DEFAULT_LNG=28.9784
   REACT_APP_DEFAULT_ZOOM=13
   REACT_APP_SERVER_PORT=3001
   ```

## 🖥️ Running the Application

### Development Mode

```bash
npm start
```

This command starts:
- React frontend on port 3000
- Node.js backend server on port 3001 (configurable in .env)

Access the application at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
```

To serve the production build:

```bash
npm run serve
```

## 📁 Project Structure

```
yollar-burada/
├── public/                 # Static files
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── Map.tsx         # Main map component
│   │   ├── MarkerPopup.tsx # Popup for marker details
│   │   ├── MarkerForm.tsx  # Form for adding new markers
│   │   ├── CategoryLegend.tsx # Legend for marker categories
│   │   └── DarkModeToggle.tsx # Dark mode toggle button
│   ├── context/            # React contexts
│   │   └── ThemeContext.tsx # Dark/light mode context
│   ├── hooks/              # Custom React hooks
│   │   └── useUserLocation.tsx # Hook for handling user location
│   ├── services/           # Service modules
│   │   ├── markerService.ts # Marker data management
│   │   └── encryptionService.ts # Encryption utilities
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Entry point
├── server.js               # Node.js backend server
├── markers.json            # Local storage for markers (development only)
├── package.json            # NPM package configuration
└── tsconfig.json           # TypeScript configuration
```

## 🔐 Security & Privacy

### Core Principles

- **Zero Server Knowledge**: The server never receives or stores plaintext coordinates
- **Client-Side Encryption**: All sensitive data is encrypted using Web Crypto API (AES-256-GCM)
- **Zero-Knowledge Proofs**: Location validation without revealing exact coordinates
- **No Personal Data**: No collection of personal identifiers or tracking
- **Local Storage**: Primary data storage happens on the client device

### Technical Implementation

- **Coordinate Encryption**: User coordinates are encrypted before any network transmission
- **Proximity Verification**: The app verifies marker placement within 1km radius without revealing exact coordinates
- **Secure Key Management**: Encryption keys are generated and stored locally
- **No External Dependencies**: Minimal external services to reduce data exposure

## 📝 Usage Guide

1. **Initial Access**:
   - Allow location access when prompted
   - If geolocation fails, you'll be offered a "Use Default Location" button

2. **Map Navigation**:
   - Pan and zoom the map using standard gestures
   - Toggle between dark and light modes using the button in the bottom right corner
   - View the category legend by clicking the info button

3. **Adding Markers**:
   - Press and hold anywhere within the 1km radius circle to place a marker
   - Select a category, add optional name and description
   - Submit to save the marker

4. **Viewing Markers**:
   - Click on any marker to view its details
   - Markers are color-coded based on their category

5. **Managing Markers**:
   - Remove markers by clicking on them and selecting the delete option

## 📦 Deployment

### Server Requirements

- Node.js v14+ environment
- 512MB RAM minimum (1GB recommended)
- 1GB storage space

### Deployment Steps

1. Clone the repository on your server
2. Install dependencies: `npm install --production`
3. Build the application: `npm run build`
4. Configure your environment variables in a `.env` file
5. Start the server: `npm run serve`

### HTTPS Configuration

For production deployment, always use HTTPS. You can use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl;
    server_name yourapp.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Troubleshooting

### Common Issues

#### Map Not Loading
- Check internet connection
- Verify map tile URLs in the environment configuration
- Try fallback map sources by clearing site data

#### Location Access Problems
- Ensure location permissions are granted in your browser
- Try the "Use Default Location" option if geolocation fails
- Check for browser permission policies blocking location access

#### Performance Issues
- Clear browser cache and reload
- Try disabling other extensions that might interfere
- Use the performance-optimized production build

### Support

If you encounter issues not covered in this section, please [open an issue](https://github.com/borsel2002/yollar-burada/issues) on the GitHub repository.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ for privacy and security.
