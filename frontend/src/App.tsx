// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './layout/AppContainer';
import Homepage from './pages/homepage';
import IslandPage from './pages/IslandPage';
import About from './pages/About';
import SensorPage from './pages/SensorPage';
import TurtlePage from './pages/TurtlePage';
import Login from './pages/login';

export default function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/islands" element={<IslandPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/turtles" element={<TurtlePage />} />
          <Route path="/sensors" element={<SensorPage />} />
          <Route path="/login" element={<Login />} />
          {/* more routes here */}
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}

