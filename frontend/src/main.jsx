import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound'; // create a simple 404 page
import './index.css';
import Logout from './pages/Logout';

// PrivateRoute component
function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/login" />;
}

// PublicRoute component to redirect logged-in users
function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? <Navigate to="/" /> : children;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* Private home route */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <App />
          </PrivateRoute>
        }
      />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  </BrowserRouter>
);

