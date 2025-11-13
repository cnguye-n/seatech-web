// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './layout/AppContainer';
import Homepage from './pages/homepage';
import IslandPage from './pages/IslandPage';
import About from './pages/About';
import TurtlePage from './pages/TurtlePage';
import Login from './pages/login';
import { useEffect, useState } from 'react';
import SensorPage from './pages/SensorPage';

export default function App() {
  /* BACKEND */
  const API = import.meta.env.VITE_API_URL;
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('${API}/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(e => console.error('Backend connection failed:', e));
  }, []);


  return (
    <BrowserRouter>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/islands" element={<IslandPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/turtles" element={<TurtlePage />} />
          <Route path="/sensor" element={<SensorPage />} />
          <Route path="/login" element={<Login />} />
          {/* more routes here */}
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}
