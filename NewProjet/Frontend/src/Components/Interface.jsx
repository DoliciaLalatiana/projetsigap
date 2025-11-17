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
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [mapType, setMapType] = useState("satellite");
  const [mapLoaded, setMapLoaded] = useState(false);

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
    } else if (showStatistique) {
      // Recherche désactivée pour les statistiques
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
    } else if (showStatistique) {
      return "Recherche désactivée en mode statistique";
    } else {
      return "Rechercher un lieu, une adresse ou une personne...";
    }
  };

  // Vérifier si la recherche est désactivée
  const isSearchDisabled = showStatistique;

  const handleLogout = () => {
    // Nettoyer le localStorage lors de la déconnexion
    localStorage.removeItem('interfaceState');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Fonction pour gérer le clic sur SIGAP/Retour
  const handleLogoClick = () => {
    if (isAnyPageOpen) {
      // Fermer toutes les pages
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
    }
    // Si aucune page n'est ouverte, ne rien faire (ou ajouter une autre action si nécessaire)
  };

  // Fonction pour afficher/masquer la page utilisateur
  const handleUserIconClick = () => {
    const newShowUserPage = !showUserPage;
    setShowUserPage(newShowUserPage);
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
    }
  };

  // Fonction pour démarrer la sélection d'adresse sur la carte
  const handleAddAddressClick = () => {
    if (isAnyPageOpen) return; // Ne rien faire si une page est ouverte
    
    setIsSelectingLocation(true);
    setSelectedLocation(null);
    setShowAddAddress(false);
  };

  // Fonction pour gérer le clic sur la carte
  const handleMapClick = (event) => {
    if (isSelectingLocation) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setSelectedLocation({ lat, lng });
      
      // Calculer la position du modal vers la droite
      calculateModalPosition(lat, lng);
      
      // Récupérer l'adresse à partir des coordonnées (géocodage inversé)
      getAddressFromCoordinates(lat, lng);
      
      // Fermer le message de sélection et ouvrir le modal
      setIsSelectingLocation(false);
    }
  };

  // Fonction pour calculer la position du modal vers la droite
  const calculateModalPosition = (lat, lng) => {
    const mapRect = document.querySelector('.absolute.inset-0')?.getBoundingClientRect();
    if (mapRect) {
      // Positionner le modal vers la droite (70% de la largeur)
      const left = mapRect.width * 0.7; // 70% vers la droite
      const top = (mapRect.height - 500) / 2; // Toujours centré verticalement
      
      setModalPosition({ top, left });
    }
  };

  // Fonction pour obtenir l'adresse à partir des coordonnées
  const getAddressFromCoordinates = (lat, lng) => {
    // Simulation du géocodage inversé
    const addresses = [
      "123 Avenue de l'Indépendance, Antananarivo",
      "456 Rue Ratsimilaho, Antsirabe", 
      "789 Boulevard de la Libération, Toamasina",
      "101 Avenue des Fleurs, Fianarantsoa",
      "202 Rue du Commerce, Mahajanga"
    ];
    
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    setSelectedAddress(randomAddress);
    
    // Afficher le modal d'ajout après la sélection
    setTimeout(() => {
      setShowAddAddress(true);
    }, 300);
  };

  // Fonction pour fermer complètement (retour au bouton Ajouter)
  const handleCloseComplete = () => {
    setShowAddAddress(false);
    setIsSelectingLocation(false);
    setSelectedAddress("");
    setSelectedLocation(null);
  };

  // Fonction pour changer d'adresse (retour à la sélection)
  const handleChangeAddress = () => {
    setShowAddAddress(false);
    setIsSelectingLocation(true);
    setSelectedAddress("");
    setSelectedLocation(null);
  };

  // Fonction pour confirmer l'ajout de l'adresse
  const handleConfirmAddress = () => {
    if (selectedAddress) {
      // Logique pour ajouter l'adresse à la base de données
      console.log("Ajout de l'adresse:", selectedAddress);
      setShowAddAddress(false);
      setIsSelectingLocation(false);
      setSelectedAddress("");
      setSelectedLocation(null);
    }
  };

  // Fonction pour annuler la sélection
  const handleCancelSelection = () => {
    setIsSelectingLocation(false);
    setSelectedLocation(null);
    setSelectedAddress("");
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

  // Options de la carte - définies après le chargement
  const getMapOptions = () => {
    if (!mapLoaded) {
      return {
        mapTypeId: mapType,
        disableDefaultUI: true,
      };
    }

    return {
      mapTypeId: mapType,
      streetViewControl: true,
      zoomControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: window.google.maps.ControlPosition.TOP_RIGHT
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      },
      scaleControl: true,
      rotateControl: true,
      disableDefaultUI: false,
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
      {/* === HEADER AVEC LA MÊME COULEUR QUE LA SIDEBAR === */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 bg-white/30 hover:bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-b border-gray-200/30 hover:border-blue-200/80 transition-all duration-300">
        
        {/* === LOGO SIGAP QUI DEVIENT BOUTON RETOUR === */}
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 cursor-pointer transition-all duration-300 hover:scale-105"
        >
          {isAnyPageOpen ? (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-300">
              <ArrowLeft size={20} className="text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SG</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800/70 hover:text-gray-800 transition-all duration-300">
            {isAnyPageOpen ? "Retour" : "SIGAP"}
          </h1>
        </button>

        {/* === BARRE DE RECHERCHE DYNAMIQUE === */}
        <div className={`absolute transition-all duration-150 ease-out ${
          (showResidence || showStatistique) 
            ? "left-80"
            : "left-1/2 transform -translate-x-1/2"
        }`}>
          <div className={`rounded-full flex items-center px-6 py-3 w-96 border transition-all duration-300 ${
            isSearchDisabled
              ? "bg-gray-100 border-gray-300 cursor-not-allowed"
              : "bg-white/80 shadow-lg border-gray-200/60 hover:bg-white hover:border-gray-300"
          }`}>
            <Search className={`mr-3 flex-shrink-0 ${
              isSearchDisabled ? "text-gray-400" : "text-gray-500"
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
                    : "text-gray-700 placeholder-gray-500"
                }`}
              />
            </form>
          </div>
        </div>

        {/* === CONTROLES DROITE === */}
        <div className="flex items-center space-x-4">
          {/* Bouton Ajouter - DÉSACTIVÉ si une page est ouverte */}
          <button
            onClick={handleAddAddressClick}
            disabled={isAnyPageOpen}
            className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap ${
              isAnyPageOpen
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : isSelectingLocation
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={isAnyPageOpen ? "Fermez les autres pages pour ajouter une adresse" : "Ajouter une nouvelle adresse"}
          >
            {isSelectingLocation ? (
              <Navigation size={18} className="mr-2 flex-shrink-0" />
            ) : (
              <Plus size={18} className="mr-2 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isSelectingLocation ? "Sélection en cours..." : "Ajouter une nouvelle adresse"}
            </span>
          </button>

          {/* Notification */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/30 hover:bg-white/80 transition-all duration-300"
            title="Notifications"
          >
            <Bell size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
          </button>

          {/* Utilisateur */}
          <button
            onClick={handleUserIconClick}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/30 hover:bg-white/80 transition-all duration-300"
            title="Profil"
          >
            <User size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* === OVERLAY DE SÉLECTION D'ADRESSE === */}
      {isSelectingLocation && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-start pt-32 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-md mx-4 border border-orange-200 relative">
            <button
              onClick={handleCancelSelection}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 pointer-events-auto"
              title="Fermer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-4 pr-8">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Navigation size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Sélectionnez une adresse sur la carte</h3>
                <p className="text-sm text-gray-600">Cliquez sur la carte pour choisir l'emplacement</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL AJOUT ADRESSE - DÉPLACÉ VERS LA DROITE === */}
      {showAddAddress && (
        <div 
          ref={addAddressRef}
          className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 w-96"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
          }}
        >
          {/* En-tête */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">Ajouter une adresse</h3>
            <button
              onClick={handleCloseComplete}
              className="text-white/80 hover:text-white transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
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
                  Lot de l'adresse *
                </label>
                <input
                  type="text"
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
                  placeholder="Ex: Antananarivo, Antsirabe"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleChangeAddress}
                className="flex-1 px-6 py-3 text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Changer d'adresse
              </button>
              <button
                onClick={handleConfirmAddress}
                className="flex-1 px-6 py-3 text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === SIDEBAR GAUCHE AVEC OPACITÉ - BLEU SEULEMENT AU SURVOL === */}
      <div className="absolute top-20 left-6 z-20">
        <div className="bg-white/30 hover:bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-2xl shadow-lg py-4 flex flex-col items-center space-y-3 transition-all duration-300 ease-out backdrop-blur-sm w-48 border border-gray-200/30 hover:border-blue-200/80">
          
          {/* Bouton Résidence */}
          <button
            onClick={handleResidenceClick}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showResidence 
                ? "bg-white border border-blue-200/80" 
                : "bg-transparent hover:bg-white hover:border-blue-200/50"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showResidence ? "bg-blue-100/70" : "bg-blue-100/70"
            }`}>
              <MapPin size={18} className={`${
                showResidence ? "text-blue-600" : "text-blue-600/80 hover:text-blue-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showResidence ? "text-gray-800" : "text-gray-800/80 hover:text-gray-800"
            } font-medium whitespace-nowrap transition-all duration-300`}>
              Résidence
            </span>
          </button>

          {/* Bouton Statistique */}
          <button
            onClick={handleStatistiqueClick}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showStatistique 
                ? "bg-white border border-green-200/80" 
                : "bg-transparent hover:bg-white hover:border-green-200/50"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showStatistique ? "bg-green-100/70" : "bg-green-100/70"
            }`}>
              <BarChart3 size={18} className={`${
                showStatistique ? "text-green-600" : "text-green-600/80 hover:text-green-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showStatistique ? "text-gray-800" : "text-gray-800/80 hover:text-gray-800"
            } font-medium whitespace-nowrap transition-all duration-300`}>
              Statistique
            </span>
          </button>
        </div>
      </div>

      {/* === PAGE RÉSIDENCE EN HAUT À GAUCHE === */}
      {showResidence && (
        <div className="absolute top-22 left-65 z-30 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 h-[76vh] w-315">
          <ResidencePage 
            onBack={handleCloseResidence} 
            searchQuery={searchQuery} // Passer la requête de recherche
            onSearchChange={setSearchQuery} // Passer le setter pour la recherche
          />
        </div>
      )}

      {/* === PAGE STATISTIQUE EN HAUT À GAUCHE === */}
      {showStatistique && (
        <div className="absolute top-22 left-65 z-30 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 h-[85vh] w-315">
          <Statistique onBack={handleCloseStatistique} />
        </div>
      )}

      {/* === PAGE UTILISATEUR EN HAUT À GAUCHE === */}
      {showUserPage && (
        <div className="absolute top-22 left-65 z-30 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 h-[87vh] w-250">
          <UserPage user={currentUser} onBack={handleCloseUserPage} onLogout={handleLogout} />
        </div>
      )}

      {/* Rest of the component remains the same... */}
      {/* === CONTROLES ZOOM ET COUCHE AVEC OPACITÉ AMÉLIORÉE AU SURVOL === */}
      <div className="fixed right-6 bottom-24 z-10 flex flex-col items-center space-y-2">
        <button 
          onClick={handleZoomIn}
          className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl"
          title="Zoom avant"
        >
          <Plus size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl"
          title="Zoom arrière"
        >
          <Minus size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
        <button 
          onClick={handleCenterMap}
          className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl"
          title="Recentrer la carte"
        >
          <LocateFixed size={20} className="text-blue-600/70 hover:text-blue-600 transition-all duration-300" />
        </button>
      </div>

      {/* === BOUTON COUCHE POUR CHANGER LE TYPE DE CARTE === */}
      <div className="fixed right-6 bottom-8 z-10">
        <button 
          onClick={handleMapTypeChange}
          className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 hover:shadow-xl"
          title={mapType === "satellite" ? "Passer en vue plan" : "Passer en vue satellite"}
        >
          <Layers size={22} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
      </div>

      {/* === GOOGLE MAPS - MODE SATELLITE AVEC CONTRÔLES ACTIVÉS === */}
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