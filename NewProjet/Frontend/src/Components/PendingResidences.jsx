import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, User, Clock, AlertCircle, Bell } from 'lucide-react';

const PendingResidences = ({ onBack, onResidenceApproved, residenceToSelect }) => {
  const [pendingResidences, setPendingResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [notificationCleared, setNotificationCleared] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

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
        console.error('Erreur chargement résidences en attente');
      }
    } catch (error) {
      console.error('Erreur:', error);
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
        console.log('Notification marquée comme lue:', notificationId);
        // Rafraîchir les notifications si un callback est fourni
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  // EFFET POUR SÉLECTIONNER AUTOMATIQUEMENT ET MARQUER LA NOTIFICATION COMME LUE
  useEffect(() => {
    console.log('[PENDING] residenceToSelect effect triggered:', residenceToSelect);
    console.log('[PENDING] Current pendingResidences:', pendingResidences.length);
    
    if (residenceToSelect && pendingResidences.length > 0 && !notificationCleared) {
      console.log('[PENDING] Looking for residence with ID:', residenceToSelect);
      
      // Essayer de trouver la résidence par différents critères
      const foundResidence = pendingResidences.find(residence => {
        console.log('[PENDING] Checking residence:', {
          id: residence.id,
          residence_id: residence.residence_id,
          residence_data_id: residence.residence_data?.id,
          pending_id: residence.pending_id
        });
        
        // Essayer plusieurs façons de faire correspondre l'ID
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
        
        // Vérifier également dans le message si présent
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
        
        // Marquer les notifications liées à cette résidence comme lues
        markNotificationAsRead(foundResidence.id);
        
        // Pré-remplir les notes avec des informations utiles
        setReviewNotes(`Notification pour la résidence "${foundResidence.residence_data?.lot || ''}" - ` +
                      `Soumis par: ${foundResidence.submitter_name || ''}`);
        
        // Scroll vers l'élément sélectionné
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
    setReviewNotes(`Résidence "${residence.residence_data?.lot || ''}" - ` +
                  `Quartier: ${residence.residence_data?.quartier || ''}`);
    
    // Si cette résidence venait d'une notification, marquer comme lue
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
        alert('Résidence approuvée avec succès');
        setSelectedResidence(null);
        setReviewNotes('');
        setNotificationCleared(false);
        fetchPendingResidences();
        
        // Appeler le callback pour mettre à jour les notifications
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      } else {
        alert('Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur réseau');
    }
  };

  const handleReject = async (pendingId) => {
    if (!reviewNotes.trim()) {
      alert('Veuillez fournir une raison pour le rejet');
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
        alert('Résidence rejetée avec succès');
        setSelectedResidence(null);
        setReviewNotes('');
        setNotificationCleared(false);
        fetchPendingResidences();
        
        // Appeler le callback pour mettre à jour les notifications
        if (onResidenceApproved) {
          onResidenceApproved();
        }
      } else {
        alert('Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur réseau');
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || 'Date inconnue';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes...</p>
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
            <Bell className="text-blue-500" size={24} />
            <h2 className="text-2xl bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl font-bold text-gray-800">Demandes en attente</h2>
            {residenceToSelect && !notificationCleared && (
              <span className="text-xs px-3 py-1 bg-yellow-500 text-white rounded-full animate-pulse">
                Nouvelle notification
              </span>
            )}
          </div>

          {pendingResidences.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-black text-lg">Aucune demande en attente</p>
              <p className="text-black text-sm mt-2">
                Les nouvelles résidences soumises par les agents apparaîtront ici
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
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200/60 bg-white/50'
                  } ${residence.id === residenceToSelect && !notificationCleared ? 'border-yellow-400 border-2' : ''}`}
                  onClick={() => handleResidenceClick(residence)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin size={16} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-800">
                          {residence.residence_data?.lot || 'Lot non spécifié'}
                        </h3>
                        {residence.id === residenceToSelect && !notificationCleared && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full animate-pulse">
                            Nouveau!
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <User size={14} />
                        <span>{residence.submitter_name || 'Agent inconnu'}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        Quartier: {residence.residence_data?.quartier || 'Non spécifié'}
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
              Détails de la demande
              {selectedResidence.id === residenceToSelect && !notificationCleared && (
                <span className="ml-2 text-sm bg-yellow-500 text-white px-2 py-1 rounded-full animate-pulse">
                  Nouvelle notification
                </span>
              )}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-2">Informations de la résidence</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de lot:</span>
                    <span className="font-medium">{selectedResidence.residence_data?.lot || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quartier:</span>
                    <span className="font-medium">{selectedResidence.residence_data?.quartier || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ville:</span>
                    <span className="font-medium">{selectedResidence.residence_data?.ville || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordonnées:</span>
                    <span className="font-medium">
                      {selectedResidence.residence_data?.lat?.toFixed(6) || 'N/A'}, {selectedResidence.residence_data?.lng?.toFixed(6) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-2">Informations de l'agent</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium">{selectedResidence.submitter_name || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Immatricule:</span>
                    <span className="font-medium">{selectedResidence.submitter_immatricule || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fokontany:</span>
                    <span className="font-medium">{selectedResidence.fokontany_nom || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de soumission:</span>
                    <span className="font-medium">{formatDate(selectedResidence.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes pour l'agent (optionnel)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Ajoutez des commentaires ou des raisons pour votre décision..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                rows="4"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleApprove(selectedResidence.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Check size={20} />
                <span>Approuver</span>
              </button>
              
              <button
                onClick={() => handleReject(selectedResidence.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X size={20} />
                <span>Rejeter</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4 mt-16" size={48} />
            <p className="text-black text-lg">Sélectionnez une demande</p>
            <p className="text-black text-sm mt-2">
              Cliquez sur une demande dans la liste pour voir les détails
            </p>
            {residenceToSelect && !notificationCleared && (
              <p className="text-blue-600 text-sm mt-4 flex items-center justify-center">
                <Bell className="mr-2" size={16} />
                <i>Une notification a été cliquée - sélectionnez la résidence correspondante</i>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingResidences;