import React, { useState, useRef, useEffect } from 'react';
import { Camera, Key, LogOut, User, X, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';


// Composant Modal séparé pour éviter les re-renders
const PasswordModal = ({ 
  showPasswordModal, 
  onClose, 
  passwordData, 
  onPasswordChange, 
  showPasswords, 
  onTogglePasswordVisibility,
  loading,
  message,
  setMessage,
  onSubmit 
}) => {
  // Utiliser useTranslation directement dans le modal
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    if (showPasswordModal && oldPasswordRef.current) {
      setTimeout(() => {
        oldPasswordRef.current.focus();
      }, 100);
    }
  }, [showPasswordModal]);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!showPasswordModal) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Overlay qui couvre TOUTE la page - header, sidebar et contenu */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Modal centré */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md mx-auto z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {message && (
          <div className="mb-4 relative z-10">
            <div className={`p-4 rounded-xl backdrop-blur-sm ${
              message.includes('succès') || message.includes('envoyée') || 
              message.includes('soa aman-tsara') || message.includes('nalefa') ||
              message.includes('success') || message.includes('sent')
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
                {t('passwordChangeTitle')}
              </h2>
            </div>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Section information - sans fond bleu */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <Lock className="text-gray-600 w-5 h-5 flex-shrink-0 mt-0.5 mt-4" />
                  <div>
                    <p className="text-gray-800 text-sm font-medium">{t('secureProcess')}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {t('secureProcessDesc')}
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
                      ref={oldPasswordRef}
                      type={showPasswords.oldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) => onPasswordChange('oldPassword', e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('oldPassword')}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newPasswordRef.current) {
                            newPasswordRef.current.focus();
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onTogglePasswordVisibility('oldPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPasswords.oldPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      ref={newPasswordRef}
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('newPassword')}
                      required
                      minLength={6}
                      disabled={loading}
                      autoComplete="new-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (confirmPasswordRef.current) {
                            confirmPasswordRef.current.focus();
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onTogglePasswordVisibility('newPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPasswords.newPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmer mot de passe */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      ref={confirmPasswordRef}
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('confirmPassword')}
                      required
                      minLength={6}
                      disabled={loading}
                      autoComplete="new-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onSubmit(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onTogglePasswordVisibility('confirmPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPasswords.confirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Boutons d'action - gris et bleu */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('sending')}</span>
                    </div>
                  ) : (
                    t('sendRequest')
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

const UserPage = ({ user, onLogout, userPageState, onUserPageStateChange }) => {
  const [profileImage, setProfileImage] = useState(null);
  const { t, i18n, ready } = useTranslation();
  
  useEffect(() => {
    console.log('UserPage i18n.language=', i18n.language, 't.title=', t('title'));
  }, [i18n.language]);
  
  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
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
        const API_BASE = import.meta.env.VITE_API_BASE || 'https://sigap-backend2.onrender.com';
        const response = await fetch(`${API_BASE}/api/auth/me`, {
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
            // Ajouter un timestamp pour éviter le cache
            const timestamp = Date.now();
            setProfileImage(`${API_BASE}/uploads/${userData.photo}?t=${timestamp}`);
          }
        } else {
          console.error(t('error'));
        }
      } catch (error) {
        console.error(t('error') + ':', error);
      }
    };

    if (user) {
      setUserData(user);
      fetchUserData();
    }
  }, [user, t]);

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
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://sigap-backend2.onrender.com';
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${API_BASE}/api/auth/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(t('photoUpdated'));
        // Mettre à jour l'image avec un nouveau timestamp
        const timestamp = Date.now();
        setProfileImage(`${API_BASE}/uploads/${result.photo}?t=${timestamp}`);
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || t('error'));
      }
    } catch (error) {
      console.error(t('error') + ':', error);
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
    setShowPasswords({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false
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
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://sigap-backend2.onrender.com';
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
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
        setMessage(data.message || t('error'));
      }
    } catch (error) {
      console.error(t('error') + ':', error);
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
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate(); 

  const handleLogout = () => {
    // Appeler la fonction onLogout passée en props
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      // Fallback si onLogout n'est pas disponible
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Utiliser une redirection conditionnelle
      navigate('/');
    }
  };

  const handleGoBack = () => {
    console.log(t('back'));
    // Vous pouvez ajouter la navigation vers la page précédente si nécessaire
    // history.goBack() si vous utilisez react-router
  };

  return (
    <>
      {/* Modal de mot de passe (rendu dans le body) */}
      <PasswordModal
        showPasswordModal={showPasswordModal}
        onClose={handleCloseModal}
        passwordData={passwordData}
        onPasswordChange={handlePasswordChange}
        showPasswords={showPasswords}
        onTogglePasswordVisibility={togglePasswordVisibility}
        loading={loading}
        message={message}
        setMessage={setMessage}
        onSubmit={handlePasswordSubmit}
      />

      {/* Contenu principal */}
      <div className={`p-8 md:p-10 ${showPasswordModal ? 'brightness-75' : ''}`}>
        {/* En-tête avec bouton retour et titre sur la même ligne */}
        <div className="flex items-center mb-5">
          <button
            onClick={handleGoBack}
            className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 mr-4 flex-shrink-0"
            aria-label={t('back')}
          >
            <ArrowLeft size={20} />
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('profileSettings')}
          </h1>
        </div>

        {/* Message de notification */}
        {message && !showPasswordModal && (
          <div className="mb-8">
            <div className={`p-4 rounded-xl ${
              message.includes('succès') || message.includes('envoyée') || 
              message.includes('soa aman-tsara') || message.includes('nalefa') ||
              message.includes('success') || message.includes('sent')
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
                    console.error('Image loading error:', e);
                    e.target.onerror = null;
                    // Remplacer par un placeholder si l'image ne se charge pas
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                    placeholder.innerHTML = `<User size={60} class="text-gray-400" />`;
                    parent.appendChild(placeholder);
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
              title={t('changePhoto')}
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
              {userData?.nom_complet || t('loading')}
            </h2>
            <span className="text-gray-600 text-sm font-medium px-3 py-1 rounded-full capitalize">
              {userData?.role || t('user')}
            </span>
          </div>

          {/* Informations secondaires */}
          <div className="space-y-2 text-center">
            <p className="text-gray-600 text-sm">
              {t('registration')}: <span className="font-medium text-gray-800">{userData?.immatricule || t('loading')}</span>
            </p>
            <p className="text-gray-600 text-sm">
              {t('username')}: <span className="font-medium text-gray-800">{userData?.username || t('loading')}</span>
            </p>
          </div>
        </div>

        {/* Section Sécurité - Centrée */}
        <div className="mb-3 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">
            {t('security')}
          </h2>
          
          <div className="w-full max-w-xl">
            <button
              onClick={handleChangePassword}
              className="w-full bg-gray-50 transition-all duration-200 flex items-center space-x-4 p-4 rounded-2xl border border-gray-200 hover:bg-gray-100"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center">
                  <Lock className="text-black w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {t('changePassword')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('updateSecurity')}
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
            className="flex items-center justify-center space-x-3 text-red-600 hover:text-white font-medium py-3 px-4 rounded-2xl hover:bg-red-600 transition-colors border border-red-200 max-w-xl"
          >
            <LogOut size={20} />
            <span className="font-semibold">{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UserPage;