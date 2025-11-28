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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResident, setNewResident] = useState({
    nomComplet: "",
    dateNaissance: "",
    cin: "",
    genre: "homme",
    telephone: "",
    relation_type: "",
    is_proprietaire: false,
    parent_id: null,
  });

  // NOUVEAUX ÉTATS : Pour stocker les résidents de toutes les résidences
  const [allResidents, setAllResidents] = useState([]);

  // ÉTATS POUR LA RECHERCHE DES RÉSIDENTS
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [residentSearchResults, setResidentSearchResults] = useState([]);
  const [showResidentSearch, setShowResidentSearch] = useState(false);

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
    // when photos exist do nothing (carousel controls already visible)
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
    } catch (e) {
      console.warn("load persons error", e);
      setSelectedResidence(residence);
    }
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResidence(null);
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
    setEditedResidents([]);
    setShowAddForm(false);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: "",
      relation_type: "",
      is_proprietaire: false,
      parent_id: null,
    });
  };

  const handleNextPhoto = () => {
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

  const handlePrevPhoto = () => {
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

  // Save edited residents: sync to backend (updates, deletes)
  const handleSaveEdit = async () => {
    if (!selectedResidence) return;
    try {
      const original = origResidentsBeforeEdit || [];
      const edited = editedResidents || [];

      // deleted = in original but not in edited
      const deleted = original.filter(
        (o) => !edited.some((e) => e.id === o.id)
      );

      // to update: numeric ids that still exist and differ
      const toUpdate = edited.filter(
        (e) => typeof e.id === "number" && original.some((o) => o.id === e.id)
      );

      // perform deletes
      for (const d of deleted) {
        if (typeof d.id === "number") {
          await fetch(`${API_BASE}/api/persons/${d.id}`, {
            method: "DELETE",
            headers: getHeaders(),
          });
        }
      }

      // update existing
      for (const u of toUpdate) {
        const payload = {
          nom_complet: u.nomComplet,
          date_naissance: u.dateNaissance || null,
          cin: u.cin === "Mineur" ? null : u.cin, // Ne pas sauvegarder "Mineur" en base
          genre: u.genre || "homme",
          telephone: u.telephone || null,
        };
        await fetch(`${API_BASE}/api/persons/${u.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
      }

      // reload persons list for this residence
      const resp = await fetch(
        `${API_BASE}/api/persons?residence_id=${selectedResidence.id}`,
        { headers: getHeaders() }
      );
      const persons = resp.ok ? await resp.json() : [];
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
      setSelectedResidence((prev) => ({
        ...prev,
        residents: normalizedPersons,
      }));
      setIsEditMode(false);
      setEditedResidents([]);
      setOrigResidentsBeforeEdit([]);
      setShowAddForm(false);

      // Recharger tous les résidents pour mettre à jour les statistiques
      const allPersonsResp = await fetch(`${API_BASE}/api/persons`, {
        headers: getHeaders()
      });
      if (allPersonsResp.ok) {
        const allPersons = await allPersonsResp.json();
        setAllResidents(allPersons || []);
      }
    } catch (e) {
      console.warn("handleSaveEdit error", e);
      alert("Erreur lors de la sauvegarde des résidents");
    }
  };

  // Add resident -> POST immediately to backend and append returned person to editedResidents
  const handleAddResident = async () => {
    if (!selectedResidence) return;
    if (!newResident.nomComplet || !newResident.dateNaissance) {
      alert("Nom et date de naissance requis");
      return;
    }
    try {
      const payload = {
        residence_id: selectedResidence.id,
        nom_complet: newResident.nomComplet,
        date_naissance: newResident.dateNaissance,
        cin: newResident.cin === "Mineur" ? null : newResident.cin, // Ne pas sauvegarder "Mineur"
        genre: newResident.genre || "homme",
        telephone: newResident.telephone || null,
        relation_type: newResident.relation_type || null,
        is_proprietaire: newResident.is_proprietaire || false,
        parent_id: newResident.parent_id || null,
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
      const person = {
        id: created.id,
        nomComplet: created.nom_complet || newResident.nomComplet,
        dateNaissance: created.date_naissance || newResident.dateNaissance,
        cin: created.cin || newResident.cin || "",
        genre: created.genre || newResident.genre || "homme",
        telephone: created.telephone || newResident.telephone || "",
        relation_type: created.relation_type || newResident.relation_type || "",
        is_proprietaire:
          created.is_proprietaire || newResident.is_proprietaire || false,
      };
      setEditedResidents((prev) => [...prev, person]);
      // also update selectedResidence.residents for immediate view
      setSelectedResidence((prev) => ({
        ...(prev || {}),
        residents: [...(prev?.residents || []), person],
      }));
      
      // Mettre à jour la liste globale des résidents
      setAllResidents(prev => [...prev, created]);
      
      setNewResident({
        nomComplet: "",
        dateNaissance: "",
        cin: "",
        genre: "homme",
        telephone: "",
        relation_type: "",
        is_proprietaire: false,
        parent_id: null,
      });
      setShowAddForm(false);
    } catch (err) {
      console.warn("handleAddResident error", err);
      alert("Erreur ajout personne");
    }
  };

  const handleRemoveResident = (residentId) => {
    setEditedResidents((prev) =>
      prev.filter((resident) => resident.id !== residentId)
    );
  };

  const handleResidentChange = (residentId, field, value) => {
    setEditedResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId ? { ...resident, [field]: value } : resident
      )
    );
    
    // Si la date de naissance change et que la personne devient mineure, mettre "Mineur" dans le champ CIN
    if (field === "dateNaissance" && value) {
      const age = calculerAge(value);
      if (age < 18) {
        setEditedResidents((prev) =>
          prev.map((resident) =>
            resident.id === residentId ? { ...resident, cin: "Mineur" } : resident
          )
        );
      }
    }
  };

  const handleNewResidentChange = (field, value) => {
    setNewResident((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Si la date de naissance change et que la personne devient mineure, mettre "Mineur" dans le champ CIN
    if (field === "dateNaissance" && value) {
      const age = calculerAge(value);
      if (age < 18) {
        setNewResident((prev) => ({
          ...prev,
          cin: "Mineur",
        }));
      }
    }
  };

  const handleEditResidents = () => {
    setEditedResidents([...selectedResidence.residents]);
    // keep original copy to detect deletions
    setOrigResidentsBeforeEdit([...selectedResidence.residents]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedResidents([]);
    setShowAddForm(false);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: "",
      relation_type: "",
      is_proprietaire: false,
      parent_id: null,
    });
  };

  const handleAddNewResident = () => {
    setShowAddForm(true);
  };

  const cancelAddNewResident = () => {
    setShowAddForm(false);
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: "",
      relation_type: "",
      is_proprietaire: false,
      parent_id: null,
    });
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

  // Fonction utilitaire pour formater l'affichage des résidents
  const formatResidentDisplay = (resident) => {
    const age = resident.date_naissance ? calculerAge(resident.date_naissance) : null;
    return {
      id: resident.id,
      nomComplet: resident.nom_complet || resident.nomComplet,
      dateNaissance: resident.date_naissance || resident.dateNaissance,
      cin: resident.cin || (age && age < 18 ? "Mineur" : ""),
      genre: resident.genre,
      telephone: resident.telephone,
      age: age,
      residenceId: resident.residence_id
    };
  };

  return (
    <div className="h-full flex">
      {/* Section principale des résidences */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          showModal ? "w-1/2" : "w-full"
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

      {/* Modal de détails/édition - VERSION CORRIGÉE AVEC TABLEAU COMPLET */}
      {showModal && selectedResidence && (
        <div className="w-1/2 bg-white/30 rounded-r-3xl overflow-hidden shadow-xl border-l border-gray-200/60">
          <div className="h-full flex flex-col">
            {/* En-tête du modal */}
            <div className="flex justify-between items-center p-4 border-gray-200/60">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? "Modifier les résidents" : ""}
              </h2>
              <button
                onClick={isEditMode ? handleCancelEdit : handleCloseModal}
                className="p-1 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal AVEC scroll limité à la liste des résidents */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              {!isEditMode ? (
                /* MODE DÉTAILS - STRUCTURE ORIGINALE AVEC SCROLL */
                <>
                  {/* Photo et informations de localisation */}
                  <div className="flex space-x-6 mb-6">
                    {/* Carousel de photos */}
                    <div className="w-1/2">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 h-48">
                        {selectedResidence.photos && selectedResidence.photos.length > 0 ? (
                          <>
                            <img
                              src={selectedResidence.photos[currentPhotoIndex]}
                              alt={`${selectedResidence.name} - Photo ${currentPhotoIndex + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.warn(
                                  "Image failed to load in carousel:",
                                  selectedResidence.photos[currentPhotoIndex]
                                );
                                e.target.style.display = "none";
                              }}
                            />

                            {/* Bouton pour modifier/ajouter des photos */}
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={() => photoInputRef.current?.click()}
                                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                title="Modifier les photos"
                              >
                                <Camera size={16} />
                              </button>
                            </div>

                            {/* Contrôles du carousel - SEULEMENT s'il y a plus d'une photo */}
                            {selectedResidence.photos.length > 1 && (
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
                          </>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
                            onClick={() => photoInputRef.current?.click()}
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
                    </div>

                    {/* Informations de localisation */}
                    <div className="flex-1">
                      <div className="h-40 flex flex-col justify-center space-y-4">
                        <div className="text-gray-800">
                          {selectedResidence.lot || "-"}
                        </div>
                        <div className="text-gray-800">
                          {selectedResidence.quartier || "-"}
                        </div>
                        <div className="text-gray-800">
                          {selectedResidence.ville || ""}
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
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">
                                  Téléphone
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                  Genre
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                              {selectedResidence.residents.map((resident) => (
                                <tr key={resident.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-800">
                                    {resident.nomComplet}
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
                        <div className="text-gray-500">Aucun résident enregistré</div>
                      </div>
                    </div>
                  )}

                  {/* Bouton Modifier - TOUJOURS EN BAS ET FIXE */}
                  <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200">
                    <button
                      onClick={handleEditResidents}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Modifier les résidents</span>
                    </button>
                  </div>
                </>
              ) : (
                /* MODE ÉDITION - STRUCTURE ORIGINALE AVEC SCROLL */
                <>
                  {/* En-tête avec bouton Ajouter */}
                  <div className="flex justify-end items-center mb-4 flex-shrink-0">
                    <button
                      onClick={handleAddNewResident}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* Tableau d'édition des résidents avec scroll */}
                  <div className="flex-1 overflow-hidden flex flex-col mb-4">
                    <div className="overflow-x-auto">
                      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                        <table className="w-full min-w-[1000px] border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th className="border border-gray-200 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                                Nom Complet
                              </th>
                              <th className="border border-gray-200 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                                Date de Naissance
                              </th>
                              <th className="border border-gray-200 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                                CIN
                              </th>
                              <th className="border border-gray-200 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                                Téléphone
                              </th>
                              <th className="border border-gray-200 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                Genre
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Ligne pour ajouter un nouveau résident */}
                            {showAddForm && (
                              <tr className="bg-blue-50">
                                <td className="border border-gray-200 p-2">
                                  <input
                                    type="text"
                                    value={newResident.nomComplet}
                                    onChange={(e) => handleNewResidentChange("nomComplet", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                                    placeholder=""
                                  />
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <input
                                    type="date"
                                    value={newResident.dateNaissance}
                                    onChange={(e) => handleNewResidentChange("dateNaissance", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-base cursor-pointer"
                                  />
                                </td>
                                <td className="border border-gray-200 p-2">
                                  {newResident.dateNaissance && !estMajeur(newResident.dateNaissance) ? (
                                    <input
                                      type="text"
                                      value="Mineur"
                                      readOnly
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={newResident.cin}
                                      onChange={(e) => handleNewResidentChange("cin", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono"
                                      placeholder=""
                                    />
                                  )}
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <input
                                    type="tel"
                                    value={newResident.telephone}
                                    onChange={(e) => handleNewResidentChange("telephone", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono"
                                    placeholder=""
                                  />
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <div className="flex space-x-2">
                                    <select
                                      value={newResident.genre}
                                      onChange={(e) => handleNewResidentChange("genre", e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-base"
                                    >
                                      <option value="homme">Masculin</option>
                                      <option value="femme">Féminin</option>
                                    </select>
                                    <button
                                      onClick={handleAddResident}
                                      className="px-3 py-2 bg-green-600 text-white rounded text-base hover:bg-green-700 transition-colors"
                                      title="Ajouter"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelAddNewResident}
                                      className="px-3 py-2 bg-gray-500 text-white rounded text-base hover:bg-gray-600 transition-colors"
                                      title="Annuler"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Résidents existants */}
                            {editedResidents.map((resident) => {
                              const age = resident.dateNaissance
                                ? calculerAge(resident.dateNaissance)
                                : 0;
                              const majeur = age >= 18;

                              return (
                                <tr key={resident.id} className="hover:bg-white/30">
                                  <td className="border border-gray-200 p-2">
                                    <input
                                      type="text"
                                      value={resident.nomComplet || ""}
                                      onChange={(e) =>
                                        handleResidentChange(
                                          resident.id,
                                          "nomComplet",
                                          e.target.value
                                        )
                                      }
                                      className="w-full py-2 border border-gray-300 rounded text-base"
                                      placeholder=""
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    <input
                                      type="date"
                                      value={resident.dateNaissance || ""}
                                      onChange={(e) => handleResidentChange(resident.id, "dateNaissance", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-base cursor-pointer"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    {majeur ? (
                                      <input
                                        type="text"
                                        value={resident.cin || ""}
                                        onChange={(e) =>
                                          handleResidentChange(
                                            resident.id,
                                            "cin",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono"
                                        placeholder=""
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value="Mineur"
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono bg-gray-100 text-gray-600 cursor-not-allowed"
                                      />
                                    )}
                                  </td>
                                  <td className="border border-gray-200 p-4">
                                    <input
                                      type="tel"
                                      value={resident.telephone || ""}
                                      onChange={(e) =>
                                        handleResidentChange(
                                          resident.id,
                                          "telephone",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-base font-mono"
                                      placeholder=""
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-4">
                                    <select
                                      value={resident.genre || "homme"}
                                      onChange={(e) =>
                                        handleResidentChange(
                                          resident.id,
                                          "genre",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                                    >
                                      <option value="homme">Masculin</option>
                                      <option value="femme">Féminin</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Boutons de sauvegarde/annulation - FIXES EN BAS */}
                  <div className="flex-shrink-0 flex space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
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

      {/* Styles CSS pour le scrollbar */}
      <style>{`
        .search-results-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .search-results-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .search-results-container::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }
        
        .search-results-container::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        .search-results-container::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
}