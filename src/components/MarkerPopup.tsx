import React from 'react';
import styled from 'styled-components';
import { Marker, markerCategories } from '../types/types';

interface MarkerPopupProps {
  marker: Marker;
  onClose: () => void;
  onDelete: (markerId: string) => void;
  canDelete: boolean;
  remainingTime: string;
}

const PopupContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  max-width: 300px;
  margin-bottom: 10px;
  position: relative;
  
  @media (max-width: 768px) {
    min-width: 180px;
    max-width: 260px;
    padding: 10px;
  }
  
  @media (max-width: 480px) {
    min-width: 160px;
    max-width: 240px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    font-size: 18px;
    width: 28px;
    height: 28px;
  }
  
  &:hover {
    color: #000;
  }
`;

const Title = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  padding-right: 20px;
  
  @media (max-width: 768px) {
    font-size: 15px;
    margin: 0 0 6px 0;
  }
`;

const Description = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 13px;
    margin: 6px 0;
  }
`;

const CategoryBadge = styled.span<{ color: string }>`
  background-color: ${props => props.color};
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-block;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 11px;
    padding: 2px 6px;
    margin-bottom: 6px;
  }
`;

const Timestamp = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 6px;
  }
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 12px;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
    margin-top: 8px;
  }
  
  &:hover {
    background: #ff2222;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ExpiryInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
  
  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 4px;
  }
`;

const MarkerPopup: React.FC<MarkerPopupProps> = ({ 
  marker, 
  onClose, 
  onDelete, 
  canDelete,
  remainingTime
}) => {
  const categoryInfo = markerCategories.find(cat => cat.id === marker.metadata.category) || 
    { name: 'Diğer', color: '#808080' };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PopupContainer>
      <CloseButton onClick={onClose}>×</CloseButton>
      <Title>{marker.metadata.name}</Title>
      <CategoryBadge color={categoryInfo.color}>{categoryInfo.name}</CategoryBadge>
      
      {marker.metadata.description && (
        <Description>{marker.metadata.description}</Description>
      )}
      
      <Timestamp>Eklenme: {formatDate(marker.timestamp)}</Timestamp>
      
      <ExpiryInfo>
        Kalan süre: {remainingTime}
      </ExpiryInfo>
      
      {canDelete && (
        <DeleteButton onClick={() => onDelete(marker.id)}>
          Sil
        </DeleteButton>
      )}
    </PopupContainer>
  );
};

export default MarkerPopup;