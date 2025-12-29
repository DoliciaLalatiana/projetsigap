import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Users,
  Eye,
  MapPin,
  User,
  Map,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Camera,
  Mars,
  Venus,
  Phone,
  Calendar,
  Building,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function ResidencePage({
  onBack,
  searchQuery,
  onSearchChange,
  onViewOnMap,
}) {
  // residences list - initialiser avec un tableau vide au lieu des mocks
  const [resList, setResList] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResidents, setEditedResidents] = useState([]);
  const [origResidentsBeforeEdit, setOrigResidentsBeforeEdit] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
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

  // ÉTAT POUR GÉRER LA DATE DE NAISSANCE AVEC FORMAT VISIBLE
  const [dateInput, setDateInput] = useState("");

  // ÉTAT POUR GÉRER L'ERREUR DE DATE
  const [dateError, setDateError] = useState("");

  // NOUVEAUX ÉTATS : Pour stocker les résidents de toutes les résidences
  const [allResidents, setAllResidents] = useState([]);

  // ÉTATS POUR LES RÉSULTATS DE RECHERCHE
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // NOUVEAUX ÉTATS POUR LA GESTION DES PHOTOS
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);

  // ÉTAT POUR LE MODAL D'AJOUT DE RÉSIDENT
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);

  // Références pour les inputs du formulaire
  const nomInputRef = useRef(null);
  const prenomInputRef = useRef(null);
  const dateNaissanceInputRef = useRef(null);
  const cinInputRef = useRef(null);
  const telephoneInputRef = useRef(null);
  const sexeSelectRef = useRef(null);

  // Référence pour l'input de photo
  const photoInputRef = useRef(null);

  // Référence pour suivre si le composant est monté
  const isMountedRef = useRef(true);

  // LOAD residences from backend on mount
  useEffect(() => {
    let mounted = true;
    const fetchResidences = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/residences`);
        if (!resp.ok) {
          console.warn("Erreur lors du chargement des résidences");
          setResList([]);
          return;
        }
        const rows = await resp.json();

        const normalized = (rows || []).map((r) => ({
          id: r.id,
          name: r.name || r.lot || `Lot ${r.id}`,
          photos: Array.isArray(r.photos)
            ? r.photos
                .filter((photo) => photo && photo.trim() !== "")
                .map((photo) => {
                  if (typeof photo === "object" && photo.url) {
                    return photo.url.startsWith("http")
                      ? photo.url
                      : `${API_BASE}${photo.url.startsWith("/") ? "" : "/"}${
                          photo.url
                        }`;
                  }
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
          residents: [],
        }));

        if (mounted) {
          const sortedByDate = normalized.sort((a, b) => {
            const dateA = a.dateCreation
              ? new Date(a.dateCreation)
              : new Date(0);
            const dateB = b.dateCreation
              ? new Date(b.dateCreation)
              : new Date(0);
            return dateB - dateA;
          });

          setResList(sortedByDate);
        }
      } catch (e) {
        console.warn("fetchResidences error", e);
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

  // Effet pour nettoyer la recherche quand on quitte la page
  useEffect(() => {
    return () => {
      // Réinitialiser la recherche quand le composant est démonté
      if (onSearchChange) {
        onSearchChange("");
      }
      setIsSearchMode(false);
      setSearchResults([]);
    };
  }, [onSearchChange]);

  // Charger tous les résidents
  useEffect(() => {
    const fetchAllResidents = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/persons`, {
          headers: getHeaders(),
        });
        if (resp.ok) {
          const persons = await resp.json();
          // Formater les résidents
          const formattedPersons = (persons || []).map((person) => ({
            id: person.id,
            nomComplet: person.nom_complet || "",
            nom: (person.nom_complet || "").split(" ")[0] || "",
            prenom:
              (person.nom_complet || "").split(" ").slice(1).join(" ") || "",
            dateNaissance: person.date_naissance || "",
            cin: person.cin || "",
            genre: person.genre || "homme",
            telephone: person.telephone || "",
            residence_id: person.residence_id || null,
            is_proprietaire: person.is_proprietaire || false,
            relation_type: person.relation_type || "",
          }));

          setAllResidents(formattedPersons);
        }
      } catch (error) {
        console.warn("Erreur chargement tous les résidents:", error);
        setAllResidents([]);
      }
    };

    fetchAllResidents();
  }, []);

  // Effet pour rechercher quand la query change
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Focus sur le premier champ en mode édition
  useEffect(() => {
    if (showAddResidentModal && nomInputRef.current) {
      setTimeout(() => {
        nomInputRef.current.focus();
      }, 100);
    }
  }, [showAddResidentModal]);

  // Calculer les statistiques
  const calculateStatistics = () => {
    const totalResidences = resList.length;
    const residentsInResidences = allResidents.filter((person) =>
      resList.some((residence) => residence.id === person.residence_id)
    );
    const totalResidents = residentsInResidences.length;
    const totalHommes = residentsInResidences.filter(
      (person) =>
        person.genre === "homme" ||
        person.genre === "Homme" ||
        person.genre === "male"
    ).length;
    const totalFemmes = residentsInResidences.filter(
      (person) =>
        person.genre === "femme" ||
        person.genre === "Femme" ||
        person.genre === "female"
    ).length;

    return {
      totalResidences,
      totalResidents,
      totalHommes,
      totalFemmes,
    };
  };

  const statistics = calculateStatistics();

  // Helper pour les headers avec token
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  // Fonction pour effectuer la recherche - MODIFIÉ
  const performSearch = (query) => {
    if (!query.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    // Recherche dans tous les résidents
    allResidents.forEach((resident) => {
      const nomComplet = (resident.nomComplet || "").toLowerCase();
      const nom = (resident.nom || "").toLowerCase();
      const prenom = (resident.prenom || "").toLowerCase();
      const cin = (resident.cin || "").toLowerCase();
      const telephone = (resident.telephone || "").toLowerCase();

      if (
        nomComplet.includes(searchTerm) ||
        nom.includes(searchTerm) ||
        prenom.includes(searchTerm) ||
        cin.includes(searchTerm) ||
        telephone.includes(searchTerm)
      ) {
        results.push({
          ...resident,
          resultType: "resident",
        });
      }
    });

    // Recherche dans les résidences
    resList.forEach((residence) => {
      const name = residence.name.toLowerCase();
      const lot = residence.lot.toLowerCase();
      const quartier = residence.quartier.toLowerCase();
      const ville = residence.ville.toLowerCase();
      const adresse = residence.adresse.toLowerCase();
      const proprietaire = residence.proprietaire.toLowerCase();

      if (
        name.includes(searchTerm) ||
        lot.includes(searchTerm) ||
        quartier.includes(searchTerm) ||
        ville.includes(searchTerm) ||
        adresse.includes(searchTerm) ||
        proprietaire.includes(searchTerm)
      ) {
        results.push({
          ...residence,
          resultType: "residence",
        });
      }
    });

    setSearchResults(results);
    setIsSearchMode(true);
  };

  // Fonction pour afficher les détails d'un résultat trouvé
  const handleViewResultDetails = (result) => {
    if (result.resultType === "resident") {
      // Trouver la résidence du résident
      const residence = resList.find((r) => r.id === result.residence_id);
      if (residence) {
        handleViewDetails(residence);
        // Réinitialiser la recherche
        if (onSearchChange) {
          onSearchChange("");
        }
        setIsSearchMode(false);
        setSearchResults([]);
      }
    } else if (result.resultType === "residence") {
      handleViewDetails(result);
      // Réinitialiser la recherche
      if (onSearchChange) {
        onSearchChange("");
      }
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  // NOUVELLE FONCTION : Naviguer vers l'adresse sur la carte
  const handleViewOnMapFromSearch = (result) => {
    if (result.resultType === "resident") {
      // Trouver la résidence du résident
      const residence = resList.find((r) => r.id === result.residence_id);
      if (residence && onViewOnMap) {
        onViewOnMap(residence);
        // Réinitialiser la recherche
        if (onSearchChange) {
          onSearchChange("");
        }
        setIsSearchMode(false);
        setSearchResults([]);
      }
    } else if (result.resultType === "residence") {
      // Si c'est une résidence, naviguer directement
      if (onViewOnMap) {
        onViewOnMap(result);
        // Réinitialiser la recherche
        if (onSearchChange) {
          onSearchChange("");
        }
        setIsSearchMode(false);
        setSearchResults([]);
      }
    }
  };

  // Fonction pour réinitialiser la recherche
  const resetSearch = () => {
    if (onSearchChange) {
      onSearchChange("");
    }
    setIsSearchMode(false);
    setSearchResults([]);
  };

  // Charger les photos d'une résidence
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

      if (result.photos && result.photos.length > 0) {
        const newPhotoUrls = result.photos.map((photo) => {
          if (photo.url.startsWith("http")) {
            return photo.url;
          }
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
      const photosResp = await fetch(
        `${API_BASE}/api/residences/${selectedResidence.id}/photos`
      );
      if (photosResp.ok) {
        const photosList = await photosResp.json();

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
      console.log("Opening details for residence:", residence.id);

      const photos = await loadResidencePhotos(residence.id);
      console.log("Loaded photos:", photos.length);

      const base = resList.find((r) => r.id === residence.id) || residence;
      const resp = await fetch(
        `${API_BASE}/api/persons?residence_id=${residence.id}`,
        { headers: getHeaders() }
      );

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const persons = await resp.json();
      console.log("Loaded persons:", persons.length);

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
        photos: photos,
        residents: normalizedPersons,
      });

      setIsPhotoExpanded(false);
      setIsFullScreenPhoto(false);

      setShowModal(true);
      // Réinitialiser la recherche quand on ouvre le modal
      resetSearch();
    } catch (e) {
      console.error("Error loading residence details:", e);
      // Fallback au minimum
      setSelectedResidence({
        ...residence,
        photos: residence.photos || [],
        residents: [],
      });
      setShowModal(true);
      resetSearch();
    }
    setCurrentPhotoIndex(0);
    setIsEditMode(false);
  };

  const handleCloseModal = () => {
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
    setDateError("");
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
    setDateError("");
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

  // Nouvelle fonction pour gérer le clic sur l'image
  const handleImageClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!selectedResidence) return;

      if (selectedResidence.photos && selectedResidence.photos.length > 0) {
        setIsPhotoExpanded(!isPhotoExpanded);
        if (!isPhotoExpanded) {
          setIsFullScreenPhoto(false);
        }
      } else {
        // Si pas de photos, ouvrir le sélecteur de fichier
        photoInputRef.current?.click();
      }
    },
    [selectedResidence, isPhotoExpanded]
  );

  // Fonctions pour la date
  const formatPartialDate = (rawValue) => {
    let result = rawValue;
    if (rawValue.length > 2) {
      result = rawValue.substring(0, 2) + "/" + rawValue.substring(2);
    }
    if (rawValue.length > 4) {
      result = result.substring(0, 5) + "/" + result.substring(5);
    }
    return result;
  };

  const validateDate = (dateStr) => {
    setDateError("");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split("/").filter((p) => p !== "");
      if (parts.length === 3) {
        let [day, month, year] = parts;
        day = day.padStart(2, "0");
        month = month.padStart(2, "0");
        year = year.padStart(4, "0").substring(0, 4);

        let dayNum = parseInt(day, 10);
        let monthNum = parseInt(month, 10);
        let yearNum = parseInt(year, 10);

        if (monthNum < 1) monthNum = 1;
        if (monthNum > 12) monthNum = 12;
        if (dayNum < 1) dayNum = 1;

        const MAX_YEAR = 2025;
        if (yearNum > MAX_YEAR) {
          yearNum = MAX_YEAR;
        }
        if (yearNum < 1900) {
          yearNum = 1900;
        }

        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        if (dayNum > daysInMonth) {
          dayNum = daysInMonth;
        }

        const correctedDate =
          dayNum.toString().padStart(2, "0") +
          "/" +
          monthNum.toString().padStart(2, "0") +
          "/" +
          yearNum.toString().padStart(4, "0");

        setDateInput(correctedDate);
        setNewResident((prev) => ({
          ...prev,
          dateNaissance: correctedDate,
        }));

        return validateDateComplete(correctedDate);
      } else {
        setDateError("Format de date invalide. Utilisez jj/mm/aaaa");
        return false;
      }
    }
    return validateDateComplete(dateStr);
  };

  const validateDateComplete = (dateStr) => {
    const parts = dateStr.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    const date = new Date(
      `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`
    );
    if (isNaN(date.getTime())) {
      setDateError("Date invalide");
      return false;
    }

    const MAX_YEAR = 2025;
    if (year > MAX_YEAR) {
      setDateError(`L'année maximum est ${MAX_YEAR}`);
      return false;
    }

    const MIN_YEAR = 1900;
    if (year < MIN_YEAR) {
      setDateError("L'année semble trop ancienne");
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(year, month - 1, day);

    if (inputDate > today) {
      setDateError("La date de naissance ne peut pas être dans le futur");
      return false;
    }

    return true;
  };

  const handleDateChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9/]/g, "");
    setDateError("");

    if (value.length > 0) {
      let formattedValue = value;
      const rawValue = value.replace(/\//g, "");

      if (rawValue.length > 2 && !value.includes("/")) {
        formattedValue = rawValue.substring(0, 2) + "/" + rawValue.substring(2);
      }

      if (rawValue.length > 4 && formattedValue.match(/\//g)?.length === 1) {
        formattedValue =
          rawValue.substring(0, 2) +
          "/" +
          rawValue.substring(2, 4) +
          "/" +
          rawValue.substring(4);
      }

      if (rawValue.length >= 1) {
        let day = parseInt(rawValue.substring(0, 2)) || 0;
        if (day > 31) {
          day = 31;
          const correctedRaw = "31" + rawValue.substring(2);
          formattedValue = formatPartialDate(correctedRaw);
        }

        if (rawValue.length >= 3) {
          let month = parseInt(rawValue.substring(2, 4)) || 0;
          if (month > 12) {
            month = 12;
            const correctedRaw =
              rawValue.substring(0, 2) + "12" + rawValue.substring(4);
            formattedValue = formatPartialDate(correctedRaw);
          }
        }

        if (rawValue.length >= 5) {
          const yearStr = rawValue.substring(4, 8);
          if (yearStr.length === 4) {
            let year = parseInt(yearStr) || 0;
            const MAX_YEAR = 2025;
            if (year > MAX_YEAR) {
              year = MAX_YEAR;
              const correctedRaw =
                rawValue.substring(0, 4) + MAX_YEAR.toString();
              formattedValue = formatPartialDate(correctedRaw);
            }
          }
        }
      }

      if (formattedValue.length > 10) {
        formattedValue = formattedValue.substring(0, 10);
      }

      setDateInput(formattedValue);
      if (formattedValue.length === 10) {
        validateDate(formattedValue);
      }

      setNewResident((prev) => ({
        ...prev,
        dateNaissance: formattedValue,
      }));
    } else {
      setDateInput(value);
      setNewResident((prev) => ({
        ...prev,
        dateNaissance: "",
      }));
    }
  };

  const handleDateBlur = () => {
    if (dateInput && dateInput.length > 0) {
      if (dateInput.length < 10) {
        const parts = dateInput.split("/").filter((p) => p !== "");
        if (parts.length === 3) {
          let [day, month, year] = parts;
          day = day.padStart(2, "0");
          month = month.padStart(2, "0");

          if (year.length === 2) {
            year = "20" + year;
          } else if (year.length < 4) {
            const currentYear = new Date().getFullYear().toString();
            year = currentYear.substring(0, 4 - year.length) + year;
          }

          let yearNum = parseInt(year, 10);
          const MAX_YEAR = 2025;
          if (yearNum > MAX_YEAR) {
            yearNum = MAX_YEAR;
            year = MAX_YEAR.toString();
          }

          const correctedDate = `${day}/${month}/${year}`;
          setDateInput(correctedDate);
          setNewResident((prev) => ({
            ...prev,
            dateNaissance: correctedDate,
          }));

          validateDate(correctedDate);
        }
      } else {
        validateDate(dateInput);
      }
    }
  };

  const handleDateFocus = (e) => {
    setTimeout(() => {
      if (dateNaissanceInputRef.current) {
        const len = dateInput.length;
        dateNaissanceInputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const handleDateKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (dateInput.length === 10) {
        if (validateDate(dateInput)) {
          if (estMajeurFromInput() && cinInputRef.current) {
            cinInputRef.current.focus();
          } else {
            telephoneInputRef.current?.focus();
          }
        }
      } else {
        setDateError("Date incomplète. Format: jj/mm/aaaa");
      }
      return;
    }

    if (e.key === "Backspace" && dateInput.length > 0) {
      const cursorPos = e.target.selectionStart;
      if (cursorPos > 0 && dateInput[cursorPos - 1] === "/") {
        e.preventDefault();
        const newValue =
          dateInput.substring(0, cursorPos - 1) +
          dateInput.substring(cursorPos);
        setDateInput(newValue);
        setTimeout(() => {
          if (dateNaissanceInputRef.current) {
            dateNaissanceInputRef.current.setSelectionRange(
              cursorPos - 1,
              cursorPos - 1
            );
          }
        }, 0);
      }
    }

    if (e.key === "Delete" && dateInput.length > 0) {
      const cursorPos = e.target.selectionStart;
      if (cursorPos < dateInput.length && dateInput[cursorPos] === "/") {
        e.preventDefault();
        const newValue =
          dateInput.substring(0, cursorPos) +
          dateInput.substring(cursorPos + 1);
        setDateInput(newValue);
        setTimeout(() => {
          if (dateNaissanceInputRef.current) {
            dateNaissanceInputRef.current.setSelectionRange(
              cursorPos,
              cursorPos
            );
          }
        }, 0);
      }
    }
  };

  const estMajeurFromInput = () => {
    const dateStr = dateInput;
    if (!dateStr || dateStr.length < 10) {
      return false;
    }

    try {
      const parts = dateStr.split("/");
      if (parts.length !== 3) return false;

      const [day, month, year] = parts;
      if (
        !/^\d{2}$/.test(day) ||
        !/^\d{2}$/.test(month) ||
        !/^\d{4}$/.test(year)
      ) {
        return false;
      }

      const birthDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(birthDate.getTime())) return false;

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 18;
    } catch (error) {
      return false;
    }
  };

  const frenchDateToISO = (frenchDate) => {
    if (!frenchDate || frenchDate.length < 10) {
      return null;
    }

    try {
      const parts = frenchDate.split("/");
      if (parts.length !== 3) return null;

      const [day, month, year] = parts;
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) return null;

      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } catch (error) {
      return null;
    }
  };

  // Save edited residents
  const handleSaveEdit = async () => {
    if (!selectedResidence) return;
    try {
      const nom = (newResident.nom || "").trim().toUpperCase();
      const prenom = (newResident.prenom || "").trim();
      const nomComplet = `${nom} ${prenom}`.trim();

      if (!nom || !prenom || !dateInput || dateInput.length < 10) {
        alert(
          "Nom, Prénom et Date de naissance sont requis (format jj/mm/aaaa)"
        );
        return;
      }

      if (!validateDate(dateInput)) {
        return;
      }

      const dateISO = frenchDateToISO(dateInput);
      if (!dateISO) {
        setDateError(
          "Format de date invalide. Utilisez jj/mm/aaaa avec une date valide"
        );
        return;
      }

      if (newResident.telephone && newResident.telephone.length !== 10) {
        alert("Le numéro de téléphone doit contenir exactement 10 chiffres");
        return;
      }

      const birthDate = new Date(dateISO);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      const payload = {
        residence_id: selectedResidence.id,
        nom_complet: nomComplet,
        date_naissance: dateISO,
        cin: age < 18 ? null : newResident.cin || null,
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

      setSelectedResidence((prev) => ({
        ...prev,
        residents: [
          ...(prev?.residents || []),
          {
            id: created.id,
            nomComplet: created.nom_complet || nomComplet,
            dateNaissance: created.date_naissance || dateInput,
            cin: created.cin || newResident.cin || "",
            genre: created.genre || newResident.sexe || "homme",
            telephone: created.telephone || newResident.telephone || "",
          },
        ],
      }));

      // Ajouter aux résidents globaux
      setAllResidents((prev) => [
        ...prev,
        {
          id: created.id,
          nomComplet: created.nom_complet || nomComplet,
          nom: nom,
          prenom: prenom,
          dateNaissance: created.date_naissance || dateInput,
          cin: created.cin || newResident.cin || "",
          genre: created.genre || newResident.sexe || "homme",
          telephone: created.telephone || newResident.telephone || "",
          residence_id: selectedResidence.id,
          is_proprietaire: false,
        },
      ]);

      setNewResident({
        nom: "",
        prenom: "",
        dateNaissance: "",
        cin: "",
        telephone: "",
        sexe: "homme",
      });
      setDateInput("");
      setDateError("");
      setShowAddResidentModal(false);
    } catch (err) {
      console.warn("handleSaveEdit error", err);
      alert("Erreur lors de la sauvegarde du résident");
    }
  };

  const validateLettersOnly = (value) => {
    return /^[A-Za-zÀ-ÿ\s'-]*$/.test(value);
  };

  const validatePhoneNumber = (value) => {
    const numbersOnly = value.replace(/\D/g, "");
    if (numbersOnly.length > 10) {
      return numbersOnly.slice(0, 10);
    }
    return numbersOnly;
  };

  const handleNewResidentChange = (field, value) => {
    let validatedValue = value;

    if (field === "nom" || field === "prenom") {
      if (!validateLettersOnly(value)) {
        return;
      }
    } else if (field === "cin") {
      if (!/^[0-9]*$/.test(value)) {
        return;
      }
      if (value.length > 12) {
        validatedValue = value.slice(0, 12);
      }
    } else if (field === "telephone") {
      validatedValue = validatePhoneNumber(value);
    } else if (field === "dateNaissance") {
      return;
    }

    setNewResident((prev) => ({
      ...prev,
      [field]: validatedValue,
    }));
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();

      switch (nextField) {
        case "prenom":
          prenomInputRef.current?.focus();
          break;
        case "dateNaissance":
          dateNaissanceInputRef.current?.focus();
          break;
        case "cin":
          if (estMajeurFromInput() && cinInputRef.current) {
            cinInputRef.current.focus();
          } else {
            telephoneInputRef.current?.focus();
          }
          break;
        case "telephone":
          telephoneInputRef.current?.focus();
          break;
        case "sexe":
          sexeSelectRef.current?.focus();
          break;
        case "save":
          handleSaveEdit();
          break;
        default:
          break;
      }
    }
  };

  const handleOpenAddResidentModal = () => {
    setShowAddResidentModal(true);
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
    setDateError("");
  };

  const handleCloseAddResidentModal = () => {
    setShowAddResidentModal(false);
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
    setDateError("");
  };

  const handleCancelEdit = () => {
    setShowAddResidentModal(false);
    setNewResident({
      nom: "",
      prenom: "",
      dateNaissance: "",
      cin: "",
      telephone: "",
      sexe: "homme",
    });
    setDateInput("");
    setDateError("");
  };

  // Filtrage et tri des résidences (recherche dans les résidences)
  const filteredResidences = resList
    .filter((residence) => {
      // Recherche dans les résidences uniquement
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
          const dateA = a.dateCreation ? new Date(a.dateCreation) : new Date(0);
          const dateB = b.dateCreation ? new Date(b.dateCreation) : new Date(0);
          return dateB - dateA;
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

  // Pagination pour les résidents dans le modal
  const [residentPage, setResidentPage] = useState(1);
  const residentsPerPage = 10;
  const indexOfLastResident = residentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidentsInModal = selectedResidence?.residents
    ? selectedResidence.residents.slice(indexOfFirstResident, indexOfLastResident)
    : [];
  const totalResidentPages = selectedResidence?.residents
    ? Math.ceil(selectedResidence.residents.length / residentsPerPage)
    : 0;

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

  const nextResidentPage = () => {
    if (residentPage < totalResidentPages) {
      setResidentPage(residentPage + 1);
    }
  };

  const prevResidentPage = () => {
    if (residentPage > 1) {
      setResidentPage(residentPage - 1);
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
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour formater la date en format "jj-mm-aaaa"
  const formatDateHyphen = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fonction pour formater le genre
  const formatGenre = (genre) => {
    return genre === "homme" ? "Masculin" : "Féminin";
  };

  // Fonction pour formater l'affichage du nom selon la logique malgache
  const formatNomMalgache = (nomComplet) => {
    if (!nomComplet) return "";
    const parts = nomComplet.split(" ");
    if (parts.length > 1) {
      return `${parts[0].toUpperCase()} ${parts.slice(1).join(" ")}`;
    }
    return nomComplet.toUpperCase();
  };

  // Fonction pour extraire le nom et prénom du nom complet
  const extractNomPrenom = (nomComplet) => {
    if (!nomComplet) return { nom: "", prenom: "" };
    const parts = nomComplet.split(" ");
    if (parts.length === 1) return { nom: parts[0], prenom: "" };
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(" "),
    };
  };

  // Composant pour afficher un résultat de recherche (résident) - MODIFIÉ
  const ResidentSearchResult = ({ result }) => {
    // Trouver la résidence associée
    const residence = resList.find((r) => r.id === result.residence_id);

    // Extraire nom et prénom
    const { nom, prenom } = extractNomPrenom(result.nomComplet);

    // Formater la date
    const formattedDate = formatDate(result.dateNaissance);

    // Vérifier si majeur
    const isMineur = result.dateNaissance && !estMajeur(result.dateNaissance);

    // Obtenir le numéro de lot
    const lotNumber = residence ? residence.lot || "N/A" : "N/A";

    return (
      <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          {/* CONTENU PRINCIPAL - lot/nom/prenom/date de naissance/cin/téléphone/féminin ou masculin */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Lot */}
            <div className="w-20">
              <span className="text-sm font-medium text-gray-700">
                {lotNumber}
              </span>
            </div>

            {/* Nom */}
            <div className="w-28">
              <span className="text-sm font-semibold text-gray-800 block truncate">
                {nom || "-"}
              </span>
            </div>

            {/* Prénom */}
            <div className="w-28">
              <span className="text-sm text-gray-700 block truncate">
                {prenom || "-"}
              </span>
            </div>

            {/* Date de naissance */}
            <div className="w-28">
              <span className="text-sm text-gray-600 block">
                {formattedDate || "-"}
              </span>
            </div>

            {/* CIN */}
            <div className="w-32">
              <span className="text-sm font-mono text-gray-600 block truncate">
                {isMineur ? "Mineur" : result.cin || "-"}
              </span>
            </div>

            {/* Téléphone */}
            <div className="w-28">
              <span className="text-sm text-gray-600 block truncate">
                {result.telephone || "-"}
              </span>
            </div>

            {/* Sexe */}
            <div className="w-24">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full block w-fit ${
                  formatGenre(result.genre) === "Masculin"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-pink-100 text-pink-800"
                }`}
              >
                {formatGenre(result.genre)}
              </span>
            </div>
          </div>

          {/* BOUTONS D'ACTION - sans icônes */}
          <div className="flex space-x-2 ml-2">
            {residence && (
              <>
                <button
                  onClick={() => handleViewResultDetails(result)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  title="Voir détails de la résidence"
                >
                  Détails
                </button>
                {onViewOnMap && (
                  <button
                    onClick={() => handleViewOnMapFromSearch(result)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                    title="Voir sur la carte"
                  >
                    Carte
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant pour afficher un résultat de recherche (résidence)
  const ResidenceSearchResult = ({ result }) => {
    return (
      <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-base mb-1">
                {result.name}
              </h3>
              <div className="flex items-center space-x-1">
                <MapPin size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">{result.adresse}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <Users size={14} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {result.totalResidents} résident
                {result.totalResidents > 1 ? "s" : ""}
              </span>
            </div>
            {result.proprietaire && (
              <div className="flex items-center space-x-2">
                <User size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  {result.proprietaire}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-2 ml-2">
            <button
              onClick={() => handleViewResultDetails(result)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
              title="Voir détails de la résidence"
            >
              Détails
            </button>
            {onViewOnMap && (
              <button
                onClick={() => handleViewOnMapFromSearch(result)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                title="Voir sur la carte"
              >
                Carte
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant pour afficher un résident dans la liste - MODIFIÉ POUR CORRESPONDRE À LA PHOTO
  const ResidentRow = ({ resident }) => {
    const { nom, prenom } = extractNomPrenom(resident.nomComplet);
    const isMineur = resident.dateNaissance && !estMajeur(resident.dateNaissance);
    const displayNom = nom ? nom.toUpperCase() : "-";

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-800">{displayNom}</div>
          <div className="text-sm text-gray-600">{prenom || ""}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            {formatGenre(resident.genre) === "Masculin" ? (
              <Mars className="w-4 h-4 text-blue-600 mr-2" />
            ) : (
              <Venus className="w-4 h-4 text-pink-600 mr-2" />
            )}
            <span className={`text-sm font-medium ${
              formatGenre(resident.genre) === "Masculin" 
                ? "text-blue-600" 
                : "text-pink-600"
            }`}>
              {formatGenre(resident.genre)}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-600">
            {resident.dateNaissance 
              ? formatDateHyphen(resident.dateNaissance) 
              : "-"}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className={`text-sm font-mono ${
            isMineur ? "text-gray-500 italic" : "text-gray-600"
          }`}>
            {isMineur ? "-- Mineur --" : resident.cin || "-"}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-600">
            {resident.telephone ? `+261 ${resident.telephone}` : "-"}
          </div>
        </td>
      </tr>
    );
  };

  // Composant pour l'en-tête de la liste des résidents - MODIFIÉ POUR CORRESPONDRE À LA PHOTO
  const ResidentListHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          NOM
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          SEXE
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          DATE DE NAISSANCE
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          CIN
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          TEL.
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="h-full flex">
      {/* Section principale - cachée quand le modal est ouvert */}
      {!showModal && (
        <div className="w-full">
          <div className="h-full flex flex-col">
            {/* Header avec titre et filtre */}
            <div className="flex items-center justify-between p-4">
              <h1 className="font-bold text-2xl text-gray-800">
                Liste des Résidences
              </h1>
            </div>

            {/* Statistiques - AVEC ICÔNES COMME DANS L'IMAGE */}
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Statistique 1 - Adresses */}
                <div className="bg-white backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {statistics.totalResidences}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Adresses
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistique 2 - Résidents */}
                <div className="bg-white backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {statistics.totalResidents}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Résidents
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistique 3 - Hommes */}
                <div className="bg-white backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mars className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {statistics.totalHommes}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Hommes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistique 4 - Femmes */}
                <div className="bg-white backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Venus className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {statistics.totalFemmes}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Femmes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTENU PRINCIPAL - LISTE DES RÉSIDENCES AVEC NUMÉROTATION ET EN-TÊTES */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="border rounded-xl border-gray-200 bg-white shadow-sm">
                {currentResidences.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                      Aucune résidence trouvée
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Aucune résidence ne correspond à votre recherche "
                      {searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* En-têtes de la liste - MODIFIÉ POUR ÉLIMINER LES ESPACES INUTILES */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        {/* N° */}
                        <div className="w-16 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          N°
                        </div>
                        {/* Photo */}
                        <div className="w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Photo
                        </div>
                        {/* Adresse */}
                        <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Adresse
                        </div>
                        {/* Résidents */}
                        <div className="w-48 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Résidents
                        </div>
                        {/* Actions */}
                        <div className="w-40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </div>
                      </div>
                    </div>

                    {/* Liste des résidences */}
                    <div className="divide-y divide-gray-200">
                      {currentResidences.map((residence, index) => (
                        <div
                          key={residence.id}
                          className="transition-all duration-200 hover:bg-gray-50"
                        >
                          <div className="px-6 py-4">
                            <div className="flex items-center">
                              {/* Numéro */}
                              <div className="w-16">
                                <span className="text-sm font-medium text-gray-700">
                                  {(currentPage - 1) * residencesPerPage + index + 1}
                                </span>
                              </div>

                              {/* Photo */}
                              <div className="w-24">
                                <div className="w-20 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200">
                                  {residence.photos &&
                                  residence.photos.length > 0 ? (
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
                                      <Home
                                        size={16}
                                        className="text-gray-400"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Adresse */}
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 text-base mb-1">
                                  {residence.name}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  <MapPin
                                    size={12}
                                    className="text-gray-500"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {residence.adresse}
                                  </span>
                                </div>
                                {residence.proprietaire && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <User size={12} className="text-gray-500" />
                                    <span className="text-xs text-gray-500">
                                      {residence.proprietaire}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Résidents - Total et détail hommes/femmes */}
                              <div className="w-48">
                                <div className="flex flex-col items-center">
                                  <div className="text-xl font-bold text-gray-800 mb-1">
                                    {residence.totalResidents || 0}
                                  </div>
                                  <div className="flex justify-center space-x-4">
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-blue-600">
                                        {residence.hommes || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Hommes
                                      </div>
                                    </div>
                                    <div className="text-gray-300">|</div>
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-pink-600">
                                        {residence.femmes || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Femmes
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="w-40">
                                <div className="flex items-center space-x-2">
                                  {onViewOnMap && (
                                    <button
                                      onClick={() => onViewOnMap(residence)}
                                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center flex-1 text-xs font-medium"
                                      title="Carte"
                                    >
                                      <Map size={14} className="mr-1" />
                                      <span>Carte</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleViewDetails(residence)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center flex-1 text-xs font-medium"
                                    title="Détails"
                                  >
                                    <Eye size={14} className="mr-1" />
                                    <span>Détails</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {!isSearchMode && filteredResidences.length > residencesPerPage && (
              <div className="border-t border-gray-200 bg-white py-3 px-6">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
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

                    {/* Affichage des numéros de page */}
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Afficher seulement 5 pages maximum autour de la page courante
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span key={pageNum} className="px-1 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

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
      )}

      {/* Modal de détails - MODIFIÉ SELON VOS NOUVELLES SPÉCIFICATIONS */}
      {showModal && selectedResidence && (
        <div className="w-full">
          <div className="h-full flex flex-col">
            {/* Header avec bouton retour et titre */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2 mr-4"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {selectedResidence.lot || selectedResidence.name}
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Section photo et informations */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Photo à gauche */}
                  <div className="bg-gray-100 rounded-lg overflow-hidden h-64">
                    {selectedResidence.photos && selectedResidence.photos.length > 0 ? (
                      <img
                        src={selectedResidence.photos[0]}
                        alt={selectedResidence.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn(
                            "Image failed to load in details:",
                            selectedResidence.photos[0]
                          );
                          e.target.style.display = "none";
                          e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Home size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Informations de la résidence au centre */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Informations de la résidence
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <MapPin size={18} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedResidence.adresse}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users size={18} className="text-gray-500" />
                        <span className="text-gray-700 font-medium">
                          {selectedResidence.totalResidents || 0} résidents
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 pt-2">
                        <div className="flex items-center space-x-2">
                          <Mars size={18} className="text-blue-600" />
                          <span className="font-medium text-gray-700">
                            {selectedResidence.hommes || 0} Hommes
                          </span>
                        </div>
                        <div className="text-gray-400">•</div>
                        <div className="flex items-center space-x-2">
                          <Venus size={18} className="text-pink-600" />
                          <span className="font-medium text-gray-700">
                            {selectedResidence.femmes || 0} Femmes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations du propriétaire à droite */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Propriétaire
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User size={18} className="text-gray-500" />
                        <span className="text-gray-700">
                          {selectedResidence.proprietaire || "Non spécifié"}
                        </span>
                      </div>
                      {selectedResidence.telephone && (
                        <div className="flex items-center space-x-2">
                          <Phone size={18} className="text-gray-500" />
                          <span className="text-gray-700">
                            {selectedResidence.telephone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section liste des résidents */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Liste des résidents
                    </h3>
                    <button
                      onClick={handleOpenAddResidentModal}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter un résident</span>
                    </button>
                  </div>

                  {selectedResidence.residents && selectedResidence.residents.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <ResidentListHeader />
                          <tbody>
                            {currentResidentsInModal.map((resident) => (
                              <ResidentRow
                                key={resident.id}
                                resident={resident}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination pour les résidents */}
                      {totalResidentPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={prevResidentPage}
                              disabled={residentPage === 1}
                              className={`p-2 rounded-lg border transition-colors ${
                                residentPage === 1
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <ChevronLeft size={20} />
                            </button>

                            {/* Affichage des numéros de page */}
                            <div className="flex items-center space-x-1">
                              {[...Array(totalResidentPages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Afficher seulement 5 pages maximum autour de la page courante
                                if (
                                  pageNum === 1 ||
                                  pageNum === totalResidentPages ||
                                  (pageNum >= residentPage - 1 && pageNum <= residentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setResidentPage(pageNum)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        residentPage === pageNum
                                          ? "bg-blue-600 text-white"
                                          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 hover:border-gray-400"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                } else if (
                                  pageNum === residentPage - 2 ||
                                  pageNum === residentPage + 2
                                ) {
                                  return (
                                    <span key={pageNum} className="px-1 text-gray-400">
                                      ...
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>

                            <button
                              onClick={nextResidentPage}
                              disabled={residentPage === totalResidentPages}
                              className={`p-2 rounded-lg border transition-colors ${
                                residentPage === totalResidentPages
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <div className="text-gray-500 mb-4">
                        Aucun résident enregistré
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un résident - FORME RECTANGULAIRE VERTICALE, 600x640px */}
      {showAddResidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseAddResidentModal}
          />
          
          {/* Modal - Dimensions fixes et centré */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] h-[640px] overflow-hidden flex flex-col">
            {/* Header du modal avec titre et bouton fermer */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Ajouter un résident
              </h2>
              <button
                onClick={handleCloseAddResidentModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Structure du formulaire inspirée de l'image */}
              <div className="space-y-6">
                {/* Champ Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    ref={nomInputRef}
                    type="text"
                    value={newResident.nom}
                    onChange={(e) =>
                      handleNewResidentChange("nom", e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, "prenom")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base"
                    placeholder="Entrez le nom"
                    maxLength={50}
                  />
                </div>

                {/* Champ Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    ref={prenomInputRef}
                    type="text"
                    value={newResident.prenom}
                    onChange={(e) =>
                      handleNewResidentChange("prenom", e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, "dateNaissance")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base"
                    placeholder="Entrez le prénom"
                    maxLength={50}
                  />
                </div>

                {/* Sélection Sexe - Style similaire à l'image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe
                  </label>
                  <div className="flex space-x-8">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sexe"
                        value="homme"
                        checked={newResident.sexe === "homme"}
                        onChange={(e) =>
                          handleNewResidentChange("sexe", e.target.value)
                        }
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Masculin</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sexe"
                        value="femme"
                        checked={newResident.sexe === "femme"}
                        onChange={(e) =>
                          handleNewResidentChange("sexe", e.target.value)
                        }
                        className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">Féminin</span>
                    </label>
                  </div>
                </div>

                {/* Champ Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    ref={dateNaissanceInputRef}
                    type="text"
                    value={dateInput}
                    onChange={handleDateChange}
                    onFocus={handleDateFocus}
                    onKeyDown={handleDateKeyDown}
                    onBlur={handleDateBlur}
                    className={`w-full px-4 py-3 border rounded-lg text-base font-mono text-left transition-colors ${
                      dateError
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    }`}
                    placeholder="jj/mm/aaaa"
                    maxLength={10}
                  />
                  {dateError && (
                    <p className="mt-2 text-sm text-red-600">{dateError}</p>
                  )}
                </div>

                {/* Champ Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    ref={telephoneInputRef}
                    type="text"
                    value={newResident.telephone}
                    onChange={(e) =>
                      handleNewResidentChange("telephone", e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, "save")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base font-mono"
                    placeholder="Ex: 34 00 000 00"
                    maxLength={10}
                  />
                </div>

                {/* Section CIN (conditionnelle pour majeurs) */}
                {estMajeurFromInput() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CIN
                    </label>
                    <input
                      ref={cinInputRef}
                      type="text"
                      value={newResident.cin}
                      onChange={(e) =>
                        handleNewResidentChange("cin", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, "telephone")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base font-mono"
                      placeholder="Numéro CIN (12 chiffres)"
                      maxLength={12}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Champ réservé aux personnes majeures uniquement
                    </p>
                  </div>
                )}

                {/* Informations de la résidence (lecture seule) */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Résidence concernée
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">
                          {selectedResidence?.lot || selectedResidence?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedResidence?.adresse || "Adresse non spécifiée"}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedResidence?.totalResidents || 0} résidents
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action en bas */}
            <div className="flex space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enregistrer
              </button>
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