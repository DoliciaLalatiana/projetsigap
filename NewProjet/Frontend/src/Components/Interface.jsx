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
  ClipboardList,
} from "lucide-react";
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow } from "@react-google-maps/api";
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";
import UserPage from "./UserPage";
import ResidencePage from "./ResidencePage";
import PendingResidences from "./PendingResidences";

// Polygon du fonkotany Andaboly - AGRANDI
const ANDABOLY_POLYGON = [
  { lat: -23.3440, lng: 43.6630 },
  { lat: -23.3445, lng: 43.6690 },
  { lat: -23.3455, lng: 43.6740 },
  { lat: -23.3475, lng: 43.6775 },
  { lat: -23.3505, lng: 43.6780 },
  { lat: -23.3535, lng: 43.6770 },
  { lat: -23.3555, lng: 43.6740 },
  { lat: -23.3565, lng: 43.6700 },
  { lat: -23.3568, lng: 43.6650 },
  { lat: -23.3555, lng: 43.6610 },
  { lat: -23.3535, lng: 43.6590 },
  { lat: -23.3505, lng: 43.6585 },
  { lat: -23.3475, lng: 43.6590 },
  { lat: -23.3450, lng: 43.6605 },
  { lat: -23.3440, lng: 43.6630 },
];

// Centre du polygon Andaboly (calculé automatiquement)
const ANDABOLY_CENTER = {
  lat: ANDABOLY_POLYGON.reduce((sum, point) => sum + point.lat, 0) / ANDABOLY_POLYGON.length,
  lng: ANDABOLY_POLYGON.reduce((sum, point) => sum + point.lng, 0) / ANDABOLY_POLYGON.length
};

