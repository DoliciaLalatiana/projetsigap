import React, { useState } from 'react';
import { X, Key, User, AlertCircle, CheckCircle, Search, Shield, Lock } from 'lucide-react';

const ForgotPassword = ({ onClose }) => {
  const [immatricule, setImmatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [step, setStep] = useState(1); // 1: Saisie immatricule, 2: Confirmation

  const handleCheckImmatricule = async (e) => {
    e.preventDefault();
    
    if (!immatricule.trim()) {
      setError('Veuillez entrer votre immatricule');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('https://sigap-backend2.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ immatricule: immatricule.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserInfo(data.user);
        setMessage(data.message);
        setStep(2); // Passer à l'étape de confirmation
        
        // 🔒 CHANGEMENT IMMÉDIAT DU MOT DE PASSE TEMPORAIRE
        // Le mot de passe est immédiatement invalidé pour sécurité
        await invalidateCurrentPassword(data.user.id);
        
      } else {
        setError(data.message || 'Immatricule non trouvé');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // 🔒 FONCTION POUR INVALIDER LE MOT DE PASSE ACTUEL
  const invalidateCurrentPassword = async (userId) => {
    try {
      const tempPassword = 'temp_invalid_' + Math.random().toString(36).slice(-8);
      const response = await fetch('https://sigap-backend2.onrender.com/api/auth/invalidate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          tempPassword 
        }),
      });
      
      if (!response.ok) {
        console.warn('Impossible d\'invalider le mot de passe actuel');
      }
    } catch (error) {
      console.warn('Erreur lors de l\'invalidation du mot de passe:', error);
    }
  };

  const handleReset = () => {
    setStep(1);
    setImmatricule('');
    setUserInfo(null);
    setMessage('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
      {/* Modal principal en blanc */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md transform animate-scaleIn">
        {/* Header - Gris noir */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-800 p-2 rounded-xl">
              <Key className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mot de passe oublié</h3>
              <p className="text-gray-600 text-sm">
                {step === 1 ? 'Étape 1: Vérification' : 'Étape 2: Demande envoyée'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Étape 1: Saisie de l'immatricule */}
        {step === 1 && (
          <form onSubmit={handleCheckImmatricule} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-800 text-sm font-medium">{error}</span>
                  <p className="text-red-700 text-xs mt-1">
                    Vérifiez votre immatricule ou contactez l'administrateur.
                  </p>
                </div>
              </div>
            )}

            {/* Section info - Gris noir */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="text-gray-700 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">Processus sécurisé</p>
                  <p className="text-gray-700 text-xs mt-1">
                    <strong className="text-gray-900">🛡️ Sécurité renforcée :</strong> Votre ancien mot de passe est immédiatement invalidé. L'administrateur devra approuver la réinitialisation pour générer un nouveau mot de passe définitif.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-800 flex items-center space-x-2">
                <User size={16} />
                <span>Immatricule de travail</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={immatricule}
                  onChange={(e) => setImmatricule(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white text-gray-900"
                  placeholder="Ex: AGENT001, SEC001..."
                  disabled={loading}
                />
              </div>
              <p className="text-gray-600 text-xs">
                Entrez votre numéro d'immatricule professionnel
              </p>
            </div>

            

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Annuler
              </button>
              {/* Bouton Vérifier en bleu */}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Vérification...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Search size={16} />
                    <span>Vérifier</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Étape 2: Confirmation */}
        {step === 2 && userInfo && (
          <div className="space-y-4">
            {/* Message succès */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 text-sm font-medium">Demande envoyée avec succès !</p>
                  <p className="text-green-800 text-xs mt-1">{message}</p>
                </div>
              </div>
            </div>

            {/* Informations de l'utilisateur - Gris noir */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-800 p-2 rounded-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userInfo.nom_complet}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-700 mt-1">
                    <span>Immatricule: {userInfo.immatricule}</span>
                    <span>•</span>
                    <span>Username: {userInfo.username}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissement sécurité - Gris noir */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Lock className="text-gray-700 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">🛡️ Sécurité activée</p>
                  <p className="text-gray-700 text-xs mt-1">
                    <strong className="text-gray-900">Votre ancien mot de passe a été invalidé.</strong> Vous ne pouvez plus vous connecter avec l'ancien mot de passe. Attendez l'approbation de l'administrateur pour recevoir votre nouveau mot de passe définitif.
                  </p>
                </div>
              </div>
            </div>

            {/* En attente - Gris noir */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-gray-700 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">En attente d'approbation</p>
                  <p className="text-gray-700 text-xs mt-1">
                    L'administrateur a été notifié. Une fois la demande approuvée, vous recevrez votre <strong className="text-gray-900">nouveau mot de passe définitif</strong>. Votre nom d'utilisateur restera le même.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Nouvelle demande
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;