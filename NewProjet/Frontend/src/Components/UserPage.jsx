import React, { useState, useRef, useEffect } from 'react';
import { Camera, Key, LogOut, User, X, Lock, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom';

const UserPage = ({ user, onLogout, userPageState, onUserPageStateChange }) => {
  const [profileImage, setProfileImage] = useState(null);
  const { t, i18n, ready } = useTranslation();
  
  useEffect(() => {
    console.log('UserPage i18n.language=', i18n.language, 't.title=', t('title'));
  }, [i18n.language, t]);
  
  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des traductions...</p>
        </div>
      </div>
    );
  }
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(() =>
    (userPageState && typeof userPageState.showPasswordModal !== 'undefined') ? userPageState.showPasswordModal : false
  );
  
  useEffect(() => {
    if (userPageState && typeof userPageState.showPasswordModal !== 'undefined') {
      setShowPasswordModal(userPageState.showPasswordModal);
    }
  }, [userPageState?.showPasswordModal]);
 
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://sigap-backend2.onrender.com/api/auth/me', {
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
            setProfileImage(`https://sigap-backend2.onrender.com/uploads/${userData.photo}?t=${Date.now()}`);
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
      if (file.size > 5 * 1024 * 1024) {
        setMessage(t('photoTooLarge'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage(t('invalidImage'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);

      await uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('https://sigap-backend2.onrender.com/api/auth/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(t('photoUpdated'));
        setProfileImage(`https://sigap-backend2.onrender.com/uploads/${result.photo}?t=${Date.now()}`);
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Erreur lors du téléchargement de la photo');
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setMessage(t('connectionError'));
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

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage(t('allFieldsRequired'));
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage(t('passwordsDontMatch'));
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://sigap-backend2.onrender.com/api/auth/change-password', {
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
        setMessage(t('passwordChangeRequest'));
        setTimeout(() => {
          handleCloseModal();
        }, 3000);
      } else {
        setMessage(data.message || "Erreur lors du changement de mot de passe");
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    if (message) setMessage('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const handleGoBack = () => {
    console.log('Retour en arrière');
  };

  // Composant Modal pour le mot de passe
  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay qui couvre TOUTE la page - header, sidebar et contenu */}
        <div 
          className="absolute inset-0 bg-black/20"
          onClick={handleCloseModal}
        />
        
        {/* Modal centré */}
        <div className="relative w-full max-w-md mx-auto z-50">
          {message && (
            <div className="mb-4 relative z-10">
              <div className={`p-4 rounded-xl backdrop-blur-sm ${
                message.includes('succès') || message.includes('envoyée') || message.includes('soa aman-tsara') || message.includes('nalefa')
                  ? 'bg-green-50/80 border border-green-200/60 text-green-800' 
                  : 'bg-red-50/80 border border-red-200/60 text-red-800'
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

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* En-tête avec icône clé centrée */}
            <div className="py-8 px-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gray-900 text-center">
                  Modification du mot de passe
                </h2>
              </div>
            </div>

            <div className="px-6 pb-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-5" onClick={(e) => e.stopPropagation()}>
                {/* Section information - sans fond bleu */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <Lock className="text-gray-600 w-5 h-5 flex-shrink-0 mt-0.5 mt-4" />
                    <div>
                      <p className="text-gray-800 text-sm font-medium">Processus sécurisé</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Pour votre sécurité, la modification du mot de passe nécessite une validation en plusieurs étapes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Champs sans labels */}
                <div className="space-y-4">
                  {/* Ancien mot de passe */}
                  <div className="group">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Mot de passe actuel"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div className="group">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Nouveau mot de passe"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div className="group">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Confirmer le nouveau mot de passe"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Boutons d'action - gris et bleu */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Envoi en cours...</span>
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
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* Modal de mot de passe (rendu dans le body) */}
      <PasswordModal />

      {/* Contenu principal */}
      <div className={`p-8 md:p-10 ${showPasswordModal ? 'brightness-75' : ''}`}>
        {/* En-tête avec bouton retour et titre sur la même ligne */}
        <div className="flex items-center mb-5">
          <button
            onClick={handleGoBack}
            className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 mr-4 flex-shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('title') || 'Paramètres et compte'}
          </h1>
        </div>

        {/* Message de notification */}
        {message && !showPasswordModal && (
          <div className="mb-8">
            <div className={`p-4 rounded-xl ${
              message.includes('succès') || message.includes('envoyée') || message.includes('soa aman-tsara') || message.includes('nalefa')
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

        {/* Section profil utilisateur - Photo montée vers le haut */}
        <div className="flex flex-col items-center mb-5">
          {/* Avatar circulaire */}
          <div className="relative mb-8">
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <User size={60} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <button
              onClick={triggerFileInput}
              className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 border-4 border-white"
              title={t('profilePhoto') || 'Changer la photo'}
              type="button"
            >
              <Camera size={15} />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Nom et rôle sur la même ligne */}
          <div className="flex items-center justify-center space-x-3 mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              {userData?.nom_complet || "Chargement..."}
            </h2>
            <span className="text-gray-600 text-sm font-medium px-3 py-1 rounded-full capitalize">
              {userData?.role || "Utilisateur"}
            </span>
          </div>

          {/* Informations secondaires */}
          <div className="space-y-2 text-center">
            <p className="text-gray-600 text-sm">
              {t('immatriculation') || 'Immatriculation'}: <span className="font-medium text-gray-800">{userData?.immatricule || "Chargement..."}</span>
            </p>
            <p className="text-gray-600 text-sm">
              {t('username') || 'Nom d\'utilisateur'}: <span className="font-medium text-gray-800">{userData?.username || "Chargement..."}</span>
            </p>
          </div>
        </div>

        {/* Section Sécurité - Centrée */}
        <div className="mb-3 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">
            Sécurité
          </h2>
          
          <div className="w-full max-w-xl">
            <button
              onClick={handleChangePassword}
              className="w-full bg-gray-50 transition-all duration-200 flex items-center space-x-4 p-4 rounded-2xl border border-gray-200"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center">
                  <Lock className="text-black w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  MOT DE PASSE
                </h3>
                <p className="text-gray-600 text-sm">
                  Mettre a jour securite
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bouton Déconnexion - Centré */}
        <div className="mt-5 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-3 text-red-600 hover:text-red-700 font-medium py-3 px-4 rounded-2xl hover:bg-red-50 transition-colors border border-red-200 max-w-xl"
          >
            <LogOut size={20} />
            <span className="font-semibold">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UserPage;