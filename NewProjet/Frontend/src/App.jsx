import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Interface from './Components/Interface';
import Statistique from './Components/Statistique';
import AdminPanel from './Components/AdminPanel';
import Login from './Components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Erreur parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Login onLogin={handleLogin} />
        } 
      />
      <Route 
        path="/admin" 
        element={
          user && user.role === 'admin' ? (
            <AdminPanel onLogout={handleLogout} currentUser={user} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/statistique" 
        element={
          user ? <Statistique user={user} onBack={() => window.history.back()} /> : <Navigate to="/login" />
        } 
      />
      <Route 
        path="/" 
        element={
          user ? <Interface user={user} /> : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

export default App;