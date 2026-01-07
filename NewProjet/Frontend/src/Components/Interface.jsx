// Import des modules React et des hooks nécessaires
import React, { useState, useRef, useEffect } from "react";

// Import du hook de navigation pour React Router
import { useNavigate } from "react-router-dom";

// Import des icônes de l'icône Lucide React
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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Menu,
  Circle,
  Map,
  Eye,
} from "lucide-react";

// Import des composants Google Maps
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow } from "@react-google-maps/api";

// Import des composants personnalisés
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";
import UserPage from "./UserPage";
import ResidencePage from "./ResidencePage";
import PendingResidences from "./PendingResidences";

// Import i18n
import { useTranslation } from 'react-i18next';

// Polygon définissant la zone géographique d'Andaboly - AGRANDI
const ANDABOLY_POLYGON = [
  { lat: -23.3440, lng: 43.6630 },
  { lat: -23.3445, lng: 43.6690 },
  { lat: -23.3490, lng: 43.6750 },
  { lat: -23.3550, lng: 43.6730 },
  { lat: -23.3580, lng: 43.6660 },
  { lat: -23.3550, lng: 43.6590 },
  { lat: -23.3480, lng: 43.6580 },
  { lat: -23.3440, lng: 43.6630 }, // Point de fermeture du polygon
];

// Calcul du centre du polygon Andaboly (moyenne des coordonnées)
const ANDABOLY_CENTER = {
  lat: ANDABOLY_POLYGON.reduce((sum, point) => sum + point.lat, 0) / ANDABOLY_POLYGON.length,
  lng: ANDABOLY_POLYGON.reduce((sum, point) => sum + point.lng, 0) / ANDABOLY_POLYGON.length
};

// Fonction utilitaire pour vérifier si un point est dans un polygon
const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || !Array.isArray(polygon) || polygon.length === 0) return false;

  const x = Number(point.lng), y = Number(point.lat);
  if (Number.isNaN(x) || Number.isNaN(y)) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lng), yi = Number(polygon[i].lat);
    const xj = Number(polygon[j].lng), yj = Number(polygon[j].lat);
    if ([xi, yi, xj, yj].some(v => Number.isNaN(v))) continue;

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Configuration de l'URL de base pour l'API (compatible Vite)
const API_BASE = import.meta.env.VITE_API_BASE || '';

