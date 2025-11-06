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
  Menu,
  Layers,
  LocateFixed,
  Plus,
} from "lucide-react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import Statistique from "./Statistique";

export default function Interface() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sauvegarde de l’état de statistique
  const [showStatistique, setShowStatistique] = useState(() => {
    const saved = localStorage.getItem("showStatistique");
    return saved === "true";
  });

  const dropdownRef = useRef(null);

  // Fermer le menu utilisateur si on clique à l’extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sauvegarde showStatistique
  useEffect(() => {
    localStorage.setItem("showStatistique", showStatistique);
  }, [showStatistique]);

  const containerStyle = { width: "100%", height: "100vh" };
  const center = { lat: -18.9136896, lng: 47.5494648 };
  const options = {
    mapTypeId: "roadmap",
    streetViewControl: false,
    zoomControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    disableDefaultUI: true,
  };

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {showStatistique ? (
        <Statistique
          user={{ name: "Jean D." }}
          onBack={() => setShowStatistique(false)}
        />
      ) : (
        <>
          {/* === LIGNE PRINCIPALE : MENU + BARRE + ICONES === */}
          <div className="absolute top-4 left-4 right-6 z-20 flex items-center justify-between">
            
            {/* === MENU HAMBURGER (affichage à droite, élargi) === */}
            <div
              className="relative flex items-start group"
              onMouseEnter={() => setIsExpanded(true)}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <button
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                title="Menu"
              >
                <Menu size={22} className="text-gray-700" />
              </button>

              {isExpanded && (
                <div
                  className="absolute top-0 left-14 bg-white rounded-2xl shadow-2xl py-3 px-4 flex flex-col items-start space-y-3 w-72 border border-gray-100 transform opacity-100 translate-y-0 transition-all duration-200 ease-out z-50"
                >
                  <button className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-150">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin size={18} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Nouvelle résidence
                    </span>
                  </button>

                  <button
                    onClick={() => setShowStatistique(true)}
                    className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-all duration-150"
                  >
                    <div className="p-2 bg-green-100 rounded-full">
                      <BarChart3 size={18} className="text-green-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Statistique
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* === BARRE DE RECHERCHE AU MILIEU (réduite légèrement) === */}
            <div className="flex-1 mr-20">
              <div className="bg-white ml-100 shadow-lg rounded-full flex items-center px-4 py-3 w-full max-w-xl mx-auto">
                <Search className="text-gray-500 mr-3" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un lieu ou une adresse"
                  className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-500 text-sm"
                />
              </div>
            </div>

            {/* === ICONES À DROITE === */}
            <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
              {!openDropdown && (
                <button
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-500 transition whitespace-nowrap"
                  title="Ajouter une nouvelle adresse"
                >
                  <Plus size={18} className="mr-2" />
                  <span className="text-sm font-medium">
                    Ajouter une nouvelle adresse
                  </span>
                </button>
              )}

              <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition">
                <Bell size={20} className="text-gray-700" />
              </button>

              {/* === MENU DÉROULANT UTILISATEUR (hover + animation fluide) === */}
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown(true)}
                onMouseLeave={() => setOpenDropdown(false)}
              >
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <User size={20} className="text-gray-700" />
                </button>

                <div
                  className={`absolute top-14 right-0 bg-white rounded-2xl shadow-2xl py-3 px-4 flex flex-col items-start space-y-3 w-72 border border-gray-100 transform transition-all duration-300 ease-out z-50 ${
                    openDropdown
                      ? "opacity-100 translate-y-0 visible"
                      : "opacity-0 -translate-y-2 invisible"
                  }`}
                >
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

                  <div className="border-t border-gray-100 w-full my-1"></div>

                  <button className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-150">
                    <div className="p-2 bg-red-100 rounded-full">
                      <LogOut size={18} className="text-red-600" />
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Déconnexion
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* === ZOOM ET CENTRAGE === */}
          <div className="fixed right-6 bottom-24 z-30 flex flex-col items-center space-y-2">
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200">
              <span className="text-xl text-gray-700 font-light">+</span>
            </button>
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200">
              <span className="text-xl text-gray-700 font-light">−</span>
            </button>
            <button
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200"
              title="Centrer la position"
            >
              <LocateFixed size={18} className="text-blue-600" />
            </button>
          </div>

          {/* === CONTROLE COUCHE/CARTE === */}
          <div className="fixed right-6 bottom-8 z-30">
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all">
              <Layers size={20} className="text-gray-700" />
            </button>
          </div>

          {/* === GOOGLE MAPS === */}
          <LoadScript googleMapsApiKey="AIzaSyD8i3HLU5QEmr4XIkYq3yH8XrzptRrSND8">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={13}
              options={options}
            />
          </LoadScript>
        </>
      )}
    </div>
  );
}
