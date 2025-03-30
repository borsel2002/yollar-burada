import React, { useState } from 'react';
import styled from 'styled-components';
import { MarkerMetadata, MarkerCategory } from '../types/types';

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

const FormContainer = styled.form`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 100px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;

  &.primary {
    background: #0080ff;
    color: white;
  }

  &.secondary {
    background: #f0f0f0;
    color: #333;
  }
`;

const markerCategories: Array<{ id: MarkerCategory; label: string }> = [
  { id: 'hazard', label: 'Tehlike' },
  { id: 'incident', label: 'Olay' },
  { id: 'service', label: 'Hizmet' },
  { id: 'poi', label: 'İlgi Noktası' },
  { id: 'other', label: 'Diğer' }
];

interface MarkerFormProps {
  onSubmit: (metadata: MarkerMetadata) => void;
  onCancel: () => void;
}

const MarkerForm: React.FC<MarkerFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MarkerCategory>(markerCategories[0].id);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      category,
      description
    });
  };

  return (
    <FormOverlay>
      <FormContainer onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">İsim*</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="İşaret için bir isim girin"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="category">Kategori*</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as MarkerCategory)}
            required
          >
            {markerCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Açıklama</Label>
          <TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="İsteğe bağlı açıklama ekleyin"
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" className="secondary" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" className="primary">
            Kaydet
          </Button>
        </ButtonGroup>
      </FormContainer>
    </FormOverlay>
  );
};

export default MarkerForm;
