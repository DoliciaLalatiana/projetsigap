import React, { useState, useRef, useEffect } from 'react';
import { Camera, Key, LogOut, User, ArrowLeft, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserPage = ({ user, onLogout }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

  // Charger les données utilisateur depuis l'API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserData(userData);
          if (userData.photo) {
            setProfileImage(`http://localhost:5000/uploads/${userData.photo}?t=${Date.now()}`);
          }
        } else {
          console.error('Erreur lors du chargement des données utilisateur');
        }
      } catch (error) {
        console.error('Erreur chargement données utilisateur:', error);
      }
    };

    if (user) {
      setUserData(user);
      fetchUserData();
    }
  }, [user]);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('La photo ne doit pas dépasser 5MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setMessage('Veuillez sélectionner une image valide');
        return;
      }

      // Prévisualisation immédiate
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload vers le serveur
      await uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('http://localhost:5000/api/auth/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessage('Photo de profil mise à jour avec succès!');
        // Mettre à jour l'URL de l'image avec un timestamp pour éviter le cache
        setProfileImage(`http://localhost:5000/uploads/${result.photo}?t=${Date.now()}`);
        
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Erreur lors du téléchargement de la photo');
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setMessage('Erreur de connexion au serveur');
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
    setMessage('');
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage("Tous les champs sont obligatoires");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Les nouveaux mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage("Le nouveau mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Demande de changement de mot de passe envoyée! L'administrateur doit l'approuver.");
        setTimeout(() => {
          handleCloseModal();
        }, 3000);
      } else {
        setMessage(data.message || "Erreur lors du changement de mot de passe");
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    // Effacer les messages d'erreur quand l'utilisateur tape
    if (message) setMessage('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBack = () => {
    navigate(-1); // Utilise useNavigate pour retour en arrière
  };

  const handleLogout = () => {
    // Appeler la fonction onLogout passée en prop
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      // Fallback si onLogout n'est pas fourni
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 via-purple-200/20 to-pink-200/20 animate-pulse"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-20 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Bouton Retour */}
      {!showPasswordModal && (
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-100 transition-colors duration-200 font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-4 py-2 shadow-lg backdrop-blur-sm z-10 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
      )}

      {/* Message de notification */}
      {message && (
        <div className="max-w-lg mx-auto mb-4 relative z-10">
          <div className={`p-4 rounded-xl ${
            message.includes('succès') || message.includes('envoyée') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message}</span>
              <button 
                onClick={() => setMessage('')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteneur principal avec animation */}
      <div className="max-w-lg mx-auto relative mt-16 z-10">
        {/* Carte Paramètres du Profil */}
        <div className={`bg-white rounded-3xl shadow-2xl border border-blue-100/50 overflow-hidden transition-all duration-500 ease-in-out ${
          showPasswordModal ? 'transform scale-95 opacity-0 absolute' : 'opacity-100'
        }`}>
          {/* En-tête avec le titre */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-6 px-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">
                Paramètres du Profil
              </h1>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6 space-y-6">
            {/* Section Photo de profil */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-300 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Si l'image ne charge pas, afficher l'icône par défaut
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-blue-400">
                      <User size={48} />
                    </div>
                  )}
                </div>
                
                {/* Bouton pour changer la photo */}
                <button
                  onClick={triggerFileInput}
                  className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110 border-2 border-white"
                  title="Changer la photo"
                  type="button"
                >
                  <Camera size={16} />
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Informations utilisateur */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-gray-800">
                  {userData?.nom_complet || "Chargement..."}
                </h2>
                <p className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full text-sm capitalize">
                  {userData?.role || "Utilisateur"}
                </p>
                <p className="text-gray-600 text-sm">
                  Immatriculation: <span className="font-medium text-purple-600">{userData?.immatricule || "Chargement..."}</span>
                </p>
                <p className="text-gray-600 text-sm">
                  Username: <span className="font-medium text-purple-600">{userData?.username || "Chargement..."}</span>
                </p>
              </div>
            </div>

            {/* Bouton Changer le mot de passe */}
            <div className="pt-4">
              <button
                onClick={handleChangePassword}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                type="button"
              >
                <Key size={20} />
                <span>Changer de mot de passe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modale Changer le mot de passe */}
        <div className={`bg-white rounded-3xl shadow-2xl border border-blue-100/50 overflow-hidden transition-all duration-500 ease-in-out ${
          showPasswordModal ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 absolute'
        }`}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-6 px-6 relative">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white text-center">
                Changer le mot de passe
              </h2>
            </div>
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-white/20 rounded-full p-1 backdrop-blur-sm"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Ancien mot de passe */}
              <div className="group">
                <label className="text-gray-700 text-sm font-medium mb-2 block">Ancien mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Entrez votre ancien mot de passe"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div className="group">
                <label className="text-gray-700 text-sm font-medium mb-2 block">Nouveau mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Entrez votre nouveau mot de passe"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Confirmer le nouveau mot de passe */}
              <div className="group">
                <label className="text-gray-700 text-sm font-medium mb-2 block">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Information sur le processus */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Lock className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 text-sm font-medium">Processus sécurisé</p>
                    <p className="text-blue-700 text-xs mt-1">
                      Votre demande sera envoyée à l'administrateur pour approbation. Vous recevrez une notification une fois le changement effectué.
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi...</span>
                    </div>
                  ) : (
                    'Envoyer la demande'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bouton Déconnexion */}
      {!showPasswordModal && (
        <div className="max-w-lg mx-auto mt-8 transition-opacity duration-500 z-10">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            type="button"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPage;