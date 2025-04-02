import React from 'react';
import styled from 'styled-components';
import { markerCategories } from '../types/types';
import { useTheme } from '../context/ThemeContext';

const LegendContainer = styled.div<{ darkMode: boolean }>`
  position: absolute;
  top: 70px;
  right: 15px;
  background: ${({ darkMode }) => darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : 'inherit'};
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  max-width: 85%;
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scrollbar-width: thin;
  
  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const LegendTitle = styled.h3<{ darkMode: boolean }>`
  margin: 0 0 10px 0;
  font-size: 18px;
  color: ${({ darkMode }) => darkMode ? '#f0f0f0' : '#333'};
  font-weight: 600;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const LegendGroup = styled.div`
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupTitle = styled.h4<{ darkMode: boolean }>`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: ${({ darkMode }) => darkMode ? '#aaa' : '#666'};
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const CategoryItem = styled.div<{ darkMode: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${({ darkMode }) => darkMode ? '#e0e0e0' : '#444'};
  padding: 6px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  
  /* Apple Maps style category items */
  background-color: transparent;
  transition: background-color 0.15s ease;
  border-radius: 8px;
  padding: 6px 4px;
  
  &:hover {
    background-color: ${({ darkMode }) => darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const ColorDot = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  color: white;
`;

const CategoryLegend: React.FC = () => {
  const { darkMode } = useTheme();
  
  // Group categories by their group property
  const groupedCategories = markerCategories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, typeof markerCategories>);

  return (
    <LegendContainer darkMode={darkMode}>
      <LegendTitle darkMode={darkMode}>Kategoriler</LegendTitle>
      {Object.entries(groupedCategories).map(([group, categories]) => (
        <LegendGroup key={group}>
          <GroupTitle darkMode={darkMode}>
            {group === 'danger' && '⚠️ Tehlikeler'}
            {group === 'warning' && '🚧 Uyarılar'}
            {group === 'info' && 'ℹ️ Bilgi'}
            {group === 'secondary' && '🔍 Diğer'}
          </GroupTitle>
          <CategoryList>
            {categories.map(category => (
              <CategoryItem key={category.id} darkMode={darkMode}>
                <ColorDot color={category.color}>
                {category.id === 'hazard' && '⚠️'}
                {category.id === 'accident' && '🚧'}
                {category.id === 'roadwork' && '🚜'}
                {category.id === 'traffic' && '🚦'}
                {category.id === 'police' && '👮'}
                {category.id === 'camera' && '📷'}
                {category.id === 'garbage' && '🚛'}
                {category.id === 'expensive' && '💰'}
                {category.id === 'other' && '❓'}
              </ColorDot>
                <span style={{ fontWeight: '500' }}>{category.name}</span>
              </CategoryItem>
            ))}
          </CategoryList>
        </LegendGroup>
      ))}
    </LegendContainer>
  );
};

export default CategoryLegend; 