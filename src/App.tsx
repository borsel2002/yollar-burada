import React from 'react';
import './App.css';
import MapComponent from './components/Map';
import styled from 'styled-components';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

function App() {
  return (
    <AppContainer>
      <MapComponent />
    </AppContainer>
  );
}

export default App;
