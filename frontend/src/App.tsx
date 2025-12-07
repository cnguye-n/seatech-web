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
import ManagePage from './pages/ManagePage';

import { AuthProvider } from "./auth/AuthContext.tsx";
import ProtectedRoute from "./auth/ProtectedRoute";

export default function App() {
  /* BACKEND */
  const API = import.meta.env.VITE_API_URL;
  const [health, setHealth] = useState<any>(null);
  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        if (!res.ok) {
          throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json(); // { status: "ok" }
        console.log("Backend health:", data);
      } catch (err) {
        console.error("Backend connection failed:", err);
      }
    };
  
    checkBackend();
  }, []);
  


  return (
    <BrowserRouter>
      <AuthProvider>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <ManagePage />
              </ProtectedRoute>
            }
          />
          <Route path="/islands" element={<IslandPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/turtles" element={<TurtlePage />} />
          <Route path="/sensor" element={<SensorPage />} />
          <Route path="/login" element={<Login />} />
          {/* more routes here */}
        </Routes>
      </AppContainer>
      </AuthProvider>
    </BrowserRouter>
  );
}
