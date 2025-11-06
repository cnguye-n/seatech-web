import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './pages/homepage';

import './styles/global.css'
import './styles/variables.css'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App
