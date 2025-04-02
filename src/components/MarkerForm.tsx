import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { MarkerMetadata, markerCategories } from '../types/types';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  margin: 0 10px;
  
  @media (max-width: 480px) {
    padding: 15px;
    max-width: 90%;
  }
`;

const FormTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  
  @media (max-width: 480px) {
    font-size: 18px;
    margin: 0 0 15px 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
  
  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    font-size: 16px; /* Prevent zoom on mobile */
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
  
  @media (max-width: 480px) {
    min-height: 60px;
    padding: 8px;
    font-size: 16px; /* Prevent zoom on mobile */
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    font-size: 16px; /* Prevent zoom on mobile */
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  
  @media (max-width: 480px) {
    margin-top: 15px;
  }
`;

const Button = styled.button<{ $variant?: 'primary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: ${props => props.$variant === 'primary' ? '#0080ff' : '#f0f0f0'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#333'};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
  
  @media (max-width: 480px) {
    padding: 10px 16px; /* Larger touch target */
    font-size: 14px;
  }
`;

interface MarkerFormProps {
  onSubmit: (metadata: MarkerMetadata) => void;
  onCancel: () => void;
}

const MarkerForm: React.FC<MarkerFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<MarkerMetadata>({
    name: 'Marker',
    category: 'other',
    description: ''
  });
  
  const formRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close the form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Set the name based on the selected category
    const categoryInfo = markerCategories.find(cat => cat.id === formData.category);
    const updatedFormData = {
      ...formData,
      name: categoryInfo ? categoryInfo.name : 'Marker'
    };
    onSubmit(updatedFormData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <FormOverlay onClick={onCancel}>
      <FormContainer ref={formRef} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <FormTitle>Yeni İşaretleme Noktası</FormTitle>
          
          <FormGroup>
            <Label htmlFor="category">Kategori</Label>
            <Select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {markerCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Açıklama</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onCancel}>
              İptal
            </Button>
            <Button type="submit" $variant="primary">
              Ekle
            </Button>
          </ButtonGroup>
        </form>
      </FormContainer>
    </FormOverlay>
  );
};

export default MarkerForm;
