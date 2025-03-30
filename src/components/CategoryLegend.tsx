import React from 'react';
import styled from 'styled-components';
import { markerCategories } from '../types/types';

const LegendContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 300px;
`;

const LegendTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
`;

const LegendGroup = styled.div`
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupTitle = styled.h4`
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #444;
`;

const ColorDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(0, 0, 0, 0.2);
`;

const CategoryLegend: React.FC = () => {
  // Group categories by their group property
  const groupedCategories = markerCategories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, typeof markerCategories>);

  return (
    <LegendContainer>
      <LegendTitle>Kategoriler</LegendTitle>
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
  );
};

export default CategoryLegend; 