// Fonction utilitaire pour vérifier si un point est dans le polygon (robuste)
const isPointInPolygon = (point, polygon) => {
  // Correct orientation: x = longitude, y = latitude
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

// base API pour Vite
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
  
  // Si la notification est d'aujourd'hui
  if (notificationDay.getTime() === today.getTime()) {
    // Retourne seulement l'heure et les minutes
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

export default function Interface({ user }) {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // NOUVEAUX ÉTATS : pour gérer l'interaction avec le polygon
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);

  // NOUVEL ÉTAT : pour gérer le statut du message (normal ou erreur)
  const [messageStatus, setMessageStatus] = useState("normal"); // "normal" ou "error"

  // NOUVEL ÉTAT : pour gérer l'erreur de validation du formulaire
  const [formError, setFormError] = useState("");

  // état pour la page utilisateur (modal changement mot de passe)
  const [userPageState, setUserPageState] = useState({ showPasswordModal: false });

  // ÉTATS POUR LES NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // NOUVEL ÉTAT : pour gérer la résidence cliquée
  const [clickedResidenceId, setClickedResidenceId] = useState(null);

  // NOUVEL ÉTAT : pour sauvegarder le niveau de zoom avant la sélection d'adresse
  const [previousZoom, setPreviousZoom] = useState(null);
  const [previousCenter, setPreviousCenter] = useState(null);

  // NOUVEL ÉTAT : pour sauvegarder le niveau de zoom avant le clic sur une résidence
  const [zoomBeforeResidenceClick, setZoomBeforeResidenceClick] = useState(null);
  const [centerBeforeResidenceClick, setCenterBeforeResidenceClick] = useState(null);

  // NOUVEL ÉTAT : pour indiquer si la carte doit être zoomée sur la zone limite
  const [shouldZoomToPolygon, setShouldZoomToPolygon] = useState(true);

  // NOUVEL ÉTAT : pour contrôler si les autres boutons sont désactivés
  const [isModalOpen, setIsModalOpen] = useState(false);

  // handlers pour le polygon (évite ReferenceError)
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

  // NOUVELLE FONCTION : Pour centrer et zoomer sur la zone limite
  const handleFocusOnPolygon = () => {
    if (!map) return;
    const polygon = (fokontanyPolygon && fokontanyPolygon.length) ? fokontanyPolygon : ANDABOLY_POLYGON;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach(p => bounds.extend(p));
      // marge 10% (réduit pour zoomer plus près)
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = (ne.lat() - sw.lat()) * 0.1;
      const lngDiff = (ne.lng() - sw.lng()) * 0.1;
      bounds.extend({ lat: ne.lat() + latDiff, lng: ne.lng() + lngDiff });
      bounds.extend({ lat: sw.lat() - latDiff, lng: sw.lng() - lngDiff });
      map.fitBounds(bounds);
      // add listener only if google.maps.event is available
      if (window.google && window.google.maps && window.google.maps.event) {
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', function () {
          try { 
            // Zoom maximum pour remplir la page (augmenté à 18)
            if (map.getZoom() > 18) map.setZoom(18); 
          } catch (e) { }
          try { window.google.maps.event.removeListener(listener); } catch (e) { }
        });
      }
    } catch (e) {
      console.warn('handleFocusOnPolygon error', e);
    }
  };

  // NOUVELLE FONCTION : Calculer les limites du polygon pour zoom initial
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

  // NOUVELLE FONCTION : Calculer le centre et le zoom optimal pour le polygon
  const calculateOptimalView = (polygon) => {
    if (!polygon || polygon.length === 0) {
      return { center: ANDABOLY_CENTER, zoom: 15 };
    }
    
    // Calculer le centre du polygon
    const center = {
      lat: polygon.reduce((sum, point) => sum + point.lat, 0) / polygon.length,
      lng: polygon.reduce((sum, point) => sum + point.lng, 0) / polygon.length
    };
    
    // Calculer la taille du polygon pour déterminer le zoom
    const bounds = calculatePolygonBounds(polygon);
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = Math.abs(ne.lat() - sw.lat());
      const lngDiff = Math.abs(ne.lng() - sw.lng());
      
      // Déterminer le zoom basé sur la taille du polygon
      let zoom = 18; // Zoom élevé par défaut pour remplir la page
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff > 0.05) zoom = 16;
      if (maxDiff > 0.1) zoom = 15;
      if (maxDiff > 0.2) zoom = 14;
      if (maxDiff > 0.3) zoom = 13;
      
      return { center, zoom };
    }
    
    return { center, zoom: 17 };
  };

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const addAddressRef = useRef(null);

  // --- NOUVEAU : fokontany récupéré depuis le backend (optionnel) ---
  const [fokontanyPolygon, setFokontanyPolygon] = useState(null);
  const [fokontanyCenter, setFokontanyCenter] = useState(null);
  const [fokontanyName, setFokontanyName] = useState(null);
  const [residences, setResidences] = useState([]);

  // Charger les notifications (UNIQUEMENT CELLES NON LUES)
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrer uniquement les notifications non lues
        const unreadNotifications = data.filter(notification => !notification.is_read);
        setNotifications(unreadNotifications);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Compter les notifications non lues
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
    }
  };

  // Marquer comme lu et SUPPRIMER de l'affichage
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour l'état local - SUPPRIMER la notification marquée comme lue
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  // NOUVELLE FONCTION : Effacer automatiquement les notifications de résidences approuvées
  const checkAndClearApprovedResidenceNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les résidences approuvées
      const residencesResponse = await fetch(`${API_BASE}/api/residences?status=approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (residencesResponse.ok) {
        const approvedResidences = await residencesResponse.json();
        
        // Pour chaque résidence approuvée, marquer comme lu ses notifications associées
        for (const residence of approvedResidences) {
          // Marquer toutes les notifications liées à cette résidence comme lues
          const notificationsResponse = await fetch(`${API_BASE}/api/notifications/residence/${residence.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (notificationsResponse.ok) {
            const residenceNotifications = await notificationsResponse.json();
            for (const notification of residenceNotifications) {
              await markAsRead(notification.id);
            }
          }
        }
        
        // Recharger les notifications après suppression
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Erreur suppression notifications approuvées:', error);
    }
  };

  // NOUVELLE FONCTION : Gérer le clic sur une notification
  const handleNotificationClick = async (notification) => {
    // Marquer comme lu
    await markAsRead(notification.id);
    
    // Fermer le panneau de notifications
    setShowNotifications(false);
    
    // Rediriger vers la page des demandes si l'utilisateur est secrétaire
    if (currentUser?.role === 'secretaire') {
      setShowPendingResidences(true);
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
      
      // Vérifier et effacer les notifications pour les résidences approuvées
      setTimeout(() => {
        checkAndClearApprovedResidenceNotifications();
      }, 1000);
    }
  };

  const fetchResidences = async () => {
    try {
      let url = `${API_BASE}/api/residences`;
      if (fokontanyName) url += `?fokontany=${encodeURIComponent(fokontanyName)}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const list = await resp.json();
      setResidences(Array.isArray(list) ? list : []);
    } catch (e) { console.warn('[RES] fetchResidences error', e); }
  };

  // Charger au montage
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    fetchResidences();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications(); // Rafraîchir aussi la liste des notifications
      // Vérifier périodiquement les résidences approuvées pour effacer les notifications
      checkAndClearApprovedResidenceNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // call fetchResidences on mount and when fokontanyName changes
  useEffect(() => {
    fetchResidences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fokontanyName]);

  // NOUVEL EFFET : Vérifier les notifications à effacer quand on ouvre la page des demandes
  useEffect(() => {
    if (showPendingResidences && currentUser?.role === 'secretaire') {
      // Vérifier et effacer les notifications pour les résidences approuvées
      setTimeout(() => {
        checkAndClearApprovedResidenceNotifications();
      }, 500);
    }
  }, [showPendingResidences]);

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
      showUserPage,
      showPendingResidences
    };
    localStorage.setItem('interfaceState', JSON.stringify(state));
  }, [showResidence, showStatistique, showUserPage, showPendingResidences]);

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
        setHasSelectedAddress(false);
        setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddAddress]);

  // Vérifier si une page est ouverte
  const isAnyPageOpen = showResidence || showStatistique || showUserPage || showPendingResidences;

  // NOUVEL EFFET : Fermer la sélection d'adresse quand une page s'ouvre
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
      setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
    }
  }, [isAnyPageOpen, isSelectingLocation]);

  // Fonction pour gérer la recherche selon la page active
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (showResidence) {
      console.log("Recherche dans les résidences:", searchQuery);
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return;
    } else {
      console.log("Recherche sur la carte:", searchQuery);
    }
  };

  // Obtenir le placeholder selon la page active
  const getSearchPlaceholder = () => {
    if (showResidence) {
      return "Rechercher une résidence, une adresse ou un propriétaire...";
    } else if (showStatistique || showUserPage || showPendingResidences) {
      return "Recherche désactivée";
    } else {
      return "Rechercher un lieu, une adresse ou une personne...";
    }
  };

  // Vérifier si la recherche est désactivée
  const isSearchDisabled = showStatistique || showUserPage || showPendingResidences;

  const handleLogout = () => {
    localStorage.removeItem('interfaceState');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // FONCTION MODIFIÉE : Gérer le clic sur SIGAP/Retour
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
    }
  };

  // Fonction pour afficher/masquer la page utilisateur
  const handleUserIconClick = () => {
    if (isModalOpen) return; // MODIFICATION : Empêcher l'ouverture si modal est ouverte
    const newShowUserPage = !showUserPage;
    setShowUserPage(newShowUserPage);
    if (newShowUserPage) {
      setUserPageState({ showPasswordModal: false });
    }
    if (newShowUserPage) {
      setShowResidence(false);
      setShowStatistique(false);
      setShowPendingResidences(false);
    }
  };

  // Fonction pour afficher/masquer la page résidence
  const handleResidenceClick = () => {
    if (isModalOpen) return; // MODIFICATION : Empêcher l'ouverture si modal est ouverte
    const newShowResidence = !showResidence;
    setShowResidence(newShowResidence);
    if (newShowResidence) {
      setShowStatistique(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
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
      setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
    }
  };

  // Fonction pour afficher/masquer la page statistique
  const handleStatistiqueClick = () => {
    if (isModalOpen) return; // MODIFICATION : Empêcher l'ouverture si modal est ouverte
    const newShowStatistique = !showStatistique;
    setShowStatistique(newShowStatistique);
    if (newShowStatistique) {
      setShowResidence(false);
      setShowUserPage(false);
      setShowPendingResidences(false);
      setUserPageState({ showPasswordModal: false });
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
      setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
    }
  };

  // NOUVELLE FONCTION : Pour afficher/masquer les demandes en attente
  const handlePendingResidencesClick = () => {
    if (isModalOpen) return; // MODIFICATION : Empêcher l'ouverture si modal est ouverte
    const newShowPending = !showPendingResidences;
    setShowPendingResidences(newShowPending);
    
    if (newShowPending) {
      setShowResidence(false);
      setShowStatistique(false);
      setShowUserPage(false);
      setUserPageState({ showPasswordModal: false });
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
      setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
    }
  };

  // MODIFICATION : Fonction pour démarrer la sélection d'adresse sur la carte
  const handleAddAddressClick = () => {
    if (isAnyPageOpen || isSelectingLocation || isModalOpen) return;

    // MODIFICATION : Indiquer qu'un modal est ouvert
    setIsModalOpen(true);

    // Sauvegarder l'état actuel de la carte AVANT de zoomer
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

    setTimeout(() => {
      handleFocusOnPolygon();
    }, 100);
  };

  // FONCTION CORRIGÉE : Utiliser l'API Google Geocoding pour obtenir l'adresse exacte
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

      // Extraire les composants d'adresse
      let quartier = "";
      let ville = "";
      let fullAddress = result.formatted_address;

      // Analyser les composants d'adresse
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

      // Si aucun quartier n'est trouvé, utiliser le nom de la localité ou une valeur par défaut
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
      
      // Fallback en cas d'erreur
      const fallbackAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      setAddressDetails({
        lot: "",
        quartier: "Quartier inconnu",
        ville: "Ville inconnue"
      });
    }
  };

  // MODIFICATION COMPLÈTE : Fonction pour gérer le clic sur la carte
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
        
        // Appeler la fonction de géocoding pour obtenir l'adresse exacte
        await getAddressFromCoordinates(lat, lng);
        
        setMessageStatus("normal");
        setIsSelectingLocation(false);
        setIsModalOpen(true); // MODIFICATION : Maintenir modal ouvert
        setTimeout(() => setShowAddAddress(true), 100);
      } else {
        setMessageStatus("error");
      }
    }
  };

  // NOUVELLE FONCTION : Pour retourner à la sélection d'adresse
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
    setIsModalOpen(true); // MODIFICATION : Maintenir modal ouvert

    setTimeout(() => {
      handleFocusOnPolygon();
    }, 100);
  };

  // Fonction pour fermer complètement
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
    setIsModalOpen(false); // MODIFICATION : Réactiver les boutons
  };

  // FONCTION UNIQUE handleConfirmAddress : Pour confirmer l'ajout de l'adresse
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
        // Si approbation requise
        setHasSelectedAddress(true);
        setShowAddAddress(false);
        setIsSelectingLocation(false);
        setFormError("");

        // MODIFICATION : Réactiver les boutons après confirmation
        setIsModalOpen(false);

        // Afficher message de succès avec attente d'approbation
        alert('Résidence soumise pour approbation. Vous recevrez une notification quand elle sera approuvée.');
      } else {
        // Création directe
        setResidences(prev => [result, ...(prev || [])]);
        setHasSelectedAddress(true);
        setShowAddAddress(false);
        setIsSelectingLocation(false);
        setFormError("");
        
        // MODIFICATION : Réactiver les boutons après confirmation
        setIsModalOpen(false);
      }

      console.log('[RES] created', result);
    } catch (err) {
      console.warn('[RES] handleConfirmAddress error', err);
      setFormError('Erreur réseau');
    }
  };

  // MODIFICATION : Fonction pour annuler la sélection - RESTAURER LE ZOOM PRÉCÉDENT
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

    // MODIFICATION : Réactiver les boutons après annulation
    setIsModalOpen(false);

    // RESTAURER LE ZOOM ET LE CENTRE PRÉCÉDENTS
    if (map && previousZoom && previousCenter) {
      setTimeout(() => {
        map.setCenter(previousCenter);
        map.setZoom(previousZoom);
      }, 100);
    }
  };

  // FONCTION MODIFIÉE : Pour mettre à jour seulement le champ Lot
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

  // Fonction pour fermer la page des demandes
  const handleClosePendingResidences = () => {
    setShowPendingResidences(false);
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

  // MODIFICATION : Fonction pour centrer la carte
  const handleCenterMap = () => {
    if (map) {
      handleFocusOnPolygon();
      setShouldZoomToPolygon(true);
    }
  };

  // Fonction pour changer le type de carte
  const handleMapTypeChange = () => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  };

  // NOUVELLE FONCTION : Pour gérer le clic sur une résidence (marqueur)
  const handleResidenceMarkerClick = (residenceId) => {
    // Sauvegarder l'état actuel de la carte AVANT d'afficher la fenêtre modale
    if (map) {
      setZoomBeforeResidenceClick(map.getZoom());
      setCenterBeforeResidenceClick(map.getCenter());
    }
    
    setClickedResidenceId(residenceId);
  };

  // NOUVELLE FONCTION : Pour fermer la fenêtre modale des détails de résidence
  const handleCloseResidenceInfo = () => {
    setClickedResidenceId(null);
    
    // RESTAURER LE ZOOM ET LE CENTRE PRÉCÉDENTS
    if (map && zoomBeforeResidenceClick && centerBeforeResidenceClick) {
      setTimeout(() => {
        map.setCenter(centerBeforeResidenceClick);
        map.setZoom(zoomBeforeResidenceClick);
      }, 100);
    }
  };

  // NOUVEAU : charger fokontany depuis l'utilisateur (login) ou via API si absent
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, map]);

  // appelé quand l'instance GoogleMap est prête
  const onMapLoad = (mapInstance) => {
    try {
      setMap(mapInstance);
      setMapLoaded(true);
      console.log('[MAP] onMapLoad: map ready', !!mapInstance, 'fokontanyCenter=', fokontanyCenter);
      
      // Zoomer sur la zone limite dès que la carte est chargée
      setTimeout(() => {
        handleFocusOnPolygon();
      }, 500);
      
    } catch (err) {
      console.warn('[MAP] onMapLoad error', err);
    }
  };

  // NOUVELLE FONCTION : Gérer les changements de zoom manuels
  const handleZoomChanged = () => {
    if (map) {
      const currentZoom = map.getZoom();
      // Si l'utilisateur zoom out (dézoome), désactiver le zoom automatique
      if (currentZoom < 16) {
        setShouldZoomToPolygon(false);
      }
    }
  };

  // NOUVELLE FONCTION : Gérer les déplacements manuels de la carte
  const handleDragEnd = () => {
    // Quand l'utilisateur déplace la carte manuellement, désactiver le zoom automatique
    setShouldZoomToPolygon(false);
  };

  // options de la carte Google Maps
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
      zoom: view.zoom, // Utiliser le zoom calculé
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false,
    };
  };

  // options du polygon
  const polygonOptions = {
    strokeColor: "#1E90FF",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#1E90FF",
    fillOpacity: 0.35,
    clickable: false,
    zIndex: 1
  };

  // gestion des événements de la carte
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
      // Appeler la fonction pour gérer le changement de zoom
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
      // Quand l'utilisateur déplace la carte manuellement, désactiver le zoom automatique
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

  // Effet pour recentrer sur la zone limite quand l'utilisateur clique sur le bouton "Localiser"
  useEffect(() => {
    if (shouldZoomToPolygon && map && mapLoaded) {
      handleFocusOnPolygon();
    }
  }, [shouldZoomToPolygon, map, mapLoaded]);

  // Hauteur de la carte - toujours pleine hauteur
  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  const activePolygon = (fokontanyPolygon && fokontanyPolygon.length > 0) ? fokontanyPolygon : ANDABOLY_POLYGON;

  // safe marker icon
  let markerIcon;
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#10B981"/>
        <circle cx="16" cy="10" r="3" fill="white"/>
      </svg>
    `;
    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    if (typeof window.google.maps.Size === 'function') {
      markerIcon = { url, scaledSize: new window.google.maps.Size(32, 32) };
    } else {
      markerIcon = { url, scaledSize: { width: 32, height: 32 } };
    }
  } else {
    markerIcon = undefined;
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      {/* === OVERLAY GRIS/FLOU QUAND UNE PAGE EST OUVERTE === */}
      {isAnyPageOpen && (
        <div className="absolute inset-0 z-20 bg-gray-500/30 backdrop-blur-sm transition-all duration-300 ease-in-out"></div>
      )}

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
                disabled={isSearchDisabled || isModalOpen} // MODIFICATION : Désactiver si modal ouvert
                className={`w-full p-1 bg-transparent outline-none text-sm ${
                  isSearchDisabled || isModalOpen ? 'text-gray-400' : 'text-gray-700'
                } placeholder-gray-600`}
              />
            </form>
          </div>
        </div>
      </div>

      {/* === BOUTONS DROITS (AJOUTER, NOTIFICATIONS, PROFIL) === */}
      <div className="absolute top-6 right-4 z-20">
        <div className="bg-white/30 hover:bg-white/50 rounded-2xl shadow-lg border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300">
          <div className="flex items-center justify-end px-4 py-1 space-x-4">

            {/* Bouton Ajouter - MODIFICATION IMPORTANTE */}
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

            {/* Notification - MODIFICATION : Toujours accessible mais désactivée si modal */}
            <button
              onClick={() => {
                if (!isModalOpen) {
                  setShowNotifications(!showNotifications);
                  fetchNotifications();
                }
              }}
              disabled={isModalOpen}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                isModalOpen
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
              }`}
              title={isModalOpen ? "Fermez la modal pour accéder aux notifications" : "Notifications"}
            >
              <Bell size={20} className={`${isModalOpen ? 'text-gray-400' : 'text-gray-600 hover:text-gray-800 transition-all duration-300'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Utilisateur */}
            <button
              onClick={handleUserIconClick}
              disabled={isModalOpen}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isModalOpen
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white/30 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm border border-gray-200/60 hover:border-gray-300/80'
              }`}
              title={isModalOpen ? "Fermez la modal pour accéder au profil" : "Profil"}
            >
              <User size={20} className={`${isModalOpen ? 'text-gray-400' : 'text-gray-600 hover:text-gray-800 transition-all duration-300'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Panneau de notifications - MODIFICATION AVEC NOUVELLE STRUCTURE */}
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
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer bg-blue-50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                    {/* Le nom de l'agent à la place de la date en haut à droite */}
                    <span className="text-xs text-gray-500 font-medium">
                      {notification.sender_name || 'Système'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    {/* La date en bas à gauche */}
                    <span className="text-xs text-gray-400">
                      {formatNotificationDate(notification.created_at)}
                    </span>
                    {/* Point jaune pour marque d'attente, bleu pour notification normale */}
                    <span className={`w-2 h-2 rounded-full ${
                      notification.type === 'pending' || notification.title.includes('attente') || notification.message.includes('attente') 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                    }`}></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === OVERLAY DE SÉLECTION D'ADRESSE === */}
      {/* MODIFICATION : Le message disparaît quand une page est ouverte */}
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

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              ref={addAddressRef}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 w-full max-w-md"
            >
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

          {/* Bouton Demandes (seulement pour les secrétaires) */}
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
      {showResidence && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <ResidencePage
            onBack={handleCloseResidence}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {showStatistique && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <Statistique onBack={handleCloseStatistique} />
        </div>
      )}

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

      {showPendingResidences && (
        <div className="absolute top-22 left-65 z-30 bg-white/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 h-[85vh] w-316">
          <PendingResidences 
            onBack={handleClosePendingResidences} 
            onResidenceApproved={checkAndClearApprovedResidenceNotifications}
          />
        </div>
      )}

      {/* === CONTROLES ZOOM ET COUCHE === */}
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
          title="Voir la zone limite"
        >
          <LocateFixed size={20} className="text-blue-600 hover:text-blue-700 transition-all duration-300" />
        </button>
      </div>

      <div className="fixed right-6 bottom-8 z-10">
        <button
          onClick={handleMapTypeChange}
          className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:shadow-xl border border-gray-200/60 hover:border-gray-300/80"
          title={mapType === "satellite" ? "Passer en vue plan" : "Passer en vue satellite"}
        >
          <Layers size={22} className="text-gray-700 hover:text-gray-800 transition-all duration-300" />
        </button>
      </div>

      {/* === GOOGLE MAPS === */}
      <div className="absolute inset-0 z-0">
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
                icon={markerIcon}
              />
            )}

            {residences.map((r) => (
              (r.lat != null && r.lng != null) ? (
                <Marker
                  key={`res-${r.id}`}
                  position={{ lat: Number(r.lat), lng: Number(r.lng) }}
                  icon={markerIcon}
                  onClick={() => handleResidenceMarkerClick(r.id)}
                  title={r.lot || `Lot ${r.id}`}
                />
              ) : null
            ))}

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
                    disableAutoPan: true, // EMPÊCHE LE RECENTRAGE AUTOMATIQUE
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

    // FeatureCollection -> take first feature with geometry
    if (data && data.type === "FeatureCollection" && Array.isArray(data.features)) {
      const f = data.features.find(ft => ft && ft.geometry && ft.geometry.coordinates);
      if (f) data = f.geometry.coordinates;
    }

    // Feature -> geometry.coordinates
    if (data && data.type === "Feature" && data.geometry && data.geometry.coordinates) {
      data = data.geometry.coordinates;
    }

    // object with geometry property
    if (data && data.geometry && data.geometry.coordinates) {
      data = data.geometry.coordinates;
    }

    // find a ring of [lng,lat] pairs inside nested arrays
    const findRing = (d) => {
      if (!Array.isArray(d) || d.length === 0) return null;
      // MultiPolygon: [ [ [ [lng,lat], ... ] ] ] -> d[0][0]
      if (Array.isArray(d[0]) && Array.isArray(d[0][0]) && Array.isArray(d[0][0][0])) return d[0][0];
      // Polygon or MultiRing: [ [ [lng,lat], ... ] ] or [ [lng,lat], ... ] -> prefer first ring
      if (Array.isArray(d[0]) && Array.isArray(d[0][0]) && typeof d[0][0][0] === "number") return d[0];
      // Direct ring: [ [lng,lat], ... ]
      if (Array.isArray(d[0]) && typeof d[0][0] === "number" && typeof d[0][1] === "number") return d;
      // recurse
      for (const el of d) {
        const candidate = findRing(el);
        if (candidate) return candidate;
      }
      return null;
    };

    const ring = findRing(data);
    if (!ring) return null;

    // convert to [{lat,lng}, ...]
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