// Fonction pour formater la date des notifications
const formatNotificationDate = (dateString) => {
  const notificationDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const notificationDay = new Date(
    notificationDate.getFullYear(),
    notificationDate.getMonth(),
    notificationDate.getDate()
  );

  if (notificationDay.getTime() === today.getTime()) {
    const hours = notificationDate.getHours().toString().padStart(2, '0');
    const minutes = notificationDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  else if (notificationDay.getTime() === yesterday.getTime()) {
    return "Hier";
  }
  else {
    const day = notificationDate.getDate().toString().padStart(2, '0');
    const month = (notificationDate.getMonth() + 1).toString().padStart(2, '0');
    const year = notificationDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

// Fonction utilitaire pour gérer les réponses API
const handleApiResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }

  if (response.status === 404) {
    console.warn('Route API non trouvée');
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};

// Composant principal Interface
export default function Interface({ user }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showStatistique, setShowStatistique] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showResidence, setShowResidence] = useState(false);
  const [showUserPage, setShowUserPage] = useState(false);
  const [showPendingResidences, setShowPendingResidences] = useState(false);
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
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);
  const [messageStatus, setMessageStatus] = useState("normal");
  const [formError, setFormError] = useState("");
  const [userPageState, setUserPageState] = useState({ showPasswordModal: false });
  const [notifications, setNotifications] = useState([]);
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clickedResidenceId, setClickedResidenceId] = useState(null);
  const [previousZoom, setPreviousZoom] = useState(null);
  const [previousCenter, setPreviousCenter] = useState(null);
  const [zoomBeforeResidenceClick, setZoomBeforeResidenceClick] = useState(null);
  const [centerBeforeResidenceClick, setCenterBeforeResidenceClick] = useState(null);
  const [shouldZoomToPolygon, setShouldZoomToPolygon] = useState(true);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [selectedMarkerColor, setSelectedMarkerColor] = useState("yellow");
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [residenceToSelect, setResidenceToSelect] = useState(null);
  const [residentFieldsScrollable, setResidentFieldsScrollable] = useState(false);
  const [residenceDetailMode, setResidenceDetailMode] = useState(false);
  const [fokontanyPolygon, setFokontanyPolygon] = useState(null);
  const [fokontanyCenter, setFokontanyCenter] = useState(null);
  const [fokontanyName, setFokontanyName] = useState("Andaboly"); // Défaut: Andaboly
  const [residences, setResidences] = useState([]);
  const [addStep, setAddStep] = useState(1);
  const [newResidents, setNewResidents] = useState([]);
  const [savingResidence, setSavingResidence] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedResidenceFromSearch, setSelectedResidenceFromSearch] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const addAddressRef = useRef(null);
  const menuDropdownRef = useRef(null);
  const residentFieldsRef = useRef(null);

  const createCustomMarkerIcon = (color) => {
    let svg = '';

    if (color === "yellow") {
      svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2C14.48 2 10 6.48 10 12C10 21 20 37 20 37C20 37 30 21 30 12C30 6.48 25.52 2 20 2Z" fill="#FBBF24"/>
          <circle cx="20" cy="12" r="5" fill="white"/>
          <circle cx="20" cy="12" r="3" fill="#F59E0B"/>
        </svg>
      `;
    } else if (color === "green") {
      svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2C14.48 2 10 6.48 10 12C10 21 20 37 20 37C20 37 30 21 30 12C30 6.48 25.52 2 20 2Z" fill="#10B981"/>
          <circle cx="20" cy="12" r="5" fill="white"/>
          <circle cx="20" cy="12" r="3" fill="#059669"/>
        </svg>
      `;
    } else {
      svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#10B981"/>
          <circle cx="16" cy="10" r="3" fill="white"/>
        </svg>
      `;
    }

    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    if (typeof window !== 'undefined' && window.google && window.google.maps && typeof window.google.maps.Size === 'function') {
      return { url, scaledSize: new window.google.maps.Size(color === "yellow" ? 40 : 32, color === "yellow" ? 40 : 32) };
    } else {
      return { url, scaledSize: { width: color === "yellow" ? 40 : 32, height: color === "yellow" ? 40 : 32 } };
    }
  };

  const getUserInitial = () => {
    if (!currentUser) return "U";
    
    if (currentUser.first_name && currentUser.first_name.trim()) {
      return currentUser.first_name.charAt(0).toUpperCase();
    }
    
    if (currentUser.nom_complet) {
      const parts = currentUser.nom_complet.trim().split(/\s+/);
      if (parts.length > 0) {
        return parts[0].charAt(0).toUpperCase();
      }
      return currentUser.nom_complet.charAt(0).toUpperCase();
    }
    
    if (currentUser.username && currentUser.username.trim()) {
      return currentUser.username.charAt(0).toUpperCase();
    }
    
    if (currentUser.nom && currentUser.nom.trim()) {
      return currentUser.nom.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  const fetchAllNotifications = async () => {
    try {
      console.log('[NOTIF] fetchAllNotifications: starting...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[NOTIF] No token found');
        return;
      }

      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[NOTIF] fetchAllNotifications response status:', response.status);

      const data = await handleApiResponse(response);
      if (data) {
        console.log('[NOTIF] Total notifications received:', data.length);

        const unreadNotifications = data.filter(notif => !notif.is_read);
        console.log('[NOTIF] Unread notifications:', unreadNotifications.length);

        setNotifications(unreadNotifications);
        setTotalNotificationsCount(unreadNotifications.length);
      }
    } catch (error) {
      console.error('[NOTIF] Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('[NOTIF] markAsRead for notification:', notificationId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('[NOTIF] Notification marked as read:', notificationId);

        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );

        setTotalNotificationsCount(prev => Math.max(0, prev - 1));

      } else if (response.status === 404) {
        console.warn('[NOTIF] Route not found, notification might be deleted already');
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
        setTotalNotificationsCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('[NOTIF] Failed to mark as read:', response.status);
      }
    } catch (error) {
      console.error('[NOTIF] Error marking as read:', error);
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      setTotalNotificationsCount(prev => Math.max(0, prev - 1));
    }
  };

  const checkAndClearApprovedResidenceNotifications = async () => {
    try {
      console.log('[NOTIF] checkAndClearApprovedResidenceNotifications: starting...');
      const token = localStorage.getItem('token');
      if (!token) return;

      const residencesResponse = await fetch(`${API_BASE}/api/residences?status=approved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (residencesResponse.ok) {
        const approvedResidences = await residencesResponse.json();
        console.log('[NOTIF] Approved residences count:', approvedResidences.length);

        if (currentUser?.role === 'secretaire' && approvedResidences.length > 0) {
          console.log('[NOTIF] User is secretaire, refreshing notifications');

          await fetchAllNotifications();
        }
      }
    } catch (error) {
      console.error('[NOTIF] Error clearing approved notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    console.log('=== CLIC SUR NOTIFICATION ===');
    console.log('Notification complète:', notification);
    console.log('Métadonnées:', notification.metadata);
    console.log('Message:', notification.message);
    console.log('Type:', notification.type);

    await markAsRead(notification.id);

    setShowNotifications(false);

    if (currentUser?.role === 'secretaire') {
      console.log('[NOTIF] Ouverture page PendingResidences pour secrétaire');

      setShowPendingResidences(true);
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });

      let residenceId = null;

      if (notification.related_entity_id) {
        residenceId = notification.related_entity_id;
      } else if (notification.message) {
        const idMatch = notification.message.match(/ID[:\s]*(\d+)/i) ||
          notification.message.match(/residence[:\s]*(\d+)/i);
        if (idMatch) {
          residenceId = idMatch[1];
        }
      }

      console.log('[NOTIF] Extracted residenceId:', residenceId);

      if (residenceId) {
        setResidenceToSelect(residenceId);
      }
    }
  };

  const fetchResidences = async () => {
    try {
      console.log('[RES] fetchResidences: starting... with fokontanyName:', fokontanyName);
      let url = `${API_BASE}/api/residences`;
      
      // Utiliser fokontanyName ou le nom de l'utilisateur
      const fokontanyToUse = fokontanyName || currentUser?.fokontany?.nom || 'Andaboly';
      
      if (fokontanyToUse) {
        url += `?fokontany=${encodeURIComponent(fokontanyToUse)}`;
        console.log('[RES] Fetching with fokontany:', fokontanyToUse);
      }

      const resp = await fetch(url);
      console.log('[RES] Response status:', resp.status);

      if (!resp.ok) {
        console.error('[RES] Failed to fetch residences:', resp.status);
        return;
      }

      const list = await resp.json();
      console.log('[RES] Residences received:', list.length);

      setResidences(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('[RES] fetchResidences error:', e);
    }
  };

  const performSearch = async (query) => {
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (showResidence) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[SEARCH] No token found');
        setSearchResults([]);
        return;
      }

      console.log('[SEARCH] Performing search for:', query);
      
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[SEARCH] Search results received:', data);
        setSearchResults(data);
        setShowSearchResults(true);

        if (showResidence) {
          console.log("[SEARCH] Recherche dans les résidences:", data);
          setShowSearchResults(false);
        } else if (!isAnyPageOpen) {
          console.log("[SEARCH] Résultats de recherche sur carte:", data);
        }
      } else if (response.status === 401) {
        console.error('[SEARCH] Token invalid');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[SEARCH] Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim() === '') {
      setShowSearchResults(false);
      return;
    }

    if (showResidence) {
      setShowSearchResults(false);
      console.log("Recherche dans les résidences:", searchQuery);
      return;
    }

    performSearch(searchQuery);

    if (showResidence) {
      console.log("Recherche dans les résidences:", searchQuery);
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return;
    } else {
      console.log("Recherche sur la carte:", searchQuery);
    }
  };

  // FONCTION POUR AFFICHER UNE RÉSIDENCE SUR LA CARTE (comme dans ResidencePage.jsx)
  const handleViewOnMapFromResidence = (residence) => {
    console.log('[INTERFACE] Affichage résidence sur carte:', residence);

    // Fermer toutes les pages ouvertes pour afficher la carte
    setShowResidence(false);
    setResidenceDetailMode(false);
    setShowStatistique(false);
    setShowUserPage(false);
    setShowPendingResidences(false);
    setUserPageState({ showPasswordModal: false });
    
    // Fermer le menu dropdown et les résultats de recherche
    setMenuDropdownOpen(false);
    setShowSearchResults(false);

    // Vérifier si la carte est disponible
    if (!map) {
      console.warn('[INTERFACE] Carte non disponible');
      return;
    }

    // Vérifier les coordonnées (comme dans ResidencePage)
    const lat = residence.latitude || residence.lat;
    const lng = residence.longitude || residence.lng;

    if (lat && lng) {
      console.log('[INTERFACE] Centrage sur:', { lat: parseFloat(lat), lng: parseFloat(lng) });

      // Sauvegarder l'état de la carte
      setPreviousZoom(map.getZoom());
      setPreviousCenter(map.getCenter());

      // Centrer la carte
      map.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
      map.setZoom(18);

      // Mettre à jour les états
      setClickedResidenceId(residence.id);
      setSelectedResidenceFromSearch(residence);

      // Ajouter à la liste si nécessaire
      if (!residences.some(r => r.id === residence.id)) {
        setResidences(prev => [residence, ...prev]);
      }
    } else {
      console.warn('[INTERFACE] Résidence sans coordonnées:', residence);
      alert(t('noCoordinates'));
    }
  };

  // FONCTION POUR AFFICHER UNE PERSONNE SUR LA CARTE
  const handleViewOnMapFromPerson = (person) => {
    console.log('[INTERFACE] Affichage personne sur carte:', person);

    // Fermer toutes les pages ouvertes pour afficher la carte
    setShowResidence(false);
    setResidenceDetailMode(false);
    setShowStatistique(false);
    setShowUserPage(false);
    setShowPendingResidences(false);
    setUserPageState({ showPasswordModal: false });
    
    // Fermer les menus
    setMenuDropdownOpen(false);
    setShowSearchResults(false);

    // Vérifier si la personne a des résidences
    if (person.residences && person.residences.length > 0) {
      // Prendre la première résidence (comme dans ResidencePage)
      const residence = person.residences[0];
      
      if (residence) {
        // Utiliser la même fonction que pour les résidences
        handleViewOnMapFromResidence(residence);
      } else {
        alert(t('personNoAddress'));
      }
    } else {
      alert(t('personNoAddress'));
    }
  };

  // FONCTION PRINCIPALE POUR LA RECHERCHE (clic sur un résultat)
  const handleSearchResultClick = (result) => {
    console.log('=== CLIC SUR RÉSULTAT DE RECHERCHE ===', result);
    console.log('[LOG] Clic sur le résultat complet (nom/lot/adresse)');

    setShowSearchResults(false);
    setSearchQuery("");

    if (result.type === 'residence') {
      // Utiliser EXACTEMENT la même logique que dans ResidencePage
      handleViewOnMapFromResidence(result);
    } else if (result.type === 'person') {
      // Pour une personne, trouver sa résidence
      handleViewOnMapFromPerson(result);
    }
  };

  // FONCTION POUR LE BOUTON "Voir sur la carte" DANS LES RÉSULTATS
  const handleViewOnMapFromSearch = (result) => {
    console.log('[INTERFACE] Affichage sur carte depuis bouton "Voir sur la carte":', result);
    console.log('[LOG] Clic spécifique sur le bouton "Voir sur la carte"');

    setShowSearchResults(false);
    setSearchQuery("");

    if (result.type === 'residence') {
      handleViewOnMapFromResidence(result);
    } else if (result.type === 'person') {
      handleViewOnMapFromPerson(result);
    }
  };

  // FONCTION POUR ResidencePage.jsx (gardée pour compatibilité)
  const handleViewOnMap = (residence) => {
    // Cette fonction est appelée par ResidencePage, donc on garde la même logique
    handleViewOnMapFromResidence(residence);
  };

  const SearchResultsModal = () => {
    if (showResidence || !showSearchResults || searchResults.length === 0) return null;

    const searchBar = document.querySelector('.search-bar-container');
    let topPosition = 80;
    let leftPosition = 320;

    if (searchBar) {
      const rect = searchBar.getBoundingClientRect();
      topPosition = rect.bottom + 5;
      leftPosition = rect.left;
    }

    return (
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
        style={{
          top: `${topPosition}px`,
          left: `${leftPosition}px`,
          width: '480px',
          maxWidth: '480px'
        }}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">{t('searchResults')}</h3>
            <button
              onClick={() => {
                console.log('[LOG] Clic sur bouton X pour fermer les résultats');
                setShowSearchResults(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {searchResults.length} {t('resultsFound')}
          </p>
        </div>

        <div className="p-2">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1"
                  onClick={(e) => {
                    // Vérifier si le clic vient du bouton ou de la zone de contenu
                    const target = e.target;
                    const isButtonClick = target.closest('button') || 
                                          target.closest('[data-view-on-map]');
                    
                    if (!isButtonClick) {
                      console.log('[LOG] Clic sur la zone de contenu (nom/lot/adresse) du résultat');
                      console.log('Résultat cliqué:', result);
                      handleSearchResultClick(result);
                    } else {
                      console.log('[LOG] Clic intercepté - provient du bouton, action annulée');
                    }
                  }}
                >
                  {result.type === 'residence' && (
                    <div>
                      <div className="flex items-center mb-2">
                        <MapPin size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                        <div className="cursor-pointer hover:text-blue-600">
                          <h4 className="font-medium text-sm text-gray-800">
                            {result.lot || 'Lot non spécifié'}
                          </h4>
                        </div>
                        <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                          {t('address')}
                        </span>
                        {/* Indicateur si pas de coordonnées */}
                        {!(result.lat || result.latitude) && !(result.lng || result.longitude) && (
                          <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                            Sans coordonnées
                          </span>
                        )}
                      </div>
                      {result.quartier && (
                        <p className="text-xs text-gray-600 mb-1 cursor-pointer hover:text-blue-600">
                          <span className="font-medium">{t('neighborhood')}:</span> {result.quartier}
                        </p>
                      )}
                      {result.ville && (
                        <p className="text-xs text-gray-600 cursor-pointer hover:text-blue-600">
                          <span className="font-medium">{t('city')}:</span> {result.ville}
                        </p>
                      )}
                      {result.proprietaires && result.proprietaires.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1 cursor-pointer hover:text-blue-600">
                          <span className="font-medium">{t('owner')}:</span> {result.proprietaires.map(p => p.nom).join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {result.type === 'person' && (
                    <div>
                      <div className="flex items-center mb-2">
                        <User size={16} className="text-green-500 mr-2 flex-shrink-0" />
                        <div className="cursor-pointer hover:text-green-600">
                          <h4 className="font-medium text-sm text-gray-800">
                            {result.nom} {result.prenom}
                          </h4>
                        </div>
                        <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex-shrink-0">
                          {t('person')}
                        </span>
                      </div>
                      {result.residences && result.residences.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">{t('addresses')}:</p>
                          {result.residences.slice(0, 2).map((residence, idx) => (
                            <p key={idx} className="text-xs text-gray-600 cursor-pointer hover:text-green-600">
                              • {residence.lot || 'Lot non spécifié'} - {residence.quartier}
                            </p>
                          ))}
                          {result.residences.length > 2 && (
                            <p className="text-xs text-gray-400 mt-1">
                              +{result.residences.length - 2} {t('otherAddresses')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  data-view-on-map="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[LOG] Clic direct sur le bouton "Voir sur la carte"');
                    handleViewOnMapFromSearch(result);
                  }}
                  className="ml-2 flex items-center text-xs px-3 py-1.5 bg-white text-gray-800 border border-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
                  title={t('viewOnMap')}
                  disabled={result.type === 'residence' && !(result.lat || result.latitude) && !(result.lng || result.longitude)}
                >
                  <Map size={14} className="mr-1" />
                  {t('viewOnMap')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // USE EFFECT POUR CHARGER LES DONNÉES APRÈS AUTHENTIFICATION
  useEffect(() => {
    console.log('[APP] useEffect principal - chargement après auth');

    // Fonction pour charger toutes les données
    const loadAllData = async () => {
      try {
        console.log('[APP] loadAllData: starting...');
        
        // 1. Charger les notifications
        await fetchAllNotifications();
        
        // 2. Charger le fokontany de l'utilisateur
        await loadMyFokontany();
        
        // 3. Attendre que fokontanyName soit disponible puis charger les résidences
        if (fokontanyName) {
          console.log('[APP] fokontanyName disponible:', fokontanyName);
          await fetchResidences();
        } else {
          // Si fokontanyName n'est pas encore disponible, réessayer après un délai
          setTimeout(() => {
            console.log('[APP] Retry fetchResidences après délai');
            fetchResidences();
          }, 500);
        }
        
        setInitialDataLoaded(true);
        console.log('[APP] Toutes les données chargées');
      } catch (error) {
        console.error('[APP] Erreur lors du chargement des données:', error);
      }
    };

    // Exécuter le chargement initial
    loadAllData();

    // Configurer l'intervalle pour les notifications
    const interval = setInterval(() => {
      console.log('[APP] Refreshing notifications...');
      fetchAllNotifications();
    }, 60000);

    return () => {
      console.log('[APP] Component unmounting...');
      clearInterval(interval);
    };
  }, []); // Exécuté une seule fois au montage

  // USE EFFECT POUR CHARGER LES RÉSIDENCES QUAND fokontanyName CHANGE
  useEffect(() => {
    console.log('[APP] useEffect fokontanyName changed:', fokontanyName);
    
    if (fokontanyName && initialDataLoaded) {
      console.log('[APP] Rechargement des résidences pour nouveau fokontany:', fokontanyName);
      fetchResidences();
    }
  }, [fokontanyName, initialDataLoaded]);

  // USE EFFECT POUR METTRE À JOUR L'UTILISATEUR COURANT
  useEffect(() => {
    if (user) {
      console.log('[APP] User prop updated:', user);
      setCurrentUser(user);
      
      // Si l'utilisateur a un fokontany différent
      if (user.fokontany?.nom && user.fokontany.nom !== fokontanyName) {
        console.log('[APP] Mise à jour fokontanyName depuis user:', user.fokontany.nom);
        setFokontanyName(user.fokontany.nom);
      }
    }
  }, [user]);

  useEffect(() => {
    if (showPendingResidences && currentUser?.role === 'secretaire') {
      console.log('[APP] Pending residences page opened, clearing notifications');
      setTimeout(() => {
        checkAndClearApprovedResidenceNotifications();
      }, 500);
    }
  }, [showPendingResidences]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        if (showResidence) {
          setShowSearchResults(false);
          setSearchResults([]);
        } else {
          performSearch(searchQuery);
        }
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showResidence]);

  const handlePolygonMouseOver = (e) => {
    try {
      setIsPolygonHovered(true);
      console.log('[MAP] handlePolygonMouseOver', e);
    } catch (err) {
      console.warn('[MAP] handlePolygonMouseOver error', err);
    }
  };

  const handlePolygonMouseOut = (e) => {
    try {
      setIsPolygonHovered(false);
      console.log('[MAP] handlePolygonMouseOut', e);
    } catch (err) {
      console.warn('[MAP] handlePolygonMouseOut error', err);
    }
  };

  const handleFocusOnPolygon = () => {
    if (!map) return;
    const polygon = (fokontanyPolygon && fokontanyPolygon.length) ? fokontanyPolygon : ANDABOLY_POLYGON;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach(p => bounds.extend(p));
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = (ne.lat() - sw.lat()) * 0.1;
      const lngDiff = (ne.lng() - sw.lng()) * 0.1;
      bounds.extend({ lat: ne.lat() + latDiff, lng: ne.lng() + lngDiff });
      bounds.extend({ lat: sw.lat() - latDiff, lng: sw.lng() - lngDiff });
      map.fitBounds(bounds);
      if (window.google && window.google.maps && window.google.maps.event) {
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', function () {
          try {
            if (map.getZoom() > 18) map.setZoom(18);
          } catch (e) { }
          try { window.google.maps.event.removeListener(listener); } catch (e) { }
        });
      }
    } catch (e) {
      console.warn('handleFocusOnPolygon error', e);
    }
  };

  const calculatePolygonBounds = (polygon) => {
    if (!polygon || polygon.length === 0) return null;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach(p => bounds.extend(p));
      return bounds;
    } catch (e) {
      console.warn('calculatePolygonBounds error', e);
      return null;
    }
  };

  const calculateOptimalView = (polygon) => {
    if (!polygon || polygon.length === 0) {
      return { center: ANDABOLY_CENTER, zoom: 15 };
    }

    const center = {
      lat: polygon.reduce((sum, point) => sum + point.lat, 0) / polygon.length,
      lng: polygon.reduce((sum, point) => sum + point.lng, 0) / polygon.length
    };

    const bounds = calculatePolygonBounds(polygon);
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = Math.abs(ne.lat() - sw.lat());
      const lngDiff = Math.abs(ne.lng() - sw.lng());

      let zoom = 18;
      const maxDiff = Math.max(latDiff, lngDiff);

      if (maxDiff > 0.05) zoom = 16;
      if (maxDiff > 0.1) zoom = 15;
      if (maxDiff > 0.2) zoom = 14;
      if (maxDiff > 0.3) zoom = 13;

      return { center, zoom };
    }

    return { center, zoom: 17 };
  };

  // FONCTION POUR CHARGER LE FOKONTANY
  const loadMyFokontany = async () => {
    try {
      console.log('[FOK] loadMyFokontany: starting request to /api/fokontany/me');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[FOK] loadMyFokontany: no token found in localStorage');
        return;
      }
      const resp = await fetch(`${API_BASE}/api/fokontany/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[FOK] loadMyFokontany: response status', resp.status);
      if (!resp.ok) {
        console.warn('[FOK] loadMyFokontany: non-ok response', await resp.text());
        return;
      }
      const f = await resp.json();
      console.log('[FOK] loadMyFokontany: body received', f);
      
      // Définir le nom du fokontany en premier
      if (f.nom) {
        console.log('[FOK] Setting fokontanyName to:', f.nom);
        setFokontanyName(f.nom);
      }
      
      let coordsRaw = f.coordinates ?? f.geometry ?? null;
      const poly = normalizeCoordinates(coordsRaw);
      console.log('[FOK] loadMyFokontany: parsed polygon length', poly ? poly.length : 0);
      setFokontanyPolygon(poly);

      if (f.centre_lat && f.centre_lng) {
        setFokontanyCenter({ lat: parseFloat(f.centre_lat), lng: parseFloat(f.centre_lng) });
        console.log('[FOK] loadMyFokontany: using centre_lat/centre_lng', f.centre_lat, f.centre_lng);
      } else if (poly && poly.length) {
        const lat = poly.reduce((s, p) => s + p.lat, 0) / poly.length;
        const lng = poly.reduce((s, p) => s + p.lng, 0) / poly.length;
        setFokontanyCenter({ lat, lng });
        console.log('[FOK] loadMyFokontany: computed center', { lat, lng });
      } else {
        console.log('[FOK] loadMyFokontany: no coordinates or center available for fokontany');
      }
    } catch (err) {
      console.warn('[FOK] loadMyFokontany failed', err);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem('interfaceState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setShowResidence(state.showResidence || false);
      setShowStatistique(state.showStatistique || false);
      setShowUserPage(state.showUserPage || false);
    }
  }, []);

  useEffect(() => {
    const state = {
      showResidence,
      showStatistique,
      showUserPage,
      showPendingResidences
    };
    localStorage.setItem('interfaceState', JSON.stringify(state));
  }, [showResidence, showStatistique, showUserPage, showPendingResidences]);

  const isAnyPageOpen = showResidence || showStatistique || showUserPage || showPendingResidences;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }

      if (!searchRef.current?.contains(event.target) && showSearchResults) {
        console.log('[LOG] Clic en dehors des résultats de recherche, fermeture');
        setShowSearchResults(false);
      }

      const menuButton = document.querySelector('[data-menu-button]');
      const menuDropdown = menuDropdownRef.current;
      
      if (menuDropdownOpen && menuDropdown && !menuDropdown.contains(event.target) && 
          menuButton && !menuButton.contains(event.target)) {
        if (!isAnyPageOpen) {
          setMenuDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults, menuDropdownOpen, isAnyPageOpen]);

  useEffect(() => {
    if (isAnyPageOpen && isSelectingLocation) {
      setIsSelectingLocation(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setHasSelectedAddress(false);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
      setMessageStatus("normal");
      setIsAddAddressModalOpen(false);
    }
  }, [isAnyPageOpen, isSelectingLocation]);

  useEffect(() => {
    if (isAnyPageOpen && showNotifications) {
      setShowNotifications(false);
    }
  }, [isAnyPageOpen]);

  useEffect(() => {
    if (isAnyPageOpen && showSearchResults) {
      setShowSearchResults(false);
    }
  }, [isAnyPageOpen]);

  useEffect(() => {
    if (isAnyPageOpen && clickedResidenceId) {
      setClickedResidenceId(null);
      handleCloseResidenceInfo();
    }
  }, [isAnyPageOpen]);

  const getSearchPlaceholder = () => {
    if (showResidence) {
      return t('searchPlaceholderResidences');
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return t('searchDisabled');
    } else {
      return t('searchPlaceholder');
    }
  };

  const isSearchDisabled = showStatistique || showUserPage || showPendingResidences;

  const handleLogout = () => {
    localStorage.removeItem('interfaceState');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleLogoClick = () => {
    console.log('=== NAVIGATION HIÉRARCHIQUE SIMPLIFIÉE ===');
    console.log('État actuel:', {
      showUserPage,
      showPasswordModal: userPageState.showPasswordModal,
      showResidence,
      showStatistique,
      showPendingResidences,
      residenceDetailMode
    });

    if (userPageState.showPasswordModal) {
      console.log('CAS 1: Fermeture modal mot de passe');
      setUserPageState(prev => ({ ...prev, showPasswordModal: false }));
      return;
    }
    
    if (showUserPage) {
      console.log('CAS 2: Retour carte depuis page utilisateur');
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
      
      setMenuDropdownOpen(false);
      
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    if (showResidence && residenceDetailMode) {
      console.log('CAS 3: Mode détail - Aucune action (rester sur le détail)');
      return;
    }
    
    if (showResidence && !residenceDetailMode) {
      console.log('CAS 4: Retour carte depuis liste des résidences');
      
      setShowResidence(false);
      setResidenceDetailMode(false);
      
      setMenuDropdownOpen(false);
      
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    if (showStatistique) {
      console.log('CAS 5: Retour carte depuis page Statistique');
      setShowStatistique(false);
      
      setMenuDropdownOpen(false);
      
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    if (showPendingResidences) {
      console.log('CAS 6: Retour carte depuis page Demandes en attente');
      setShowPendingResidences(false);
      setResidenceToSelect(null);
      
      setMenuDropdownOpen(false);
      
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    console.log('CAS 7: Déjà sur la carte');
    setMenuDropdownOpen(false);
  };

  const openPage = (page) => {
    console.log(`Ouverture page: ${page}`);
    
    setShowResidence(false);
    setShowStatistique(false);
    setShowUserPage(false);
    setShowPendingResidences(false);
    setUserPageState({ showPasswordModal: false });
    setResidenceDetailMode(false);
    
    switch(page) {
      case 'residence':
        setShowResidence(true);
        break;
      case 'statistique':
        setShowStatistique(true);
        break;
      case 'user':
        setShowUserPage(true);
        break;
      case 'pending':
        setShowPendingResidences(true);
        break;
    }
    
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleEnterResidenceDetail = () => {
    console.log('Entrée en mode détail résidence');
    setResidenceDetailMode(true);
  };

  const handleExitResidenceDetail = () => {
    console.log('Sortie du mode détail résidence');
    setResidenceDetailMode(false);
  };

  const handleMenuButtonClick = () => {
    console.log('Menu button clicked, current state:', menuDropdownOpen);
    setMenuDropdownOpen(prev => !prev);
  };

  const handleResidenceClick = () => {
    console.log('Residence clicked from menu');
    
    if (showResidence) {
      if (residenceDetailMode) {
        setResidenceDetailMode(false);
      } else {
        setShowResidence(false);
        setMenuDropdownOpen(false);
      }
    } else {
      openPage('residence');
    }
  };

  const handleStatistiqueClick = () => {
    console.log('Statistique clicked from menu');
    
    if (showStatistique) {
      setShowStatistique(false);
      setMenuDropdownOpen(false);
    } else {
      openPage('statistique');
    }
  };

  const handlePendingResidencesClick = () => {
    console.log('Pending residences clicked from menu');
    
    if (showPendingResidences) {
      setShowPendingResidences(false);
      setResidenceToSelect(null);
      setMenuDropdownOpen(false);
    } else {
      openPage('pending');
    }
  };

  const handleUserIconClick = () => {
    if (showUserPage) {
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
      setMenuDropdownOpen(false);
    } else {
      openPage('user');
      setMenuDropdownOpen(false);
    }
  };

  const latLngToPixel = (latLng) => {
    if (!map || !latLng) return { x: 0, y: 0 };

    try {
      const projection = map.getProjection();
      const point = projection.fromLatLngToPoint(
        new window.google.maps.LatLng(latLng.lat, latLng.lng)
      );

      const bounds = map.getBounds();
      if (!bounds) {
        const center = map.getCenter();
        const zoom = map.getZoom();

        const scale = Math.pow(2, zoom);
        const worldWidth = 256 * scale;
        const worldHeight = 256 * scale;

        const mapContainer = document.querySelector('[data-map-container]');
        const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };

        const x = (point.x * scale * 256) % worldWidth;
        const y = (point.y * scale * 256) % worldHeight;

        const pixelX = (x / worldWidth) * mapRect.width;
        const pixelY = (y / worldHeight) * mapRect.height;

        return { x: pixelX, y: pixelY };
      }

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const topRight = projection.fromLatLngToPoint(ne);
      const bottomLeft = projection.fromLatLngToPoint(sw);

      const mapContainer = document.querySelector('[data-map-container]');
      const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

      const worldWidth = topRight.x - bottomLeft.x;
      const worldHeight = bottomLeft.y - topRight.y;

      const x = (point.x - bottomLeft.x) / worldWidth * mapRect.width;
      const y = (point.y - topRight.y) / worldHeight * mapRect.height;

      return { x: x + mapRect.left, y: y + mapRect.top };
    } catch (error) {
      console.error('Erreur conversion coordonnées:', error);

      const mapContainer = document.querySelector('[data-map-container]');
      const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

      return {
        x: mapRect.left + mapRect.width / 2,
        y: mapRect.top + mapRect.height / 2
      };
    }
  };

  const handleAddAddressClick = () => {
    if (isAnyPageOpen || isSelectingLocation || isAddAddressModalOpen || showAddAddress) return;

    console.log('[LOG] Clic sur bouton "Ajouter une adresse"');
    setIsAddAddressModalOpen(true);
    setSelectedMarkerColor("yellow");

    if (map) {
      setPreviousZoom(map.getZoom());
      setPreviousCenter(map.getCenter());
    }

    setIsSelectingLocation(true);
    setSelectedLocation(null);
    setShowAddAddress(false);
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });

    setMessageStatus("normal");

    setShowNotifications(false);
    setShowSearchResults(false);
    setClickedResidenceId(null);
    setMenuDropdownOpen(false);
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();

      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('Geocoding failed: ' + status));
          }
        });
      });

      let quartier = "";
      let ville = "";
      let fullAddress = result.formatted_address;

      result.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('sublocality') || types.includes('neighborhood')) {
          quartier = component.long_name;
        } else if (types.includes('locality')) {
          ville = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !ville) {
          ville = component.long_name;
        }
      });

      if (!quartier) {
        quartier = ville || t('neighborhoodNotSpecified');
      }

      const addressInfo = {
        lot: "",
        quartier,
        ville,
        fullAddress
      };

      console.log('[GEOCODING] Adresse trouvée:', addressInfo);

      setSelectedAddress(fullAddress);
      setAddressDetails({
        lot: "",
        quartier: addressInfo.quartier,
        ville: addressInfo.ville
      });

    } catch (error) {
      console.error('[GEOCODING] Erreur:', error);

      const fallbackAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      setAddressDetails({
        lot: "",
        quartier: t('unknownNeighborhood'),
        ville: t('unknownCity')
      });
    }
  };

  const repositionModalForLocation = (location) => {
    setTimeout(() => {
      if (map) {
        const screenPos = latLngToPixel(location);
        const modalWidth = 480;
        const modalHeight = 580;

        const mapContainer = document.querySelector('[data-map-container]');
        const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

        let modalX = screenPos.x + 20;
        let modalY = screenPos.y - (modalHeight / 2);

        if (modalX + modalWidth > mapRect.left + mapRect.width - 20) {
          modalX = screenPos.x - modalWidth - 20;

          if (modalX < mapRect.left + 20) {
            const neededSpace = modalWidth + 40;
            const currentSpace = mapRect.width - (screenPos.x - mapRect.left);

            if (currentSpace < neededSpace) {
              const offsetPixels = neededSpace - currentSpace;

              try {
                const projection = map.getProjection();
                const bounds = map.getBounds();
                if (bounds) {
                  const ne = bounds.getNorthEast();
                  const sw = bounds.getSouthWest();
                  const topRight = projection.fromLatLngToPoint(ne);
                  const bottomLeft = projection.fromLatLngToPoint(sw);

                  const worldWidth = topRight.x - bottomLeft.x;
                  const pixelToLngRatio = worldWidth / mapRect.width;
                  const lngOffset = offsetPixels * pixelToLngRatio;

                  const currentCenter = map.getCenter();
                  const newLng = currentCenter.lng() + lngOffset;

                  map.panTo({ lat: currentCenter.lat(), lng: newLng });

                  setTimeout(() => {
                    const newScreenPos = latLngToPixel(location);
                    modalX = newScreenPos.x + 20;
                    modalY = newScreenPos.y - (modalHeight / 2);

                    if (modalY < mapRect.top + 20) {
                      modalY = mapRect.top + 20;
                    }
                    if (modalY + modalHeight > mapRect.top + mapRect.height - 20) {
                      modalY = mapRect.top + mapRect.height - modalHeight - 20;
                    }

                    setModalPosition({ x: modalX, y: modalY });

                    setShowAddAddress(true);
                  }, 300);

                  return;
                }
              } catch (error) {
                console.error('Erreur déplacement carte:', error);
              }
            }
          }
        }

        if (modalY < mapRect.top + 20) {
          modalY = mapRect.top + 20;
        }
        if (modalY + modalHeight > mapRect.top + mapRect.height - 20) {
          modalY = mapRect.top + mapRect.height - modalHeight - 20;
        }

        setModalPosition({ x: modalX, y: modalY });
        setShowAddAddress(true);
      }
    }, 100);
  };

  const handleMapClick = async (event) => {
    if (isSelectingLocation) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      console.log('[FOK] handleMapClick: clicked coords', { lat, lng });
      const clickedPoint = { lat, lng };
      const activePoly = (fokontanyPolygon && fokontanyPolygon.length) ? fokontanyPolygon : ANDABOLY_POLYGON;
      const isInsidePolygon = isPointInPolygon(clickedPoint, activePoly);
      console.log('[FOK] handleMapClick: isInsidePolygon?', isInsidePolygon);

      if (isInsidePolygon) {
        setSelectedLocation({ lat, lng });
        setSelectedMarkerColor("yellow");

        if (map) {
          setPreviousZoom(map.getZoom());
          setPreviousCenter(map.getCenter());
        }

        await getAddressFromCoordinates(lat, lng);

        setMessageStatus("normal");
        setIsSelectingLocation(false);
        setIsAddAddressModalOpen(true);

        repositionModalForLocation({ lat, lng });
      } else {
        setMessageStatus("error");
      }
    }
  };

  const handleReturnToSelection = () => {
    console.log('[LOG] Clic sur bouton "Retour à la sélection"');
    setShowAddAddress(false);
    setIsSelectingLocation(true);
    setSelectedAddress("");
    setSelectedLocation(null);
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });

    setMessageStatus("normal");
    setIsAddAddressModalOpen(true);
    setSelectedMarkerColor("yellow");
  };

  const handleCloseComplete = () => {
    console.log('[LOG] Fermeture complète de la modal d\'ajout d\'adresse');
    setShowAddAddress(false);
    setIsSelectingLocation(false);
    setSelectedAddress("");
    setSelectedLocation(null);
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });

    setMessageStatus("normal");
    setIsAddAddressModalOpen(false);
    setSelectedMarkerColor("yellow");
  };

  const calculateAgeFromDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleAddPerson = () => {
    console.log('[LOG] Ajout d\'une nouvelle personne');
    setNewResidents(prev => [...prev, { nom: '', prenom: '', birthdate: '', cin: '', sexe: 'masculin', phone: '' }]);
    setResidentFieldsScrollable(true);
  };

  const handleRemovePerson = (index) => {
    console.log(`[LOG] Suppression de la personne à l'index ${index}`);
    setNewResidents(prev => prev.filter((_, i) => i !== index));
    if (newResidents.length <= 1) {
      setResidentFieldsScrollable(false);
    }
  };

  const handlePersonChange = (index, field, value) => {
    setNewResidents(prev => {
      const copy = [...prev];

      if (field === 'sexe') {
        copy[index] = { ...copy[index], [field]: value };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }

      if (field === 'birthdate') {
        const age = calculateAgeFromDate(value);
        if (age !== null && age < 18) {
          copy[index].cin = t('minor');
        } else if (age !== null && age >= 18) {
          if (copy[index].cin && copy[index].cin !== t('minor')) {
            copy[index].cin = String(copy[index].cin).replace(/\D/g, '').slice(0, 12);
          }
        }
      }
      if (field === 'cin') {
        const age = calculateAgeFromDate(copy[index].birthdate);
        if (age === null || age >= 18) {
          copy[index].cin = String(value).replace(/\D/g, '').slice(0, 12);
        } else {
          copy[index].cin = t('minor');
        }
      }
      return copy;
    });
  };

  const handleNextFromLot = () => {
    if (!addressDetails.lot || !addressDetails.lot.trim()) {
      setFormError(t('lotError'));
      return;
    }
    setFormError('');
    setAddStep(2);
  };

  const handleBackToLot = () => {
    console.log('[LOG] Retour à l\'étape de saisie du lot');
    setAddStep(1);
  };

  const handleConfirmSave = async () => {
    console.log('[LOG] Tentative de sauvegarde de la résidence');
    if (!addressDetails.lot || !addressDetails.lot.trim()) {
      setModalError(t('lotError'));
      return;
    }
    if (!selectedLocation) {
      setModalError(t('invalidLocation'));
      return;
    }

    setSavingResidence(true);
    setModalError('');

    try {
      const token = localStorage.getItem('token');

      const residencePayload = {
        lot: addressDetails.lot.trim(),
        quartier: addressDetails.quartier || null,
        ville: addressDetails.ville || null,
        fokontany: fokontanyName || null,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        created_by: currentUser?.id || null
      };

      console.log('Étape 1: Création résidence', residencePayload);

      const residenceResp = await fetch(`${API_BASE}/api/residences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(residencePayload)
      });

      if (!residenceResp.ok) {
        const body = await residenceResp.text().catch(() => null);
        let errorMessage = t('saveError');
        try {
          if (body) {
            const errorJson = JSON.parse(body);
            errorMessage = errorJson.error || errorJson.message || body;
          }
        } catch (e) {
          errorMessage = body || t('saveError');
        }
        throw new Error(errorMessage);
      }

      const residenceResult = await residenceResp.json();
      console.log('Résidence créée:', residenceResult);

      const residenceId = residenceResult.id;

      if (newResidents.length > 0) {
        console.log('Étape 2: Ajout des personnes', newResidents.length);
        
        const validResidents = newResidents.filter(r => 
          r.nom?.trim() && r.prenom?.trim()
        );

        if (validResidents.length > 0) {
          for (const r of validResidents) {
            const nomComplet = `${r.nom.trim()}${r.prenom ? ' ' + r.prenom.trim() : ''}`.trim();
            
            const age = calculateAgeFromDate(r.birthdate);
            let cinVal = null;
            if (age === null) {
              cinVal = null;
            } else if (age < 18) {
              cinVal = null;
            } else {
              cinVal = (r.cin && r.cin !== t('minor')) ? String(r.cin).replace(/\D/g, '').slice(0, 12) : null;
            }

            const genre = r.sexe === 'masculin' ? 'homme' : (r.sexe === 'feminin' ? 'femme' : 'homme');

            const personPayload = {
              residence_id: residenceId,
              nom_complet: nomComplet,
              date_naissance: r.birthdate || null,
              cin: cinVal,
              genre: genre,
              telephone: r.phone || null
            };

            console.log('Ajout personne:', personPayload);

            const personResp = await fetch(`${API_BASE}/api/persons`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(personPayload)
            });

            if (!personResp.ok) {
              console.warn(`Échec ajout personne: ${nomComplet}`);
            }
          }
          console.log('Personnes ajoutées avec succès');
        }
      }

      const newResidence = {
        id: residenceId,
        lot: residenceResult.lot,
        quartier: residenceResult.quartier,
        ville: residenceResult.ville,
        fokontany: residenceResult.fokontany,
        lat: residenceResult.lat,
        lng: residenceResult.lng,
        created_by: residenceResult.created_by,
        created_at: residenceResult.created_at,
        is_active: residenceResult.is_active,
        name: residenceResult.lot,
        proprietaire: null
      };

      setResidences(prev => [newResidence, ...(prev || [])]);

      if (residenceResult.requires_approval) {
        alert(t('submittedForApproval'));
      } else {
        alert(t('saveSuccess'));
      }

      setAddressDetails({ 
        lot: '', 
        quartier: '', 
        ville: '' 
      });
      setSelectedAddress('');
      setSelectedLocation(null);
      setHasSelectedAddress(true);
      setShowAddAddress(false);
      setIsSelectingLocation(false);
      setAddStep(1);
      setNewResidents([]);
      setModalError('');
      setResidentFieldsScrollable(false);
      setIsAddAddressModalOpen(false);

      fetchResidences();

    } catch (err) {
      console.error('handleConfirmSave error', err);
      setModalError(err.message || t('saveError'));
    } finally {
      setSavingResidence(false);
    }
  };

  const handleToggleLang = () => {
    console.log('[LOG] Changement de langue');
    const next = i18n.language === 'fr' ? 'mg' : 'fr';
    i18n.changeLanguage(next);
  };

  const handleCancelSelection = () => {
    console.log('[LOG] Annulation de la sélection d\'emplacement');
    setIsSelectingLocation(false);
    setSelectedLocation(null);
    setSelectedAddress("");
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });

    setMessageStatus("normal");

    setIsAddAddressModalOpen(false);
    setSelectedMarkerColor("yellow");
  };

  const handleCancelToSelection = () => {
    console.log('[LOG] Annulation et retour à la sélection');
    setShowAddAddress(false);
    setIsSelectingLocation(true);
    setSelectedAddress("");
    setSelectedLocation(null);
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
    setAddStep(1);
    setNewResidents([]);
    setModalError('');
    setResidentFieldsScrollable(false);

    setMessageStatus("normal");
    setIsAddAddressModalOpen(true);
    setSelectedMarkerColor("yellow");
  };

  const handleAddressDetailsChange = (field, value) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'lot' && formError) {
      setFormError("");
    }
  };

  const handleCloseResidence = () => {
    console.log('[LOG] Fermeture de la page Résidences');
    setShowResidence(false);
    setResidenceDetailMode(false);
  };

  const handleCloseStatistique = () => {
    console.log('[LOG] Fermeture de la page Statistiques');
    setShowStatistique(false);
  };

  const handleCloseUserPage = () => {
    console.log('[LOG] Fermeture de la page Utilisateur');
    setShowUserPage(false);
    setUserPageState({ showPasswordModal: false });
  };

  const handleClosePendingResidences = () => {
    console.log('[LOG] Fermeture de la page Demandes en attente');
    setShowPendingResidences(false);
    setResidenceToSelect(null);
  };

  const handleUserPageStateChange = (newState) => {
    setUserPageState(newState);
  };

  const handleZoomIn = () => {
    console.log('[LOG] Zoom avant');
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    console.log('[LOG] Zoom arrière');
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleCenterMap = () => {
    console.log('[LOG] Centrage sur la zone');
    if (map) {
      handleFocusOnPolygon();
      setShouldZoomToPolygon(true);
    }
  };

  const handleMapTypeChange = () => {
    console.log('[LOG] Changement de type de carte');
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  };

  const handleResidenceMarkerClick = (residenceId) => {
    console.log(`[LOG] Clic sur le marqueur de résidence ${residenceId}`);
    if (map) {
      setZoomBeforeResidenceClick(map.getZoom());
      setCenterBeforeResidenceClick(map.getCenter());
    }

    setClickedResidenceId(residenceId);
  };

  const handleCloseResidenceInfo = () => {
    console.log('[LOG] Fermeture des informations de résidence');
    setClickedResidenceId(null);

    if (map && zoomBeforeResidenceClick && centerBeforeResidenceClick) {
      setTimeout(() => {
        map.setCenter(centerBeforeResidenceClick);
        map.setZoom(zoomBeforeResidenceClick);
      }, 100);
    }
  };

  useEffect(() => {
    const initFokontanyFromUser = async () => {
      try {
        const stored = localStorage.getItem('user');
        const localUser = stored ? JSON.parse(stored) : null;
        const u = user || localUser;
        console.log('[FOK] initFokontanyFromUser: user from props/local', !!user, !!localUser);
        if (!u) {
          console.log('[FOK] initFokontanyFromUser: no user available, skipping');
          return;
        }

        if (u.fokontany && (u.fokontany.coordinates || u.fokontany.centre_lat)) {
          console.log('[FOK] initFokontanyFromUser: user has fokontany object', u.fokontany?.nom || u.fokontany?.code);
          try {
            const f = u.fokontany;
            const coords = f.coordinates ? (typeof f.coordinates === 'string' ? JSON.parse(f.coordinates) : f.coordinates) : null;
            console.log('[FOK] initFokontanyFromUser: user.fokontany coords raw', coords && (Array.isArray(coords) ? coords.length : typeof coords));
            if (coords && Array.isArray(coords)) {
              const ring = Array.isArray(coords[0] && coords[0][0]) ? coords[0][0] : (coords[0] || []);
              const poly = ring.filter(p => Array.isArray(p) && p.length >= 2).map(p => ({ lat: +p[1], lng: +p[0] }));
              console.log('[FOK] initFokontanyFromUser: parsed poly length', poly.length);
              if (poly && poly.length) {
                setFokontanyPolygon(poly);
                const sum = poly.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
                setFokontanyCenter({ lat: sum.lat / poly.length, lng: sum.lng / poly.length });

                if (f.nom) {
                  setFokontanyName(f.nom);
                }

                console.log('[FOK] initFokontanyFromUser: set polygon & center from user.fokontany');
                return;
              }
            }
            if (f.centre_lat && f.centre_lng) {
              setFokontanyCenter({ lat: +f.centre_lat, lng: +f.centre_lng });

              if (f.nom) {
                setFokontanyName(f.nom);
              }

              console.log('[FOK] initFokontanyFromUser: set center from user.fokontany centre_lat/centre_lng');
              return;
            }
          } catch (e) { console.warn('[FOK] initFokontanyFromUser user fokontany parse error', e); }
        }

        const token = localStorage.getItem('token');
        console.log('[FOK] initFokontanyFromUser: fetching /api/fokontany/me fallback, token?', !!token);
        if (!token) return;
        const resp = await fetch(`${API_BASE}/api/fokontany/me`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('[FOK] initFokontanyFromUser: response status', resp.status);
        if (!resp.ok) {
          console.warn('[FOK] initFokontanyFromUser: non-ok response', await resp.text());
          return;
        }
        const fok = await resp.json();
        console.log('[FOK] initFokontanyFromUser: body', fok);
        if (fok && (fok.coordinates || fok.centre_lat)) {
          try {
            const coords = fok.coordinates ? (typeof fok.coordinates === 'string' ? JSON.parse(fok.coordinates) : fok.coordinates) : null;
            console.log('[FOK] initFokontanyFromUser: coords parsed type', typeof coords, Array.isArray(coords) ? coords.length : 'n/a');
            if (coords && Array.isArray(coords)) {
              const ring = Array.isArray(coords[0] && coords[0][0]) ? coords[0][0] : (coords[0] || []);
              const poly = ring.filter(p => Array.isArray(p) && p.length >= 2).map(p => ({ lat: +p[1], lng: +p[0] }));
              console.log('[FOK] initFokontanyFromUser: parsed fallback poly length', poly.length);
              if (poly && poly.length) {
                setFokontanyPolygon(poly);
                const sum = poly.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
                setFokontanyCenter({ lat: sum.lat / poly.length, lng: sum.lng / poly.length });

                if (fok.nom) {
                  setFokontanyName(fok.nom);
                }

                console.log('[FOK] initFokontanyFromUser: set polygon & center from fallback API');
                return;
              }
            }
            if (fok.centre_lat && fok.centre_lng) {
              setFokontanyCenter({ lat: +fok.centre_lat, lng: +fok.centre_lng });

              if (fok.nom) {
                setFokontanyName(fok.nom);
              }

              console.log('[FOK] initFokontanyFromUser: set center from fallback centre_lat/centre_lng');
            }
          } catch (e) { console.warn('[FOK] initFokontanyFromUser parse error', e); }
        } else {
          console.log('[FOK] initFokontanyFromUser: no fokontany data returned by API');
        }
      } catch (err) {
        console.warn('initFokontanyFromUser error', err);
      }
    };

    initFokontanyFromUser();
  }, [user, map]);

  useEffect(() => {
    const handleResize = () => {
      if (selectedLocation && showAddAddress) {
        repositionModalForLocation(selectedLocation);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedLocation, showAddAddress, map]);

  const onMapLoad = (mapInstance) => {
    try {
      setMap(mapInstance);
      setMapLoaded(true);
      console.log('[MAP] onMapLoad: map ready', !!mapInstance, 'fokontanyCenter=', fokontanyCenter);

      setTimeout(() => {
        handleFocusOnPolygon();
      }, 500);

    } catch (err) {
      console.warn('[MAP] onMapLoad error', err);
    }
  };

  const handleZoomChanged = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom < 16) {
        setShouldZoomToPolygon(false);
      }
    }
  };

  const handleDragEnd = () => {
    setShouldZoomToPolygon(false);
  };

  const getMapOptions = () => {
    const activePolygon = (fokontanyPolygon && fokontanyPolygon.length > 0) ? fokontanyPolygon : ANDABOLY_POLYGON;
    const view = calculateOptimalView(activePolygon);

    return {
      mapTypeId: mapType === "satellite" ? "hybrid" : "roadmap",
      styles: [],
      gestureHandling: "greedy",
      disableDoubleClickZoom: true,
      draggable: true,
      scrollwheel: true,
      pinchZoom: true,
      center: view.center,
      zoom: view.zoom,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false,
      rotateControl: false,
      tilt: 0,
      disableDefaultUI: true,
    };
  };

  const polygonOptions = {
    strokeColor: "#1E90FF",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#1E90FF",
    fillOpacity: 0.35,
    clickable: false,
    zIndex: 1
  };

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      console.log('[MAP] Click event:', e);
    };
    const handleDblClick = (e) => {
      console.log('[MAP] Double Click event:', e);
    };
    const handleMouseMove = (e) => {
      console.log('[MAP] Mouse Move event:', e);
    };
    const handleZoomChanged = () => {
      console.log('[MAP] Zoom changed:', map.getZoom());
      if (map) {
        const currentZoom = map.getZoom();
        if (currentZoom < 16) {
          setShouldZoomToPolygon(false);
        }
      }
    };
    const handleDragEnd = () => {
      const center = map.getCenter();
      console.log('[MAP] Drag ended. New center:', center.lat(), center.lng());
      setShouldZoomToPolygon(false);
    };

    map.addListener("click", handleClick);
    map.addListener("dblclick", handleDblClick);
    map.addListener("mousemove", handleMouseMove);
    map.addListener("zoom_changed", handleZoomChanged);
    map.addListener("dragend", handleDragEnd);

    return () => {
      if (map) {
        map.removeListener("click", handleClick);
        map.removeListener("dblclick", handleDblClick);
        map.removeListener("mousemove", handleMouseMove);
        map.removeListener("zoom_changed", handleZoomChanged);
        map.removeListener("dragend", handleDragEnd);
      }
    };
  }, [map]);

  useEffect(() => {
    if (shouldZoomToPolygon && map && mapLoaded) {
      handleFocusOnPolygon();
    }
  }, [shouldZoomToPolygon, map, mapLoaded]);

  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  const activePolygon = (fokontanyPolygon && fokontanyPolygon.length > 0) ? fokontanyPolygon : ANDABOLY_POLYGON;

  return (
    <div className="relative w-full h-screen bg-[#F2F2F2] overflow-hidden">
      {isAnyPageOpen && (
        <div className="absolute inset-0 z-25 bg-white transition-all duration-300 ease-in-out pointer-events-none"></div>
      )}

      <div className="absolute top-6 left-[320px] z-40 search-bar-container">
        <div className="w-96">
          <div className={`
            rounded-full flex items-center px-6 py-1.5 w-100 border 
            ${showResidence 
              ? 'bg-gray-400/30 border-white' 
              : 'bg-white backdrop-blur-sm border-gray-200/60 hover:border-gray-300/80'
            } 
            transition-all duration-300
          `}>
            <Search className="mr-3 flex-shrink-0 text-gray-600" size={20} />

            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                disabled={isSearchDisabled || isAddAddressModalOpen}
                className={`
                  w-full p-1 bg-transparent outline-none text-sm 
                  ${isSearchDisabled || isAddAddressModalOpen ? 'text-gray-400' : 'text-gray-700'}
                  placeholder-gray-600
                  ${showResidence ? 'placeholder-gray-300' : ''}
                `}
              />
              {searchLoading && (
                <div className="ml-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <SearchResultsModal />

      <div className="absolute top-6 right-4 z-50">
        <div className="bg-white/30 hover:bg-white/50 rounded-2xl shadow-lg border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300">
          <div className="flex items-center justify-end px-4 py-1 space-x-4">

            {!isAnyPageOpen && (
              <button
                onClick={handleAddAddressClick}
                disabled={isSelectingLocation || isAddAddressModalOpen}
                className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap ${isSelectingLocation || isAddAddressModalOpen
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed backdrop-blur-sm"
                  : isSelectingLocation
                    ? "bg-neutral-950 text-white hover:bg-black-500 backdrop-blur-sm"
                    : "bg-neutral-950 text-white hover:bg-black-500 backdrop-blur-sm"
                  }`}
                title={
                  isSelectingLocation
                    ? t('clickOnMap')
                    : isAddAddressModalOpen
                      ? "Une modal est déjà ouverte"
                      : t('addAddress')
                }
              >
                {isSelectingLocation ? (
                  <Navigation size={18} className="mr-2 flex-shrink-0" />
                ) : (
                  <Plus size={18} className="mr-2 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">
                  {isSelectingLocation ? t('clickOnMap') : t('addAddress')}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (!showAddAddress) {
                  console.log('[LOG] Clic sur bouton notifications');
                  setShowNotifications(!showNotifications);
                  fetchAllNotifications();
                }
              }}
              disabled={showAddAddress}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center ${showAddAddress
                ? 'bg-gray-100 cursor-not-allowed'
                : isAddAddressModalOpen
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
                }`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : showAddAddress ? "Fermez la modal d'ajout d'adresse pour accéder aux notifications" : t('notifications')}
            >
              <Bell size={20} className={`${isAddAddressModalOpen ? 'text-gray-400' : showAddAddress ? 'text-gray-400' : 'text-gray-600 hover:text-gray-800 transition-all duration-300'}`} />
              {totalNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalNotificationsCount > 9 ? '9+' : totalNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={handleToggleLang}
              disabled={isAddAddressModalOpen}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isAddAddressModalOpen ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
                }`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : "Changer la langue"}
            >
              <span className="text-sm font-medium" style={{ color: isAddAddressModalOpen ? '#9ca3af' : '#374151' }}>{i18n.language === 'fr' ? 'FR' : 'MG'}</span>
            </button>

            <button
              onClick={handleUserIconClick}
              disabled={isAddAddressModalOpen}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isAddAddressModalOpen
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
                }`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : t('profile')}
            >
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getUserInitial()}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="absolute top-18 right-4 z-60 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">{t('notifications')}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {notifications.length} {notifications.length !== 1 ? t('notificationsCount') : t('notification')}
            </p>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('noUnreadNotifications')}</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('[LOG] Clic sur bouton X pour marquer comme lu');
                        markAsRead(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs"
                      title={t('markAsRead')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {formatNotificationDate(notification.created_at)}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${notification.type === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isSelectingLocation && !isAnyPageOpen && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-none">
          <div className={`rounded-2xl shadow-2xl p-4 mx-4 border relative w-full max-w-2xl ${messageStatus === "error"
            ? "bg-red-50 border-red-200"
            : "bg-white/95 backdrop-blur-sm border-gray-200"}`}>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${messageStatus === "error" ? "bg-red-500" : "bg-gray-700"}`}>
                  <Navigation size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-base mb-1 ${messageStatus === "error" ? "text-red-800" : "text-gray-800"}`}>
                    {messageStatus === "error"
                      ? t('clickOnlyInZone')
                      : t('selectAddress')}
                  </p>
                  <p className={`text-sm ${messageStatus === "error" ? "text-red-600" : "text-gray-600"}`}>
                    <span className={`font-medium ${messageStatus === "error" ? "text-red-700" : "text-gray-700"}`}>
                      {t('zoneLimited')}
                    </span> {messageStatus === "error"
                      ? t('clickInBlueZone')
                      : t('clickInZone')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCancelSelection}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 pointer-events-auto flex items-center space-x-2 flex-shrink-0"
                title={t('cancel')}
              >
                <X size={16} />
                <span className="text-sm font-medium">{t('cancel')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAddress && (
        <>
          <div className="fixed inset-0 bg-black/50 z-60"></div>

          <div
            ref={addAddressRef}
            className="fixed z-70 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              transform: 'translate(0, 0)',
              transition: 'left 0.3s ease, top 0.3s ease',
              width: '480px',
              maxHeight: '580px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-gray-800 font-semibold text-lg">{t('addResidence')}</h3>
              <button
                onClick={handleReturnToSelection}
                className="text-gray-500 hover:text-gray-700 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ paddingTop: '16px', paddingBottom: '16px', maxHeight: '440px' }}>
              <div className="mb-5">
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-gray-700 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 text-base">{fokontanyName || 'Non spécifié'}</span>
                        <span className="text-sm text-gray-500">(-23.352776, 43.684839)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {addStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <input
                      type="text"
                      value={addressDetails.lot}
                      onChange={(e) => handleAddressDetailsChange('lot', e.target.value)}
                      placeholder={t('lotLabel')}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formError ? "border-red-500" : "border-gray-300"}`}
                      style={{ height: '42px', fontSize: '14px' }}
                    />
                    {formError && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <Info size={14} className="mr-1" />
                        {formError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 text-sm">{t('addResident')}</h4>
                      <button 
                        onClick={handleAddPerson}
                        className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-all duration-200 flex items-center"
                      >
                        <Plus size={14} className="mr-1" />
                        {t('addResident')}
                      </button>
                    </div>

                    {newResidents.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                        {t('noResidentAdded')}
                      </div>
                    ) : (
                      <div 
                        ref={residentFieldsRef}
                        className={`space-y-3 ${residentFieldsScrollable ? 'max-h-48 overflow-y-auto pr-2' : ''}`}
                        style={{ 
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 #f1f5f9'
                        }}
                      >
                        {newResidents.map((p, idx) => {
                          const age = calculateAgeFromDate(p.birthdate);
                          const showCinField = age !== null && age >= 18;
                          
                          return (
                            <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-3 bg-white">
                              <div className="flex justify-between items-center">
                                <strong className="text-sm text-gray-800">
                                  {p.nom || p.prenom ? `${p.nom} ${p.prenom}` : `${t('resident')} ${idx + 1}`}
                                </strong>
                                <button 
                                  onClick={() => handleRemovePerson(idx)} 
                                  className="text-red-600 hover:text-red-800 text-xs flex items-center"
                                >
                                  <X size={12} className="mr-1" />
                                  {t('delete')}
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <input 
                                      type="text" 
                                      placeholder={t('lastName')}
                                      value={p.nom} 
                                      onChange={(e) => handlePersonChange(idx, 'nom', e.target.value)} 
                                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
                                      style={{ height: '36px', fontSize: '12px' }}
                                    />
                                  </div>
                                  <div>
                                    <input 
                                      type="text" 
                                      placeholder={t('firstName')}
                                      value={p.prenom} 
                                      onChange={(e) => handlePersonChange(idx, 'prenom', e.target.value)} 
                                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
                                      style={{ height: '36px', fontSize: '12px' }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <div className="flex flex-col">
                                      <label className="text-xs text-gray-700 font-medium mb-1">{t('gender')}:</label>
                                      <div className="flex items-center space-x-3">
                                        <label className="flex items-center cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`sexe-${idx}`}
                                            value="masculin"
                                            checked={p.sexe === 'masculin'}
                                            onChange={(e) => handlePersonChange(idx, 'sexe', e.target.value)}
                                            className="mr-1"
                                            style={{ width: '14px', height: '14px', accentColor: '#3b82f6' }}
                                          />
                                          <span className="text-xs text-gray-700">{t('male')}</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`sexe-${idx}`}
                                            value="feminin"
                                            checked={p.sexe === 'feminin'}
                                            onChange={(e) => handlePersonChange(idx, 'sexe', e.target.value)}
                                            className="mr-1"
                                            style={{ width: '14px', height: '14px', accentColor: '#3b82f6' }}
                                          />
                                          <span className="text-xs text-gray-700">{t('female')}</span>
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <input 
                                      type="date" 
                                      placeholder={t('birthDate')}
                                      value={p.birthdate} 
                                      onChange={(e) => handlePersonChange(idx, 'birthdate', e.target.value)} 
                                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
                                      style={{ height: '36px', fontSize: '12px' }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    {showCinField ? (
                                      <input 
                                        type="text" 
                                        placeholder={t('cin')}
                                        value={p.cin} 
                                        onChange={(e) => handlePersonChange(idx, 'cin', e.target.value)} 
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
                                        style={{ height: '36px', fontSize: '12px' }}
                                    />
                                    ) : p.birthdate ? (
                                      <input 
                                        type="text" 
                                        placeholder={t('cin')}
                                        value={t('minor')} 
                                        disabled
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                        style={{ height: '36px', fontSize: '12px' }}
                                      />
                                    ) : (
                                      <input 
                                        type="text" 
                                        placeholder={t('cin')}
                                        value="" 
                                        disabled
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                        style={{ height: '36px', fontSize: '12px' }}
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <input 
                                      type="text" 
                                      placeholder={t('phone')}
                                      value={p.phone} 
                                      onChange={(e) => handlePersonChange(idx, 'phone', e.target.value)} 
                                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
                                      style={{ height: '36px', fontSize: '12px' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {addStep === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-gray-800">{t('addResident')}</h4>
                    <button onClick={handleAddPerson} className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-900">{t('addAnotherPerson')}</button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {newResidents.length === 0 && (
                      <div className="text-sm text-gray-500">{t('noResidentAdded')}</div>
                    )}

                    {newResidents.map((p, idx) => {
                      const age = calculateAgeFromDate(p.birthdate);
                      const showCinField = age !== null && age >= 18;
                      
                      return (
                        <div key={idx} className="border p-3 rounded-lg space-y-2 bg-white">
                          <div className="flex justify-between">
                            <strong className="text-sm text-gray-800">{p.nom || p.prenom ? `${p.nom} ${p.prenom}` : `${t('resident')} ${idx + 1}`}</strong>
                            <button onClick={() => handleRemovePerson(idx)} className="text-red-500 text-xs">{t('delete')}</button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder={t('lastName')} value={p.nom} onChange={(e) => handlePersonChange(idx, 'nom', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }} />
                            <input type="text" placeholder={t('firstName')} value={p.prenom} onChange={(e) => handlePersonChange(idx, 'prenom', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }} />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <label className="text-xs text-gray-700 font-medium mb-1">{t('gender')}:</label>
                              <select value={p.sexe} onChange={(e) => handlePersonChange(idx, 'sexe', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }}>
                                <option value="masculin">{t('male')}</option>
                                <option value="feminin">{t('female')}</option>
                              </select>
                            </div>
                            <input type="date" placeholder={t('birthDate')} value={p.birthdate} onChange={(e) => handlePersonChange(idx, 'birthdate', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 items-center">
                            {showCinField ? (
                              <input type="text" placeholder={t('cin')} value={p.cin} onChange={(e) => handlePersonChange(idx, 'cin', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }} />
                            ) : p.birthdate ? (
                              <input type="text" placeholder={t('cin')} value={t('minor')} disabled className="px-2 py-1 border rounded text-sm bg-gray-100 text-gray-500" style={{ height: '32px' }} />
                            ) : (
                              <input type="text" placeholder={t('cin')} value="" disabled className="px-2 py-1 border rounded text-sm bg-gray-100 text-gray-500" style={{ height: '32px' }} />
                            )}
                            <input type="text" placeholder={t('phone')} value={p.phone} onChange={(e) => handlePersonChange(idx, 'phone', e.target.value)} className="px-2 py-1 border rounded text-sm" style={{ height: '32px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-4">
                    <button onClick={handleBackToLot} className="px-3 py-1.5 border rounded-lg text-sm text-gray-700 border-gray-300 hover:bg-gray-50">{t('back')}</button>
                    <div className="flex gap-2">
                      <button onClick={handleCancelToSelection} className="px-3 py-1.5 border rounded-lg text-sm text-gray-700 border-gray-300 hover:bg-gray-50">{t('cancel')}</button>
                      <button onClick={handleConfirmSave} disabled={savingResidence} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        {savingResidence ? t('saving') : t('save')}
                      </button>
                    </div>
                  </div>

                  {modalError && <div className="text-red-600 text-sm mt-2">{modalError}</div>}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-4 bg-white" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
              <button
                onClick={handleCancelToSelection}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                style={{ height: '38px', fontSize: '13px' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={addStep === 1 ? handleConfirmSave : handleConfirmSave}
                disabled={savingResidence}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: '38px', fontSize: '13px' }}
              >
                {savingResidence ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="absolute top-6 left-6 z-40 sidebar-container">
        <div className="bg-gray-300/20 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 hover:bg-gray-400/30 hover:backdrop-blur-md hover:border-gray-400/30 transition-all duration-300 ease-out overflow-hidden group"
          style={{
            width: "260px",
            minHeight: "400px",
            maxHeight: "85vh"
          }}>
          
          <button
            onClick={handleLogoClick}
            disabled={isAddAddressModalOpen}
            className={`w-full flex items-center px-4 py-3 transition-all duration-200 ${isAddAddressModalOpen
              ? 'cursor-not-allowed opacity-70'
              : ''
              }`}
            style={{ height: "44px" }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isAddAddressModalOpen ? "#9ca3af" : "#1f2937",
              borderRadius: "8px",
              marginRight: "12px"
            }}>
              <span style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#ffffff"
              }}>S</span>
            </div>
            <span style={{
              fontSize: "16px",
              fontWeight: 600,
              color: isAddAddressModalOpen ? "#9ca3af" : "#111827"
            }}>SIGAP</span>
          </button>

          {/* Nouvelle section placée au-dessus du menu */}
          <div className="p-4 border-b border-gray-200/60 bg-white/30">
            {!isAnyPageOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin size={18} className="text-gray-700 mr-2" />
                  <span className="text-sm font-medium text-gray-800">
                    Carte {fokontanyName}
                  </span>
                </div>
                
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin size={18} className="text-gray-700 mr-2" />
                  <span className="text-sm font-medium text-gray-800">
                    {fokontanyName}
                  </span>
                </div>
                <button
                  onClick={handleLogoClick}
                  className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center"
                >
                  <Eye size={14} className="mr-1" />
                  Voir carte
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Titre "Menu" toujours affiché */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Menu size={18} className="text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('menu')}
                </span>
              </div>
            
              {/* MENU FIXE - Pas de collapse/expand */}
              <div className="space-y-1">
                {/* Résidences */}
                <button
                  onClick={() => {
                    console.log('[LOG] Clic sur menu Résidences');
                    if (showResidence) {
                      if (residenceDetailMode) {
                        setResidenceDetailMode(false);
                      } else {
                        setShowResidence(false);
                      }
                    } else {
                      openPage('residence');
                    }
                  }}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 hover:bg-gray-100 hover:border hover:border-gray-200 ${
                    showResidence ? "bg-gray-100 border border-gray-200" : ""
                  }`}
                  style={{
                    height: "44px",
                    padding: "0 12px"
                  }}
                >
                  <div style={{
                    width: "36px",
                    display: "flex",
                    justifyContent: "center",
                    marginRight: "10px"
                  }}>
                    <MapPin size={20} className={showResidence ? "text-gray-800" : "text-gray-700"} />
                  </div>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: showResidence ? "#111827" : "#374151"
                  }}>{t('residence')}</span>
                </button>

                {/* Statistiques */}
                <button
                  onClick={() => {
                    console.log('[LOG] Clic sur menu Statistiques');
                    if (showStatistique) {
                      setShowStatistique(false);
                    } else {
                      openPage('statistique');
                    }
                  }}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 hover:bg-gray-100 hover:border hover:border-gray-200 ${
                    showStatistique ? "bg-gray-100 border border-gray-200" : ""
                  }`}
                  style={{
                    height: "44px",
                    padding: "0 12px"
                  }}
                >
                  <div style={{
                    width: "36px",
                    display: "flex",
                    justifyContent: "center",
                    marginRight: "10px"
                  }}>
                    <BarChart3 size={20} className={showStatistique ? "text-gray-800" : "text-gray-700"} />
                  </div>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: showStatistique ? "#111827" : "#374151"
                  }}>{t('statistics')}</span>
                </button>

                {/* Demandes en attente (seulement pour secrétaire) */}
                {currentUser?.role === 'secretaire' && (
                  <button
                    onClick={() => {
                      console.log('[LOG] Clic sur menu Demandes en attente');
                      if (showPendingResidences) {
                        setShowPendingResidences(false);
                        setResidenceToSelect(null);
                      } else {
                        openPage('pending');
                      }
                    }}
                    className={`w-full flex items-center rounded-xl transition-all duration-200 hover:bg-gray-100 hover:border hover:border-gray-200 ${
                      showPendingResidences ? "bg-gray-100 border border-gray-200" : ""
                    }`}
                    style={{
                      height: "44px",
                      padding: "0 12px"
                    }}
                  >
                    <div style={{
                      width: "36px",
                      display: "flex",
                      justifyContent: "center",
                      marginRight: "10px"
                    }}>
                      <ClipboardList size={20} className={showPendingResidences ? "text-gray-800" : "text-gray-700"} />
                    </div>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: showPendingResidences ? "#111827" : "#374151"
                    }}>{t('requests')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResidence && (
        <div className="absolute top-20 left-[320px] right-4 z-30 bg-gray-400/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-white"
          style={{
            height: "calc(92vh - 28px)",
            bottom: "4px"
          }}>
          <ResidencePage
            onBack={handleCloseResidence}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onViewOnMap={handleViewOnMap}
            detailMode={residenceDetailMode}
            onEnterDetail={handleEnterResidenceDetail}
            onExitDetail={handleExitResidenceDetail}
          />
        </div>
      )}

      {showStatistique && (
        <div className="absolute top-20 left-[320px] right-4 z-30 bg-gray-400/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-white"
          style={{
            height: "calc(92vh - 28px)",
            bottom: "4px"
          }}>
          <Statistique onBack={handleCloseStatistique} />
        </div>
      )}

      {showUserPage && (
        <div className="absolute top-20 left-[320px] right-4 z-30 bg-gray-400/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-white"
          style={{
            height: "calc(92vh - 28px)",
            bottom: "4px"
          }}>
          <UserPage
            user={currentUser}
            onBack={handleCloseUserPage}
            onLogout={handleLogout}
            userPageState={userPageState}
            onUserPageStateChange={handleUserPageStateChange}
          />
        </div>
      )}

      {showPendingResidences && currentUser?.role === 'secretaire' && (
        <div className="absolute top-20 left-[320px] right-4 z-30 bg-gray-400/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-white"
          style={{
            height: "calc(92vh - 28px)",
            bottom: "4px"
          }}>
          <PendingResidences
            onBack={handleClosePendingResidences}
            onResidenceApproved={checkAndClearApprovedResidenceNotifications}
            residenceToSelect={residenceToSelect}
          />
        </div>
      )}

      {!isAnyPageOpen && (
        <>
          <div className="fixed right-6 bottom-24 z-40 flex flex-col items-center space-y-2">
            <button
              onClick={handleZoomIn}
              disabled={isAddAddressModalOpen}
              className={`w-10 h-10 ${isAddAddressModalOpen ? 'bg-gray-300 cursor-not-allowed' : 'bg-white/95 backdrop-blur-sm hover:bg-white'} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border ${isAddAddressModalOpen ? 'border-gray-300' : 'border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl'}`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : t('zoomIn')}
            >
              <Plus size={20} className={isAddAddressModalOpen ? "text-gray-400" : "text-gray-700 hover:text-gray-800 transition-all duration-300"} />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={isAddAddressModalOpen}
              className={`w-10 h-10 ${isAddAddressModalOpen ? 'bg-gray-300 cursor-not-allowed' : 'bg-white/95 backdrop-blur-sm hover:bg-white'} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border ${isAddAddressModalOpen ? 'border-gray-300' : 'border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl'}`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : t('zoomOut')}
            >
              <Minus size={20} className={isAddAddressModalOpen ? "text-gray-400" : "text-gray-700 hover:text-gray-800 transition-all duration-300"} />
            </button>
            <button
              onClick={handleCenterMap}
              disabled={isAddAddressModalOpen}
              className={`w-10 h-10 ${isAddAddressModalOpen ? 'bg-gray-300 cursor-not-allowed' : 'bg-white/95 backdrop-blur-sm hover:bg-white'} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border ${isAddAddressModalOpen ? 'border-gray-300' : 'border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl'}`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : t('viewZone')}
            >
              <LocateFixed size={20} className={isAddAddressModalOpen ? "text-gray-400" : "text-gray-700 hover:text-gray-800 transition-all duration-300"} />
            </button>
          </div>

          <div className="fixed right-6 bottom-8 z-40">
            <button
              onClick={handleMapTypeChange}
              disabled={isAddAddressModalOpen}
              className={`w-10 h-10 ${isAddAddressModalOpen ? 'bg-gray-300 cursor-not-allowed' : 'bg-white/95 backdrop-blur-sm hover:bg-white'} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl border ${isAddAddressModalOpen ? 'border-gray-300' : 'border-gray-200/60 hover:border-gray-300/80'}`}
              title={isAddAddressModalOpen ? "Modal ouverte - désactivé" : mapType === "satellite" ? t('switchToPlan') : t('switchToSatellite')}
            >
              <Layers size={22} className={isAddAddressModalOpen ? "text-gray-400" : "text-gray-700 hover:text-gray-800 transition-all duration-300"} />
            </button>
          </div>
        </>
      )}

      <div className="absolute inset-0 z-0" data-map-container>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIza..."} >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={fokontanyCenter || ANDABOLY_CENTER}
            zoom={15}
            mapTypeId={mapType === "satellite" ? "hybrid" : "roadmap"}
            onLoad={onMapLoad}
            options={getMapOptions()}
            onClick={handleMapClick}
          >
            {activePolygon && activePolygon.length > 0 && (
              <Polygon
                paths={activePolygon}
                options={polygonOptions}
                onMouseOver={handlePolygonMouseOver}
                onMouseOut={handlePolygonMouseOut}
                clickable={false}
              />
            )}

            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={createCustomMarkerIcon(selectedMarkerColor)}
              />
            )}

            {residences.map((r) => (
              (r.lat != null && r.lng != null) ? (
                <Marker
                  key={`res-${r.id}`}
                  position={{ lat: Number(r.lat), lng: Number(r.lng) }}
                  icon={createCustomMarkerIcon("default")}
                  onClick={() => handleResidenceMarkerClick(r.id)}
                  title={r.lot || `Lot ${r.id}`}
                />
              ) : null
            ))}

            {selectedResidenceFromSearch && (
              <Marker
                position={{ 
                  lat: parseFloat(selectedResidenceFromSearch.lat || selectedResidenceFromSearch.latitude), 
                  lng: parseFloat(selectedResidenceFromSearch.lng || selectedResidenceFromSearch.longitude)
                }}
                icon={createCustomMarkerIcon("yellow")}
              />
            )}

            {clickedResidenceId && (() => {
              const r = residences.find(x => x.id === clickedResidenceId);
              if (!r) return null;
              const lat = Number(r.lat);
              const lng = Number(r.lng);
              if (!isFinite(lat) || !isFinite(lng)) return null;

              return (
                <InfoWindow
                  position={{ lat, lng }}
                  onCloseClick={handleCloseResidenceInfo}
                  options={{
                    disableAutoPan: true,
                    maxWidth: 200,
                    pixelOffset: new window.google.maps.Size(0, -30)
                  }}
                >
                  <div className="p-2 max-w-xs">
                    <div className="font-semibold text-gray-800 text-sm mb-2">
                      {r.lot && r.lot.trim() ? r.lot : `Lot ${r.id}`}
                    </div>
                    {r.quartier && (
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">{t('neighborhood')}:</span> {r.quartier}
                      </div>
                    )}
                    {r.ville && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{t('city')}:</span> {r.ville}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              );
            })()}
          </GoogleMap>
        </LoadScript>
      </div>

      {showForgotPassword && (
        <ForgotPassword
          onClose={() => setShowForgotPassword(false)}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
}

const normalizeCoordinates = (input) => {
  try {
    if (!input) return null;

    let data = input;
    if (typeof input === "string") {
      try { data = JSON.parse(input); } catch (e) { }
    }

    if (data && data.type === "FeatureCollection" && Array.isArray(data.features)) {
      const f = data.features.find(ft => ft && ft.geometry && ft.geometry.coordinates);
      if (f) data = f.geometry.coordinates;
    }

    if (data && data.type === "Feature" && data.geometry && data.geometry.coordinates) {
      data = data.geometry.coordinates;
    }

    if (data && data.geometry && data.geometry.coordinates) {
      data = data.geometry.coordinates;
    }

    const findRing = (d) => {
      if (!Array.isArray(d) || d.length === 0) return null;
      if (Array.isArray(d[0] && d[0][0]) && Array.isArray(d[0][0][0])) return d[0][0];
      if (Array.isArray(d[0] && d[0][0]) && typeof d[0][0][0] === "number") return d[0];
      if (Array.isArray(d[0]) && typeof d[0][0] === "number" && typeof d[0][1] === "number") return d;
      for (const el of d) {
        const candidate = findRing(el);
        if (candidate) return candidate;
      }
      return null;
    };

    const ring = findRing(data);
    if (!ring) return null;

    const coords = ring.map((p) => {
      if (Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number") {
        return { lat: +p[1], lng: +p[0] };
      }
      return null;
    }).filter(p => p !== null);

    return coords.length > 0 ? coords : null;
  } catch (e) {
    console.warn('normalizeCoordinates error', e);
    return null;
  }
};