import React from 'react';
import styled from 'styled-components';
import { Marker } from '../types/types';

interface MarkerPopupProps {
  marker: Marker;
  onClose: () => void;
  onDelete: () => Promise<void>;
  canDelete: boolean;
  remainingTime: string;
}

const PopupContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 400px;
  width: 90%;
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
`;

const Description = styled.p`
  margin: 0 0 15px 0;
  color: #666;
`;

const Category = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.9em;
  color: #666;
  margin-bottom: 10px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  background: ${props => props.variant === 'danger' ? '#ff4444' : '#007bff'};
  color: white;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.variant === 'danger' ? '#cc0000' : '#0056b3'};
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const TimeInfo = styled.div`
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
`;

const MarkerPopup: React.FC<MarkerPopupProps> = ({
  marker,
  onClose,
  onDelete,
  canDelete,
  remainingTime
}) => {
  return (
    <PopupContainer>
      <Title>{marker.metadata.name}</Title>
      <Category>{marker.metadata.category}</Category>
      <Description>{marker.metadata.description}</Description>
      <TimeInfo>
        {remainingTime}
      </TimeInfo>
      <ButtonContainer>
        <Button onClick={onClose}>Kapat</Button>
        {canDelete && (
          <Button variant="danger" onClick={onDelete}>
            Sil
          </Button>
        )}
      </ButtonContainer>
    </PopupContainer>
  );
};

export default MarkerPopup; 