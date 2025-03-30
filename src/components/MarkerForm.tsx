import React, { useState } from 'react';
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
`;

const FormTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
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
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${props => props.$variant === 'primary' ? '#0080ff' : '#f44336'};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

interface MarkerFormProps {
  onSubmit: (metadata: MarkerMetadata) => void;
  onCancel: () => void;
}

const MarkerForm: React.FC<MarkerFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<MarkerMetadata>({
    name: '',
    category: 'other',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <FormOverlay>
      <FormContainer>
        <form onSubmit={handleSubmit}>
          <FormTitle>Yeni İşaretleme Noktası</FormTitle>
          
          <FormGroup>
            <Label htmlFor="name">İsim</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </FormGroup>

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
