import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Interface from './Components/Interface';
import Statistique from './Components/Statistique';
import AdminPanel from './Components/AdminPanel';
import Login from './Components/Login';
import UserPage from './Components/UserPage';
import ResidencePage from './Components/ResidencePage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Ajout du hook useNavigate

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
    // Utilisation de navigate au lieu de window.location.href
    navigate('/');
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
          user ? <Statistique user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } 
      />
      <Route 
        path="/userPage" 
        element={
          user ? <UserPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } 
      />
      <Route 
        path="/residence" 
        element={
          user ? <ResidencePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } 
      />
      <Route 
        path="/" 
        element={
          user ? <Interface user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } 
      />
      {/* Route fallback pour les URLs non trouvées */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;