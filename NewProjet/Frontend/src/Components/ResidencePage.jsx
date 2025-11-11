import React, { useState } from 'react';
import { ArrowLeft, Home, Users, Eye, MapPin, Phone, Mail, User, Edit, Trash2, Map } from 'lucide-react';

// Données mockées pour les résidences
const mockResidences = [
  {
    id: 1,
    name: "Résidence Les Jardins",
    photo: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
    proprietaire: "Jean Dupont",
    totalResidents: 24,
    hommes: 14,
    femmes: 10,
    adresse: "123 Avenue de la Liberté, Antananarivo",
    telephone: "+261 34 12 345 67",
    email: "j.dupont@email.com",
    latitude: -18.9136896,
    longitude: 47.5494648,
    residents: [
      { id: 1, name: "Marie Lambert", genre: "femme" },
      { id: 2, name: "Pierre Durand", genre: "homme" },
      { id: 3, name: "Sophie Martin", genre: "femme" },
      { id: 4, name: "Thomas Moreau", genre: "homme" },
      { id: 5, name: "Alice Petit", genre: "femme" },
      { id: 6, name: "Robert Lefebvre", genre: "homme" }
    ]
  },
  {
    id: 2,
    name: "Résidence du Lac",
    photo: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=300&fit=crop",
    proprietaire: "Sarah Johnson",
    totalResidents: 18,
    hommes: 8,
    femmes: 10,
    adresse: "456 Rue des Fleurs, Antananarivo",
    telephone: "+261 33 12 345 67",
    email: "s.johnson@email.com",
    latitude: -18.9100000,
    longitude: 47.5520000,
    residents: [
      { id: 1, name: "David Wilson", genre: "homme" },
      { id: 2, name: "Emma Brown", genre: "femme" },
      { id: 3, name: "Michael Davis", genre: "homme" },
      { id: 4, name: "Olivia Garcia", genre: "femme" }
    ]
  }
];

