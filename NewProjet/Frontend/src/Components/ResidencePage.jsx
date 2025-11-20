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

// Données mockées COMPLÈTES pour les résidences
const mockResidences = [
  {
    id: 1,
    name: "Résidence Les Jardins",
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&h=300&fit=crop"
    ],
    lot: "Lot 123A",
    quartier: "Analakely",
    ville: "Antananarivo",
    proprietaire: "Jean Dupont",
    totalResidents: 24,
    hommes: 14,
    femmes: 10,
    adresse: "123 Avenue de la Liberté, Antananarivo",
    telephone: "0341234567",
    email: "j.dupont@email.com",
    latitude: -18.9136896,
    longitude: 47.5494648,
    status: "active",
    dateCreation: "2023-01-15",
    residents: [
      {
        id: 1,
        nomComplet: "Marie Lambert",
        dateNaissance: "1995-05-15",
        cin: "123456789012",
        genre: "femme",
        telephone: "0341111111"
      },
      {
        id: 2,
        nomComplet: "Pierre Durand",
        dateNaissance: "1991-08-22",
        cin: "123456789013",
        genre: "homme",
        telephone: "0341111112"
      },
      {
        id: 3,
        nomComplet: "Sophie Martin",
        dateNaissance: "2008-03-10",
        genre: "femme",
        telephone: "0341111113"
      },
    ],
  },
  {
    id: 2,
    name: "Résidence du Lac",
    photos: [
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 456B",
    quartier: "Isoraka",
    ville: "Antananarivo",
    proprietaire: "Sarah Johnson",
    totalResidents: 18,
    hommes: 8,
    femmes: 10,
    adresse: "456 Rue des Fleurs, Antananarivo",
    telephone: "0331234567",
    email: "s.johnson@email.com",
    latitude: -18.91,
    longitude: 47.552,
    status: "active",
    dateCreation: "2023-03-20",
    residents: [
      {
        id: 1,
        nomComplet: "David Wilson",
        dateNaissance: "1992-12-05",
        cin: "123456789017",
        genre: "homme",
        telephone: "0341111117"
      },
      {
        id: 2,
        nomComplet: "Emma Brown",
        dateNaissance: "1996-04-20",
        cin: "123456789018",
        genre: "femme",
        telephone: "0341111118"
      },
    ],
  },
  {
    id: 3,
    name: "Résidence Belle Vue",
    photos: [
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 789C",
    quartier: "Andraharo",
    ville: "Antananarivo",
    proprietaire: "Michel Ravel",
    totalResidents: 32,
    hommes: 18,
    femmes: 14,
    adresse: "789 Boulevard de l'Indépendance, Antananarivo",
    telephone: "0321234567",
    email: "m.ravel@email.com",
    latitude: -18.908,
    longitude: 47.551,
    status: "active",
    dateCreation: "2023-02-10",
    residents: [
      {
        id: 1,
        nomComplet: "Catherine Leroy",
        dateNaissance: "1988-07-15",
        cin: "123456789020",
        genre: "femme",
        telephone: "0341111120"
      },
    ],
  },
  {
    id: 4,
    name: "Résidence Le Parc",
    photos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 321D",
    quartier: "Ankadifotsy",
    ville: "Antananarivo",
    proprietaire: "Robert Martin",
    totalResidents: 22,
    hommes: 12,
    femmes: 10,
    adresse: "321 Rue des Roses, Antananarivo",
    telephone: "0345678901",
    email: "r.martin@email.com",
    latitude: -18.905,
    longitude: 47.553,
    status: "active",
    dateCreation: "2023-04-05",
    residents: [
      {
        id: 1,
        nomComplet: "Lucie Bernard",
        dateNaissance: "1993-11-20",
        cin: "123456789021",
        genre: "femme",
        telephone: "0341111121"
      },
    ],
  },
  {
    id: 5,
    name: "Résidence Les Oliviers",
    photos: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 654E",
    quartier: "Ivandry",
    ville: "Antananarivo",
    proprietaire: "Sophie Laurent",
    totalResidents: 16,
    hommes: 7,
    femmes: 9,
    adresse: "654 Avenue des Palmiers, Antananarivo",
    telephone: "0334567890",
    email: "s.laurent@email.com",
    latitude: -18.907,
    longitude: 47.548,
    status: "active",
    dateCreation: "2023-05-12",
    residents: [
      {
        id: 1,
        nomComplet: "Nicolas Dubois",
        dateNaissance: "1988-09-15",
        cin: "123456789022",
        genre: "homme",
        telephone: "0341111122"
      },
    ],
  },
  {
    id: 6,
    name: "Résidence Les Roses",
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 987F",
    quartier: "Ambohijatovo",
    ville: "Antananarivo",
    proprietaire: "Paul Lefevre",
    totalResidents: 28,
    hommes: 15,
    femmes: 13,
    adresse: "987 Rue des Jacarandas, Antananarivo",
    telephone: "0347890123",
    email: "p.lefevre@email.com",
    latitude: -18.904,
    longitude: 47.555,
    status: "active",
    dateCreation: "2023-06-18",
    residents: [
      {
        id: 1,
        nomComplet: "Julie Moreau",
        dateNaissance: "1990-03-25",
        cin: "123456789023",
        genre: "femme",
        telephone: "0341111123"
      },
    ],
  },
  {
    id: 7,
    name: "Résidence Le Chêne",
    photos: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 147G",
    quartier: "Anosy",
    ville: "Antananarivo",
    proprietaire: "Marc Dubois",
    totalResidents: 20,
    hommes: 11,
    femmes: 9,
    adresse: "147 Avenue des Baobabs, Antananarivo",
    telephone: "0336789012",
    email: "m.dubois@email.com",
    latitude: -18.902,
    longitude: 47.557,
    status: "active",
    dateCreation: "2023-07-22",
    residents: [
      {
        id: 1,
        nomComplet: "Thomas Petit",
        dateNaissance: "1985-12-10",
        cin: "123456789024",
        genre: "homme",
        telephone: "0341111124"
      },
    ],
  },
  {
    id: 8,
    name: "Résidence Les Palmiers",
    photos: [
      "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 258H",
    quartier: "Mahamasina",
    ville: "Antananarivo",
    proprietaire: "Laura Martin",
    totalResidents: 26,
    hommes: 14,
    femmes: 12,
    adresse: "258 Boulevard de la Mer, Antananarivo",
    telephone: "0323456789",
    email: "l.martin@email.com",
    latitude: -18.899,
    longitude: 47.554,
    status: "active",
    dateCreation: "2023-08-30",
    residents: [
      {
        id: 1,
        nomComplet: "Alexandre Roy",
        dateNaissance: "1994-06-18",
        cin: "123456789025",
        genre: "homme",
        telephone: "0341111125"
      },
    ],
  },
  {
    id: 9,
    name: "Résidence Le Jardin",
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=300&fit=crop"
    ],
    lot: "Lot 369I",
    quartier: "Antanimena",
    ville: "Antananarivo",
    proprietaire: "Eric Bernard",
    totalResidents: 19,
    hommes: 10,
    femmes: 9,
    adresse: "369 Rue des Orchidées, Antananarivo",
    telephone: "0349012345",
    email: "e.bernard@email.com",
    latitude: -18.896,
    longitude: 47.552,
    status: "active",
    dateCreation: "2023-09-15",
    residents: [
      {
        id: 1,
        nomComplet: "Sandrine Leroy",
        dateNaissance: "1991-02-14",
        cin: "123456789026",
        genre: "femme",
        telephone: "0341111126"
      },
    ],
  },
  {
    id: 10,
    name: "Résidence La Fontaine",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"
    ],
    lot: "Lot 741J",
    quartier: "Besarety",
    ville: "Antananarivo",
    proprietaire: "Denis Morel",
    totalResidents: 24,
    hommes: 13,
    femmes: 11,
    adresse: "741 Avenue des Lilas, Antananarivo",
    telephone: "0331234567",
    email: "d.morel@email.com",
    latitude: -18.893,
    longitude: 47.549,
    status: "active",
    dateCreation: "2023-10-20",
    residents: [
      {
        id: 1,
        nomComplet: "Patrick Simon",
        dateNaissance: "1987-08-30",
        cin: "123456789027",
        genre: "homme",
        telephone: "0341111127"
      },
    ],
  },
];

