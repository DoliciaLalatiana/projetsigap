import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, User, Clock, AlertCircle } from 'lucide-react';

const PendingResidences = ({ onBack }) => {
  const [pendingResidences, setPendingResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

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
        fetchPendingResidences();
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
        fetchPendingResidences();
      } else {
        alert('Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur réseau');
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
            {/* SUPPRESSION DU BOUTON RETOUR - On utilise SIGAP pour le retour */}
            <h2 className="text-2xl bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl font-bold text-gray-800">Demandes en attente</h2>
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
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedResidence?.id === residence.id 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200/60 bg-white/50'
                  }`}
                  onClick={() => setSelectedResidence(residence)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin size={16} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-800">
                          {residence.residence_data.lot}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <User size={14} />
                        <span>{residence.submitter_name}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        Quartier: {residence.residence_data.quartier}
                      </div>

                      <div className="text-xs text-gray-400">
                        {new Date(residence.created_at).toLocaleDateString()}
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
        {selectedResidence ? (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Détails de la demande
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-2">Informations de la résidence</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de lot:</span>
                    <span className="font-medium">{selectedResidence.residence_data.lot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quartier:</span>
                    <span className="font-medium">{selectedResidence.residence_data.quartier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ville:</span>
                    <span className="font-medium">{selectedResidence.residence_data.ville || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordonnées:</span>
                    <span className="font-medium">
                      {selectedResidence.residence_data.lat?.toFixed(6)}, {selectedResidence.residence_data.lng?.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-2">Informations de l'agent</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium">{selectedResidence.submitter_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Immatricule:</span>
                    <span className="font-medium">{selectedResidence.submitter_immatricule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fokontany:</span>
                    <span className="font-medium">{selectedResidence.fokontany_nom}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingResidences;