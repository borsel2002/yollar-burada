import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { markerCategories } from '../types/types';

const LegendToggle = styled.button`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 1000;
  font-size: 20px;
  
  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    bottom: 15px;
    left: 15px;
  }
  
  &:hover {
    background: #f0f0f0;
  }
`;

const LegendContainer = styled.div`
  position: absolute;
  bottom: 70px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 300px;
  max-height: 60vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    bottom: 65px;
    left: 15px;
    padding: 12px;
    max-width: 250px;
    max-height: 50vh;
  }
  
  @media (max-width: 480px) {
    max-width: 85vw;
    left: 10px;
  }
`;

const LegendTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    font-size: 15px;
    margin: 0 0 8px 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  @media (max-width: 768px) {
    font-size: 20px;
    width: 28px;
    height: 28px;
  }
  
  &:hover {
    color: #000;
  }
`;

const LegendGroup = styled.div`
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 8px;
  }
`;

const GroupTitle = styled.h4`
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 13px;
    margin: 0 0 4px 0;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  
  @media (max-width: 768px) {
    gap: 4px;
  }
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #444;
  
  @media (max-width: 768px) {
    font-size: 12px;
    gap: 6px;
  }
`;

const ColorDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    width: 10px;
    height: 10px;
  }
`;

const CategoryLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  // Group categories by their group property
  const groupedCategories = markerCategories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, typeof markerCategories>);

  // Handle click outside to close the legend
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <LegendToggle onClick={() => setIsOpen(!isOpen)} title="Kategori Listesi">
        ℹ️
      </LegendToggle>
      
      {isOpen && (
        <LegendContainer ref={legendRef}>
          <LegendTitle>
            Kategoriler
            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
          </LegendTitle>
          
          {Object.entries(groupedCategories).map(([group, categories]) => (
            <LegendGroup key={group}>
              <GroupTitle>
                {group === 'danger' && 'Tehlikeler'}
                {group === 'warning' && 'Uyarılar'}
                {group === 'info' && 'Bilgi'}
                {group === 'secondary' && 'Diğer'}
              </GroupTitle>
              <CategoryList>
                {categories.map(category => (
                  <CategoryItem key={category.id}>
                    <ColorDot color={category.color} />
                    <span>{category.name}</span>
                  </CategoryItem>
                ))}
              </CategoryList>
            </LegendGroup>
          ))}
        </LegendContainer>
      )}
    </>
  );
};

export default CategoryLegend;