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
import { GoogleMap, LoadScript, Marker, Polygon } from "@react-google-maps/api";
import Statistique from "./Statistique";
import ForgotPassword from "./ForgotPassword";
import UserPage from "./UserPage";
import ResidencePage from "./ResidencePage";

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

export default function Interface({ user })  {
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
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  
  // NOUVEAUX ÉTATS : pour gérer l'interaction avec le polygon
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);
  
  // NOUVEL ÉTAT : pour gérer le statut du message (normal ou erreur)
  const [messageStatus, setMessageStatus] = useState("normal"); // "normal" ou "error"

  // NOUVEL ÉTAT : pour gérer l'erreur de validation du formulaire
  const [formError, setFormError] = useState("");

  // état pour la page utilisateur (modal changement mot de passe)
  const [userPageState, setUserPageState] = useState({ showPasswordModal: false });

  // handlers pour le polygon (évite ReferenceError)
  const handlePolygonMouseOver = (e) => {
    try {
      setIsPolygonHovered(true);
      // éventuellement afficher infobulle / changer style
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
      // marge 20%
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = (ne.lat() - sw.lat()) * 0.2;
      const lngDiff = (ne.lng() - sw.lng()) * 0.2;
      bounds.extend({ lat: ne.lat() + latDiff, lng: ne.lng() + lngDiff });
      bounds.extend({ lat: sw.lat() - latDiff, lng: sw.lng() - lngDiff });
      map.fitBounds(bounds);
      // add listener only if google.maps.event is available
      if (window.google && window.google.maps && window.google.maps.event) {
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', function() {
          try { if (map.getZoom() > 16) map.setZoom(16); } catch(e) {}
          try { window.google.maps.event.removeListener(listener); } catch(e) {}
        });
      }
    } catch (e) {
      console.warn('handleFocusOnPolygon error', e);
    }
  };

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const addAddressRef = useRef(null);

  // --- NOUVEAU : fokontany récupéré depuis le backend (optionnel) ---
  const [fokontanyPolygon, setFokontanyPolygon] = useState(null);
  const [fokontanyCenter, setFokontanyCenter] = useState(null);

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
        // f.coordinates may be JSON string or already parsed structure
        let coordsRaw = f.coordinates ?? f.geometry ?? null;
        const poly = normalizeCoordinates(coordsRaw);
        console.log('[FOK] loadMyFokontany: parsed polygon length', poly ? poly.length : 0);
        setFokontanyPolygon(poly);
        if (f.centre_lat && f.centre_lng) {
          setFokontanyCenter({ lat: parseFloat(f.centre_lat), lng: parseFloat(f.centre_lng) });
          console.log('[FOK] loadMyFokontany: using centre_lat/centre_lng', f.centre_lat, f.centre_lng);
        } else if (poly && poly.length) {
          const lat = poly.reduce((s,p) => s + p.lat, 0) / poly.length;
          const lng = poly.reduce((s,p) => s + p.lng, 0) / poly.length;
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
        setHasSelectedAddress(false);
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
      setHasSelectedAddress(false);
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
      setHasSelectedAddress(false);
      setAddressDetails({
        lot: "",
        quartier: "",
        ville: ""
      });
    }
  };

  // MODIFICATION : Fonction pour démarrer la sélection d'adresse sur la carte
  const handleAddAddressClick = () => {
    if (isAnyPageOpen) return; // Ne rien faire si une page est ouverte
    
    setIsSelectingLocation(true);
    setSelectedLocation(null);
    setShowAddAddress(false);
    setHasSelectedAddress(false);
    setAddressDetails({
      lot: "",
      quartier: "",
      ville: ""
    });
    
    // Réinitialiser le statut du message
    setMessageStatus("normal");
    
    // NOUVEAU : Zoom automatique sur la zone limite quand on clique sur Ajouter
    setTimeout(() => {
      handleFocusOnPolygon();
    }, 100);
  };

  // MODIFICATION COMPLÈTE : Fonction pour gérer le clic sur la carte
  const handleMapClick = (event) => {
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
        getAddressFromCoordinates(lat, lng);
        setMessageStatus("normal");
        setIsSelectingLocation(false);
        setTimeout(() => setShowAddAddress(true), 100);
      } else {
        setMessageStatus("error");
      }
    }
  };

  // FONCTION MODIFIÉE : Pour obtenir l'adresse à partir des coordonnées
  const getAddressFromCoordinates = (lat, lng) => {
    // Déterminer le quartier et la ville en fonction des coordonnées
    let quartier = "Andaboly";
    let ville = "Antananarivo";
    
    // Logique pour déterminer le quartier en fonction des coordonnées
    if (lat > -23.348 && lng < 43.670) {
      quartier = "Andaboly Nord";
    } else if (lat < -23.352 && lng > 43.672) {
      quartier = "Andaboly Sud";
    } else if (lng > 43.673) {
      quartier = "Andaboly Est";
    } else if (lng < 43.667) {
      quartier = "Andaboly Ouest";
    }
    
    const addressData = [
      { 
        address: `${quartier}, ${ville}`,
        lot: "",
        quartier: quartier,
        ville: ville
      }
    ];
    
    const addressInfo = addressData[0];
    setSelectedAddress(addressInfo.address);
    setAddressDetails({
      lot: "",
      quartier: addressInfo.quartier,
      ville: addressInfo.ville
    });
  };

  // NOUVELLE FONCTION : Pour retourner à la sélection d'adresse (utilisée par X et Changer d'adresse)
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
    
    // Réinitialiser le statut du message
    setMessageStatus("normal");
    
    // Recentrer sur la zone limite
    setTimeout(() => {
      handleFocusOnPolygon();
    }, 100);
  };

  // Fonction pour fermer complètement (retour au bouton Ajouter)
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
    
    // Réinitialiser le statut du message
    setMessageStatus("normal");
  };

  // FONCTION MODIFIÉE : Pour confirmer l'ajout de l'adresse
  const handleConfirmAddress = () => {
    if (!addressDetails.lot) {
      // Afficher l'erreur de validation
      setFormError("Veuillez remplir le numéro de lot");
      return;
    }

    if (selectedAddress && addressDetails.lot) {
      // Logique pour ajouter l'adresse à la base de données
      console.log("Ajout de l'adresse:", {
        address: selectedAddress,
        details: addressDetails,
        location: selectedLocation
      });
      setHasSelectedAddress(true);
      setShowAddAddress(false);
      setIsSelectingLocation(false);
      setFormError(""); // Réinitialiser l'erreur
      // Ne pas reset selectedAddress et selectedLocation pour pouvoir les utiliser avec LocateFixed
    }
  };

  // Fonction pour annuler la sélection
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
    
    // Réinitialiser le statut du message
    setMessageStatus("normal");
  };

  // FONCTION MODIFIÉE : Pour mettre à jour seulement le champ Lot
  const handleAddressDetailsChange = (field, value) => {
    if (field === 'lot') {
      setAddressDetails(prev => ({
        ...prev,
        [field]: value
      }));
      // Effacer l'erreur quand l'utilisateur commence à taper
      if (formError) {
        setFormError("");
      }
    }
    // Les champs quartier et ville ne sont pas modifiables
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

  // MODIFICATION : Fonction pour centrer la carte
  const handleCenterMap = () => {
    if (map && selectedLocation) {
      // Utiliser directement les coordonnées déjà sélectionnées
      map.setCenter(selectedLocation);
      map.setZoom(16); // Zoom sur le quartier
    } else if (map) {
      // NOUVEAU : Centrer sur la zone limite avec zoom adapté
      handleFocusOnPolygon();
    }
  };

  // Fonction pour changer le type de carte
  const handleMapTypeChange = () => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
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

        // si le user contient déjà l'objet fokontany (login), l'utiliser
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
                if (map && window.google && window.google.maps) {
                  const bounds = new window.google.maps.LatLngBounds();
                  poly.forEach(p => bounds.extend(p));
                  map.fitBounds(bounds);
                }
                return;
              }
            }
            if (f.centre_lat && f.centre_lng) {
              setFokontanyCenter({ lat: +f.centre_lat, lng: +f.centre_lng });
              console.log('[FOK] initFokontanyFromUser: set center from user.fokontany centre_lat/centre_lng');
              if (map) map.panTo({ lat: +f.centre_lat, lng: +f.centre_lng });
              return;
            }
          } catch (e) { /* ignore parse errors and fallback to API */ console.warn('[FOK] initFokontanyFromUser user fokontany parse error', e); }
        }

        // fallback : demander /api/fokontany/me si token existant
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
                if (map && window.google && window.google.maps) {
                  const bounds = new window.google.maps.LatLngBounds();
                  poly.forEach(p => bounds.extend(p));
                  map.fitBounds(bounds);
                }
                return;
              }
            }
            if (fok.centre_lat && fok.centre_lng) {
              setFokontanyCenter({ lat: +fok.centre_lat, lng: +fok.centre_lng });
              console.log('[FOK] initFokontanyFromUser: set center from fallback centre_lat/centre_lng');
              if (map) map.panTo({ lat: +fok.centre_lat, lng: +fok.centre_lng });
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
      // recentrer si on a déjà le centre du fokontany
      if (fokontanyCenter && mapInstance && window.google && window.google.maps) {
        try {
          mapInstance.panTo(fokontanyCenter);
          mapInstance.setZoom(15);
        } catch (e) {
          console.warn('[MAP] onMapLoad panTo error', e);
        }
      }
    } catch (err) {
      console.warn('[MAP] onMapLoad error', err);
    }
  };

  // options de la carte Google Maps
  const getMapOptions = () => {
    return {
      // Utiliser mapTypeId pour demander "hybrid" quand mapType === 'satellite'
      // "hybrid" = imagery satellite + labels (noms de route, POI...)
      mapTypeId: mapType === "satellite" ? "hybrid" : "roadmap",
      // minimal/no custom styles to preserve labels and POI text
      styles: [],
      gestureHandling: "greedy",
      disableDoubleClickZoom: true,
      draggable: true,
      scrollwheel: true,
      pinchZoom: true,
      center: fokontanyCenter || ANDABOLY_CENTER,
      zoom: fokontanyCenter ? 14 : 14,
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

  // états des événements de la carte
  const [mapEvents, setMapEvents] = useState({
    click: null,
    dblclick: null,
    mousemove: null,
    zoom_changed: null,
    dragend: null
  });

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
    };
    const handleDragEnd = () => {
      const center = map.getCenter();
      console.log('[MAP] Drag ended. New center:', center.lat(), center.lng());
    };

    // attacher les événements
    map.addListener("click", handleClick);
    map.addListener("dblclick", handleDblClick);
    map.addListener("mousemove", handleMouseMove);
    map.addListener("zoom_changed", handleZoomChanged);
    map.addListener("dragend", handleDragEnd);

    // nettoyer les événements à la désactivation de la carte
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

  // Hauteur de la carte - toujours pleine hauteur
  const containerStyle = {
    width: "100%",
    height: "100vh",
  };

  const activePolygon = (fokontanyPolygon && fokontanyPolygon.length > 0) ? fokontanyPolygon : ANDABOLY_POLYGON;

  // safe marker icon: only create Size if google.maps.Size exists, otherwise use plain object
  let markerIcon;
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    // Deprecation guidance for visibility in console
    if (window.google.maps.Marker) {
      console.warn('[GMaps] google.maps.Marker exists — consider migrating to google.maps.marker.AdvancedMarkerElement (see https://developers.google.com/maps/documentation/javascript/advanced-markers/migration)');
    }
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C11.58 2 8 5.58 8 10C8 17 16 30 16 30C16 30 24 17 24 10C24 5.58 20.42 2 16 2Z" fill="#10B981"/>
        <circle cx="16" cy="10" r="3" fill="white"/>
      </svg>
    `;
    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    // prefer real Size if available
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

      {/* === OVERLAY DE SÉLECTION D'ADRESSE - MODIFIÉ AVEC MESSAGE DYNAMIQUE === */}
      {isSelectingLocation && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-none">
          <div className={`rounded-2xl shadow-2xl p-4 mx-4 border relative w-full max-w-2xl ${
            messageStatus === "error" 
              ? "bg-red-50 border-red-200" 
              : "bg-white/95 backdrop-blur-sm border-orange-200"
          }`}>
            <div className="flex items-center justify-between space-x-4">
              {/* Partie gauche : Icône Navigation et texte */}
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  messageStatus === "error" ? "bg-red-500" : "bg-green-600"
                }`}>
                  <Navigation size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-base mb-1 ${
                    messageStatus === "error" ? "text-red-800" : "text-gray-800"
                  }`}>
                    {messageStatus === "error" 
                      ? "Veuillez cliquer uniquement dans la zone limite (en bleu)" 
                      : "Cliquez sur la carte pour sélectionner une adresse"
                    }
                  </p>
                  <p className={`text-sm ${
                    messageStatus === "error" ? "text-red-600" : "text-gray-600"
                  }`}>
                    <span className={`font-medium ${
                      messageStatus === "error" ? "text-red-700" : "text-blue-600"
                    }`}>
                      Zone limitée :
                    </span> {messageStatus === "error" 
                      ? "Cliquez dans la zone bleue pour ajouter une résidence" 
                      : "Veuillez cliquer uniquement dans la zone bleue"
                    }
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

      {/* === MODAL AJOUT ADRESSE - MODIFIÉ AVEC UN SEUL CHAMP MODIFIABLE === */}
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
                <h3 className="text-white font-semibold text-lg">Ajouter une résidence</h3>
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
                {/* Emplacement sélectionné */}
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

                {/* Champs de formulaire - UN SEUL CHAMP MODIFIABLE */}
                <div className="space-y-4">
                  {/* Champ Lot - SEUL CHAMP MODIFIABLE */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Numéro de lot *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.lot}
                      onChange={(e) => handleAddressDetailsChange('lot', e.target.value)}
                      placeholder="Ex: Lot 123, Lot ABC, Lot 45B"
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formError ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    {/* Message d'erreur */}
                    {formError && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <Info size={14} className="mr-1" />
                        {formError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200">
                  {/* MODIFICATION : Changer d'adresse utilise handleReturnToSelection */}
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
              showResidence ? "text-gray-800" : "text-gray-800"}`
            }>
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
          title={hasSelectedAddress ? "Aller à l'adresse sélectionnée" : "Voir la zone limite"}
        >
          <LocateFixed size={20} className={`${hasSelectedAddress ? "text-green-600" : "text-blue-600"} hover:text-blue-700 transition-all duration-300`} />
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

      {/* === GOOGLE MAPS - AVEC POLYGON ANDABOLY ET TOUS LES ÉLÉMENTS GOOGLE MAPS VISIBLES === */}
      <div className="absolute inset-0 z-0">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIza..."} >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={fokontanyCenter || ANDABOLY_CENTER}
            zoom={fokontanyCenter ? 14 : 14}
            // assurer que le mapTypeId reflète l'état (hybrid pour satellite)
            mapTypeId={mapType === "satellite" ? "hybrid" : "roadmap"}
            onLoad={onMapLoad}
            options={getMapOptions()}
            onClick={handleMapClick}
          >
            {/* === POLYGON DU FONKOTANY ANDABOLY - AGRANDI ET PLUS VISIBLE === */}
            {/* Afficher le polygon actif (fokontany assigné ou fallback) */}
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
      // MultiPolygon: [ [ [ [lng,lat], ... ] ] ] -> d[0][0][0]
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

    const out = ring.map(p => {
      if (!Array.isArray(p) || p.length < 2) return null;
      const lng = Number(p[0]);
      const lat = Number(p[1]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng };
    }).filter(Boolean);

    return out.length ? out : null;
  } catch (err) {
    console.warn('[FOK] normalizeCoordinates error', err);
    return null;
  }
};