// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './layout/AppContainer';
import Homepage from './pages/homepage';
import IslandPage from './pages/IslandPage';
import About from './pages/About';
import TurtlePage from './pages/TurtlePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/islands" element={<IslandPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/turtles" element={<TurtlePage />} />
          {/* more routes here */}
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}

