import React, { useState } from 'react';
import styled from 'styled-components';
import { MarkerMetadata, markerCategories } from '../types/types';
import { useTheme } from '../context/ThemeContext';

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

const FormContainer = styled.div<{ darkMode: boolean }>`
  background: ${({ darkMode }) => darkMode ? '#222' : 'white'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  
  @media (max-width: 480px) {
    max-width: 90%;
    padding: 15px;
  }
`;

const FormTitle = styled.h2<{ darkMode: boolean }>`
  margin: 0 0 20px 0;
  font-size: 20px;
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : '#333'};
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 500;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label<{ darkMode?: boolean }>`
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: ${({ darkMode }) => darkMode ? '#aaa' : '#666'};
`;

const Input = styled.input<{ darkMode?: boolean }>`
  width: 100%;
  padding: 8px;
  border: 1px solid ${({ darkMode }) => darkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  background-color: ${({ darkMode }) => darkMode ? '#333' : 'white'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
`;

const Select = styled.select<{ darkMode?: boolean }>`
  width: 100%;
  padding: 8px;
  border: 1px solid ${({ darkMode }) => darkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  background-color: ${({ darkMode }) => darkMode ? '#333' : 'white'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};

  &:focus {
    outline: none;
    border-color: #0080ff;
  }
`;

const TextArea = styled.textarea<{ darkMode?: boolean }>`
  width: 100%;
  padding: 8px;
  border: 1px solid ${({ darkMode }) => darkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  background-color: ${({ darkMode }) => darkMode ? '#333' : 'white'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};

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

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; darkMode?: boolean }>`
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${props => props.$variant === 'primary' ? '#007AFF' : '#f44336'};
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

interface MarkerFormProps {
  onSubmit: (metadata: MarkerMetadata) => void;
  onCancel: () => void;
}

// Error text styling
const ErrorText = styled.p<{ darkMode?: boolean }>`
  color: ${({ darkMode }) => darkMode ? '#ff6b6b' : '#f44336'};
  font-size: 12px;
  margin: 4px 0 0 0;
`;

const MarkerForm: React.FC<MarkerFormProps> = ({ onSubmit, onCancel }) => {
  const { darkMode } = useTheme();
  
  const [formData, setFormData] = useState<MarkerMetadata>({
    name: '',
    category: 'other',
    description: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form based on category
    const newErrors: {[key: string]: string} = {};
    
    // Name is only required for Pahallı İstasyon
    if (formData.category === 'expensive' && !formData.name.trim()) {
      newErrors.name = 'Pahalı İstasyon için isim gereklidir';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Default name if not provided
    const finalFormData = {
      ...formData,
      name: formData.name.trim() || getCategoryDefaultName(formData.category)
    };
    
    onSubmit(finalFormData);
  };
  
  // Get default name based on category if user doesn't provide one
  const getCategoryDefaultName = (category: string): string => {
    const categoryObj = markerCategories.find(cat => cat.id === category);
    return categoryObj ? categoryObj.name : 'İşaretleme Noktası';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <FormOverlay>
      <FormContainer darkMode={darkMode}>
        <form onSubmit={handleSubmit}>
          <FormTitle darkMode={darkMode}>Yeni İşaretleme Noktası</FormTitle>
          
          <FormGroup>
            <Label htmlFor="category" darkMode={darkMode}>Kategori</Label>
            <Select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              darkMode={darkMode}
            >
              {markerCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="name" darkMode={darkMode}>
              İsim {formData.category === 'expensive' ? '(Gerekli)' : '(İsteğe bağlı)'}
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required={formData.category === 'expensive'}
              placeholder={formData.category === 'expensive' ? 'Pahalı istasyon adını girin' : 'İsteğe bağlı'}
              darkMode={darkMode}
            />
            {errors.name && <ErrorText darkMode={darkMode}>{errors.name}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description" darkMode={darkMode}>Açıklama</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              darkMode={darkMode}
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onCancel} darkMode={darkMode}>
              İptal
            </Button>
            <Button type="submit" $variant="primary" darkMode={darkMode}>
              Ekle
            </Button>
          </ButtonGroup>
        </form>
      </FormContainer>
    </FormOverlay>
  );
};

export default MarkerForm;
