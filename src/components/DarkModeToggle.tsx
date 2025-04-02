import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const ToggleButton = styled.button<{ isDarkMode: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px; /* Positioned at the bottom right corner */
  z-index: 1100; /* Ensure it's above other UI elements */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: ${props => props.isDarkMode ? 'rgba(50, 50, 50, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
  border: 2px solid ${props => props.isDarkMode ? 'rgba(100, 100, 100, 0.5)' : 'rgba(200, 200, 200, 0.5)'};
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    background: ${props => props.isDarkMode ? 'rgba(70, 70, 70, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    bottom: 20px;
    right: 20px; /* Consistent position for mobile */
  }
`;

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <ToggleButton 
      onClick={toggleDarkMode} 
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      isDarkMode={darkMode}
    >
      {darkMode ? (
        <span role="img" aria-label="Light mode" style={{ fontSize: '20px' }}>
          ☀️
        </span>
      ) : (
        <span role="img" aria-label="Dark mode" style={{ fontSize: '20px' }}>
          🌙
        </span>
      )}
    </ToggleButton>
  );
};

export default DarkModeToggle;
