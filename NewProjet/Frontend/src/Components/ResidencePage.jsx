import React, { useState } from "react";
import {
  Home,
  Users,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Edit,
  Trash2,
  Map,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Données mockées pour les résidences
const mockResidences = [
  {
    id: 1,
    name: "Résidence Les Jardins",
    photo:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
    proprietaire: "Jean Dupont",
    totalResidents: 24,
    hommes: 14,
    femmes: 10,
    adresse: "123 Avenue de la Liberté, Antananarivo",
    telephone: "+261 34 12 345 67",
    email: "j.dupont@email.com",
    latitude: -18.9136896,
    longitude: 47.5494648,
    status: "active",
    dateCreation: "2023-01-15",
    residents: [
      {
        id: 1,
        name: "Marie Lambert",
        genre: "femme",
        age: 28,
        profession: "Enseignante",
      },
      {
        id: 2,
        name: "Pierre Durand",
        genre: "homme",
        age: 32,
        profession: "Ingénieur",
      },
      {
        id: 3,
        name: "Sophie Martin",
        genre: "femme",
        age: 25,
        profession: "Étudiante",
      },
      {
        id: 4,
        name: "Thomas Moreau",
        genre: "homme",
        age: 45,
        profession: "Commercial",
      },
      {
        id: 5,
        name: "Alice Petit",
        genre: "femme",
        age: 29,
        profession: "Médecin",
      },
      {
        id: 6,
        name: "Robert Lefebvre",
        genre: "homme",
        age: 38,
        profession: "Architecte",
      },
    ],
  },
  {
    id: 2,
    name: "Résidence du Lac",
    photo:
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=300&fit=crop",
    proprietaire: "Sarah Johnson",
    totalResidents: 18,
    hommes: 8,
    femmes: 10,
    adresse: "456 Rue des Fleurs, Antananarivo",
    telephone: "+261 33 12 345 67",
    email: "s.johnson@email.com",
    latitude: -18.91,
    longitude: 47.552,
    status: "active",
    dateCreation: "2023-03-20",
    residents: [
      {
        id: 1,
        name: "David Wilson",
        genre: "homme",
        age: 31,
        profession: "Développeur",
      },
      {
        id: 2,
        name: "Emma Brown",
        genre: "femme",
        age: 27,
        profession: "Designer",
      },
      {
        id: 3,
        name: "Michael Davis",
        genre: "homme",
        age: 42,
        profession: "Manager",
      },
      {
        id: 4,
        name: "Olivia Garcia",
        genre: "femme",
        age: 24,
        profession: "Infirmière",
      },
    ],
  },
  {
    id: 3,
    name: "Résidence Belle Vue",
    photo:
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&h=300&fit=crop",
    proprietaire: "Michel Ravel",
    totalResidents: 32,
    hommes: 18,
    femmes: 14,
    adresse: "789 Boulevard de l'Indépendance, Antananarivo",
    telephone: "+261 32 12 345 67",
    email: "m.ravel@email.com",
    latitude: -18.908,
    longitude: 47.551,
    status: "active",
    dateCreation: "2023-02-10",
    residents: [
      {
        id: 1,
        name: "Catherine Leroy",
        genre: "femme",
        age: 35,
        profession: "Avocate",
      },
      {
        id: 2,
        name: "Philippe Morel",
        genre: "homme",
        age: 29,
        profession: "Consultant",
      },
      {
        id: 3,
        name: "Isabelle Petit",
        genre: "femme",
        age: 26,
        profession: "Journaliste",
      },
    ],
  },
  {
    id: 4,
    name: "Résidence Le Parc",
    photo:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    proprietaire: "Robert Martin",
    totalResidents: 22,
    hommes: 12,
    femmes: 10,
    adresse: "321 Rue des Roses, Antananarivo",
    telephone: "+261 34 56 789 01",
    email: "r.martin@email.com",
    latitude: -18.905,
    longitude: 47.553,
    status: "active",
    dateCreation: "2023-04-05",
    residents: [
      {
        id: 1,
        name: "Lucie Bernard",
        genre: "femme",
        age: 31,
        profession: "Architecte",
      },
      {
        id: 2,
        name: "Antoine Petit",
        genre: "homme",
        age: 28,
        profession: "Designer",
      },
    ],
  },
  {
    id: 5,
    name: "Résidence Les Oliviers",
    photo:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
    proprietaire: "Sophie Laurent",
    totalResidents: 16,
    hommes: 7,
    femmes: 9,
    adresse: "654 Avenue des Palmiers, Antananarivo",
    telephone: "+261 33 45 678 90",
    email: "s.laurent@email.com",
    latitude: -18.907,
    longitude: 47.548,
    status: "active",
    dateCreation: "2023-05-12",
    residents: [
      {
        id: 1,
        name: "Nicolas Dubois",
        genre: "homme",
        age: 35,
        profession: "Ingénieur",
      },
      {
        id: 2,
        name: "Émilie Rousseau",
        genre: "femme",
        age: 29,
        profession: "Médecin",
      },
    ],
  },
];

export default function ResidencePage({ onBack, searchQuery, onSearchChange }) {
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResidence, setEditingResidence] = useState(null);
  const [editedResidents, setEditedResidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedResidence, setExpandedResidence] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [residencesPerPage] = useState(4);

  const handleViewDetails = (residence) => {
    setSelectedResidence(residence);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResidence(null);
  };

  const handleViewOnMap = (residence) => {
    localStorage.setItem(
      "selectedResidence",
      JSON.stringify({
        latitude: residence.latitude,
        longitude: residence.longitude,
        name: residence.name,
        adresse: residence.adresse,
      })
    );
    window.location.href = "/";
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingResidence(null);
    setEditedResidents([]);
  };

  const handleSaveEdit = () => {
    console.log("Sauvegarde des modifications:", editedResidents);
    handleCloseEditModal();
  };

  const handleAddResident = () => {
    const newResident = {
      id: Date.now(),
      name: "",
      genre: "homme",
      age: "",
      profession: "",
    };
    setEditedResidents([...editedResidents, newResident]);
  };

  const handleRemoveResident = (residentId) => {
    setEditedResidents(
      editedResidents.filter((resident) => resident.id !== residentId)
    );
  };

  const handleResidentChange = (residentId, field, value) => {
    setEditedResidents(
      editedResidents.map((resident) =>
        resident.id === residentId ? { ...resident, [field]: value } : resident
      )
    );
  };

  const handleEditResidents = (residence) => {
    setEditingResidence(residence);
    setEditedResidents([...residence.residents]);
    setShowEditModal(true);
  };

  const toggleResidenceExpand = (residenceId) => {
    setExpandedResidence(
      expandedResidence === residenceId ? null : residenceId
    );
  };

  // Filtrage et tri des résidences avec la searchQuery passée en props
  const filteredResidences = mockResidences
    .filter((residence) => {
      const matchesSearch =
        residence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.proprietaire.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || residence.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "residents":
          return b.totalResidents - a.totalResidents;
        case "date":
          return new Date(b.dateCreation) - new Date(a.dateCreation);
        default:
          return 0;
      }
    });

  // Calcul de la pagination
  const indexOfLastResidence = currentPage * residencesPerPage;
  const indexOfFirstResidence = indexOfLastResidence - residencesPerPage;
  const currentResidences = filteredResidences.slice(indexOfFirstResidence, indexOfLastResidence);
  const totalPages = Math.ceil(filteredResidences.length / residencesPerPage);

  // Fonctions de pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calcul des totaux généraux
  const totalResidences = mockResidences.length;
  const totalResidents = mockResidences.reduce(
    (total, residence) => total + residence.totalResidents,
    0
  );
  const totalHommes = mockResidences.reduce(
    (total, residence) => total + residence.hommes,
    0
  );
  const totalFemmes = mockResidences.reduce(
    (total, residence) => total + residence.femmes,
    0
  );

  return (
    <div className="h-full flex">
      {/* Section principale des résidences qui se réduit quand le modal s'ouvre */}
      <div className={`transition-all duration-300 ease-in-out ${
        showModal ? "w-1/2" : "w-full"
      }`}>
        <div className="h-full flex flex-col">
          {/* Header avec fond transparent */}
          <div className="flex items-center justify-between p-8 border-gray-200/60 bg-transparent">
            <h1 className="font-bold text-3xl text-gray-800 bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl border border-gray-200/60">Résidences</h1>
          </div>

          {/* Statistiques compactes avec fond transparent */}
          <div className="border-gray-200/60 bg-transparent">
            <div className="grid grid-cols-4 gap-4 ml-12 mr-12">
              
              {/* Résidences */}
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {totalResidences}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Résidences</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <span>▲ 12%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>

              {/* Résidents */}
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {totalResidents}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Résidents</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <span>▲ 8%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>

              {/* Hommes */}
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {totalHommes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Hommes</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-blue-600">
                  <span>{Math.round((totalHommes / totalResidents) * 100)}%</span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>

              {/* Femmes */}
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {totalFemmes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Femmes</div>
                  </div>
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-pink-600">
                  <span>{Math.round((totalFemmes / totalResidents) * 100)}%</span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des résidences avec scroll */}
          <div className="flex-1 overflow-y-auto bg-transparent">
            <div className="p-3 space-y-3 mr-3.3 ml-4">
              {currentResidences.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-600 text-lg mb-2">
                    Aucune résidence trouvée
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Aucune résidence ne correspond à votre recherche "{searchQuery}"
                  </p>
                </div>
              ) : (
                currentResidences.map((residence) => (
                  <div
                    key={residence.id}
                    className="bg-white backdrop-blur-sm border border-gray-200/60 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    {/* En-tête compact */}
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={residence.photo}
                              alt={residence.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">
                              {residence.adresse}
                            </h3>
                            <div className="flex items-center space-x-1 mt-1 text-gray-600">
                              <MapPin size={12} />
                              <span className="text-xs truncate">
                                {residence.adresse}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleViewDetails(residence)}
                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex"
                            title="Détails"
                          >
                            <Eye className="mt-2" size={12} />
                            <span className="px-3">Details</span>
                          </button>
                          <button
                            onClick={() => handleViewOnMap(residence)}
                            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex"
                            title="Carte"
                          >
                            <Map className="mt-2" size={12} />
                            <span className="px-2">Carte</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination FIXE EN BAS */}
          {filteredResidences.length > residencesPerPage && (
            <div className="border-t border-gray-200/60 bg-white/30 backdrop-blur-sm py-3 px-6 shadow-inner">
              <div className="flex items-center justify-center">
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Numéros de page */}
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === number
                            ? "bg-blue-600 text-white border border-blue-600"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails qui s'affiche à côté */}
      {showModal && selectedResidence && (
        <div className="w-1/2 bg-transparent rounded-r-3xl overflow-hidden shadow-xl border-l border-gray-200/60">
          <div className="h-full flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-transparent">
              <h2 className="text-xl bg-white py-3 px-6 rounded-2xl font-bold text-gray-800">
                Détails Résidence
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal avec scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex space-x-4">
                <img
                  src={selectedResidence.photo}
                  alt={selectedResidence.name}
                  className="w-24 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {selectedResidence.name}
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedResidence.adresse}
                  </div>
                  <div className="flex space-x-3 mt-2">
                    <div className="flex items-center space-x-1 text-blue-600 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{selectedResidence.hommes}H</span>
                    </div>
                    <div className="flex items-center space-x-1 text-pink-600 text-sm">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>{selectedResidence.femmes}F</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-white backdrop-blur-sm rounded-lg border border-gray-200/60">
                  <span className="text-sm text-gray-800">Propriétaire:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedResidence.proprietaire}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white backdrop-blur-sm rounded-lg border border-gray-200/60">
                  <span className="text-sm text-gray-800">Téléphone:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedResidence.telephone}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white backdrop-blur-sm rounded-lg border border-gray-200/60">
                  <span className="text-sm text-gray-800">Email:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedResidence.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white backdrop-blur-sm rounded-lg border border-gray-200/60">
                  <span className="text-sm text-gray-800">Total résidents:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedResidence.totalResidents}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white backdrop-blur-sm rounded-lg border border-gray-200/60">
                  <span className="text-sm text-gray-800">Date création:</span>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(selectedResidence.dateCreation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Liste des résidents */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Liste des résidents ({selectedResidence.residents.length})</h4>
                <div className="space-y-2 max-h-41 overflow-y-auto">
                  {selectedResidence.residents.map((resident) => (
                    <div key={resident.id} className="flex items-center justify-between p-3 bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-800">{resident.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          resident.genre === 'homme' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-pink-100 text-pink-600'
                        }`}>
                          {resident.genre === 'homme' ? '♂' : '♀'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {resident.age} ans • {resident.profession}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200/60">
                <button
                  onClick={() => handleEditResidents(selectedResidence)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Modifier les résidents
                </button>
                <button
                  onClick={() => handleViewOnMap(selectedResidence)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Voir sur la carte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition (reste en overlay) */}
      {showEditModal && editingResidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/30 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-200/60">
            <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
              <h2 className="text-lg font-bold text-gray-800">
                Modifier - {editingResidence.name}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {editedResidents.map((resident) => (
                  <div
                    key={resident.id}
                    className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <input
                      type="text"
                      value={resident.name}
                      onChange={(e) =>
                        handleResidentChange(
                          resident.id,
                          "name",
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Nom"
                    />
                    <select
                      value={resident.genre}
                      onChange={(e) =>
                        handleResidentChange(
                          resident.id,
                          "genre",
                          e.target.value
                        )
                      }
                      className="px-2 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="homme">H</option>
                      <option value="femme">F</option>
                    </select>
                    <input
                      type="number"
                      value={resident.age}
                      onChange={(e) =>
                        handleResidentChange(
                          resident.id,
                          "age",
                          e.target.value
                        )
                      }
                      className="w-16 px-2 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Âge"
                    />
                    <button
                      onClick={() => handleRemoveResident(resident.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={handleAddResident}
                  className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Plus size={12} />
                  <span>Ajouter</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}