export default function ResidencePage({ onBack }) {
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResidence, setEditingResidence] = useState(null);
  const [editedResidents, setEditedResidents] = useState([]);

  const handleViewDetails = (residence) => {
    setSelectedResidence(residence);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResidence(null);
  };

  const handleViewOnMap = (residence) => {
    // Stocker les coordonnées de la résidence pour la carte
    localStorage.setItem('selectedResidence', JSON.stringify({
      latitude: residence.latitude,
      longitude: residence.longitude,
      name: residence.name,
      adresse: residence.adresse
    }));
    
    // Rediriger vers la page principale avec la carte
    window.location.href = '/';
  };


  const handleEdit = (residence) => {
    setEditingResidence(residence);
    setEditedResidents([...residence.residents]);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingResidence(null);
    setEditedResidents([]);
  };

  const handleSaveEdit = () => {
    console.log('Sauvegarde des modifications:', editedResidents);
    // Logique de sauvegarde ici
    handleCloseEditModal();
  };

  const handleAddResident = () => {
    const newResident = {
      id: Date.now(),
      name: '',
      genre: 'homme'
    };
    setEditedResidents([...editedResidents, newResident]);
  };

  const handleRemoveResident = (residentId) => {
    setEditedResidents(editedResidents.filter(resident => resident.id !== residentId));
  };

  const handleResidentChange = (residentId, field, value) => {
    setEditedResidents(editedResidents.map(resident => 
      resident.id === residentId ? { ...resident, [field]: value } : resident
    ));
  };

  // Calcul des totaux généraux
  const totalResidences = mockResidences.length;
  const totalResidents = mockResidences.reduce((total, residence) => total + residence.totalResidents, 0);
  const totalHommes = mockResidences.reduce((total, residence) => total + residence.hommes, 0);
  const totalFemmes = mockResidences.reduce((total, residence) => total + residence.femmes, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header avec style amélioré */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              <span>Retour</span>
            </button>
            <h1 className="text-3xl font-bold text-white bg-blue-600 px-4 py-2 rounded-lg shadow-md">
              Liste des Résidences
            </h1>
          </div>
          
        </div>

        {/* Tableau des résidences plus large */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-24">Photo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom de la Propriété</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Résidents</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockResidences.map((residence) => (
                <tr key={residence.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {/* Colonne Photo */}
                  <td className="px-6 py-4">
                    <div className="w-20 h-16 rounded-lg overflow-hidden shadow-md">
                      <img 
                        src={residence.photo} 
                        alt={residence.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  
                  {/* Colonne Nom de la Propriété */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">{residence.name}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                        <MapPin size={14} />
                        <span>{residence.adresse}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Colonne Total Résidents */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Users size={20} className="text-green-600" />
                      <div>
                        <span className="font-medium text-gray-700 text-lg">{residence.totalResidents}</span>
                        <span className="text-gray-500 text-sm ml-1">résidents</span>
                        <div className="flex items-center space-x-2 mt-1 text-xs">
                          <div className="flex items-center space-x-1 text-blue-600">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>{residence.hommes}H</span>
                          </div>
                          <div className="flex items-center space-x-1 text-pink-600">
                            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                            <span>{residence.femmes}F</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Colonne Actions élargie */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(residence)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1 justify-center text-sm"
                      >
                        <Eye size={14} />
                        <span>Détails</span>
                      </button>
                      <button
                        onClick={() => handleViewOnMap(residence)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex-1 justify-center text-sm"
                      >
                        <Map size={14} />
                        <span>Carte</span>
                      </button>
                      <button
                        onClick={() => handleEdit(residence)}
                        className="flex items-center space-x-2 bg-yellow-600 text-white px-2 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                        title="Modifier"
                      >
                        <Edit size={14} />
                      </button>
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistiques améliorées avec différenciation H/F */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="text-blue-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalResidences}</div>
                <div className="text-sm text-gray-600">Résidences totales</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalResidents}</div>
                <div className="text-sm text-gray-600">Résidents total</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">H</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalHommes}</div>
                <div className="text-sm text-gray-600">Hommes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">F</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalFemmes}</div>
                <div className="text-sm text-gray-600">Femmes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de détails - Fond blanc */}
        {showModal && selectedResidence && (
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              {/* Header du modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-800">Détails de la Résidence</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Photo et informations principales */}
                  <div>
                    <div className="rounded-lg overflow-hidden shadow-lg mb-4">
                      <img 
                        src={selectedResidence.photo} 
                        alt={selectedResidence.name}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-800">{selectedResidence.name}</h3>
                      
                      <div className="flex items-center space-x-3 text-gray-600">
                        <MapPin size={18} />
                        <span>{selectedResidence.adresse}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Users size={18} />
                        <span>{selectedResidence.totalResidents} résidents</span>
                      </div>

                      {/* Statistiques genre */}
                      <div className="flex space-x-4 mt-3">
                        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700 font-medium">{selectedResidence.hommes} hommes</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-pink-50 px-3 py-2 rounded-lg">
                          <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                          <span className="text-pink-700 font-medium">{selectedResidence.femmes} femmes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations propriétaire et résidents */}
                  <div className="space-y-6">
                    {/* Propriétaire */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Propriétaire</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-500" />
                          <span className="text-gray-700">{selectedResidence.proprietaire}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-700">{selectedResidence.telephone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail size={16} className="text-gray-500" />
                          <span className="text-gray-700">{selectedResidence.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Liste des résidents */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Liste des Résidents</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedResidence.residents.map((resident) => (
                          <div
                            key={resident.id}
                            className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              resident.genre === 'homme' ? 'bg-blue-100' : 'bg-pink-100'
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${
                                resident.genre === 'homme' ? 'bg-blue-500' : 'bg-pink-500'
                              }`}></div>
                            </div>
                            <span className="text-gray-700 font-medium">{resident.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              resident.genre === 'homme' ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-pink-100 text-pink-800'
                            }`}>
                              {resident.genre}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer du modal */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de modification des résidents - Fond blanc */}
        {showEditModal && editingResidence && (
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              {/* Header du modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-800">
                  Modifier les Résidents - {editingResidence.name}
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Liste des Résidents</h3>
                    <button
                      onClick={handleAddResident}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <span>+ Ajouter un résident</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {editedResidents.map((resident) => (
                      <div key={resident.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nom du résident
                            </label>
                            <input
                              type="text"
                              value={resident.name}
                              onChange={(e) => handleResidentChange(resident.id, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nom du résident"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Genre
                            </label>
                            <select
                              value={resident.genre}
                              onChange={(e) => handleResidentChange(resident.id, 'genre', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="homme">Homme</option>
                              <option value="femme">Femme</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveResident(resident.id)}
                          className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Résumé des modifications */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">Résumé</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{editedResidents.length}</div>
                      <div className="text-blue-700">Total résidents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {editedResidents.filter(r => r.genre === 'homme').length}
                      </div>
                      <div className="text-blue-700">Hommes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {editedResidents.filter(r => r.genre === 'femme').length}
                      </div>
                      <div className="text-pink-700">Femmes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer du modal */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={handleCloseEditModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}