// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './layout/AppContainer';
import Homepage from './pages/homepage';
import IslandPage from './pages/IslandPage';
import About from './pages/About';
import TurtlePage from './pages/TurtlePage';
import Login from './pages/login';
import { useEffect } from 'react';
import SensorPage from './pages/SensorPage';
import ManagePage from './pages/ManagePage';
import Settings from './pages/Settings';
import Scroll from './components/scroll';
import DataPage from './pages/DataPage';
import AdminAccess from "./pages/AdminAccess";

import { AuthProvider } from "./auth/AuthContext.tsx";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleProtectedRoute from "./auth/RoleProtectedRoute";

export default function App() {
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        const data = await res.json();
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

            {/* Manage: upload + turtle metadata — admin only */}
            <Route
              path="/manage"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <ManagePage />
                </RoleProtectedRoute>
              }
            />

            <Route path="/islands" element={<IslandPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/turtles" element={<TurtlePage />} />

            {/* Sensor: view stored data — admin + member */}
            <Route
              path="/sensor"
              element={
                <RoleProtectedRoute allow={["admin", "member"]}>
                  <SensorPage />
                </RoleProtectedRoute>
              }
            />

            {/* /upload kept as a direct fallback (DataPage still works standalone) */}
            <Route path="/upload" element={<DataPage />} />

            {/* Admin access panel */}
            <Route
              path="/admin/access"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <AdminAccess />
                </RoleProtectedRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppContainer>
      </AuthProvider>
    </BrowserRouter>
  );
}