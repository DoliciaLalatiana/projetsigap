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
} from "lucide-react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
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

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Fermer le menu utilisateur si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Recherche:", searchQuery);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Fonction pour afficher/masquer la page utilisateur
  const handleUserIconClick = () => {
    setShowUserPage(!showUserPage);
    // Fermer les autres pages si UserPage s'ouvre
    if (!showUserPage) {
      setShowResidence(false);
      setShowStatistique(false);
    }
  };

  // Fonction pour afficher/masquer la page résidence
  const handleResidenceClick = () => {
    setShowResidence(!showResidence);
    // Fermer les autres pages si résidence s'ouvre
    if (!showResidence) {
      setShowStatistique(false);
      setShowUserPage(false);
    }
  };

   // Fonction pour afficher/masquer la page statistique
   const handleStatistiqueClick = () => {
    setShowStatistique(!showStatistique);
    // Fermer les autres pages si statistique s'ouvre
    if (!showStatistique) {
      setShowResidence(false);
      setShowUserPage(false);
    }
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

  // Hauteur de la carte - toujours pleine hauteur
  const containerStyle = {
    width: "100%",
    height: "100vh", // Toujours pleine hauteur
  };

  const center = { lat: -18.9136896, lng: 47.5494648 };

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      {/* === HEADER AVEC LA MÊME COULEUR QUE LA SIDEBAR === */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 bg-white/30 hover:bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-b border-gray-200/30 hover:border-blue-200/80 transition-all duration-300">
        
        {/* === LOGO SIGAP À GAUCHE === */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800/70 hover:text-gray-800 transition-all duration-300">SIGAP</h1>
        </div>

        {/* === BARRE DE RECHERCHE CENTRÉE === */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="bg-white/80 shadow-lg rounded-full flex items-center px-6 py-3 w-96 border border-gray-200/60 hover:bg-white hover:border-gray-300 transition-all duration-300">
            <Search className="text-gray-500 mr-3 flex-shrink-0" size={20} />
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center"
            >
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un lieu ou une adresse"
                className="w-full p-1 bg-transparent outline-none text-gray-700 placeholder-gray-500 text-sm"
              />
            </form>
          </div>
        </div>

        {/* === CONTROLES DROITE === */}
        <div className="flex items-center space-x-4">
          {/* Bouton Ajouter */}
          <button
            className="flex items-center bg-green-600/80 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-all duration-300 whitespace-nowrap"
            title="Ajouter une nouvelle adresse"
          >
            <Plus size={18} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">Ajouter une nouvelle adresse</span>
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
          <ResidencePage onBack={handleCloseResidence} />
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
        <div className="absolute top-22 left-65 z-30 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 h-[89vh] w-250">
          <UserPage user={currentUser} onBack={handleCloseUserPage} onLogout={handleLogout} />
        </div>
      )}

      {/* === CONTROLES ZOOM ET COUCHE AVEC OPACITÉ AMÉLIORÉE AU SURVOL === */}
      <div className="fixed right-6 bottom-24 z-10 flex flex-col items-center space-y-2">
        <button className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl">
          <Plus size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
        <button className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl">
          <Minus size={20} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
        <button className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 border border-gray-200/50 hover:border-gray-300 hover:shadow-xl">
          <LocateFixed size={20} className="text-blue-600/70 hover:text-blue-600 transition-all duration-300" />
        </button>
      </div>

      {/* === BOUTON COUCHE AVEC OPACITÉ AMÉLIORÉE AU SURVOL === */}
      <div className="fixed right-6 bottom-8 z-10">
        <button className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-300 hover:shadow-xl">
          <Layers size={22} className="text-gray-700/70 hover:text-gray-700 transition-all duration-300" />
        </button>
      </div>

      {/* === GOOGLE MAPS - TOUJOURS EN ARRIÈRE-PLAN === */}
      <div className="absolute inset-0 z-0">
        <LoadScript googleMapsApiKey="AIzaSyD8i3HLU5QEmr4XIkYq3yH8XrzptRrSND8">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            options={{
              mapTypeId: "roadmap",
              streetViewControl: false,
              zoomControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              disableDefaultUI: true,
            }}
          />
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