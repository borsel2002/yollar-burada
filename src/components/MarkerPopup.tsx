import React from 'react';
import styled from 'styled-components';
import { Marker, markerCategories } from '../types/types';
import { useTheme } from '../context/ThemeContext';

interface MarkerPopupProps {
  marker: Marker;
  onClose: () => void;
  onDelete: () => Promise<void>;
  canDelete: boolean;
  remainingTime: string;
}

const PopupContainer = styled.div<{ darkMode: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ darkMode }) => darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)'};
  padding: 16px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  width: 280px;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
  max-height: 350px;
  overflow-y: auto;
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};
  
  /* Popup arrow/triangle */
  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 16px;
    height: 16px;
    background-color: ${({ darkMode }) => darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
    box-shadow: 4px 4px 5px rgba(0, 0, 0, 0.1);
  }
  
  /* Ensure popup arrow doesn't show scrollbar */
  &:before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: ${({ darkMode }) => darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
    z-index: -1;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
  }
`;

const Title = styled.h3<{ darkMode: boolean }>`
  margin: 0 0 8px 0;
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : '#333'};
  font-size: 16px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  text-align: center;
`;

const Description = styled.p<{ darkMode: boolean }>`
  margin: 8px 0 12px 0;
  color: ${({ darkMode }) => darkMode ? '#aaa' : '#666'};
  font-size: 14px;
  line-height: 1.4;
  max-height: 100px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 0;
  
  /* Hide scrollbar for clean look */
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`;

const Category = styled.div<{ darkMode: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: ${({ darkMode }) => darkMode ? '#333' : '#f5f5f7'};
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : '#333'};
  margin: 0 auto 12px;
  width: fit-content;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-top: 15px;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  background: ${props => props.variant === 'danger' ? '#ff3b30' : '#007AFF'};
  color: white;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const TimeInfo = styled.div<{ darkMode: boolean }>`
  color: ${({ darkMode }) => darkMode ? '#aaa' : '#666'};
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
  padding: 4px 8px;
  background: ${({ darkMode }) => darkMode ? '#333' : '#f5f5f7'};
  border-radius: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

// Helper function to get the appropriate icon for the marker category
const getMarkerIcon = (category: string): JSX.Element => {
  switch (category) {
    case 'hazard':
      return <span role="img" aria-label="hazard">⚠️</span>;
    case 'accident':
      return <span role="img" aria-label="accident">🚧</span>;
    case 'roadwork':
      return <span role="img" aria-label="roadwork">🚜</span>;
    case 'traffic':
      return <span role="img" aria-label="traffic">🚦</span>;
    case 'police':
      return <span role="img" aria-label="police">👮</span>;
    case 'camera':
      return <span role="img" aria-label="camera">📷</span>;
    case 'garbage':
      return <span role="img" aria-label="garbage truck">🚛</span>;
    case 'expensive':
      return <span role="img" aria-label="expensive">💰</span>;
    default:
      return <span role="img" aria-label="other">❓</span>;
  }
};

const MarkerPopup: React.FC<MarkerPopupProps> = ({
  marker,
  onClose,
  onDelete,
  canDelete,
  remainingTime
}) => {
  const { darkMode } = useTheme();
  // Find category information
  const categoryInfo = markerCategories.find(cat => cat.id === marker.metadata.category);
  
  return (
    <PopupContainer darkMode={darkMode}>
      <Title darkMode={darkMode}>{marker.metadata.name}</Title>
      <Category darkMode={darkMode}>
        {getMarkerIcon(marker.metadata.category)}
        <span style={{ marginLeft: '6px' }}>{categoryInfo?.name || marker.metadata.category}</span>
      </Category>
      {marker.metadata.description && (
        <Description darkMode={darkMode}>{marker.metadata.description}</Description>
      )}
      <TimeInfo darkMode={darkMode}>
        <span role="img" aria-label="time">⏰</span> {remainingTime}
      </TimeInfo>
      <ButtonContainer>
        {canDelete && (
          <Button variant="danger" onClick={onDelete}>
            Sil
          </Button>
        )}
        <Button onClick={onClose}>
          Kapat
        </Button>
      </ButtonContainer>
    </PopupContainer>
  );
};

export default MarkerPopup; 