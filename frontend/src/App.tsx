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
import Settings from './pages/Settings';
import Scroll from './components/scroll';
import DataPage from './pages/DataPage';

import Unauthorized from "./pages/Unauthorized";

import { AuthProvider } from "./auth/AuthContext.tsx";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleProtectedRoute from "./auth/RoleProtectedRoute";

export default function App() {
  /* BACKEND */
  const API = import.meta.env.VITE_API_URL;
  const [health, setHealth] = useState<any>(null);
  const BACKEND_URL = import.meta.env.VITE_API_URL;

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
      <Scroll />
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

            {/* Add this */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Change this: protect sensor page by role */}
            <Route
              path="/sensor"
              element={
                <RoleProtectedRoute allow={["admin", "member"]}>
                  <SensorPage />
                </RoleProtectedRoute>
              }
            />

            {/* the temp datapage, will be moved when i have access to the sensor page */}
            {/* after access to the sensor page, move <DataSection/> into the SensorPage.tsx and remove this route */}
            <Route path="/upload" element={<DataPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppContainer>
      </AuthProvider>
    </BrowserRouter>
  );
}
