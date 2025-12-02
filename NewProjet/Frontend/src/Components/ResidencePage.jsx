import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Users,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Edit,
  Trash2,
  Map,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Maximize2,
  Minimize2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function ResidencePage({ onBack, searchQuery, onSearchChange, onViewOnMap }) {
  // residences list - initialiser avec un tableau vide au lieu des mocks
  const [resList, setResList] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResidents, setEditedResidents] = useState([]);
  const [origResidentsBeforeEdit, setOrigResidentsBeforeEdit] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedResidence, setExpandedResidence] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [residencesPerPage] = useState(4);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newResident, setNewResident] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    cin: "",
    telephone: "",
    sexe: "homme",
  });

  // ÉTAT POUR GÉRER LA DATE DE NAISSANCE DE MANIÈRE SIMPLE
  const [dateInput, setDateInput] = useState("");

  // NOUVEAUX ÉTATS : Pour stocker les résidents de toutes les résidences
  const [allResidents, setAllResidents] = useState([]);

  // ÉTATS POUR LA RECHERCHE DES RÉSIDENTS
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [residentSearchResults, setResidentSearchResults] = useState([]);
  const [showResidentSearch, setShowResidentSearch] = useState(false);

  // ÉTAT POUR L'ANIMATION DE SLIDE
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('left');

  // NOUVEAUX ÉTATS POUR LA GESTION DES PHOTOS
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);

  // Références pour les inputs du formulaire (navigation avec Entrée)
  const nomInputRef = useRef(null);
  const prenomInputRef = useRef(null);
  const dateNaissanceInputRef = useRef(null);
  const cinInputRef = useRef(null);
  const telephoneInputRef = useRef(null);
  const sexeSelectRef = useRef(null);

  // LOAD residences from backend on mount - version corrigée
  useEffect(() => {
    let mounted = true;
    const fetchResidences = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/residences`);
        if (!resp.ok) {
          console.warn("Erreur lors du chargement des résidences");
          setResList([]); // Assurer que la liste est vide en cas d'erreur
          return;
        }
        const rows = await resp.json();

        // Normaliser les données - s'assurer que photos est toujours un tableau
        const normalized = (rows || []).map((r) => ({
          id: r.id,
          name: r.name || r.lot || `Lot ${r.id}`,
          photos: Array.isArray(r.photos)
            ? r.photos
                .filter((photo) => photo && photo.trim() !== "")
                .map((photo) => {
                  // Si c'est un objet avec une propriété url
                  if (typeof photo === "object" && photo.url) {
                    return photo.url.startsWith("http")
                      ? photo.url
                      : `${API_BASE}${photo.url.startsWith("/") ? "" : "/"}${
                          photo.url
                        }`;
                  }
                  // Si c'est une chaîne simple
                  if (typeof photo === "string") {
                    return photo.startsWith("http")
                      ? photo
                      : `${API_BASE}${
                          photo.startsWith("/") ? "" : "/"
                        }${photo}`;
                  }
                  return photo;
                })
            : [],
          lot: r.lot || "",
          quartier: r.quartier || "",
          ville: r.ville || "",
          proprietaire: r.proprietaire || "",
          totalResidents: r.total_residents || 0,
          hommes: r.hommes || 0,
          femmes: r.femmes || 0,
          adresse: r.adresse || `${r.quartier || ""} ${r.ville || ""}`.trim(),
          telephone: r.telephone || "",
          email: r.email || "",
          latitude: r.lat || r.latitude || null,
          longitude: r.lng || r.longitude || null,
          status: r.status || "active",
          dateCreation: r.created_at || r.dateCreation || null,
          residents: [], // loaded on demand
        }));

        if (mounted) {
          setResList(normalized);
        }
      } catch (e) {
        console.warn("fetchResidences error", e);
        // En cas d'erreur, on garde une liste vide au lieu des mocks
        if (mounted) {
          setResList([]);
        }
      }
    };
    fetchResidences();
    return () => {
      mounted = false;
    };
  }, []);

  // NOUVEL EFFET : Charger tous les résidents pour calculer les statistiques
  useEffect(() => {
    const fetchAllResidents = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/persons`, {
          headers: getHeaders()
        });
        if (resp.ok) {
          const persons = await resp.json();
          setAllResidents(persons || []);
        }
      } catch (error) {
        console.warn("Erreur chargement tous les résidents:", error);
        setAllResidents([]);
      }
    };

    fetchAllResidents();
  }, []);

  // EFFET : Recherche automatique des résidents
  useEffect(() => {
    if (residentSearchQuery.trim()) {
      const timer = setTimeout(() => {
        handleResidentSearch(residentSearchQuery);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setShowResidentSearch(false);
      setResidentSearchResults([]);
    }
  }, [residentSearchQuery]);

  // EFFET : Fermer les résultats en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResidentSearch && !event.target.closest('.search-container')) {
        setShowResidentSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResidentSearch]);

  // EFFET : Focus sur le premier champ quand on entre en mode édition
  useEffect(() => {
    if (isEditMode && nomInputRef.current) {
      setTimeout(() => {
        nomInputRef.current.focus();
      }, 100);
    }
  }, [isEditMode]);

  // NOUVELLE FONCTION : Calculer les statistiques basées sur la liste des résidents
  const calculateStatistics = () => {
    // Total résidences
    const totalResidences = resList.length;

    // Filtrer les résidents par résidence (si vous avez une relation résidence_id dans les personnes)
    const residentsInResidences = allResidents.filter(person => 
      resList.some(residence => residence.id === person.residence_id)
    );

    // Total résidents
    const totalResidents = residentsInResidences.length;

    // Compter hommes et femmes
    const totalHommes = residentsInResidences.filter(person => 
      person.genre === 'homme' || person.genre === 'Homme' || person.genre === 'male'
    ).length;

    const totalFemmes = residentsInResidences.filter(person => 
      person.genre === 'femme' || person.genre === 'Femme' || person.genre === 'female'
    ).length;

    return {
      totalResidences,
      totalResidents,
      totalHommes,
      totalFemmes
    };
  };

  // Récupérer les statistiques calculées
  const statistics = calculateStatistics();

  // helper headers with possible token
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  // ref for hidden file input (image chooser)
  const photoInputRef = useRef(null);

  // Residence info edit state (lot/quartier/ville)
  const [isEditingResidenceInfo, setIsEditingResidenceInfo] = useState(false);
  const [resInfoDraft, setResInfoDraft] = useState({
    lot: "",
    quartier: "",
    ville: "",
  });

  // FONCTION : Recherche des résidents
  const handleResidentSearch = async (query) => {
    if (!query.trim()) {
      setResidentSearchResults([]);
      setShowResidentSearch(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/api/persons/search?q=${encodeURIComponent(query)}`, 
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (response.ok) {
        const results = await response.json();
        setResidentSearchResults(results);
        setShowResidentSearch(true);
      } else {
        setResidentSearchResults([]);
        setShowResidentSearch(true);
      }
    } catch (error) {
      console.error('Erreur recherche résidents:', error);
      setResidentSearchResults([]);
      setShowResidentSearch(true);
    }
  };

  // FONCTION : Afficher les détails d'un résident recherché
  const handleViewResidentDetails = (resident) => {
    // Trouver la résidence du résident
    const residence = resList.find(r => r.id === resident.residence_id);
    if (residence) {
      handleViewDetails(residence);
      setShowResidentSearch(false);
      setResidentSearchQuery("");
      onSearchChange(""); // Vider aussi la recherche principale
    }
  };

  const startEditResidenceInfo = () => {
    if (!selectedResidence) return;
    setResInfoDraft({
      lot: selectedResidence.lot || "",
      quartier: selectedResidence.quartier || "",
      ville: selectedResidence.ville || "",
    });
    setIsEditingResidenceInfo(true);
  };

  const cancelEditResidenceInfo = () => {
    setIsEditingResidenceInfo(false);
    setResInfoDraft({ lot: "", quartier: "", ville: "" });
  };

  const saveResidenceInfo = async () => {
    if (!selectedResidence) return;
    try {
      const resp = await fetch(
        `${API_BASE}/api/residences/${selectedResidence.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            lot: resInfoDraft.lot,
            quartier: resInfoDraft.quartier,
            ville: resInfoDraft.ville,
          }),
        }
      );
      if (!resp.ok) throw new Error("Erreur update residence");
      const updated = await resp.json();
      // update UI: selectedResidence and resList
      setSelectedResidence((prev) => ({ ...prev, ...updated }));
      setResList((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
      setIsEditingResidenceInfo(false);
    } catch (err) {
      console.warn("saveResidenceInfo error", err);
      alert("Erreur lors de la mise à jour de la résidence");
    }
  };

  const handleImageClick = () => {
    if (!selectedResidence) return;
    const photos = selectedResidence.photos || [];
    if (!photos.length) {
      // open file chooser to add images when none exist
      if (photoInputRef.current) photoInputRef.current.click();
      return;
    }
    // Toggle l'expansion de la photo
    setIsPhotoExpanded(!isPhotoExpanded);
  };

  // Fonction pour charger les photos d'une résidence
  const loadResidencePhotos = async (residenceId) => {
    try {
      const resp = await fetch(
        `${API_BASE}/api/residences/${residenceId}/photos`
      );
      if (resp.ok) {
        const photos = await resp.json();
        return photos.map((photo) => {
          if (typeof photo === "object" && photo.url) {
            return photo.url.startsWith("http")
              ? photo.url
              : `${API_BASE}${photo.url.startsWith("/") ? "" : "/"}${
                  photo.url
                }`;
          }
          return photo;
        });
      }
    } catch (err) {
      console.warn("Erreur chargement photos:", err);
    }
    return [];
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedResidence) return;

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      const resp = await fetch(
        `${API_BASE}/api/residences/${selectedResidence.id}/photos`,
        {
          method: "POST",
          headers: localStorage.getItem("token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            : {},
          body: formData,
        }
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.warn("upload photos response not ok", resp.status, errorText);
        throw new Error("Erreur upload photos");
      }

      const result = await resp.json();

      // CORRECTION : Mettre à jour les photos avec les URLs complètes
      if (result.photos && result.photos.length > 0) {
        const newPhotoUrls = result.photos.map((photo) => {
          // Si c'est déjà une URL complète, l'utiliser directement
          if (photo.url.startsWith("http")) {
            return photo.url;
          }
          // Sinon, construire l'URL complète
          return `${API_BASE}${photo.url.startsWith("/") ? "" : "/"}${
            photo.url
          }`;
        });

        setSelectedResidence((prev) => {
          const updated = {
            ...prev,
            photos: [...(prev.photos || []), ...newPhotoUrls],
          };
          setResList((list) =>
            list.map((r) =>
              r.id === updated.id ? { ...r, photos: updated.photos } : r
            )
          );
          return updated;
        });
      }
    } catch (err) {
      console.warn("handlePhotoSelect upload error", err);
      alert("Erreur lors de l'upload des photos");
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoIndex) => {
    if (!selectedResidence || !selectedResidence.photos) return;

    const photos = selectedResidence.photos;
    const photoUrl = photos[photoIndex];

    try {
      // Récupérer la liste des photos depuis le backend pour trouver l'ID
      const photosResp = await fetch(
        `${API_BASE}/api/residences/${selectedResidence.id}/photos`
      );
      if (photosResp.ok) {
        const photosList = await photosResp.json();

        // Trouver la photo correspondante par son URL
        const photoToDelete = photosList.find((p) => {
          const fullUrl =
            typeof p === "object" && p.url
              ? p.url.startsWith("http")
                ? p.url
                : `${API_BASE}${p.url.startsWith("/") ? "" : "/"}${p.url}`
              : p;
          return fullUrl === photoUrl;
        });

        if (photoToDelete) {
          const deleteResp = await fetch(
            `${API_BASE}/api/residences/${selectedResidence.id}/photos/${photoToDelete.id}`,
            {
              method: "DELETE",
              headers: getHeaders(),
            }
          );

          if (!deleteResp.ok) throw new Error("Erreur suppression photo");
        }
      }

      // Mettre à jour l'interface
      const updatedPhotos = photos.filter((_, index) => index !== photoIndex);
      setSelectedResidence((prev) => ({
        ...prev,
        photos: updatedPhotos,
      }));

      setResList((prev) =>
        prev.map((r) =>
          r.id === selectedResidence.id ? { ...r, photos: updatedPhotos } : r
        )
      );

      // Ajuster l'index de la photo courante si nécessaire
      if (currentPhotoIndex >= updatedPhotos.length) {
        setCurrentPhotoIndex(Math.max(0, updatedPhotos.length - 1));
      }
    } catch (err) {
      console.warn("Erreur suppression photo:", err);
      alert("Erreur lors de la suppression de la photo");
    }
  };

  const handleViewDetails = async (residence) => {
    try {
      // Charger les photos
      const photos = await loadResidencePhotos(residence.id);

      // Charger les résidents
      const base = resList.find((r) => r.id === residence.id) || residence;
      const resp = await fetch(
        `${API_BASE}/api/persons?residence_id=${residence.id}`,
        { headers: getHeaders() }
      );
      const persons = resp.ok ? await resp.json() : base.residents || [];
      // ensure persons array shape matches UI (nomComplet, dateNaissance, cin, genre, telephone, id)
      const normalizedPersons = (persons || []).map((p) => ({
        id: p.id,
        nomComplet: p.nom_complet || p.nomComplet || "",
        dateNaissance: p.date_naissance || p.dateNaissance || "",
        cin: p.cin || p.cin || "",
        genre: p.genre || p.genre || "homme",
        telephone: p.telephone || p.telephone || "",
        relation_type: p.relation_type || "",
        is_proprietaire: p.is_proprietaire || false,
      }));

      setSelectedResidence({
        ...base,
        photos: photos, // Utiliser les photos chargées
        residents: normalizedPersons,
      });
      
      // Réinitialiser l'état de la photo
      setIsPhotoExpanded(false);
      setIsFullScreenPhoto(false);
      
      // Animation de slide
      setSlideDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setShowModal(true);
        setIsAnimating(false);
      }, 300);
    } catch (e) {
      console.warn("load persons error", e);
      setSelectedResidence(residence);
      // Animation de slide même en cas d'erreur
      setSlideDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setShowModal(true);
        setIsAnimating(false);
      }, 300);
    }
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
  };

  const handleCloseModal = () => {
    // Animation de slide pour fermer
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setShowModal(false);
      setSelectedResidence(null);
      setCurrentPhotoIndex(0);
      setIsEditMode(false);
      setEditedResidents([]);
      setIsPhotoExpanded(false);
      setIsFullScreenPhoto(false);
      setNewResident({
        nom: "",
        prenom: "",
        dateNaissance: "",
        cin: "",
        telephone: "",
        sexe: "homme",
      });
      setDateInput("");
      setIsAnimating(false);
    }, 300);
  };

  const handleBackFromEdit = () => {
    setIsEditMode(false);
    setEditedResidents([]);
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (
      selectedResidence &&
      selectedResidence.photos &&
      selectedResidence.photos.length > 0
    ) {
      setCurrentPhotoIndex((prev) =>
        prev === selectedResidence.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (
      selectedResidence &&
      selectedResidence.photos &&
      selectedResidence.photos.length > 0
    ) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? selectedResidence.photos.length - 1 : prev - 1
      );
    }
  };

  const handleToggleFullScreen = (e) => {
    e.stopPropagation();
    setIsFullScreenPhoto(!isFullScreenPhoto);
  };

  // FONCTION CORRIGÉE : Pour rechercher et afficher sur la carte
  const handleSearchAndLocate = async (query) => {
    if (!query.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/api/residences/search?q=${encodeURIComponent(query)}`, 
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (response.ok) {
        const results = await response.json();
        if (results.length > 0) {
          // Prendre le premier résultat
          const residence = results[0];
          
          // Fermer le modal si ouvert
          setShowModal(false);
          setSelectedResidence(null);
          
          // Utiliser la fonction pour afficher sur la carte
          if (onViewOnMap) {
            onViewOnMap(residence);
          }
          
          // Optionnel : vider le champ de recherche
          onSearchChange("");
        } else {
          alert("Aucune résidence trouvée pour cette recherche");
        }
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      alert("Erreur lors de la recherche");
    }
  };

  // FONCTION MODIFIÉE : Gestionnaire de soumission de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearchAndLocate(searchQuery);
    }
  };

  // FONCTION CORRIGÉE : Pour afficher sur la carte sans recharger la page
  const handleViewOnMap = (residence) => {
    // Vérifier que la résidence a des coordonnées
    if (!residence.latitude || !residence.longitude) {
      alert("Cette résidence n'a pas de coordonnées géographiques");
      return;
    }

    console.log('[RESIDENCE] Affichage sur carte:', residence.name, {
      lat: residence.latitude,
      lng: residence.longitude
    });

    // Utiliser la fonction passée en prop depuis Interface
    if (onViewOnMap) {
      onViewOnMap(residence);
    } else {
      // Fallback: stocker dans localStorage et recharger (méthode originale)
      localStorage.setItem(
        "selectedResidence",
        JSON.stringify({
          latitude: residence.latitude,
          longitude: residence.longitude,
          name: residence.name,
          adresse: residence.adresse,
        })
      );
      window.location.reload();
    }
  };

  // FONCTION SIMPLIFIÉE POUR LA DATE
  const handleDateInput = (e) => {
    const value = e.target.value;
    
    // Garder seulement les chiffres
    const numbers = value.replace(/\D/g, '');
    
    // Limiter à 8 chiffres (jjmmAAAA)
    let formatted = numbers.substring(0, 8);
    
    // Ajouter les séparateurs automatiquement
    if (formatted.length > 4) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4) + '/' + formatted.substring(4);
    } else if (formatted.length > 2) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
    }
    
    // Mettre à jour l'état
    setDateInput(formatted);
    setNewResident(prev => ({
      ...prev,
      dateNaissance: formatted
    }));
  };

  // FONCTION POUR GÉRER LE FOCUS SUR LE CHAMP DATE
  const handleDateFocus = (e) => {
    // Si vide, initialiser
    if (!dateInput) {
      setDateInput("");
      setNewResident(prev => ({
        ...prev,
        dateNaissance: ""
      }));
    }
  };

  // FONCTION POUR VÉRIFIER SI MAJEUR (SIMPLIFIÉE)
  const estMajeurFromInput = () => {
    const dateStr = dateInput;
    if (!dateStr || dateStr.length !== 10) {
      return false; // Date incomplète
    }
    
    try {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      
      const [day, month, year] = parts;
      
      // Vérifier que tous les champs sont remplis
      if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
        return false;
      }
      
      const birthDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(birthDate.getTime())) return false;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= 18;
    } catch (error) {
      return false;
    }
  };

  // FONCTION POUR CONVERTIR EN ISO
  const frenchDateToISO = (frenchDate) => {
    if (!frenchDate || frenchDate.length !== 10) {
      return null; // Date incomplète
    }
    
    try {
      const parts = frenchDate.split('/');
      if (parts.length !== 3) return null;
      
      const [day, month, year] = parts;
      
      // Vérifier que c'est une date valide
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) return null;
      
      // Formater en YYYY-MM-DD
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (error) {
      return null;
    }
  };

  // Save edited residents: sync to backend (updates, deletes)
  const handleSaveEdit = async () => {
    if (!selectedResidence) return;
    try {
      // CORRECTION : Pour l'affichage malgache, on met NOM puis PRÉNOM
      // Nettoyer et formater le nom et prénom
      const nom = (newResident.nom || '').trim().toUpperCase();
      const prenom = (newResident.prenom || '').trim();
      
      // Format malgache : NOM Prénom
      const nomComplet = `${nom} ${prenom}`.trim();
      
      // Vérifier les champs requis
      if (!nom || !prenom || !dateInput) {
        alert("Nom, Prénom et Date de naissance sont requis");
        return;
      }

      // Vérifier que la date est complète
      if (!dateInput || dateInput.length !== 10) {
        alert("Veuillez compléter la date de naissance (format jj/mm/aaaa)");
        return;
      }

      // Convertir la date au format ISO
      const dateISO = frenchDateToISO(dateInput);
      if (!dateISO) {
        alert("Format de date invalide. Utilisez jj/mm/aaaa avec une date valide");
        return;
      }

      // Vérifier que le téléphone a exactement 10 chiffres s'il est rempli
      if (newResident.telephone && newResident.telephone.length !== 10) {
        alert("Le numéro de téléphone doit contenir exactement 10 chiffres");
        return;
      }

      // Calculer l'âge pour vérifier si majeur
      const birthDate = new Date(dateISO);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const payload = {
        residence_id: selectedResidence.id,
        nom_complet: nomComplet,
        date_naissance: dateISO,
        cin: age < 18 ? null : (newResident.cin || null), // Pas de CIN pour mineur
        genre: newResident.sexe || "homme",
        telephone: newResident.telephone || null,
      };

      const resp = await fetch(`${API_BASE}/api/persons`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        console.warn("create person failed", resp.status, body);
        throw new Error("Erreur création personne");
      }

      const created = await resp.json();
      
      // Mettre à jour la liste des résidents
      setSelectedResidence((prev) => ({
        ...prev,
        residents: [...(prev?.residents || []), {
          id: created.id,
          nomComplet: created.nom_complet || nomComplet,
          dateNaissance: created.date_naissance || dateInput,
          cin: created.cin || newResident.cin || "",
          genre: created.genre || newResident.sexe || "homme",
          telephone: created.telephone || newResident.telephone || "",
        }],
      }));

      // Mettre à jour la liste globale des résidents
      setAllResidents(prev => [...prev, created]);
      
      // Réinitialiser le formulaire et retourner au mode détails
      setNewResident({
        nom: "",
        prenom: "",
        dateNaissance: "",
        cin: "",
        telephone: "",
        sexe: "homme",
      });
      setDateInput("");
      setIsEditMode(false);
    } catch (err) {
      console.warn("handleSaveEdit error", err);
      alert("Erreur lors de la sauvegarde du résident");
    }
  };

  // Fonction pour valider que le texte ne contient que des lettres
  const validateLettersOnly = (value) => {
    return /^[A-Za-zÀ-ÿ\s'-]*$/.test(value);
  };

  // Fonction pour valider et formater le numéro de téléphone
  const validatePhoneNumber = (value) => {
    // Accepter seulement les chiffres
    const numbersOnly = value.replace(/\D/g, '');
    
    // Limiter à 10 chiffres maximum
    if (numbersOnly.length > 10) {
      return numbersOnly.slice(0, 10);
    }
    
    return numbersOnly;
  };

  const handleNewResidentChange = (field, value) => {
    // Validation selon le type de champ
    let validatedValue = value;
    
    if (field === "nom" || field === "prenom") {
      // Seulement des lettres pour nom et prénom
      if (!validateLettersOnly(value)) {
        return; // Ne pas mettre à jour si ce ne sont pas que des lettres
      }
    } else if (field === "cin") {
      // Seulement des chiffres pour CIN
      if (!/^[0-9]*$/.test(value)) {
        return;
      }
      if (value.length > 12) {
        validatedValue = value.slice(0, 12); // Limiter à 12 chiffres
      }
    } else if (field === "telephone") {
      // Validation spéciale pour téléphone
      validatedValue = validatePhoneNumber(value);
    } else if (field === "dateNaissance") {
      // Géré par handleDateInput
      return;
    }

    setNewResident((prev) => ({
      ...prev,
      [field]: validatedValue,
    }));
  };

  // NOUVELLE FONCTION : Navigation avec la touche Entrée
  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      switch (nextField) {
        case 'prenom':
          prenomInputRef.current?.focus();
          break;
        case 'dateNaissance':
          dateNaissanceInputRef.current?.focus();
          break;
        case 'cin':
          // Ne focus le CIN que si la personne est majeure
          if (estMajeurFromInput() && cinInputRef.current) {
            cinInputRef.current.focus();
          } else {
            telephoneInputRef.current?.focus();
          }
          break;
        case 'telephone':
          telephoneInputRef.current?.focus();
          break;
        case 'sexe':
          sexeSelectRef.current?.focus();
          break;
        case 'save':
          handleSaveEdit();
          break;
        default:
          break;
      }
    }
  };

  const handleEditResidents = () => {
    setIsEditMode(true);
    // Réinitialiser le formulaire
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
  };

  // Filtrage et tri des résidences avec la searchQuery passée en props
  const filteredResidences = resList
    .filter((residence) => {
      const matchesSearch =
        residence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.proprietaire
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || residence.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "residents":
          return b.totalResidents - a.totalResidents;
        case "date":
          return new Date(b.dateCreation) - new Date(a.dateCreation);
        default:
          return 0;
      }
    });

  // Calcul de la pagination
  const indexOfLastResidence = currentPage * residencesPerPage;
  const indexOfFirstResidence = indexOfLastResidence - residencesPerPage;
  const currentResidences = filteredResidences.slice(
    indexOfFirstResidence,
    indexOfLastResidence
  );
  const totalPages = Math.ceil(filteredResidences.length / residencesPerPage);

  // Fonctions de pagination
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fonction utilitaire pour calculer l'âge
  const calculerAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Fonction utilitaire pour vérifier si majeur
  const estMajeur = (dateNaissance) => {
    return calculerAge(dateNaissance) >= 18;
  };

  // Fonction pour formater la date en français
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour formater le genre
  const formatGenre = (genre) => {
    return genre === "homme" ? "Masculin" : "Féminin";
  };

  // Fonction pour formater l'affichage du nom selon la logique malgache
  const formatNomMalgache = (nomComplet) => {
    if (!nomComplet) return "";
    const parts = nomComplet.split(' ');
    if (parts.length > 1) {
      // Première partie (le nom) en majuscules, le reste (prénom) tel quel
      return `${parts[0].toUpperCase()} ${parts.slice(1).join(' ')}`;
    }
    return nomComplet.toUpperCase();
  };

  return (
    <div className="h-full flex">
      {/* Section principale des résidences - ANIMATION MODIFIÉE */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showModal 
            ? isAnimating 
              ? slideDirection === 'left' 
                ? 'w-0 opacity-0' 
                : 'w-full opacity-100'
              : 'w-0 opacity-0'
            : 'w-full opacity-100'
        }`}
      >
        <div className="h-full flex flex-col mt-3">
          {/* Header SIMPLIFIÉ - SUPPRESSION DE LA BARRE DE RECHERCHE INTERNE */}
          <div className="flex items-center justify-between p-4 border-gray-200/60 bg-transparent">
            <h1 className="font-bold text-3xl text-gray-800 bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl border border-gray-200/60">
              Résidences
            </h1>
            
            {/* SUPPRIMÉ : La barre de recherche interne */}
          </div>

          {/* Statistiques MODIFIÉES : Utilisation des statistiques calculées */}
          <div className="border-gray-200/60 bg-transparent mt-2">
            <div className="grid grid-cols-4 gap-4 mb-3 ml-8 mr-3">
              <div className="bg-white backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {statistics.totalResidences}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Résidences</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <span>▲ 12%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {statistics.totalResidents}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Résidents</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <span>▲ 8%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {statistics.totalHommes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Hommes</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-blue-600">
                  <span>
                    {statistics.totalResidents > 0 
                      ? Math.round((statistics.totalHommes / statistics.totalResidents) * 100)
                      : 0}%
                  </span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {statistics.totalFemmes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Femmes</div>
                  </div>
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-pink-600">
                  <span>
                    {statistics.totalResidents > 0 
                      ? Math.round((statistics.totalFemmes / statistics.totalResidents) * 100)
                      : 0}%
                  </span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTE DES RÉSIDENCES */}
          <div className="flex-1 overflow-y-auto mt-5">
            <div className="mr-3 ml-8 border rounded-2xl border-gray-200/80 ">
              {currentResidences.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-black text-lg mb-2">
                    Aucune résidence trouvée
                  </h3>
                  <p className="text-black text-sm">
                    Aucune résidence ne correspond à votre recherche "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/30 rounded-2xl">
                  {currentResidences.map((residence) => (
                    <div
                      key={residence.id}
                      className={`transition-all duration-200 hover:bg-gray-50 ${
                        selectedResidence &&
                        selectedResidence.id === residence.id &&
                        showModal
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white/30 backdrop-blur-sm"
                      } first:rounded-t-2xl last:rounded-b-2xl`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                              {residence.photos && residence.photos.length > 0 ? (
                                <img
                                  src={residence.photos[0]}
                                  alt={residence.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.warn(
                                      "Image failed to load in list:",
                                      residence.photos[0]
                                    );
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <Home size={16} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold text-sm truncate ${
                                  selectedResidence &&
                                  selectedResidence.id === residence.id &&
                                  showModal
                                    ? "text-blue-800"
                                    : "text-gray-800"
                                }`}
                              >
                                {residence.name}
                              </h3>
                              <div className="flex items-center space-x-1 mt-1">
                                <MapPin
                                  size={12}
                                  className={
                                    selectedResidence &&
                                    selectedResidence.id === residence.id &&
                                    showModal
                                      ? "text-blue-600"
                                      : "text-gray-600"
                                  }
                                />
                                <span
                                  className={`text-xs truncate ${
                                    selectedResidence &&
                                    selectedResidence.id === residence.id &&
                                    showModal
                                      ? "text-blue-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {residence.adresse}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-2">
                            <button
                              onClick={() => handleViewDetails(residence)}
                              className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${
                                selectedResidence &&
                                selectedResidence.id === residence.id &&
                                showModal
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                              title="Détails"
                            >
                              <Eye size={14} />
                              <span className="text-xs">Details</span>
                            </button>
                            <button
                              onClick={() => handleViewOnMap(residence)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                              title="Carte"
                            >
                              <Map size={14} />
                              <span className="text-xs">Carte</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination simplifiée avec seulement les flèches */}
          {filteredResidences.length > residencesPerPage && (
            <div className="border-t border-gray-200/60 bg-white/30 backdrop-blur-sm py-3 px-6 shadow-inner">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-sm font-medium text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails/édition - PREND TOUTE LA PLACE AVEC SLIDE */}
      {showModal && selectedResidence && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isAnimating
              ? slideDirection === 'left'
                ? 'w-full opacity-100'
                : 'w-0 opacity-0'
              : 'w-full opacity-100'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* En-tête du modal avec bouton retour */}
            <div className="flex justify-between items-center p-4 border-gray-200/60">
              <button
                onClick={isEditMode ? handleBackFromEdit : handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ChevronLeft size={20} className="text-gray-600" />
                <span className="text-gray-600">Retour</span>
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? "Ajouter un résident" : "Détails de la résidence"}
              </h2>
              <div className="w-10"></div> {/* Pour l'équilibrage */}
            </div>

            {/* Contenu du modal */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              {!isEditMode ? (
                /* MODE DÉTAILS */
                <>
                  {/* Photo et informations de localisation */}
                  <div className="flex space-x-6 mb-6">
                    {/* Photo - PETITE PAR DÉFAUT, S'AGRANDIT AU CLIC */}
                    <div className="w-1/3">
                      <div 
                        className={`relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer transition-all duration-300 ease-in-out ${
                          isPhotoExpanded 
                            ? isFullScreenPhoto
                              ? 'fixed inset-0 z-50 m-0 bg-black'
                              : 'h-96'
                            : 'h-48'
                        }`}
                        onClick={handleImageClick}
                      >
                        {selectedResidence.photos && selectedResidence.photos.length > 0 ? (
                          <>
                            <img
                              src={selectedResidence.photos[currentPhotoIndex]}
                              alt={`${selectedResidence.name} - Photo ${currentPhotoIndex + 1}`}
                              className={`w-full h-full object-contain ${
                                isFullScreenPhoto ? 'object-contain' : 'object-cover'
                              }`}
                              onError={(e) => {
                                console.warn(
                                  "Image failed to load in carousel:",
                                  selectedResidence.photos[currentPhotoIndex]
                                );
                                e.target.style.display = "none";
                              }}
                            />

                            {/* Bouton pour modifier/ajouter des photos */}
                            <div className="absolute top-2 right-2 flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  photoInputRef.current?.click();
                                }}
                                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                title="Modifier les photos"
                              >
                                <Camera size={16} />
                              </button>
                              {isPhotoExpanded && selectedResidence.photos.length > 0 && (
                                <button
                                  onClick={handleToggleFullScreen}
                                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                  title={isFullScreenPhoto ? "Réduire" : "Plein écran"}
                                >
                                  {isFullScreenPhoto ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                              )}
                            </div>

                            {/* Contrôles du carousel - TOUJOURS VISIBLES QUAND EXPANDED */}
                            {isPhotoExpanded && selectedResidence.photos.length > 1 && (
                              <>
                                <button
                                  onClick={handlePrevPhoto}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                >
                                  <ChevronLeft size={20} />
                                </button>
                                <button
                                  onClick={handleNextPhoto}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                >
                                  <ChevronRight size={20} />
                                </button>

                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                  {selectedResidence.photos.map((_, index) => (
                                    <div
                                      key={index}
                                      className={`w-2 h-2 rounded-full ${
                                        index === currentPhotoIndex
                                          ? "bg-white"
                                          : "bg-white/50"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {/* Indicateur de photo miniature en bas à droite quand expanded */}
                            {isPhotoExpanded && selectedResidence.photos.length > 1 && (
                              <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                                {currentPhotoIndex + 1} / {selectedResidence.photos.length}
                              </div>
                            )}
                          </>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              photoInputRef.current?.click();
                            }}
                          >
                            <div className="text-center">
                              <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-500">
                                Cliquer pour ajouter une photo
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Instructions */}
                      {!isPhotoExpanded && selectedResidence.photos && selectedResidence.photos.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          Cliquez sur la photo pour l'agrandir
                          {selectedResidence.photos.length > 1 && " et voir le carousel"}
                        </div>
                      )}
                    </div>

                    {/* Informations de localisation */}
                    <div className="flex-1">
                      <div className="h-40 flex flex-col justify-center space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 text-gray-600">Lot :</div>
                          <div className="text-gray-800 font-medium">{selectedResidence.lot || "-"}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 text-gray-600">Quartier :</div>
                          <div className="text-gray-800 font-medium">{selectedResidence.quartier || "-"}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 text-gray-600">Ville :</div>
                          <div className="text-gray-800 font-medium">{selectedResidence.ville || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des résidents AVEC SCROLL - TABLEAU COMPLET */}
                  {selectedResidence.residents && selectedResidence.residents.length > 0 ? (
                    <div className="flex-1 overflow-hidden flex flex-col mb-4">
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 overflow-hidden flex flex-col flex-1">
                        
                        {/* Conteneur scrollable POUR LE TABLEAU SEULEMENT */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto">
                          <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                                  Nom Complet
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                  Date de Naissance
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                                  CIN
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w=[130px]">
                                  Téléphone
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                  Sexe
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                              {selectedResidence.residents.map((resident) => (
                                <tr key={resident.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-800">
                                    {formatNomMalgache(resident.nomComplet)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {resident.dateNaissance
                                      ? formatDate(resident.dateNaissance)
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                    {resident.dateNaissance && estMajeur(resident.dateNaissance)
                                      ? (resident.cin || "-")
                                      : "Mineur"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                    {resident.telephone || "-"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {formatGenre(resident.genre)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Message quand aucun résident */
                    <div className="flex-1 flex items-center justify-center mb-4">
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 p-8 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <div className="text-gray-500 mb-4">Aucun résident enregistré</div>
                      </div>
                    </div>
                  )}

                  {/* BOUTON AJOUTER */}
                  <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200">
                    <button
                      onClick={handleEditResidents}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter des résidents</span>
                    </button>
                  </div>
                </>
              ) : (
                /* MODE ÉDITION - AJOUTER DES RÉSIDENTS */
                <>
                  {/* Formulaire pour ajouter un résident */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouveau résident</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={nomInputRef}
                          type="text"
                          value={newResident.nom}
                          onChange={(e) => handleNewResidentChange("nom", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'prenom')}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base text-left"
                          placeholder=""
                          maxLength={50}
                        />
                      </div>
                      
                      {/* Prénom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={prenomInputRef}
                          type="text"
                          value={newResident.prenom}
                          onChange={(e) => handleNewResidentChange("prenom", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'dateNaissance')}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base text-left"
                          placeholder=""
                          maxLength={50}
                        />
                      </div>
                      
                      {/* Date de naissance - VERSION SIMPLIFIÉE */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de naissance <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={dateNaissanceInputRef}
                          type="text"
                          value={dateInput}
                          onChange={handleDateInput}
                          onFocus={handleDateFocus}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (estMajeurFromInput() && cinInputRef.current) {
                                cinInputRef.current.focus();
                              } else {
                                telephoneInputRef.current?.focus();
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono text-left"
                          placeholder="jj/mm/aaaa"
                          maxLength={10}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Format: jj/mm/aaaa
                        </div>
                      </div>
                      
                      {/* CIN - CONDITIONNEL */}
                      {estMajeurFromInput() && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CIN
                          </label>
                          <input
                            ref={cinInputRef}
                            type="text"
                            value={newResident.cin}
                            onChange={(e) => handleNewResidentChange("cin", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'telephone')}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono text-left"
                            placeholder=""
                            maxLength={12}
                          />
                        </div>
                      )}
                      
                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone
                        </label>
                        <input
                          ref={telephoneInputRef}
                          type="text"
                          value={newResident.telephone}
                          onChange={(e) => handleNewResidentChange("telephone", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'sexe')}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono text-left"
                          placeholder=""
                          maxLength={10}
                        />
                      </div>
                      
                      {/* Sexe */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sexe
                        </label>
                        <select
                          ref={sexeSelectRef}
                          value={newResident.sexe}
                          onChange={(e) => handleNewResidentChange("sexe", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'save')}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base text-left"
                        >
                          <option value="homme">Masculin</option>
                          <option value="femme">Féminin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Boutons de sauvegarde/annulation */}
                  <div className="flex-shrink-0 flex space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input caché pour sélectionner des photos */}
      <input
        type="file"
        ref={photoInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handlePhotoSelect}
      />
    </div>
  );
}