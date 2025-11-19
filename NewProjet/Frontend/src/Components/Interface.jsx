import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  BarChart3,
  Search,
  Bell,
  User,
  Info,
  Settings,
  LogOut,
  Layers,
  LocateFixed,
  Plus,
  Minus,
  Key,
  ArrowLeft,
  X,
  Navigation,
} from "lucide-react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";
import UserPage from "./UserPage";
import ResidencePage from "./ResidencePage";

export default function Interface({ user }) {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatistique, setShowStatistique] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showResidence, setShowResidence] = useState(false);
  const [showUserPage, setShowUserPage] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("satellite");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    lot: "",
    quartier: "",
    ville: ""
  });

  // NOUVEL ÉTAT : pour gérer l'état interne de UserPage
  const [userPageState, setUserPageState] = useState({
    showPasswordModal: false
  });

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const addAddressRef = useRef(null);

  // Charger l'état depuis le localStorage au montage du composant
  useEffect(() => {
    const savedState = localStorage.getItem('interfaceState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setShowResidence(state.showResidence || false);
      setShowStatistique(state.showStatistique || false);
      setShowUserPage(state.showUserPage || false);
    }
  }, []);

  // Sauvegarder l'état dans le localStorage à chaque changement
  useEffect(() => {
    const state = {
      showResidence,
      showStatistique,
      showUserPage
    };
    localStorage.setItem('interfaceState', JSON.stringify(state));
  }, [showResidence, showStatistique, showUserPage]);

  // Fermer le menu add address si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
      if (addAddressRef.current && !addAddressRef.current.contains(event.target) && showAddAddress) {
        setShowAddAddress(false);
        setIsSelectingLocation(false);
        setSelectedLocation(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddAddress]);

  // Vérifier si une page est ouverte
  const isAnyPageOpen = showResidence || showStatistique || showUserPage;

  // Fonction pour gérer la recherche selon la page active
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (showResidence) {
      // Recherche dans les résidences - sera gérée par le composant ResidencePage
      console.log("Recherche dans les résidences:", searchQuery);
    } else if (showStatistique || showUserPage) {
      // Recherche désactivée pour les statistiques et userpage
      return;
    } else {
      // Recherche sur la carte (interface principale)
      console.log("Recherche sur la carte:", searchQuery);
      // Ici vous pouvez ajouter la logique pour rechercher sur la carte
      // Par exemple : géocodage de l'adresse et centrage de la carte
    }
  };

  // Obtenir le placeholder selon la page active
  const getSearchPlaceholder = () => {
    if (showResidence) {
      return "Rechercher une résidence, une adresse ou un propriétaire...";
    } else if (showStatistique || showUserPage) {
      return "Recherche désactivée";
    } else {
      return "Rechercher un lieu, une adresse ou une personne...";
    }
  };

  // Vérifier si la recherche est désactivée
  const isSearchDisabled = showStatistique || showUserPage;

  const handleLogout = () => {
    // Nettoyer le localStorage lors de la déconnexion
    localStorage.removeItem('interfaceState');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // FONCTION MODIFIÉE : Gérer le clic sur SIGAP/Retour
  const handleLogoClick = () => {
    // Si UserPage est ouverte ET on est dans le mode "changer mot de passe"
    if (showUserPage && userPageState.showPasswordModal) {
      // Fermer seulement le modal de changement de mot de passe
      setUserPageState(prev => ({ ...prev, showPasswordModal: false }));
    } 
    // Si UserPage est ouverte mais PAS dans le mode "changer mot de passe"
    else if (showUserPage) {
      // Fermer complètement la UserPage
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
    }
    // Si d'autres pages sont ouvertes
    else if (isAnyPageOpen) {
      // Fermer toutes les pages
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
    }
    // Si aucune page n'est ouverte, ne rien faire
  };

  // Fonction pour afficher/masquer la page utilisateur
  const handleUserIconClick = () => {
    const newShowUserPage = !showUserPage;
    setShowUserPage(newShowUserPage);
    // Réinitialiser l'état de UserPage quand on l'ouvre
    if (newShowUserPage) {
      setUserPageState({ showPasswordModal: false });
    }
    // Fermer les autres pages si UserPage s'ouvre
    if (newShowUserPage) {
      setShowResidence(false);
      setShowStatistique(false);
    }
  };

  // Fonction pour afficher/masquer la page résidence
  const handleResidenceClick = () => {
    const newShowResidence = !showResidence;
    setShowResidence(newShowResidence);
    // Fermer les autres pages si résidence s'ouvre
    if (newShowResidence) {
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
    }
    // Fermer la sélection d'adresse si elle est active
    if (isSelectingLocation || showAddAddress) {
      setIsSelectingLocation(false);
      setShowAddAddress(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
    }
  };

   // Fonction pour afficher/masquer la page statistique
   const handleStatistiqueClick = () => {
    const newShowStatistique = !showStatistique;
    setShowStatistique(newShowStatistique);
    // Fermer les autres pages si statistique s'ouvre
    if (newShowStatistique) {
      setShowResidence(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
    }
    // Fermer la sélection d'adresse si elle est active
    if (isSelectingLocation || showAddAddress) {
      setIsSelectingLocation(false);
      setShowAddAddress(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
    }
  };

  // Fonction pour démarrer la sélection d'adresse sur la carte
  const handleAddAddressClick = () => {
    if (isAnyPageOpen) return; // Ne rien faire si une page est ouverte
    
    setIsSelectingLocation(true);
    setSelectedLocation(null);
    setShowAddAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
  };

  // Fonction pour gérer le clic sur la carte
  const handleMapClick = (event) => {
    if (isSelectingLocation) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      setSelectedLocation({ lat, lng });
      
      // Récupérer l'adresse à partir des coordonnées (géocodage inversé)
      getAddressFromCoordinates(lat, lng);
      
      // Fermer le message de sélection et ouvrir le modal
      setIsSelectingLocation(false);
    }
  };

  // Fonction pour obtenir l'adresse à partir des coordonnées
  const getAddressFromCoordinates = (lat, lng) => {
    // Simulation du géocodage inversé avec des données plus réalistes
    const addressData = [
      { 
        address: "123 Rue d'Analakely, Antananarivo",
        lot: "Lot 123",
        quartier: "Analakely",
        ville: "Antananarivo"
      },
      { 
        address: "456 Avenue de l'Indépendance, Antananarivo",
        lot: "Lot 456", 
        quartier: "Analakely",
        ville: "Antananarivo"
      },
      { 
        address: "789 Rue Ratsimilaho, Antananarivo",
        lot: "Lot 789",
        quartier: "Isoraka",
        ville: "Antananarivo"
      }
    ];
    
    const randomAddressData = addressData[Math.floor(Math.random() * addressData.length)];
    setSelectedAddress(randomAddressData.address);
    setAddressDetails({
      lot: randomAddressData.lot,
      quartier: randomAddressData.quartier,
      ville: randomAddressData.ville
    });
    
    // Afficher le modal d'ajout après la sélection
    setTimeout(() => {
      setShowAddAddress(true);
    }, 300);
  };

  // NOUVELLE FONCTION : Pour retourner à la sélection d'adresse (utilisée par X et Changer d'adresse)
  const handleReturnToSelection = () => {
    setShowAddAddress(false);
    setIsSelectingLocation(true);
    setSelectedAddress("");
    setSelectedLocation(null);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
  };

  // Fonction pour fermer complètement (retour au bouton Ajouter)
  const handleCloseComplete = () => {
    setShowAddAddress(false);
    setIsSelectingLocation(false);
    setSelectedAddress("");
    setSelectedLocation(null);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
  };

  // Fonction pour confirmer l'ajout de l'adresse
  const handleConfirmAddress = () => {
    if (selectedAddress) {
      // Logique pour ajouter l'adresse à la base de données
      console.log("Ajout de l'adresse:", {
        address: selectedAddress,
        details: addressDetails,
        location: selectedLocation
      });
      setShowAddAddress(false);
      setIsSelectingLocation(false);
      setSelectedAddress("");
      setSelectedLocation(null);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
    }
  };

  // Fonction pour annuler la sélection
  const handleCancelSelection = () => {
    setIsSelectingLocation(false);
    setSelectedLocation(null);
    setSelectedAddress("");
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
  };

  // Fonction pour mettre à jour les détails de l'adresse
  const handleAddressDetailsChange = (field, value) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour fermer la page résidence
  const handleCloseResidence = () => {
    setShowResidence(false);
  };

  // Fonction pour fermer la page statistique
  const handleCloseStatistique = () => {
    setShowStatistique(false);
  };

  // Fonction pour fermer la page utilisateur
  const handleCloseUserPage = () => {
    setShowUserPage(false);
    setUserPageState({ showPasswordModal: false });
  };

  // NOUVELLE FONCTION : Callback pour mettre à jour l'état de UserPage
  const handleUserPageStateChange = (newState) => {
    setUserPageState(newState);
  };

  // Fonctions pour les contrôles de zoom
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleCenterMap = () => {
    if (map) {
      map.panTo(center);
    }
  };

  // Fonction pour changer le type de carte
  const handleMapTypeChange = () => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  };

  // Fonction appelée quand la carte est chargée
  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    setMapLoaded(true);
  };

  // Options de la carte - définies après le chargement (avec contrôles désactivés)
  const getMapOptions = () => {
    if (!mapLoaded) {
      return {
        mapTypeId: mapType,
        disableDefaultUI: true,
      };
    }

    return {
      mapTypeId: mapType,
      streetViewControl: false, // Désactivé
      zoomControl: false, // Désactivé
      mapTypeControl: false, // Désactivé
      fullscreenControl: false, // Désactivé
      scaleControl: false, // Désactivé
      rotateControl: false, // Désactivé
      disableDefaultUI: true, // Tous les contrôles par défaut désactivés
    };
  };

  // Hauteur de la carte - toujours pleine hauteur
  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  const center = { lat: -18.9136896, lng: 47.5494648 };

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      {/* === NAVBAR SÉPARÉE EN DEUX PARTIES === */}
      
      {/* Partie gauche - Barre de recherche avec opacité */}
      <div className={`absolute top-5 z-30 transition-all px-7 py-2  rounded-3xl bg-white/30 hover:bg-white/50 duration-300 ease-out ${
        isAnyPageOpen ? "left-64" : "left-1/2 transform -translate-x-1/2"
      }`}>
        <div className={`rounded-full flex items-center px-6 py-1 w-96 border transition-all duration-300 ${
          isSearchDisabled
            ? "bg-gray-100/80 border-gray-300 cursor-not-allowed backdrop-blur-sm"
            : "bg-white/50 backdrop-blur-sm border-gray-200/60 hover:bg-white hover:border-gray-300/80"
        }`}>
          <Search className={`mr-3 flex-shrink-0 ${
            isSearchDisabled ? "text-gray-400" : "text-gray-600"
          }`} size={20} />
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center"
          >
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder()}
              disabled={isSearchDisabled}
              className={`w-full p-1 bg-transparent outline-none text-sm ${
                isSearchDisabled
                  ? "text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "text-gray-700 placeholder-gray-600"
              }`}
            />
          </form>
        </div>
      </div>

      {/* Partie droite - Bouton et icônes avec background fixe */}
      <div className="absolute top-6 right-4 z-20">
        <div className="bg-white/30 hover:bg-white/50  rounded-2xl shadow-lg border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300">
          <div className="flex items-center justify-end px-4 py-1 space-x-4">
            
            {/* Bouton Ajouter - CHANGE EN "Cliquez sur la carte" quand la sélection est active */}
            <button
              onClick={handleAddAddressClick}
              disabled={isAnyPageOpen}
              className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap ${
                isAnyPageOpen
                  ? "bg-gray-400/80 text-gray-200 cursor-not-allowed backdrop-blur-sm"
                  : isSelectingLocation
                  ? "bg-green-600 text-white hover:bg-green-700 backdrop-blur-sm"
                  : "bg-green-600 text-white hover:bg-green-700 backdrop-blur-sm"
              }`}
              title={isAnyPageOpen ? "Fermez les autres pages pour ajouter une adresse" : "Ajouter une nouvelle adresse"}
            >
              {isSelectingLocation ? (
                <Navigation size={18} className="mr-2 flex-shrink-0" />
              ) : (
                <Plus size={18} className="mr-2 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">
                {isSelectingLocation ? "Cliquez sur la carte" : "Ajouter une nouvelle adresse"}
              </span>
            </button>

            {/* Notification */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80"
              title="Notifications"
            >
              <Bell size={20} className="text-gray-600 hover:text-gray-800 transition-all duration-300" />
            </button>

            {/* Utilisateur */}
            <button
              onClick={handleUserIconClick}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80"
              title="Profil"
            >
              <User size={20} className="text-gray-600 hover:text-gray-800 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* === OVERLAY DE SÉLECTION D'ADRESSE - MODIFIÉ POUR ÊTRE SUR UNE SEULE LIGNE === */}
      {isSelectingLocation && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 mx-4 border border-orange-200 relative w-full max-w-2xl">
            <div className="flex items-center justify-between space-x-4">
              {/* Partie gauche : Icône Navigation et texte */}
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Navigation size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">
                    Cliquez sur la carte pour sélectionner une adresse
                  </p>
                </div>
              </div>

              {/* Partie droite : Bouton Annuler */}
              <button
                onClick={handleCancelSelection}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 pointer-events-auto flex items-center space-x-2 flex-shrink-0"
                title="Annuler"
              >
                <X size={16} />
                <span className="text-sm font-medium">Annuler</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL AJOUT ADRESSE - AU CENTRE AVEC FOND ASSOMBRI === */}
      {showAddAddress && (
        <>
          {/* Overlay sombre */}
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              ref={addAddressRef}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 w-full max-w-md"
            >
              {/* En-tête */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Ajouter une adresse</h3>
                {/* MODIFICATION : Le bouton X utilise maintenant handleReturnToSelection */}
                <button
                  onClick={handleReturnToSelection}
                  className="text-white/80 hover:text-white transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-5">
                {/* Adresse sélectionnée */}
                <div className="mb-6">
                  <div className="flex items-start space-x-3 mb-3">
                    <MapPin size={20} className="text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-base mb-1">Adresse sélectionnée :</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {selectedAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Champs de formulaire */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Lot de la maison *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.lot}
                      onChange={(e) => handleAddressDetailsChange('lot', e.target.value)}
                      placeholder="Ex: Lot 123, Lot ABC"
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Quartier *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.quartier}
                      onChange={(e) => handleAddressDetailsChange('quartier', e.target.value)}
                      placeholder="Ex: Analakely, Isoraka"
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.ville}
                      onChange={(e) => handleAddressDetailsChange('ville', e.target.value)}
                      placeholder="Ex: Antananarivo, Antsirabe"
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-4 mt-2 border-gray-200">
                  {/* MODIFICATION : Changer d'adresse utilise handleReturnToSelection */}
                  <button
                    onClick={handleReturnToSelection}
                    className="flex-1 px-1 py-3 text-base bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Changer d'adresse
                  </button>
                  <button
                    onClick={handleConfirmAddress}
                    className="flex-1 px-1 py-3 text-base bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 font-medium"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === SIDEBAR GAUCHE AVEC OPACITÉ === */}
      <div className="absolute top-1 left-6 z-20">
        <div className="bg-white/30 hover:bg-white/50  rounded-2xl shadow-lg py-4 flex flex-col items-center space-y-6 transition-all duration-300 ease-out w-55 border border-gray-200/60 hover:border-gray-300/80">
          
          {/* === SIGAP - MONTE VERS LE HAUT === */}
          <button 
            onClick={handleLogoClick}
            className="w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 bg-transparent hover:bg-white"
          >
            <div className="p-2 rounded-full flex-shrink-0 bg-blue-100/70">
              <span className="text-blue-600 font-bold text-sm">SG</span>
            </div>
            <span className="text-gray-800 font-medium whitespace-nowrap transition-all duration-300">
              SIGAP {/* Toujours afficher "SIGAP" */}
            </span>
          </button>

          {/* Bouton Résidence - BACKGROUND BLANC AU SURVOL */}
          <button
            onClick={handleResidenceClick}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showResidence 
                ? "bg-white border border-blue-200/60" 
                : "bg-transparent hover:bg-white hover:border-blue-200/60"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showResidence ? "bg-blue-100/70" : "bg-blue-100/70"
            }`}>
              <MapPin size={18} className={`${
                showResidence ? "text-blue-600" : "text-blue-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showResidence ? "text-gray-800" : "text-gray-800"
            } font-medium whitespace-nowrap transition-all duration-300`}>
              Résidence
            </span>
          </button>

          {/* Bouton Statistique - BACKGROUND BLANC AU SURVOL */}
          <button
            onClick={handleStatistiqueClick}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showStatistique 
                ? "bg-white border border-green-200/60" 
                : "bg-transparent hover:bg-white hover:border-green-200/60"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showStatistique ? "bg-green-100/70" : "bg-green-100/70"
            }`}>
              <BarChart3 size={18} className={`${
                showStatistique ? "text-green-600" : "text-green-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showStatistique ? "text-gray-800" : "text-gray-800"
            } font-medium whitespace-nowrap transition-all duration-300`}>
              Statistique
            </span>
          </button>
        </div>
      </div>

      {/* === PAGE RÉSIDENCE EN HAUT À GAUCHE === */}
      {showResidence && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[86vh] w-315">
          <ResidencePage 
            onBack={handleCloseResidence} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* === PAGE STATISTIQUE EN HAUT À GAUCHE === */}
      {showStatistique && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-315">
          <Statistique onBack={handleCloseStatistique} />
        </div>
      )}

      {/* === PAGE UTILISATEUR EN HAUT À GAUCHE === */}
      {showUserPage && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[87vh] w-250">
          <UserPage 
            user={currentUser} 
            onBack={handleCloseUserPage} 
            onLogout={handleLogout}
            // NOUVELLES PROPS : passer l'état et la callback
            userPageState={userPageState}
            onUserPageStateChange={handleUserPageStateChange}
          />
        </div>
      )}

      {/* === CONTROLES ZOOM ET COUCHE AVEC OPACITÉ === */}
      <div className="fixed right-6 bottom-24 z-10 flex flex-col items-center space-y-2">
        <button 
          onClick={handleZoomIn}
          className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Zoom avant"
        >
          <Plus size={20} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Zoom arrière"
        >
          <Minus size={20} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
        <button 
          onClick={handleCenterMap}
          className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Recentrer la carte"
        >
          <LocateFixed size={20} className="text-blue-600 hover:text-blue-700 transition-all duration-300" />
        </button>
      </div>

      {/* === BOUTON COUCHE POUR CHANGER LE TYPE DE CARTE === */}
      <div className="fixed right-6 bottom-8 z-10">
        <button 
          onClick={handleMapTypeChange}
          className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:shadow-xl border border-gray-200/60 hover:border-gray-300/80"
          title={mapType === "satellite" ? "Passer en vue plan" : "Passer en vue satellite"}
        >
          <Layers size={22} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
      </div>

      {/* === GOOGLE MAPS - CONTRÔLES DÉSACTIVÉS === */}
      <div className="absolute inset-0 z-0">
        <LoadScript googleMapsApiKey="AIzaSyD8i3HLU5QEmr4XIkYq3yH8XrzptRrSND8">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onLoad={onMapLoad}
            options={getMapOptions()}
            onClick={handleMapClick}
          >
            {/* Marqueur pour l'emplacement sélectionné */}
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#10B981"/>
                      <circle cx="16" cy="10" r="3" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Modal Mot de passe oublié */}
      {showForgotPassword && (
        <ForgotPassword
          onClose={() => setShowForgotPassword(false)}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
}