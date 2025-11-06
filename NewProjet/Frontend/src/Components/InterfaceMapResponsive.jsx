import React from "react";
import { MapPin, BarChart3, Search, Bell, Settings } from "lucide-react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

export default function InterfaceMapResponsive() {
  return (
    <div className="relative w-full h-screen bg-blue-50 overflow-hidden">
      {/* ==== Sidebar (gauche sur desktop, bas sur mobile) ==== */}
      <div
        className="fixed md:top-6 md:left-6 md:h-[90%] md:w-14 md:flex-col md:space-y-6
                      bottom-0 left-0 w-full h-14 bg-blue-600 flex justify-around items-center 
                       md:py-6 shadow-lg z-20 rounded-t-2xl md:rounded-2xl"
      >
        {/* Icône localisation */}
        <button className="text-white hover:text-blue-200 transition">
          <MapPin size={24} />
        </button>

        {/* Icône statistiques */}
        <button className="text-white hover:text-blue-200 transition">
          <BarChart3 size={24} />
        </button>
      </div>

      {/* ==== Navbar supérieure ==== */}
      <div
        className="fixed md:top-6 md:left-28 md:right-6 md:flex-row flex-col gap-3
                      bg-white rounded-2xl shadow-md px-6 py-3 flex items-center justify-between
                      z-10 w-[95%] mx-auto md:w-auto md:mx-0 top-3 left-1/2 md:translate-x-0 -translate-x-1/2"
      >
        {/* Barre de recherche */}
        <div className="flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-xl w-full md:w-1/3">
          <Search className="text-blue-600" size={20} />
          <input
            type="text"
            placeholder="Rechercher"
            className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full"
          />
        </div>

        {/* Icônes droites */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Bell className="text-blue-600" size={22} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings className="text-blue-600" size={22} />
          </button>
        </div>
      </div>

      {/* ==== Fond carte clair ==== */}
      {/* ==== Carte Google Maps réelle ==== */}
<LoadScript googleMapsApiKey="AIzaSyD8i3HLU5QEmr4XIkYq3yH8XrzptRrSND8">
  <GoogleMap
    mapContainerStyle={{ width: "100%", height: "100%" }}
    center={{ lat: -18.8792, lng: 47.5079 }} // ex: Antananarivo
    zoom={13}
    options={{
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    }}
  />
</LoadScript>

    </div>
  );
}