// Fonction utilitaire pour calculer l'âge
const calculerAge = (dateNaissance) => {
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Fonction utilitaire pour vérifier si majeur
const estMajeur = (dateNaissance) => {
  return calculerAge(dateNaissance) >= 18;
};

export default function ResidencePage({ onBack, searchQuery, onSearchChange }) {
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResidents, setEditedResidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedResidence, setExpandedResidence] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [residencesPerPage] = useState(4);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newResident, setNewResident] = useState({
    nomComplet: "",
    dateNaissance: "",
    cin: "",
    genre: "homme",
    telephone: ""
  });

  const handleViewDetails = (residence) => {
    setSelectedResidence(residence);
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResidence(null);
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
    setEditedResidents([]);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: ""
    });
  };

  const handleNextPhoto = () => {
    if (selectedResidence && selectedResidence.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === selectedResidence.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevPhoto = () => {
    if (selectedResidence && selectedResidence.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedResidence.photos.length - 1 : prev - 1
      );
    }
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

  const handleSaveEdit = () => {
    console.log("Sauvegarde des modifications:", editedResidents);
    setIsEditMode(false);
    setEditedResidents([]);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: ""
    });
  };

  const handleAddResident = () => {
    if (newResident.nomComplet && newResident.dateNaissance) {
      const residentToAdd = {
        id: Date.now(),
        ...newResident
      };
      setEditedResidents([...editedResidents, residentToAdd]);
      setNewResident({
        nomComplet: "",
        dateNaissance: "",
        cin: "",
        genre: "homme",
        telephone: ""
      });
    }
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

  const handleNewResidentChange = (field, value) => {
    setNewResident(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditResidents = () => {
    setEditedResidents([...selectedResidence.residents]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedResidents([]);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: ""
    });
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
      {/* Section principale des résidences */}
      <div className={`transition-all duration-300 ease-in-out ${
        showModal ? "w-1/2" : "w-full"
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-gray-200/60 bg-transparent">
            <h1 className="font-bold text-3xl text-gray-800 bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl border border-gray-200/60">Résidences</h1>
          </div>

          {/* Statistiques */}
          <div className="border-gray-200/60 bg-transparent">
            <div className="grid grid-cols-4 gap-4 ml-12 mr-12">
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalResidences}</div>
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

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalResidents}</div>
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

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalHommes}</div>
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

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalFemmes}</div>
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

          {/* LISTE DES RÉSIDENCES - PARTIE FONCTIONNELLE */}
          <div className="flex-1 overflow-y-auto bg-transparent">
            <div className="p-3 space-y-3 mr-3 ml-4">
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
                    className={`backdrop-blur-sm border rounded-lg hover:shadow-md transition-all duration-200 ${
                      selectedResidence && selectedResidence.id === residence.id && showModal
                        ? "bg-blue-50 border-blue-200 shadow-md" // Résidence sélectionnée
                        : "bg-white border-gray-200/60" // Résidence normale
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={residence.photos[0]}
                              alt={residence.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm truncate ${
                              selectedResidence && selectedResidence.id === residence.id && showModal
                                ? "text-blue-800" // Texte bleu pour la résidence sélectionnée
                                : "text-gray-800" // Texte normal
                            }`}>
                              {residence.name}
                            </h3>
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin size={12} className={
                                selectedResidence && selectedResidence.id === residence.id && showModal
                                  ? "text-blue-600" // Icône bleue pour la résidence sélectionnée
                                  : "text-gray-600" // Icône normale
                              } />
                              <span className={`text-xs truncate ${
                                selectedResidence && selectedResidence.id === residence.id && showModal
                                  ? "text-blue-600" // Texte bleu pour la résidence sélectionnée
                                  : "text-gray-600" // Texte normal
                              }`}>
                                {residence.adresse}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleViewDetails(residence)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                              selectedResidence && selectedResidence.id === residence.id && showModal
                                ? "bg-blue-600 text-white hover:bg-blue-700" // Bouton bleu pour la résidence sélectionnée
                                : "bg-blue-600 text-white hover:bg-blue-700" // Bouton normal
                            }`}
                            title="Détails"
                          >
                            <Eye size={14} />
                            <span className="text-xs">Details</span>
                          </button>
                          <button
                            onClick={() => handleViewOnMap(residence)}
                            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                            title="Carte"
                          >
                            <Map size={14} />
                            <span className="text-xs">Carte</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination simplifiée avec seulement les flèches */}
          {filteredResidences.length > residencesPerPage && (
            <div className="border-t border-gray-200/60 bg-white/30 backdrop-blur-sm py-3 px-6 shadow-inner">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-sm font-medium text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails/édition qui change de contenu */}
      {showModal && selectedResidence && (
        <div className="w-1/2 bg-transparent rounded-r-3xl overflow-hidden shadow-xl border-l border-gray-200/60">
          <div className="h-full flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-transparent">
              <h2 className="text-xl bg-white py-3 px-6 rounded-2xl font-bold text-gray-800">
                {isEditMode ? "Modifier les résidents" : "Détails Résidence"}
              </h2>
              <div className="flex items-center space-x-2">
                {isEditMode && (
                  <button
                    onClick={handleAddResident}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <Plus size={14} />
                    <span>Ajouter</span>
                  </button>
                )}
                <button
                  onClick={isEditMode ? handleCancelEdit : handleCloseModal}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Contenu du modal avec scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isEditMode ? (
                /* MODE DÉTAILS */
                <>
                  {/* Photo et informations de localisation */}
                  <div className="flex space-x-6 mb-6">
                    {/* Carousel de photos */}
                    <div className="w-1/2">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 h-48">
                        <img
                          src={selectedResidence.photos[currentPhotoIndex]}
                          alt={`${selectedResidence.name} - Photo ${currentPhotoIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {selectedResidence.photos.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevPhoto}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={handleNextPhoto}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                            >
                              <ChevronRight size={20} />
                            </button>
                            
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                              {selectedResidence.photos.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full ${
                                    index === currentPhotoIndex 
                                      ? 'bg-white' 
                                      : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Informations de localisation */}
                    <div>
                      <div className="h-40 flex flex-col justify-center space-y-4">
                        <div className="font-bold text-gray-800">{selectedResidence.lot}</div>
                        <div className="font-bold text-gray-800">{selectedResidence.quartier}</div>
                        <div className="font-bold text-gray-800">{selectedResidence.ville}</div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des résidents sans en-têtes */}
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-200/30">
                          {selectedResidence.residents.map((resident) => (
                            <tr key={resident.id} className="hover:bg-gray-50/30">
                              <td className="px-4 py-3 text-sm text-gray-800">{resident.nomComplet}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(resident.dateNaissance).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {estMajeur(resident.dateNaissance) && resident.cin 
                                  ? resident.cin 
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{resident.telephone}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {resident.genre === 'homme' ? 'H' : 'F'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bouton pour passer en mode édition */}
                  <div className="flex mt-6 pt-4 border-t border-gray-200/60">
                    <button
                      onClick={handleEditResidents}
                      className="w-full px-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Modifier les résidents
                    </button>
                  </div>
                </>
              ) : (
                /* MODE ÉDITION */
                <>
                  {/* Tableau d'édition des résidents */}
                  <div className="mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Naissance</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">CIN</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Téléphone</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Genre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedResidents.map((resident) => {
                            const age = resident.dateNaissance ? calculerAge(resident.dateNaissance) : 0;
                            const majeur = age >= 18;
                            
                            return (
                              <tr key={resident.id} className="hover:bg-gray-50/30">
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="text"
                                    value={resident.nomComplet}
                                    onChange={(e) => handleResidentChange(resident.id, "nomComplet", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                    placeholder="Nom complet"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="date"
                                    value={resident.dateNaissance}
                                    onChange={(e) => handleResidentChange(resident.id, "dateNaissance", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  {majeur ? (
                                    <input
                                      type="text"
                                      value={resident.cin || ""}
                                      onChange={(e) => handleResidentChange(resident.id, "cin", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                      placeholder="CIN"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="tel"
                                    value={resident.telephone}
                                    onChange={(e) => handleResidentChange(resident.id, "telephone", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                    placeholder="0341234567"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <select
                                    value={resident.genre}
                                    onChange={(e) => handleResidentChange(resident.id, "genre", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  >
                                    <option value="homme">H</option>
                                    <option value="femme">F</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Boutons de sauvegarde/annulation */}
                  <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200/60">
                    <button
                      onClick={handleCancelEdit}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}