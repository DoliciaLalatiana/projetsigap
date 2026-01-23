import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, User, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PendingResidences = ({ onBack, onResidenceApproved, residenceToSelect }) => {
  const { t, i18n } = useTranslation();
  const [pendingResidences, setPendingResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [notificationCleared, setNotificationCleared] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Fonction pour traduire les valeurs qui viennent de l'API
  const translateValue = (value) => {
    if (!value) return value;
    
    // Mappez les valeurs spécifiques qui viennent de l'API
    const translations = {
      // Quartier/Neighborhood
      'Fari-tany tsy fantatra': t('unknownNeighborhood'),
      'Quartier inconnu': t('unknownNeighborhood'),
      'Fari-tany tsy voafaritra': t('neighborhoodNotSpecified'),
      'Quartier non spécifié': t('neighborhoodNotSpecified'),
      
      // Ville/City
      'Tanàna tsy fantatra': t('unknownCity'),
      'Ville inconnue': t('unknownCity'),
      
      // Lot
      'Lot tsy voafaritra': t('lotNotSpecified'),
      'Lot non spécifié': t('lotNotSpecified'),
    };
    
    return translations[value] || value;
  };

  const fetchPendingResidences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/residences/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingResidences(data);
      } else {
        console.error(t('errorLoadingStatistics'));
      }
    } catch (error) {
      console.error(t('error') + ':', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResidences();
  }, []);

  // FONCTION POUR MARQUER UNE NOTIFICATION COMME LUE
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(t('markAsRead') + ':', notificationId);
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      }
    } catch (error) {
      console.error(t('error') + ' ' + t('markAsMask') + ':', error);
    }
  };

  // EFFET POUR SÉLECTIONNER AUTOMATIQUEMENT ET MARQUER LA NOTIFICATION COMME LUE
  useEffect(() => {
    console.log('[PENDING] residenceToSelect effect triggered:', residenceToSelect);
    console.log('[PENDING] Current pendingResidences:', pendingResidences.length);
    
    if (residenceToSelect && pendingResidences.length > 0 && !notificationCleared) {
      console.log('[PENDING] Looking for residence with ID:', residenceToSelect);
      
      const foundResidence = pendingResidences.find(residence => {
        console.log('[PENDING] Checking residence:', {
          id: residence.id,
          residence_id: residence.residence_id,
          residence_data_id: residence.residence_data?.id,
          pending_id: residence.pending_id
        });
        
        if (residence.id && residence.id.toString() === residenceToSelect.toString()) {
          return true;
        }
        if (residence.residence_id && residence.residence_id.toString() === residenceToSelect.toString()) {
          return true;
        }
        if (residence.residence_data?.id && residence.residence_data.id.toString() === residenceToSelect.toString()) {
          return true;
        }
        if (residence.pending_id && residence.pending_id.toString() === residenceToSelect.toString()) {
          return true;
        }
        
        if (residence.residence_data?.lot && 
            residence.residence_data.lot.toLowerCase().includes(residenceToSelect.toString().toLowerCase())) {
          return true;
        }
        
        return false;
      });
      
      if (foundResidence) {
        console.log('[PENDING] Found residence for auto-selection:', foundResidence);
        setSelectedResidence(foundResidence);
        setNotificationCleared(true);
        
        markNotificationAsRead(foundResidence.id);
        
        // Ne pas pré-remplir les notes pour les notifications
        // Laisser la zone de texte vide
        setReviewNotes('');
        
        setTimeout(() => {
          const selectedElement = document.querySelector(`[data-residence-id="${foundResidence.id}"]`);
          if (selectedElement) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        console.warn('[PENDING] No matching residence found for ID:', residenceToSelect);
        console.warn('[PENDING] Available IDs:', pendingResidences.map(r => ({
          id: r.id,
          residence_id: r.residence_id,
          residence_data_id: r.residence_data?.id,
          lot: r.residence_data?.lot
        })));
      }
    }
  }, [residenceToSelect, pendingResidences, notificationCleared]);

  // GESTIONNAIRE POUR CLIQUER SUR UNE RÉSIDENCE
  const handleResidenceClick = (residence) => {
    setSelectedResidence(residence);
    // Réinitialiser les notes à vide lorsqu'on clique sur une résidence
    setReviewNotes('');
    
    if (residence.id === residenceToSelect && !notificationCleared) {
      markNotificationAsRead(residence.id);
      setNotificationCleared(true);
    }
  };

  const handleApprove = async (pendingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/residences/pending/${pendingId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        alert(t('saveSuccess'));
        setSelectedResidence(null);
        setReviewNotes('');
        setNotificationCleared(false);
        fetchPendingResidences();
        
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      } else {
        alert(t('saveError'));
      }
    } catch (error) {
      console.error(t('error') + ':', error);
      alert(t('connectionError'));
    }
  };

  const handleReject = async (pendingId) => {
    if (!reviewNotes.trim()) {
      alert(t('reviewNotesRequired'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/residences/pending/${pendingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        alert(t('residenceRejected'));
        setSelectedResidence(null);
        setReviewNotes('');
        setNotificationCleared(false);
        fetchPendingResidences();
        
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      } else {
        alert(t('rejectionError'));
      }
    } catch (error) {
      console.error(t('error') + ':', error);
      alert(t('connectionError'));
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || t('unknownDate');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingRequests')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white/30 rounded-3xl overflow-hidden">
      {/* Liste des demandes */}
      <div className="w-1/2 border-r border-gray-200/60 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('pendingRequests')}</h2>
            {residenceToSelect && !notificationCleared && (
              <span className="text-xs px-3 py-1 bg-gray-800 text-white rounded-full animate-pulse">
                {t('newNotification')}
              </span>
            )}
          </div>

          {pendingResidences.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-800 text-lg">{t('noPendingRequests')}</p>
              <p className="text-gray-600 text-sm mt-2">
                {t('newResidencesWillAppear')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingResidences.map((residence) => (
                <div
                  key={residence.id}
                  data-residence-id={residence.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedResidence?.id === residence.id 
                      ? 'border-gray-800 bg-gray-100/50' 
                      : 'border-gray-200/60 bg-white/50'
                  } ${residence.id === residenceToSelect && !notificationCleared ? 'border-gray-800 border-2' : ''}`}
                  onClick={() => handleResidenceClick(residence)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin size={16} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-800">
                          {translateValue(residence.residence_data?.lot) || t('lotNotSpecified')}
                        </h3>
                        {residence.id === residenceToSelect && !notificationCleared && (
                          <span className="text-xs px-2 py-1 bg-gray-800 text-white rounded-full animate-pulse">
                            {t('new')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <User size={14} />
                        <span>{residence.submitter_name || t('unknownAgent')}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        {t('neighborhood')}: {translateValue(residence.residence_data?.quartier) || t('notSpecified')}
                      </div>

                      <div className="text-xs text-gray-400">
                        {formatDate(residence.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Détails de la demande sélectionnée */}
      <div className="w-1/2 p-6 overflow-y-auto">
        {pendingResidences.length === 0 ? (
          <div></div>
        ) : selectedResidence ? (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {t('requestDetails')}
              {selectedResidence.id === residenceToSelect && !notificationCleared && (
                <span className="ml-2 text-sm bg-gray-800 text-white px-2 py-1 rounded-full animate-pulse">
                  {t('newNotification')}
                </span>
              )}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-3">{t('residenceInformation')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('lotNumber')} : </span>
                    {translateValue(selectedResidence.residence_data?.lot) || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('neighborhood')} : </span>
                    {translateValue(selectedResidence.residence_data?.quartier) || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('city')} : </span>
                    {translateValue(selectedResidence.residence_data?.ville) || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('coordinates')} : </span>
                    {selectedResidence.residence_data?.lat?.toFixed(6) || 'N/A'}, {selectedResidence.residence_data?.lng?.toFixed(6) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-3">{t('agentInformation')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('name')}: </span>
                    {selectedResidence.submitter_name || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('registration')}: </span>
                    {selectedResidence.submitter_immatricule || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('fokontany')}: </span>
                    {selectedResidence.fokontany_nom || t('notSpecified')}
                  </div>
                  <div className="text-gray-800">
                    <span className="font-medium text-gray-600">{t('submissionDate')}: </span>
                    {formatDate(selectedResidence.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notesForAgent')}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t('addCommentsPlaceholder')}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent bg-white/50"
                rows="4"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleReject(selectedResidence.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={20} />
                <span>{t('reject')}</span>
              </button>
              
              <button
                onClick={() => handleApprove(selectedResidence.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check size={20} />
                <span>{t('approve')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4 mt-16" size={48} />
            <p className="text-gray-800 text-lg">{t('selectRequest')}</p>
            <p className="text-gray-600 text-sm mt-2">
              {t('clickRequestInList')}
            </p>
            {residenceToSelect && !notificationCleared && (
              <p className="text-gray-700 text-sm mt-4 flex items-center justify-center">
                <i>{t('notificationClickedSelect')}</i>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingResidences;