// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppContainer from './layout/AppContainer';
import Homepage from './pages/homepage';
import Login from './pages/login';

export default function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          {/* more routes here */}
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}

