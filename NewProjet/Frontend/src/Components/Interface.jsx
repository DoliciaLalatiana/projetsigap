import React, { useState, useRef, useEffect } from "react";
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
  Key
} from "lucide-react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";

export default function Interface({ user }) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatistique, setShowStatistique] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  const center = { lat: -18.9136896, lng: 47.5494648 };

  if (showStatistique) {
    return <Statistique user={currentUser} onBack={() => setShowStatistique(false)} />;
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* === LIGNE PRINCIPALE : MENU + BARRE + ICONES === */}
      <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
        {/* === MENU GAUCHE === */}
        <div className="relative flex-shrink-0 z-20">
          <div className="bg-white/60 hover:bg-white/90 hover:opacity-100 opacity-80 rounded-2xl shadow-lg py-3 flex flex-col items-start space-y-3 transition-all duration-300 ease-out backdrop-blur-sm w-72 px-4">
            <button className="w-full flex items-center justify-start space-x-3 rounded-lg hover:bg-blue-50 transition-all duration-150 py-2.5">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <span className="text-sm text-gray-800 font-medium whitespace-nowrap transition-all duration-200">
                Nouvelle résidence
              </span>
            </button>

            <button
              onClick={() => setShowStatistique(true)}
              className="w-full flex items-center justify-start space-x-3 rounded-lg hover:bg-green-50 transition-all duration-150 py-2.5"
            >
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                <BarChart3 size={18} className="text-green-600" />
              </div>
              <span className="text-sm text-gray-800 font-medium whitespace-nowrap transition-all duration-200">
                Statistique
              </span>
            </button>
          </div>
        </div>

        {/* === BARRE DE RECHERCHE FIXE === */}
        <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white shadow-lg rounded-full flex items-center px-6 py-3 w-96">
            <Search
              className="text-gray-500 mr-3 flex-shrink-0"
              size={20}
            />
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
              {searchQuery && (
                <button
                  type="submit"
                  className="ml-2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-500 transition-all duration-200"
                >
                  OK
                </button>
              )}
            </form>
          </div>
        </div>

        {/* === CONTENEUR DROIT === */}
        <div
          className="flex items-center space-x-3 relative flex-shrink-0 z-20"
          ref={dropdownRef}
        >
          <div className="bg-white shadow-lg rounded-full flex items-center px-4 py-2 space-x-3">
            {/* Bouton Ajouter une nouvelle adresse */}
            <button
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-500 transition-all duration-200 whitespace-nowrap"
              title="Ajouter une nouvelle adresse"
            >
              <Plus size={18} className="mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">
                Ajouter une nouvelle adresse
              </span>
            </button>

            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-200"></div>

            {/* Notification */}
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
              title="Notifications"
            >
              <Bell size={20} className="text-gray-700" />
            </button>

            {/* === MENU DÉROULANT UTILISATEUR === */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                title="Profil"
              >
                <User size={20} className="text-gray-700" />
              </button>

              {openDropdown && (
                <div className="absolute top-14 right-0 bg-white rounded-2xl shadow-2xl py-3 px-4 flex flex-col items-start space-y-3 w-72 border border-gray-100 z-50">
                  <button className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-150">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Info size={18} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Informations
                    </span>
                  </button>

                  <button className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-all duration-150">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Settings size={18} className="text-green-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Paramètres
                    </span>
                  </button>

                  {/* Bouton Mot de passe oublié pour agents et secrétaires */}
                  {currentUser && ['agent', 'secretaire'].includes(currentUser.role) && (
                    <button 
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-all duration-150"
                    >
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Key size={18} className="text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-800 font-medium">
                        Mot de passe oublié
                      </span>
                    </button>
                  )}

                  <div className="border-t border-gray-100 w-full my-1"></div>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-150"
                  >
                    <div className="p-2 bg-red-100 rounded-full">
                      <LogOut size={18} className="text-red-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Déconnexion
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === ZONE DE CLIC POUR LE MESSAGE GOOGLE MAPS === */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" />

      {/* === ZOOM ET CENTRAGE === */}
      <div className="fixed right-6 bottom-24 z-10 flex flex-col items-center space-y-2">
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:shadow-xl">
          <Plus size={20} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:shadow-xl">
          <Minus size={20} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:shadow-xl">
          <LocateFixed size={20} className="text-blue-600" />
        </button>
      </div>

      {/* === CONTROLE COUCHE/CARTE === */}
      <div className="fixed right-6 bottom-8 z-10">
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:shadow-xl">
          <Layers size={22} className="text-gray-700" />
        </button>
      </div>

      {/* === GOOGLE MAPS === */}
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