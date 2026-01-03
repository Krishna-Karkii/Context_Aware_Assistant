// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default route is Login */}
        <Route path="/" element={<Login />} />
        
        {/* Route for Signup */}
        <Route path="/signup" element={<Signup />} />
        
        {/* Route for Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}