import React, { useState, useRef, useEffect } from 'react';
import { Camera, Key, LogOut, User, ArrowLeft, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UserPage = ({ user, onBack, onLogout, userPageState, onUserPageStateChange }) => {
  const [profileImage, setProfileImage] = useState(null);
  const { t, i18n, ready } = useTranslation(); // Ajout de 'ready'
  
  useEffect(() => {
    console.log('UserPage i18n.language=', i18n.language, 't.title=', t('title'));
  }, [i18n.language, t]);
  
  // Afficher un chargement si les traductions ne sont pas prêtes
  if (!ready) {
    return (
      <div className="min-h-screen bg-transparent py-4 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des traductions...</p>
        </div>
      </div>
    );
  }
  
  const currentLang = i18n?.language || 'fr';
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
  
  // Gérer localement l'ouverture du modal de changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(() =>
    (userPageState && typeof userPageState.showPasswordModal !== 'undefined') ? userPageState.showPasswordModal : false
  );
  // Si parent contrôle showPasswordModal, synchroniser quand il change
  useEffect(() => {
    if (userPageState && typeof userPageState.showPasswordModal !== 'undefined') {
      setShowPasswordModal(userPageState.showPasswordModal);
    }
  }, [userPageState?.showPasswordModal]);
 
  const toggleLanguage = () => {
    const next = (i18n.language === 'fr' || !i18n.language) ? 'mg' : 'fr';
    i18n.changeLanguage(next);
  };

  // Charger les données utilisateur depuis l'API
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

  return (
    <div className="min-h-screen bg-transparent py-4 px-4 relative overflow-hidden">
      
      {/* Bouton de changement de langue */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={t('ChangeLanguage') || (currentLang === 'fr' ? 'Changer en Malagasy' : 'Hiova amin\'ny frantsay')}
        >
          {currentLang === 'fr' ? (
            // Drapeau français (bandes verticales)
            <div className="w-full h-full flex">
              <div className="w-1/3 bg-blue-600"></div>
              <div className="w-1/3 bg-white"></div>
              <div className="w-1/3 bg-red-600"></div>
            </div>
          ) : (
            // Drapeau malgache CORRIGÉ : bande verticale blanche à gauche, bandes horizontales rouge et verte à droite
            <div className="w-full h-full flex">
              {/* Bande verticale blanche */}
              <div className="w-1/3 bg-white"></div>
              {/* Partie droite avec bandes horizontales */}
              <div className="w-2/3 flex flex-col">
                <div className="h-1/2 bg-red-600"></div>
                <div className="h-1/2 bg-green-600"></div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Message de notification */}
      {message && (
        <div className="max-w-lg mx-auto mb-4 relative z-10">
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

      {/* Conteneur principal */}
      <div className="max-w-lg mx-auto relative z-10">
        
        { !showPasswordModal ? (
          <div className="transition-opacity duration-300 opacity-100">
            <div className="bg-white backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-100/30 overflow-hidden">
              {/* En-tête avec le titre */}
              <div className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm py-6 px-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">
                    {t('title')}
                  </h1>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="p-6 space-y-6">
                {/* Section Photo de profil */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-300/60 bg-gradient-to-br from-blue-100/50 to-purple-100/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
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
                        <div className="text-blue-400">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={triggerFileInput}
                      className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:from-blue-600/80 hover:to-purple-700/80 transition-all duration-300 transform hover:scale-110 border-2 border-white"
                      title={t('profilePhoto')}
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

                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-gray-800">
                      {userData?.nom_complet || "Chargement..."}
                    </h2>
                    <p className="text-blue-600 font-semibold bg-blue-50/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm capitalize">
                      {userData?.role || "Utilisateur"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {t('immatriculation')}: <span className="font-medium text-purple-600">{userData?.immatricule || "Chargement..."}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      {t('username')}: <span className="font-medium text-purple-600">{userData?.username || "Chargement..."}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-blue-600/80 hover:to-purple-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                    type="button"
                  >
                    <Key size={20} />
                    <span>{t('changePassword')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500/80 to-red-600/80 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-red-600/80 hover:to-red-700/80 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                type="button"
              >
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="transition-opacity duration-300 opacity-100">
            <div className="bg-white backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-100/30 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm py-6 px-6 relative">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white text-center">
                    {t('passwordChangeTitle')}
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-3">

                  <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Lock className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-800 text-sm font-medium">{t('secureProcess')}</p>
                        <p className="text-blue-700 text-xs mt-1">
                          {t('secureProcessDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-gray-800 text-sm font-medium mb-2 block">{t('oldPassword')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/60 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={t('oldPasswordPlaceholder')}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-gray-800 text-sm font-medium mb-2 block">{t('newPassword')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/60 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={t('newPasswordPlaceholder')}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-gray-800 text-sm font-medium mb-2 block">{t('confirmPassword')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/60 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={t('confirmPasswordPlaceholder')}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 mb-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={loading}
                      className="flex-1 bg-gray-500/80 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-blue-600/80 hover:to-purple-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}
      </div>
    </div>
  );
};

export default UserPage;