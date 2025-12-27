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
} from "lucide-react";

// Import des composants Google Maps
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow } from "@react-google-maps/api";

// Import des composants personnalisés
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";
import UserPage from "./UserPage";
import ResidencePage from "./ResidencePage";
import PendingResidences from "./PendingResidences";

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
  // Orientation correcte: x = longitude, y = latitude
  // Vérifications de sécurité des paramètres
  if (!point || !polygon || !Array.isArray(polygon) || polygon.length === 0) return false;
  
  const x = Number(point.lng), y = Number(point.lat);
  if (Number.isNaN(x) || Number.isNaN(y)) return false;
  
  let inside = false;
  // Algorithme du ray casting pour déterminer si un point est dans un polygon
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
  
  // Si la notification est d'aujourd'hui, affiche uniquement l'heure
  if (notificationDay.getTime() === today.getTime()) {
    const hours = notificationDate.getHours().toString().padStart(2, '0');
    const minutes = notificationDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  // Si la notification est d'hier
  else if (notificationDay.getTime() === yesterday.getTime()) {
    return "Hier";
  }
  // Pour les dates plus anciennes
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
    // Token invalide
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
  // Hook de navigation React Router
  const navigate = useNavigate();
  
  // État pour le menu dropdown
  const [openDropdown, setOpenDropdown] = useState(false);
  
  // État pour la requête de recherche
  const [searchQuery, setSearchQuery] = useState("");
  
  // NOUVEAUX ÉTATS POUR LA RECHERCHE
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // États pour gérer l'affichage des différentes pages
  const [showStatistique, setShowStatistique] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // État pour l'utilisateur courant
  const [currentUser, setCurrentUser] = useState(user);
  
  // États pour contrôler l'affichage des différentes sections
  const [showResidence, setShowResidence] = useState(false);
  const [showUserPage, setShowUserPage] = useState(false);
  const [showPendingResidences, setShowPendingResidences] = useState(false);
  
  // États pour la gestion de l'ajout d'adresse
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  
  // États pour la gestion de la carte Google Maps
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("satellite");
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // État pour les détails de l'adresse
  const [addressDetails, setAddressDetails] = useState({
    lot: "",
    quartier: "",
    ville: ""
  });
  
  // État pour indiquer si une adresse a été sélectionnée
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);

  // NOUVEAUX ÉTATS : pour gérer l'interaction avec le polygon
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);

  // NOUVEL ÉTAT : pour gérer le statut du message (normal ou erreur)
  const [messageStatus, setMessageStatus] = useState("normal"); // "normal" ou "error"

  // NOUVEL ÉTAT : pour gérer l'erreur de validation du formulaire
  const [formError, setFormError] = useState("");

  // état pour la page utilisateur (modal changement mot de passe)
  const [userPageState, setUserPageState] = useState({ showPasswordModal: false });

  // ÉTATS POUR LES NOTIFICATIONS - MIS À JOUR
  const [notifications, setNotifications] = useState([]);
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0); // Total des notifications
  const [showNotifications, setShowNotifications] = useState(false);

  // NOUVEL ÉTAT : pour gérer la résidence cliquée (modal de détail)
  const [clickedResidenceId, setClickedResidenceId] = useState(null);

  // NOUVEAUX ÉTATS : pour sauvegarder le niveau de zoom avant la sélection d'adresse
  const [previousZoom, setPreviousZoom] = useState(null);
  const [previousCenter, setPreviousCenter] = useState(null);

  // NOUVEAUX ÉTATS : pour sauvegarder le niveau de zoom avant le clic sur une résidence
  const [zoomBeforeResidenceClick, setZoomBeforeResidenceClick] = useState(null);
  const [centerBeforeResidenceClick, setCenterBeforeResidenceClick] = useState(null);

  // NOUVEL ÉTAT : pour indiquer si la carte doit être zoomée sur la zone limite
  const [shouldZoomToPolygon, setShouldZoomToPolygon] = useState(true);

  // NOUVEL ÉTAT : pour contrôler si les autres boutons sont désactivés
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NOUVEL ÉTAT : pour gérer la couleur du marqueur de localisation
  const [selectedMarkerColor, setSelectedMarkerColor] = useState("yellow"); // "yellow" (avant confirmation), "green" (après confirmation)

  // NOUVEL ÉTAT : pour la position du modal
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // NOUVEL ÉTAT : pour stocker l'ID de la résidence à sélectionner dans PendingResidences
  const [residenceToSelect, setResidenceToSelect] = useState(null);

  // Références pour les éléments DOM
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const addAddressRef = useRef(null);

  // --- NOUVEAUX ÉTATS : fokontany récupéré depuis le backend ---
  const [fokontanyPolygon, setFokontanyPolygon] = useState(null);
  const [fokontanyCenter, setFokontanyCenter] = useState(null);
  const [fokontanyName, setFokontanyName] = useState(null);
  const [residences, setResidences] = useState([]);

  // Fonction pour créer une icône SVG personnalisée pour les marqueurs
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

  // FONCTION : Récupérer TOUTES les notifications (pour le comptage total)
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
        
        // Filtrer les notifications non lues
        const unreadNotifications = data.filter(notif => !notif.is_read);
        console.log('[NOTIF] Unread notifications:', unreadNotifications.length);
        
        setNotifications(unreadNotifications); // Stocke les non lues pour l'affichage
        setTotalNotificationsCount(unreadNotifications.length); // Compteur basé sur les non lues
      }
    } catch (error) {
      console.error('[NOTIF] Error loading notifications:', error);
    }
  };

  // FONCTION : Marquer une notification comme lue et la supprimer IMMÉDIATEMENT
  const markAsRead = async (notificationId) => {
    try {
      console.log('[NOTIF] markAsRead for notification:', notificationId);
      const token = localStorage.getItem('token');
      
      // Appel API pour marquer comme lue
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('[NOTIF] Notification marked as read:', notificationId);
        
        // SUPPRIME IMMÉDIATEMENT la notification de la liste locale
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
        
        // Met à jour le compteur total
        setTotalNotificationsCount(prev => Math.max(0, prev - 1));
        
      } else if (response.status === 404) {
        console.warn('[NOTIF] Route not found, notification might be deleted already');
        // Supprime quand même de la liste locale
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
        setTotalNotificationsCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('[NOTIF] Failed to mark as read:', response.status);
      }
    } catch (error) {
      console.error('[NOTIF] Error marking as read:', error);
      // En cas d'erreur, supprime quand même de la liste locale pour l'UI
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      setTotalNotificationsCount(prev => Math.max(0, prev - 1));
    }
  };

  // Fonction pour vérifier et effacer les notifications des résidences approuvées
  const checkAndClearApprovedResidenceNotifications = async () => {
    try {
      console.log('[NOTIF] checkAndClearApprovedResidenceNotifications: starting...');
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Récupère les résidences approuvées
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
          
          // Rafraîchir les notifications
          await fetchAllNotifications();
        }
      }
    } catch (error) {
      console.error('[NOTIF] Error clearing approved notifications:', error);
    }
  };

  // GESTIONNAIRE : Clic sur une notification - VERSION SIMPLIFIÉE
  const handleNotificationClick = async (notification) => {
    console.log('=== CLIC SUR NOTIFICATION ===');
    console.log('Notification complète:', notification);
    console.log('Métadonnées:', notification.metadata);
    console.log('Message:', notification.message);
    console.log('Type:', notification.type);
    
    // Marque comme lue IMMÉDIATEMENT
    await markAsRead(notification.id);
    
    // Ferme le panneau de notifications
    setShowNotifications(false);
    
    // SI L'UTILISATEUR EST SECRÉTAIRE, AFFICHE LES RÉSIDENCES EN ATTENTE
    if (currentUser?.role === 'secretaire') {
      console.log('[NOTIF] Ouverture page PendingResidences pour secrétaire');
      
      // Ouvrir la page PendingResidences
      setShowPendingResidences(true);
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
      
      // Extraire l'ID de résidence du message ou metadata
      let residenceId = null;
      
      // Essayer d'extraire l'ID de différentes manières
      if (notification.related_entity_id) {
        residenceId = notification.related_entity_id;
      } else if (notification.message) {
        // Essayer d'extraire l'ID du message
        const idMatch = notification.message.match(/ID[:\s]*(\d+)/i) || 
                       notification.message.match(/residence[:\s]*(\d+)/i);
        if (idMatch) {
          residenceId = idMatch[1];
        }
      }
      
      console.log('[NOTIF] Extracted residenceId:', residenceId);
      
      // Stocker l'ID de la résidence pour la sélection automatique
      if (residenceId) {
        setResidenceToSelect(residenceId);
      }
    }
  };

  // Fonction pour récupérer les résidences
  const fetchResidences = async () => {
    try {
      console.log('[RES] fetchResidences: starting...');
      let url = `${API_BASE}/api/residences`;
      if (fokontanyName) {
        url += `?fokontany=${encodeURIComponent(fokontanyName)}`;
        console.log('[RES] Fetching with fokontany:', fokontanyName);
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

  // Fonction pour effectuer une recherche - MODIFIÉE POUR DÉSACTIVER LES SUGGESTIONS SUR RÉSIDENCE
  const performSearch = async (query) => {
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // DÉSACTIVER LES SUGGESTIONS QUAND LA PAGE RÉSIDENCE EST OUVERTE
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
      
      // Effectuer la recherche via l'API
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
        
        // Si on est sur la page Résidence, passer les résultats
        if (showResidence) {
          console.log("Recherche dans les résidences:", data);
          // DÉSACTIVER LES SUGGESTIONS POPUP SUR LA CARTE
          setShowSearchResults(false);
        } else if (!isAnyPageOpen) {
          // Si on est sur la carte, on peut traiter les résultats
          console.log("Résultats de recherche sur carte:", data);
        }
      } else if (response.status === 401) {
        console.error('[SEARCH] Token invalid');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Gestionnaire de soumission de recherche - MODIFIÉ POUR DÉSACTIVER LES SUGGESTIONS SUR RÉSIDENCE
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim() === '') {
      setShowSearchResults(false);
      return;
    }
    
    // DÉSACTIVER LES SUGGESTIONS QUAND LA PAGE RÉSIDENCE EST OUVERTE
    if (showResidence) {
      setShowSearchResults(false);
      console.log("Recherche dans les résidences:", searchQuery);
      return;
    }
    
    // Effectuer la recherche
    performSearch(searchQuery);
    
    if (showResidence) {
      console.log("Recherche dans les résidences:", searchQuery);
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return;
    } else {
      console.log("Recherche sur la carte:", searchQuery);
    }
  };

  // CORRECTION: Gestionnaire de clic sur un résultat de recherche amélioré
  const handleSearchResultClick = (result) => {
    console.log('=== CLIC SUR RÉSULTAT DE RECHERCHE ===', result);
    
    // Fermer les résultats de recherche
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Gérer différents types de résultats
    if (result.type === 'residence') {
      handleResidenceSearchResult(result);
    } else if (result.type === 'person') {
      handlePersonSearchResult(result);
    }
  };

  // Nouvelle fonction pour gérer les résultats de type résidence
  const handleResidenceSearchResult = (result) => {
    // Vérifier si la résidence a des coordonnées
    if (result.lat && result.lng) {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lng);
      
      // Sauvegarder l'état actuel de la carte si disponible
      if (map) {
        setPreviousZoom(map.getZoom());
        setPreviousCenter(map.getCenter());
      }
      
      // Centrer et zoomer sur la résidence
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(18);
      }
      
      // Mettre à jour l'ID de la résidence cliquée pour afficher l'info-bulle
      setClickedResidenceId(result.id);
      
      // Ajouter à la liste des résidences si nécessaire
      if (!residences.some(r => r.id === result.id)) {
        setResidences(prev => [result, ...prev]);
      }
      
      // Fermer toutes les pages pour voir la carte
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
      
    } else {
      alert("Cette résidence n'a pas de coordonnées géographiques enregistrées");
    }
    
    // Si on est sur la page Résidence, fermer la page
    if (showResidence) {
      console.log("Résidence sélectionnée:", result);
      setShowResidence(false);
    }
  };

  // Nouvelle fonction pour gérer les résultats de type personne
  const handlePersonSearchResult = (result) => {
    console.log("Personne sélectionnée:", result);
    
    // Si la personne a des résidences avec coordonnées, prendre la première
    if (result.residences && result.residences.length > 0) {
      // Chercher la première résidence avec des coordonnées
      const residenceWithCoords = result.residences.find(r => r.lat && r.lng);
      
      if (residenceWithCoords) {
        handleResidenceSearchResult(residenceWithCoords);
      } else {
        alert(`Personne: ${result.nom} ${result.prenom}\nAucune adresse avec coordonnées trouvée`);
      }
    } else {
      alert(`Personne: ${result.nom} ${result.prenom}\nAucune adresse associée`);
    }
  };

  // Composant pour afficher les résultats de recherche - MODIFIÉ POUR DÉSACTIVER SUR RÉSIDENCE
  const SearchResultsModal = () => {
    // NE PAS AFFICHER LES SUGGESTIONS QUAND LA PAGE RÉSIDENCE EST OUVERTE
    if (showResidence || !showSearchResults || searchResults.length === 0) return null;
    
    return (
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Résultats de recherche</h3>
            <button
              onClick={() => setShowSearchResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} trouvé{searchResults.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="p-2">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200"
              onClick={() => handleSearchResultClick(result)}
            >
              {result.type === 'residence' && (
                <div>
                  <div className="flex items-center mb-2">
                    <MapPin size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                    <h4 className="font-medium text-sm text-gray-800">
                      {result.lot || 'Lot non spécifié'}
                    </h4>
                    <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                      Adresse
                    </span>
                  </div>
                  {result.quartier && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Quartier:</span> {result.quartier}
                    </p>
                  )}
                  {result.ville && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Ville:</span> {result.ville}
                    </p>
                  )}
                  {result.proprietaires && result.proprietaires.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Propriétaire(s):</span> {result.proprietaires.map(p => p.nom).join(', ')}
                    </p>
                  )}
                  {/* MODIFICATION: Supprimé le bouton "Cliquez pour voir sur la carte" car maintenant le clic sur tout le résultat le fait */}
                </div>
              )}
              
              {result.type === 'person' && (
                <div>
                  <div className="flex items-center mb-2">
                    <User size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <h4 className="font-medium text-sm text-gray-800">
                      {result.nom} {result.prenom}
                    </h4>
                    <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex-shrink-0">
                      Personne
                    </span>
                  </div>
                  {result.residences && result.residences.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Adresse(s):</p>
                      {result.residences.slice(0, 2).map((residence, idx) => (
                        <p key={idx} className="text-xs text-gray-600">
                          • {residence.lot || 'Lot non spécifié'} - {residence.quartier}
                        </p>
                      ))}
                      {result.residences.length > 2 && (
                        <p className="text-xs text-gray-400 mt-1">
                          +{result.residences.length - 2} autre(s) adresse(s)
                        </p>
                      )}
                      {/* MODIFICATION: Supprimé le texte "Cliquez pour voir sur la carte" car maintenant le clic sur tout le résultat le fait */}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    console.log('[APP] Component mounted, loading data...');
    
    // Charge les notifications et résidences
    fetchAllNotifications();
    fetchResidences();

    // Intervalle pour actualiser les notifications toutes les 60 secondes
    const interval = setInterval(() => {
      console.log('[APP] Refreshing notifications...');
      fetchAllNotifications();
    }, 60000);

    // Nettoyage à la désinstallation
    return () => {
      console.log('[APP] Component unmounting...');
      clearInterval(interval);
    };
  }, []);

  // Effet pour charger les résidences quand le nom du fokontany change
  useEffect(() => {
    if (fokontanyName) {
      console.log('[APP] fokontanyName changed:', fokontanyName);
      fetchResidences();
    }
  }, [fokontanyName]);

  // Effet pour nettoyer les notifications quand on affiche les résidences en attente
  useEffect(() => {
    if (showPendingResidences && currentUser?.role === 'secretaire') {
      console.log('[APP] Pending residences page opened, clearing notifications');
      setTimeout(() => {
        checkAndClearApprovedResidenceNotifications();
      }, 500);
    }
  }, [showPendingResidences]);

  // Effet pour effectuer la recherche en temps réel - MODIFIÉ POUR DÉSACTIVER SUR RÉSIDENCE
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        // NE PAS EFFECTUER DE RECHERCHE AVEC SUGGESTIONS SUR LA CARTE QUAND LA PAGE RÉSIDENCE EST OUVERTE
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
  }, [searchQuery, showResidence]); // Ajouter showResidence aux dépendances

  // Gestionnaires d'événements pour le polygon
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

  // Fonction pour centrer et zoomer sur la zone limite
  const handleFocusOnPolygon = () => {
    if (!map) return;
    const polygon = (fokontanyPolygon && fokontanyPolygon.length) ? fokontanyPolygon : ANDABOLY_POLYGON;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach(p => bounds.extend(p));
      // Ajoute une marge de 10%
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = (ne.lat() - sw.lat()) * 0.1;
      const lngDiff = (ne.lng() - sw.lng()) * 0.1;
      bounds.extend({ lat: ne.lat() + latDiff, lng: ne.lng() + lngDiff });
      bounds.extend({ lat: sw.lat() - latDiff, lng: sw.lng() - lngDiff });
      map.fitBounds(bounds);
      // Écouteur pour limiter le zoom maximum
      if (window.google && window.google.maps && window.google.maps.event) {
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', function () {
          try { 
            // Limite le zoom maximum à 18
            if (map.getZoom() > 18) map.setZoom(18); 
          } catch (e) { }
          try { window.google.maps.event.removeListener(listener); } catch (e) { }
        });
      }
    } catch (e) {
      console.warn('handleFocusOnPolygon error', e);
    }
  };

  // Fonction pour calculer les limites d'un polygon
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

  // Fonction pour calculer la vue optimale pour un polygon
  const calculateOptimalView = (polygon) => {
    if (!polygon || polygon.length === 0) {
      return { center: ANDABOLY_CENTER, zoom: 15 };
    }
    
    // Calcule le centre du polygon
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
      
      // Ajuste le zoom selon la taille du polygon
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

  // Effet pour charger les données du fokontany depuis l'API
  useEffect(() => {
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
    loadMyFokontany();
  }, []);

  // Effet pour restaurer l'état depuis le localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('interfaceState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setShowResidence(state.showResidence || false);
      setShowStatistique(state.showStatistique || false);
      setShowUserPage(state.showUserPage || false);
    }
  }, []);

  // Effet pour sauvegarder l'état dans le localStorage
  useEffect(() => {
    const state = {
      showResidence,
      showStatistique,
      showUserPage,
      showPendingResidences
    };
    localStorage.setItem('interfaceState', JSON.stringify(state));
  }, [showResidence, showStatistique, showUserPage, showPendingResidences]);

  // MODIFICATION: Supprimer le gestionnaire handleClickOutside pour le modal d'ajout d'adresse
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
      
      // MODIFICATION: NE PAS fermer les résultats de recherche quand on clique en dehors
      // Seulement si on clique spécifiquement sur le bouton X dans le modal
      if (!searchRef.current?.contains(event.target) && showSearchResults) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults]);

  // Vérifie si une page est ouverte
  const isAnyPageOpen = showResidence || showStatistique || showUserPage || showPendingResidences;

  // Effet pour réinitialiser la sélection d'adresse quand une page est ouverte
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
      setIsModalOpen(false);
    }
  }, [isAnyPageOpen, isSelectingLocation]);

  // MODIFICATION: Effet pour fermer les notifications quand une page s'ouvre
  useEffect(() => {
    if (isAnyPageOpen && showNotifications) {
      setShowNotifications(false);
    }
  }, [isAnyPageOpen]);

  // MODIFICATION: Effet pour fermer les résultats de recherche quand une page s'ouvre
  useEffect(() => {
    if (isAnyPageOpen && showSearchResults) {
      setShowSearchResults(false);
    }
  }, [isAnyPageOpen]);

  // NOUVELLE MODIFICATION: Effet pour fermer le modal de détail des résidences quand une page s'ouvre
  useEffect(() => {
    if (isAnyPageOpen && clickedResidenceId) {
      setClickedResidenceId(null);
      handleCloseResidenceInfo();
    }
  }, [isAnyPageOpen]);

  // Fonction pour obtenir le placeholder du champ de recherche - MODIFIÉ POUR INDIQUER LE CHANGEMENT
  const getSearchPlaceholder = () => {
    if (showResidence) {
      return "Rechercher dans les résidences... (saisissez et appuyez sur Entrée)";
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return "Recherche désactivée";
    } else {
      return "Rechercher un lieu, une adresse ou une personne...";
    }
  };

  // Vérifie si la recherche est désactivée
  const isSearchDisabled = showStatistique || showUserPage || showPendingResidences;

  // Gestionnaire de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('interfaceState');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Gestionnaire de clic sur le logo
  const handleLogoClick = () => {
    if (showUserPage && userPageState.showPasswordModal) {
      setUserPageState(prev => ({ ...prev, showPasswordModal: false }));
    }
    else if (showUserPage) {
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
    }
    else if (isAnyPageOpen) {
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
      // Réinitialiser la sélection automatique
      setResidenceToSelect(null);
    }
    // Fermer les résultats de recherche
    setShowSearchResults(false);
  };

  // Gestionnaire de clic sur l'icône utilisateur
  const handleUserIconClick = () => {
    if (isModalOpen) return;
    const newShowUserPage = !showUserPage;
    setShowUserPage(newShowUserPage);
    if (newShowUserPage) {
      setUserPageState({ showPasswordModal: false });
    }
    if (newShowUserPage) {
      setShowResidence(false);
      setShowStatistique(false);
      setShowPendingResidences(false);
      // MODIFICATION: Ferme les notifications quand on ouvre la page utilisateur
      setShowNotifications(false);
      // MODIFICATION: Ferme les résultats de recherche
      setShowSearchResults(false);
      // NOUVELLE MODIFICATION: Ferme le modal de détail des résidences
      setClickedResidenceId(null);
      // Réinitialiser la sélection automatique
      setResidenceToSelect(null);
    }
  };

  // Gestionnaire de clic sur Résidence - MODIFIÉ POUR FERMER LES SUGGESTIONS
  const handleResidenceClick = () => {
    if (isModalOpen) return;
    const newShowResidence = !showResidence;
    setShowResidence(newShowResidence);
    if (newShowResidence) {
      setShowStatistique(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
      // MODIFICATION: Ferme les notifications quand on ouvre la page résidence
      setShowNotifications(false);
      // MODIFICATION: Ferme les résultats de recherche
      setShowSearchResults(false);
      setSearchResults([]);
      // NOUVELLE MODIFICATION: Ferme le modal de détail des résidences
      setClickedResidenceId(null);
      // Réinitialiser la sélection automatique
      setResidenceToSelect(null);
    }
    if (isSelectingLocation || showAddAddress) {
      setIsSelectingLocation(false);
      setShowAddAddress(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setHasSelectedAddress(false);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
      setIsModalOpen(false);
    }
  };

  // Gestionnaire de clic sur Statistique
  const handleStatistiqueClick = () => {
    if (isModalOpen) return;
    const newShowStatistique = !showStatistique;
    setShowStatistique(newShowStatistique);
    if (newShowStatistique) {
      setShowResidence(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
      // MODIFICATION: Ferme les notifications quand on ouvre la page statistique
      setShowNotifications(false);
      // MODIFICATION: Ferme les résultats de recherche
      setShowSearchResults(false);
      // NOUVELLE MODIFICATION: Ferme le modal de détail des résidences
      setClickedResidenceId(null);
      // Réinitialiser la sélection automatique
      setResidenceToSelect(null);
    }
    if (isSelectingLocation || showAddAddress) {
      setIsSelectingLocation(false);
      setShowAddAddress(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setHasSelectedAddress(false);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
      setIsModalOpen(false);
    }
  };

  // Gestionnaire de clic sur Demandes (pour secrétaire)
  const handlePendingResidencesClick = () => {
    if (isModalOpen) return;
    const newShowPending = !showPendingResidences;
    setShowPendingResidences(newShowPending);
    
    if (newShowPending) {
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
      // MODIFICATION: Ferme les notifications quand on ouvre la page demandes
      setShowNotifications(false);
      // MODIFICATION: Ferme les résultats de recherche
      setShowSearchResults(false);
      // NOUVELLE MODIFICATION: Ferme le modal de détail des résidences
      setClickedResidenceId(null);
      // Ne pas réinitialiser residenceToSelect ici, on le garde pour la sélection automatique
    } else {
      // Quand on ferme la page, réinitialiser la sélection
      setResidenceToSelect(null);
    }
    
    if (isSelectingLocation || showAddAddress) {
      setIsSelectingLocation(false);
      setShowAddAddress(false);
      setSelectedLocation(null);
      setSelectedAddress("");
      setHasSelectedAddress(false);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
      setIsModalOpen(false);
    }
  };

  // MODIFICATION: Mettre à jour la fonction latLngToPixel pour être plus robuste
  const latLngToPixel = (latLng) => {
    if (!map || !latLng) return { x: 0, y: 0 };
    
    try {
      const projection = map.getProjection();
      const point = projection.fromLatLngToPoint(
        new window.google.maps.LatLng(latLng.lat, latLng.lng)
      );
      
      const bounds = map.getBounds();
      if (!bounds) {
        // Si pas de bounds, utiliser la vue actuelle
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        // Approximatif: calcul basé sur le zoom
        const scale = Math.pow(2, zoom);
        const worldWidth = 256 * scale;
        const worldHeight = 256 * scale;
        
        const mapContainer = document.querySelector('[data-map-container]');
        const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        
        // Conversion approximative
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
      
      // Fallback: position au centre de l'écran
      const mapContainer = document.querySelector('[data-map-container]');
      const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      
      return { 
        x: mapRect.left + mapRect.width / 2, 
        y: mapRect.top + mapRect.height / 2 
      };
    }
  };

  // Gestionnaire de clic sur Ajouter une adresse
  const handleAddAddressClick = () => {
    if (isAnyPageOpen || isSelectingLocation || isModalOpen || showAddAddress) return;

    setIsModalOpen(true);
    setSelectedMarkerColor("yellow");

    // Sauvegarde l'état actuel de la carte MAIS NE PAS ZOOMER
    if (map) {
      setPreviousZoom(map.getZoom());
      setPreviousCenter(map.getCenter());
      // MODIFICATION: On ne change pas le zoom ici
      // On garde simplement le zoom actuel
    }

    // Active le mode sélection de localisation
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

    // MODIFICATION: Ferme les notifications quand on ouvre l'ajout d'adresse
    setShowNotifications(false);
    // MODIFICATION: Ferme les résultats de recherche
    setShowSearchResults(false);
    // NOUVELLE MODIFICATION: Ferme le modal de détail des résidences
    setClickedResidenceId(null);

    // MODIFICATION: On ne centre plus sur le polygon
    // On laisse la carte dans son état actuel
  };

  // Fonction pour obtenir l'adresse à partir de coordonnées (géocodage)
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

      // Parse les composants de l'adresse
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
        quartier = ville || "Quartier non spécifié";
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
      
      // Adresse de secours si le géocodage échoue
      const fallbackAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      setAddressDetails({
        lot: "",
        quartier: "Quartier inconnu",
        ville: "Ville inconnue"
      });
    }
  };

  // NOUVELLE FONCTION: Pour repositionner le modal pour un emplacement donné
  const repositionModalForLocation = (location) => {
    setTimeout(() => {
      if (map) {
        const screenPos = latLngToPixel(location);
        const modalWidth = 448;
        const modalHeight = 400;
        
        const mapContainer = document.querySelector('[data-map-container]');
        const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        
        // Position à droite de l'adresse
        let modalX = screenPos.x + 20;
        let modalY = screenPos.y - (modalHeight / 2);
        
        // Vérifier si le modal dépasse de l'écran à droite
        if (modalX + modalWidth > mapRect.left + mapRect.width - 20) {
          // Le modal dépasse à droite, on va le positionner à gauche de l'adresse
          modalX = screenPos.x - modalWidth - 20;
          
          // Si même à gauche ça dépasse (trop à gauche), on déplace la carte
          if (modalX < mapRect.left + 20) {
            // Calculer le décalage nécessaire pour que le modal soit visible
            const neededSpace = modalWidth + 40; // Modal + marge
            const currentSpace = mapRect.width - (screenPos.x - mapRect.left);
            
            if (currentSpace < neededSpace) {
              // Pas assez d'espace à droite, on déplace la carte
              const offsetPixels = neededSpace - currentSpace;
              
              // Convertir le décalage en pixels en décalage géographique
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
                  
                  // Déplacer la carte vers la droite
                  const currentCenter = map.getCenter();
                  const newLng = currentCenter.lng() + lngOffset;
                  
                  // Pan la carte vers la nouvelle position
                  map.panTo({ lat: currentCenter.lat(), lng: newLng });
                  
                  // Attendre que la carte se soit déplacée avant de repositionner le modal
                  setTimeout(() => {
                    const newScreenPos = latLngToPixel(location);
                    modalX = newScreenPos.x + 20;
                    modalY = newScreenPos.y - (modalHeight / 2);
                    
                    // Ajustements finaux
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
        
        // Ajustements verticaux
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

  // Gestionnaire de clic sur la carte
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
        
        // MODIFICATION: On ne change pas le zoom ici non plus
        // On garde le zoom actuel de la carte
        if (map) {
          // Sauvegarde l'état actuel pour pouvoir revenir
          setPreviousZoom(map.getZoom());
          setPreviousCenter(map.getCenter());
        }
        
        // Obtient l'adresse pour les coordonnées
        await getAddressFromCoordinates(lat, lng);
        
        setMessageStatus("normal");
        setIsSelectingLocation(false);
        setIsModalOpen(true);
        
        // Positionner le modal avec la nouvelle logique
        repositionModalForLocation({ lat, lng });
      } else {
        setMessageStatus("error");
      }
    }
  };

  // Gestionnaire pour retourner à la sélection de localisation
  const handleReturnToSelection = () => {
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
    setIsModalOpen(true);
    setSelectedMarkerColor("yellow");

    // MODIFICATION: On ne recentre pas sur le polygon
    // On laisse la carte dans son état actuel
  };

  // Gestionnaire pour fermer complètement l'ajout d'adresse
  const handleCloseComplete = () => {
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
    setIsModalOpen(false);
    setSelectedMarkerColor("yellow");
    
    // MODIFICATION: On ne restaure pas la vue précédente
    // On laisse la carte dans son état actuel
  };

  // Gestionnaire pour confirmer l'adresse
  const handleConfirmAddress = async () => {
    if (!addressDetails.lot) {
      setFormError("Veuillez remplir le numéro de lot");
      return;
    }
    if (!selectedLocation) {
      setFormError("Emplacement invalide");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = {
        lot: addressDetails.lot,
        quartier: addressDetails.quartier,
        ville: addressDetails.ville,
        fokontany: null,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        created_by: currentUser?.id || null
      };
      const resp = await fetch(`${API_BASE}/api/residences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const body = await resp.text();
        console.warn('[RES] create failed', resp.status, body);
        setFormError("Erreur lors de l'enregistrement");
        return;
      }

      const result = await resp.json();

      if (result.requires_approval) {
        setHasSelectedAddress(true);
        setShowAddAddress(false);
        setIsSelectingLocation(false);
        setFormError("");

        setIsModalOpen(false);
        setSelectedMarkerColor("green");

        alert('Résidence soumise pour approbation. Vous recevrez une notification quand elle sera approuvée.');
      } else {
        // Ajoute la nouvelle résidence à la liste
        setResidences(prev => [result, ...(prev || [])]);
        setHasSelectedAddress(true);
        setShowAddAddress(false);
        setIsSelectingLocation(false);
        setFormError("");
        
        setIsModalOpen(false);
        setSelectedMarkerColor("green");
      }

      console.log('[RES] created', result);
    } catch (err) {
      console.warn('[RES] handleConfirmAddress error', err);
      setFormError('Erreur réseau');
    }
  };

  // Gestionnaire pour annuler la sélection
  const handleCancelSelection = () => {
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

    setIsModalOpen(false);
    setSelectedMarkerColor("yellow");

    // MODIFICATION: On ne restaure pas la vue précédente
    // On laisse la carte dans son état actuel
  };

  // Gestionnaire de changement des détails de l'adresse
  const handleAddressDetailsChange = (field, value) => {
    if (field === 'lot') {
      setAddressDetails(prev => ({
        ...prev,
        [field]: value
      }));
      if (formError) {
        setFormError("");
      }
    }
  };

  // Gestionnaires pour fermer les différentes pages
  const handleCloseResidence = () => {
    setShowResidence(false);
  };

  const handleCloseStatistique = () => {
    setShowStatistique(false);
  };

  const handleCloseUserPage = () => {
    setShowUserPage(false);
    setUserPageState({ showPasswordModal: false });
  };

  const handleClosePendingResidences = () => {
    setShowPendingResidences(false);
    // Réinitialiser l'ID de résidence à sélectionner
    setResidenceToSelect(null);
  };

  // Gestionnaire pour changer l'état de la page utilisateur
  const handleUserPageStateChange = (newState) => {
    setUserPageState(newState);
  };

  // Gestionnaires pour le zoom de la carte
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

  // Fonction pour centrer la carte sur le polygon
  const handleCenterMap = () => {
    if (map) {
      handleFocusOnPolygon();
      setShouldZoomToPolygon(true);
    }
  };

  // Gestionnaire pour changer le type de carte
  const handleMapTypeChange = () => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  };

  // Gestionnaire de clic sur un marqueur de résidence
  const handleResidenceMarkerClick = (residenceId) => {
    if (map) {
      setZoomBeforeResidenceClick(map.getZoom());
      setCenterBeforeResidenceClick(map.getCenter());
    }
    
    setClickedResidenceId(residenceId);
  };

  // Gestionnaire pour fermer l'info-bulle de résidence
  const handleCloseResidenceInfo = () => {
    setClickedResidenceId(null);
    
    // Restaure la vue précédente de la carte
    if (map && zoomBeforeResidenceClick && centerBeforeResidenceClick) {
      setTimeout(() => {
        map.setCenter(centerBeforeResidenceClick);
        map.setZoom(zoomBeforeResidenceClick);
      }, 100);
    }
  };

  // NOUVELLE FONCTION : Pour gérer l'affichage d'une résidence sur la carte
  const handleViewOnMap = (residence) => {
    console.log('[INTERFACE] Affichage résidence sur carte:', residence);
    
    // Ferme la page résidence si elle est ouverte
    setShowResidence(false);
    
    // Sauvegarde l'état actuel de la carte
    if (map) {
      setPreviousZoom(map.getZoom());
      setPreviousCenter(map.getCenter());
    }
    
    // Centre la carte sur la résidence
    if (map && (residence.latitude || residence.lat) && (residence.longitude || residence.lng)) {
      const lat = residence.latitude || residence.lat;
      const lng = residence.longitude || residence.lng;
      
      console.log('[INTERFACE] Centrage sur:', { lat, lng });
      
      map.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
      map.setZoom(18);
      
      // Mettre à jour l'ID de la résidence cliquée pour afficher l'info-bulle
      setClickedResidenceId(residence.id);
      
      // Met à jour la liste des résidences si nécessaire
      if (!residences.some(r => r.id === residence.id)) {
        setResidences(prev => [residence, ...prev]);
      }
    } else {
      console.warn('[INTERFACE] Résidence sans coordonnées:', residence);
      alert("Cette résidence n'a pas de coordonnées géographiques enregistrées");
    }
  };

  // Effet pour initialiser le fokontany depuis l'utilisateur
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
                console.log('[FOK] initFokontanyFromUser: set polygon & center from user.fokontany');
                return;
              }
            }
            if (f.centre_lat && f.centre_lng) {
              setFokontanyCenter({ lat: +f.centre_lat, lng: +f.centre_lng });
              console.log('[FOK] initFokontanyFromUser: set center from user.fokontany centre_lat/centre_lng');
              return;
            }
          } catch (e) { console.warn('[FOK] initFokontanyFromUser user fokontany parse error', e); }
        }

        // Fallback: récupère depuis l'API
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
                console.log('[FOK] initFokontanyFromUser: set polygon & center from fallback API');
                return;
              }
            }
            if (fok.centre_lat && fok.centre_lng) {
              setFokontanyCenter({ lat: +fok.centre_lat, lng: +fok.centre_lng });
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

  // Effet pour repositionner le modal lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (selectedLocation && showAddAddress) {
        repositionModalForLocation(selectedLocation);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedLocation, showAddAddress, map]);

  // Gestionnaire de chargement de la carte
  const onMapLoad = (mapInstance) => {
    try {
      setMap(mapInstance);
      setMapLoaded(true);
      console.log('[MAP] onMapLoad: map ready', !!mapInstance, 'fokontanyCenter=', fokontanyCenter);
      
      // Centre sur le polygon après un délai
      setTimeout(() => {
        handleFocusOnPolygon();
      }, 500);
      
    } catch (err) {
      console.warn('[MAP] onMapLoad error', err);
    }
  };

  // Gestionnaire de changement de zoom
  const handleZoomChanged = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom < 16) {
        setShouldZoomToPolygon(false);
      }
    }
  };

  // Gestionnaire de fin de déplacement de la carte
  const handleDragEnd = () => {
    setShouldZoomToPolygon(false);
  };

  // Fonction pour obtenir les options de la carte
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

  // Options du polygon affiché sur la carte
  const polygonOptions = {
    strokeColor: "#1E90FF",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#1E90FF",
    fillOpacity: 0.35,
    clickable: false,
    zIndex: 1
  };

  // Effet pour ajouter des écouteurs d'événements à la carte
  useEffect(() => {
    if (!map) return;
    
    // Définition des gestionnaires d'événements
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

    // Ajout des écouteurs
    map.addListener("click", handleClick);
    map.addListener("dblclick", handleDblClick);
    map.addListener("mousemove", handleMouseMove);
    map.addListener("zoom_changed", handleZoomChanged);
    map.addListener("dragend", handleDragEnd);

    // Nettoyage à la désinstallation
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

  // Effet pour zoomer sur le polygon quand nécessaire
  useEffect(() => {
    if (shouldZoomToPolygon && map && mapLoaded) {
      handleFocusOnPolygon();
    }
  }, [shouldZoomToPolygon, map, mapLoaded]);

  // Style du conteneur de la carte
  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  // Détermine le polygon actif (personnalisé ou par défaut)
  const activePolygon = (fokontanyPolygon && fokontanyPolygon.length > 0) ? fokontanyPolygon : ANDABOLY_POLYGON;

  // Rendu du composant
  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      {/* Overlay flou quand une page est ouverte */}
      {isAnyPageOpen && (
        <div className="absolute inset-0 z-20 bg-gray-500/30 backdrop-blur-sm transition-all duration-300 ease-in-out"></div>
      )}

      {/* Barre de recherche centrale */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-30">
        <div className="px-7 py-2 rounded-3xl bg-white/30 hover:bg-white/50 duration-300 ease-out opacity-100">
          <div className="rounded-full flex items-center px-6 py-1 w-96 border bg-white backdrop-blur-sm border-gray-200/60 hover:border-gray-300/80 transition-all duration-300">
            <Search className="mr-3 flex-shrink-0 text-gray-600" size={20} />

            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                disabled={isSearchDisabled || isModalOpen}
                className={`w-full p-1 bg-transparent outline-none text-sm ${
                  isSearchDisabled || isModalOpen ? 'text-gray-400' : 'text-gray-700'
                } placeholder-gray-600`}
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

      {/* === RÉSULTATS DE RECHERCHE === */}
      <SearchResultsModal />

      {/* === BOUTONS DROITS (AJOUTER, NOTIFICATIONS, PROFIL) === */}
      <div className="absolute top-6 right-4 z-20">
        <div className="bg-white/30 hover:bg-white/50 rounded-2xl shadow-lg border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300">
          <div className="flex items-center justify-end px-4 py-1 space-x-4">

            {/* Bouton Ajouter une adresse */}
            <button
              onClick={handleAddAddressClick}
              disabled={isAnyPageOpen || isSelectingLocation || isModalOpen}
              className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap ${
                isAnyPageOpen || isSelectingLocation || isModalOpen
                  ? "bg-green-600 text-gray-200 cursor-not-allowed backdrop-blur-sm"
                  : isSelectingLocation
                  ? "bg-green-600 text-white hover:bg-green-700 backdrop-blur-sm"
                  : "bg-green-600 text-white hover:bg-green-700 backdrop-blur-sm"
              }`}
              title={
                isAnyPageOpen 
                  ? "Fermez les autres pages pour ajouter une adresse" 
                  : isModalOpen
                  ? "Une modal est déjà ouverte"
                  : isSelectingLocation
                  ? "Sélection en cours - cliquez sur la carte ou annulez"
                  : "Ajouter une nouvelle adresse"
              }
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

            {/* BOUTON NOTIFICATION */}
            <button
              onClick={() => {
                if (!showAddAddress) {
                  setShowNotifications(!showNotifications);
                  // Rafraîchir les notifications quand on ouvre le panneau
                  fetchAllNotifications();
                }
              }}
              disabled={showAddAddress}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                showAddAddress
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
              }`}
              title={showAddAddress ? "Fermez la modal d'ajout d'adresse pour accéder aux notifications" : "Notifications"}
            >
              <Bell size={20} className={`${showAddAddress ? 'text-gray-400' : 'text-gray-600 hover:text-gray-800 transition-all duration-300'}`} />
              {/* BADGE AVEC TOTAL DES NOTIFICATIONS NON LUES */}
              {totalNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalNotificationsCount > 9 ? '9+' : totalNotificationsCount}
                </span>
              )}
            </button>

            {/* Bouton Profil */}
            <button
              onClick={handleUserIconClick}
              disabled={isModalOpen}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isModalOpen
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
              }`}
              title={isModalOpen ? "Fermez la modal pour accéder au profil" : "Profil"}
            >
              <User size={20} className={`${isModalOpen ? 'text-gray-400' : 'text-gray-600 hover:text-gray-800 transition-all duration-300'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DE NOTIFICATIONS - AFFICHE SEULEMENT LES NON LUES */}
      {showNotifications && (
        <div className="absolute top-18 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} non lue{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune notification non lue</p>
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
                        markAsRead(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs"
                      title="Marquer comme lue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {formatNotificationDate(notification.created_at)}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      notification.type === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === OVERLAY DE SÉLECTION D'ADRESSE === */}
      {isSelectingLocation && !isAnyPageOpen && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-none">
          <div className={`rounded-2xl shadow-2xl p-4 mx-4 border relative w-full max-w-2xl ${messageStatus === "error"
            ? "bg-red-50 border-red-200"
            : "bg-white/95 backdrop-blur-sm border-orange-200"}`}>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${messageStatus === "error" ? "bg-red-500" : "bg-green-600"}`}>
                  <Navigation size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-base mb-1 ${messageStatus === "error" ? "text-red-800" : "text-gray-800"}`}>
                    {messageStatus === "error"
                      ? "Veuillez cliquer uniquement dans la zone limite (en bleu)"
                      : "Cliquez sur la carte pour sélectionner une adresse"}
                  </p>
                  <p className={`text-sm ${messageStatus === "error" ? "text-red-600" : "text-gray-600"}`}>
                    <span className={`font-medium ${messageStatus === "error" ? "text-red-700" : "text-blue-600"}`}>
                      Zone limitée :
                    </span> {messageStatus === "error"
                      ? "Cliquez dans la zone bleue pour ajouter une résidence"
                      : "Veuillez cliquer uniquement dans la zone bleue"}
                  </p>
                </div>
              </div>

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

      {/* === MODAL AJOUT ADRESSE === */}
      {showAddAddress && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>

          <div 
            ref={addAddressRef}
            className="fixed z-50 w-full max-w-md"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              transform: 'translate(0, 0)',
              transition: 'left 0.3s ease, top 0.3s ease'
            }}
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mx-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Ajouter une résidence</h3>
                <button
                  onClick={handleReturnToSelection}
                  className="text-white/80 hover:text-white transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-6">
                  <div className="flex items-start space-x-3 mb-3">
                    <MapPin size={20} className="text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-base mb-1">Emplacement sélectionné :</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {selectedAddress}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Coordonnées :</span> {selectedLocation?.lat?.toFixed(6)}, {selectedLocation?.lng?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Numéro de lot *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.lot}
                      onChange={(e) => handleAddressDetailsChange('lot', e.target.value)}
                      placeholder="Ex: Lot 123, Lot ABC, Lot 45B"
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formError ? "border-red-500" : "border-gray-300"}`}
                      required
                    />
                    {formError && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <Info size={14} className="mr-1" />
                        {formError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleReturnToSelection}
                    className="flex-1 px-1 py-3 text-base bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Changer d'emplacement
                  </button>
                  <button
                    onClick={handleConfirmAddress}
                    className="flex-1 px-1 py-3 text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === SIDEBAR GAUCHE === */}
      <div className="absolute top-1 left-6 z-20">
        <div className="bg-white/30 hover:bg-white/50 rounded-2xl shadow-lg py-4 flex flex-col items-center space-y-6 transition-all duration-300 ease-out w-55 border border-gray-200/60 hover:border-gray-300/80">

          {/* Logo / Accueil */}
          <button
            onClick={handleLogoClick}
            disabled={isModalOpen}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              isModalOpen
                ? 'bg-transparent cursor-not-allowed'
                : 'bg-transparent hover:bg-white'
            }`}
          >
            <div className="p-2 rounded-full flex-shrink-0 bg-blue-100/70">
              <span className="text-blue-600 font-bold text-sm">SG</span>
            </div>
            <span className={`text-gray-800 font-medium whitespace-nowrap transition-all duration-300 ${
              isModalOpen ? 'opacity-50' : ''
            }`}>
              SIGAP
            </span>
          </button>

          {/* Bouton Résidence */}
          <button
            onClick={handleResidenceClick}
            disabled={isModalOpen}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showResidence
                ? "bg-white border border-blue-200/60"
                : isModalOpen
                ? "bg-transparent cursor-not-allowed"
                : "bg-transparent hover:bg-white hover:border-blue-200/60"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showResidence ? "bg-blue-100/70" : isModalOpen ? "bg-blue-100/50" : "bg-blue-100/70"
            }`}>
              <MapPin size={18} className={`${
                showResidence ? "text-blue-600" : isModalOpen ? "text-blue-400" : "text-blue-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showResidence ? "text-gray-800" : isModalOpen ? "text-gray-500" : "text-gray-800"
            }`}>
              Résidence
            </span>
          </button>

          {/* Bouton Statistique */}
          <button
            onClick={handleStatistiqueClick}
            disabled={isModalOpen}
            className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
              showStatistique
                ? "bg-white border border-green-200/60"
                : isModalOpen
                ? "bg-transparent cursor-not-allowed"
                : "bg-transparent hover:bg-white hover:border-green-200/60"
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              showStatistique ? "bg-green-100/70" : isModalOpen ? "bg-green-100/50" : "bg-green-100/70"
            }`}>
              <BarChart3 size={18} className={`${
                showStatistique ? "text-green-600" : isModalOpen ? "text-green-400" : "text-green-600"
              } transition-all duration-300`} />
            </div>
            <span className={`${
              showStatistique ? "text-gray-800" : isModalOpen ? "text-gray-500" : "text-gray-800"
            } font-medium whitespace-nowrap transition-all duration-300`}>
              Statistique
            </span>
          </button>

          {/* Bouton Demandes (visible uniquement pour les secrétaires) */}
          {currentUser?.role === 'secretaire' && (
            <button
              onClick={handlePendingResidencesClick}
              disabled={isModalOpen}
              className={`w-full flex items-center space-x-3 rounded-xl transition-all duration-300 py-3 px-4 ${
                showPendingResidences
                  ? "bg-white border border-purple-200/60"
                  : isModalOpen
                  ? "bg-transparent cursor-not-allowed"
                  : "bg-transparent hover:bg-white hover:border-purple-200/60"
              }`}
            >
              <div className={`p-2 rounded-full flex-shrink-0 ${
                showPendingResidences ? "bg-purple-100/70" : isModalOpen ? "bg-purple-100/50" : "bg-purple-100/70"
              }`}>
                <ClipboardList size={18} className={`${
                  showPendingResidences ? "text-purple-600" : isModalOpen ? "text-purple-400" : "text-purple-600"
                } transition-all duration-300`} />
              </div>
              <span className={`${
                showPendingResidences ? "text-gray-800" : isModalOpen ? "text-gray-500" : "text-gray-800"
              } font-medium whitespace-nowrap transition-all duration-300`}>
                Demandes
              </span>
            </button>
          )}
        </div>
      </div>

      {/* === PAGES === */}
      {/* Page Résidence */}
      {showResidence && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <ResidencePage
            onBack={handleCloseResidence}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onViewOnMap={handleViewOnMap}
          />
        </div>
      )}

      {/* Page Statistique */}
      {showStatistique && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <Statistique onBack={handleCloseStatistique} />
        </div>
      )}

      {/* Page Utilisateur */}
      {showUserPage && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <UserPage
            user={currentUser}
            onBack={handleCloseUserPage}
            onLogout={handleLogout}
            userPageState={userPageState}
            onUserPageStateChange={handleUserPageStateChange}
          />
        </div>
      )}

      {/* Page Demandes en attente */}
      {showPendingResidences && currentUser?.role === 'secretaire' && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <PendingResidences 
            onBack={handleClosePendingResidences} 
            onResidenceApproved={checkAndClearApprovedResidenceNotifications}
            // Passer l'ID de la résidence à sélectionner
            residenceToSelect={residenceToSelect}
          />
        </div>
      )}

      {/* === CONTROLES ZOOM ET COUCHE === */}
      <div className="fixed right-6 bottom-24 z-10 flex flex-col items-center space-y-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Zoom avant"
        >
          <Plus size={20} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Zoom arrière"
        >
          <Minus size={20} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
        <button
          onClick={handleCenterMap}
          className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-xl"
          title="Voir la zone limite"
        >
          <LocateFixed size={20} className="text-blue-600 hover:text-blue-700 transition-all duration-300" />
        </button>
      </div>

      {/* Bouton changement de type de carte */}
      <div className="fixed right-6 bottom-8 z-10">
        <button
          onClick={handleMapTypeChange}
          className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:shadow-xl border border-gray-200/60 hover:border-gray-300/80"
          title={mapType === "satellite" ? "Passer en vue plan" : "Passer en vue satellite"}
        >
          <Layers size={22} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
      </div>

      {/* === GOOGLE MAPS === */}
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
            {/* Affichage du polygon de zone */}
            {activePolygon && activePolygon.length > 0 && (
              <Polygon
                paths={activePolygon}
                options={polygonOptions}
                onMouseOver={handlePolygonMouseOver}
                onMouseOut={handlePolygonMouseOut}
                clickable={false}
              />
            )}

            {/* Marqueur pour l'emplacement sélectionné */}
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={createCustomMarkerIcon(selectedMarkerColor)}
              />
            )}

            {/* Marqueurs pour les résidences existantes */}
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

            {/* Info-bulle pour la résidence cliquée */}
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
                        <span className="font-medium">Quartier:</span> {r.quartier}
                      </div>
                    )}
                    {r.ville && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Ville:</span> {r.ville}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              );
            })()}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Modal de récupération de mot de passe (masqué par défaut) */}
      {showForgotPassword && (
        <ForgotPassword
          onClose={() => setShowForgotPassword(false)}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
}

/* NOUVEAU : normalisation robuste des coordonnées GeoJSON/arrays/strings
   Retourne null ou un array [{lat,lng}, ...] */
const normalizeCoordinates = (input) => {
  try {
    if (!input) return null;

    let data = input;
    if (typeof input === "string") {
      try { data = JSON.parse(input); } catch (e) { /* keep raw string */ }
    }

    // Gestion des différents formats GeoJSON
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

    // Fonction récursive pour trouver l'anneau de coordonnées
    const findRing = (d) => {
      if (!Array.isArray(d) || d.length === 0) return null;
      if (Array.isArray(d[0]) && Array.isArray(d[0][0]) && Array.isArray(d[0][0][0])) return d[0][0];
      if (Array.isArray(d[0]) && Array.isArray(d[0][0]) && typeof d[0][0][0] === "number") return d[0];
      if (Array.isArray(d[0]) && typeof d[0][0] === "number" && typeof d[0][1] === "number") return d;
      for (const el of d) {
        const candidate = findRing(el);
        if (candidate) return candidate;
      }
      return null;
    };

    const ring = findRing(data);
    if (!ring) return null;

    // Conversion en format {lat, lng}
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