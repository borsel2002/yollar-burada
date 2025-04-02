import React from 'react';
import './App.css';
import MapComponent from './components/Map';
import styled from 'styled-components';
import { ThemeProvider } from './context/ThemeContext';
import DarkModeToggle from './components/DarkModeToggle';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

function App() {
  return (
    <ThemeProvider>
      <AppContainer>
        <DarkModeToggle />
        <MapComponent />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
