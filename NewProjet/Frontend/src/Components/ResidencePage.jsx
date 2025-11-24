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
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ResidencePage({ onBack, searchQuery, onSearchChange }) {
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
    nomComplet: "",
    dateNaissance: "",
    cin: "",
    genre: "homme",
    telephone: "",
    relation_type: "",
    is_proprietaire: false,
    parent_id: null
  });

  // LOAD residences from backend on mount - version corrigée
  useEffect(() => {
    let mounted = true;
    const fetchResidences = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/residences`);
        if (!resp.ok) {
          console.warn('Erreur lors du chargement des résidences');
          setResList([]); // Assurer que la liste est vide en cas d'erreur
          return;
        }
        const rows = await resp.json();
        
        // Normaliser les données - s'assurer que photos est toujours un tableau
        const normalized = (rows || []).map(r => ({
          id: r.id,
          name: r.name || r.lot || `Lot ${r.id}`,
          photos: Array.isArray(r.photos) 
            ? r.photos
                .filter(photo => photo && photo.trim() !== '')
                .map(photo => {
                  // Si c'est un objet avec une propriété url
                  if (typeof photo === 'object' && photo.url) {
                    return photo.url.startsWith('http') 
                      ? photo.url 
                      : `${API_BASE}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
                  }
                  // Si c'est une chaîne simple
                  if (typeof photo === 'string') {
                    return photo.startsWith('http') 
                      ? photo 
                      : `${API_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
                  }
                  return photo;
                })
            : [],
          lot: r.lot || '',
          quartier: r.quartier || '',
          ville: r.ville || '',
          proprietaire: r.proprietaire || '',
          totalResidents: r.total_residents || 0,
          hommes: r.hommes || 0,
          femmes: r.femmes || 0,
          adresse: r.adresse || `${r.quartier || ''} ${r.ville || ''}`.trim(),
          telephone: r.telephone || '',
          email: r.email || '',
          latitude: r.lat || r.latitude || null,
          longitude: r.lng || r.longitude || null,
          status: r.status || 'active',
          dateCreation: r.created_at || r.dateCreation || null,
          residents: [] // loaded on demand
        }));
        
        if (mounted) {
          setResList(normalized);
        }
      } catch (e) {
        console.warn('fetchResidences error', e);
        // En cas d'erreur, on garde une liste vide au lieu des mocks
        if (mounted) {
          setResList([]);
        }
      }
    };
    fetchResidences();
    return () => { mounted = false; };
  }, []);

  // helper headers with possible token
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
  };
  
  // ref for hidden file input (image chooser)
  const photoInputRef = useRef(null);

  // Residence info edit state (lot/quartier/ville)
  const [isEditingResidenceInfo, setIsEditingResidenceInfo] = useState(false);
  const [resInfoDraft, setResInfoDraft] = useState({ lot: '', quartier: '', ville: '' });

  const startEditResidenceInfo = () => {
    if (!selectedResidence) return;
    setResInfoDraft({
      lot: selectedResidence.lot || '',
      quartier: selectedResidence.quartier || '',
      ville: selectedResidence.ville || ''
    });
    setIsEditingResidenceInfo(true);
  };

  const cancelEditResidenceInfo = () => {
    setIsEditingResidenceInfo(false);
    setResInfoDraft({ lot: '', quartier: '', ville: '' });
  };

  const saveResidenceInfo = async () => {
    if (!selectedResidence) return;
    try {
      const resp = await fetch(`${API_BASE}/api/residences/${selectedResidence.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          lot: resInfoDraft.lot,
          quartier: resInfoDraft.quartier,
          ville: resInfoDraft.ville
        })
      });
      if (!resp.ok) throw new Error('Erreur update residence');
      const updated = await resp.json();
      // update UI: selectedResidence and resList
      setSelectedResidence(prev => ({ ...prev, ...updated }));
      setResList(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      setIsEditingResidenceInfo(false);
    } catch (err) {
      console.warn('saveResidenceInfo error', err);
      alert('Erreur lors de la mise à jour de la résidence');
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
      const resp = await fetch(`${API_BASE}/api/residences/${residenceId}/photos`);
      if (resp.ok) {
        const photos = await resp.json();
        return photos.map(photo => {
          if (typeof photo === 'object' && photo.url) {
            return photo.url.startsWith('http') 
              ? photo.url 
              : `${API_BASE}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
          }
          return photo;
        });
      }
    } catch (err) {
      console.warn('Erreur chargement photos:', err);
    }
    return [];
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedResidence) return;

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      const resp = await fetch(`${API_BASE}/api/residences/${selectedResidence.id}/photos`, {
        method: 'POST',
        headers: localStorage.getItem('token') ? { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        } : {},
        body: formData
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.warn('upload photos response not ok', resp.status, errorText);
        throw new Error('Erreur upload photos');
      }

      const result = await resp.json();
      
      // CORRECTION : Mettre à jour les photos avec les URLs complètes
      if (result.photos && result.photos.length > 0) {
        const newPhotoUrls = result.photos.map(photo => {
          // Si c'est déjà une URL complète, l'utiliser directement
          if (photo.url.startsWith('http')) {
            return photo.url;
          }
          // Sinon, construire l'URL complète
          return `${API_BASE}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        });

        setSelectedResidence(prev => {
          const updated = { 
            ...prev, 
            photos: [...(prev.photos || []), ...newPhotoUrls] 
          };
          setResList(list => list.map(r => r.id === updated.id ? { ...r, photos: updated.photos } : r));
          return updated;
        });
      }
    } catch (err) {
      console.warn('handlePhotoSelect upload error', err);
      alert('Erreur lors de l\'upload des photos');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoIndex) => {
    if (!selectedResidence || !selectedResidence.photos) return;

    const photos = selectedResidence.photos;
    const photoUrl = photos[photoIndex];
    
    try {
      // Récupérer la liste des photos depuis le backend pour trouver l'ID
      const photosResp = await fetch(`${API_BASE}/api/residences/${selectedResidence.id}/photos`);
      if (photosResp.ok) {
        const photosList = await photosResp.json();
        
        // Trouver la photo correspondante par son URL
        const photoToDelete = photosList.find(p => {
          const fullUrl = typeof p === 'object' && p.url 
            ? (p.url.startsWith('http') 
                ? p.url 
                : `${API_BASE}${p.url.startsWith('/') ? '' : '/'}${p.url}`)
            : p;
          return fullUrl === photoUrl;
        });
        
        if (photoToDelete) {
          const deleteResp = await fetch(
            `${API_BASE}/api/residences/${selectedResidence.id}/photos/${photoToDelete.id}`, 
            {
              method: 'DELETE',
              headers: getHeaders()
            }
          );
          
          if (!deleteResp.ok) throw new Error('Erreur suppression photo');
        }
      }

      // Mettre à jour l'interface
      const updatedPhotos = photos.filter((_, index) => index !== photoIndex);
      setSelectedResidence(prev => ({
        ...prev,
        photos: updatedPhotos
      }));
      
      setResList(prev => prev.map(r => 
        r.id === selectedResidence.id ? { ...r, photos: updatedPhotos } : r
      ));
      
      // Ajuster l'index de la photo courante si nécessaire
      if (currentPhotoIndex >= updatedPhotos.length) {
        setCurrentPhotoIndex(Math.max(0, updatedPhotos.length - 1));
      }
      
    } catch (err) {
      console.warn('Erreur suppression photo:', err);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  const handleViewDetails = async (residence) => {
    try {
      // Charger les photos
      const photos = await loadResidencePhotos(residence.id);
      
      // Charger les résidents
      const base = resList.find(r => r.id === residence.id) || residence;
      const resp = await fetch(`${API_BASE}/api/persons?residence_id=${residence.id}`, { headers: getHeaders() });
      const persons = resp.ok ? await resp.json() : (base.residents || []);
      // ensure persons array shape matches UI (nomComplet, dateNaissance, cin, genre, telephone, id)
      const normalizedPersons = (persons || []).map(p => ({
        id: p.id,
        nomComplet: p.nom_complet || p.nomComplet || '',
        dateNaissance: p.date_naissance || p.dateNaissance || '',
        cin: p.cin || p.cin || '',
        genre: p.genre || p.genre || 'homme',
        telephone: p.telephone || p.telephone || '',
        relation_type: p.relation_type || '',
        is_proprietaire: p.is_proprietaire || false
      }));
      
      setSelectedResidence({ 
        ...base, 
        photos: photos, // Utiliser les photos chargées
        residents: normalizedPersons 
      });
    } catch (e) {
      console.warn('load persons error', e);
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
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: "",
      relation_type: "",
      is_proprietaire: false,
      parent_id: null
    });
  };

  const handleNextPhoto = () => {
    if (selectedResidence && selectedResidence.photos && selectedResidence.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === selectedResidence.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevPhoto = () => {
    if (selectedResidence && selectedResidence.photos && selectedResidence.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedResidence.photos.length - 1 : prev - 1
      );
    }
  };

  const handleViewOnMap = (residence) => {
    localStorage.setItem(
      "selectedResidence",
      JSON.stringify({
        latitude: residence.latitude,
        longitude: residence.longitude,
        name: residence.name,
        adresse: residence.adresse,
      })
    );
    window.location.href = "/";
  };

  // Save edited residents: sync to backend (updates, deletes)
  const handleSaveEdit = async () => {
    if (!selectedResidence) return;
    try {
      const original = origResidentsBeforeEdit || [];
      const edited = editedResidents || [];

      // deleted = in original but not in edited
      const deleted = original.filter(o => !edited.some(e => e.id === o.id));

      // to update: numeric ids that still exist and differ
      const toUpdate = edited.filter(e => typeof e.id === 'number' && original.some(o => o.id === e.id));

      // perform deletes
      for (const d of deleted) {
        if (typeof d.id === 'number') {
          await fetch(`${API_BASE}/api/persons/${d.id}`, { method: 'DELETE', headers: getHeaders() });
        }
      }

      // update existing
      for (const u of toUpdate) {
        const payload = {
          nom_complet: u.nomComplet,
          date_naissance: u.dateNaissance || null,
          cin: u.cin || null,
          genre: u.genre || 'homme',
          telephone: u.telephone || null
        };
        await fetch(`${API_BASE}/api/persons/${u.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
      }

      // reload persons list for this residence
      const resp = await fetch(`${API_BASE}/api/persons?residence_id=${selectedResidence.id}`, { headers: getHeaders() });
      const persons = resp.ok ? await resp.json() : [];
      const normalizedPersons = (persons || []).map(p => ({
        id: p.id,
        nomComplet: p.nom_complet || p.nomComplet || '',
        dateNaissance: p.date_naissance || p.dateNaissance || '',
        cin: p.cin || p.cin || '',
        genre: p.genre || p.genre || 'homme',
        telephone: p.telephone || p.telephone || '',
        relation_type: p.relation_type || '',
        is_proprietaire: p.is_proprietaire || false
      }));
      setSelectedResidence(prev => ({ ...prev, residents: normalizedPersons }));
      setIsEditMode(false);
      setEditedResidents([]);
      setOrigResidentsBeforeEdit([]);
    } catch (e) {
      console.warn('handleSaveEdit error', e);
      alert('Erreur lors de la sauvegarde des résidents');
    }
  };

  // Add resident -> POST immediately to backend and append returned person to editedResidents
  const handleAddResident = async () => {
    if (!selectedResidence) return;
    if (!newResident.nomComplet || !newResident.dateNaissance) {
      alert('Nom et date de naissance requis');
      return;
    }
    try {
      const payload = {
        residence_id: selectedResidence.id,
        nom_complet: newResident.nomComplet,
        date_naissance: newResident.dateNaissance,
        cin: newResident.cin || null,
        genre: newResident.genre || 'homme',
        telephone: newResident.telephone || null,
        relation_type: newResident.relation_type || null,
        is_proprietaire: newResident.is_proprietaire || false,
        parent_id: newResident.parent_id || null
      };
      const resp = await fetch(`${API_BASE}/api/persons`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const body = await resp.text().catch(()=>'');
        console.warn('create person failed', resp.status, body);
        throw new Error('Erreur création personne');
      }
      const created = await resp.json();
      const person = {
        id: created.id,
        nomComplet: created.nom_complet || newResident.nomComplet,
        dateNaissance: created.date_naissance || newResident.dateNaissance,
        cin: created.cin || newResident.cin || '',
        genre: created.genre || newResident.genre || 'homme',
        telephone: created.telephone || newResident.telephone || '',
        relation_type: created.relation_type || newResident.relation_type || '',
        is_proprietaire: created.is_proprietaire || newResident.is_proprietaire || false
      };
      setEditedResidents(prev => [...prev, person]);
      // also update selectedResidence.residents for immediate view
      setSelectedResidence(prev => ({ ...(prev || {}), residents: [...(prev?.residents || []), person] }));
      setNewResident({ 
        nomComplet: "", 
        dateNaissance: "", 
        cin: "", 
        genre: "homme", 
        telephone: "",
        relation_type: "",
        is_proprietaire: false,
        parent_id: null
      });
    } catch (err) {
      console.warn('handleAddResident error', err);
      alert('Erreur ajout personne');
    }
  };

  const handleRemoveResident = (residentId) => {
    setEditedResidents(prev => prev.filter((resident) => resident.id !== residentId));
  };

  const handleResidentChange = (residentId, field, value) => {
    setEditedResidents(prev => prev.map((resident) =>
      resident.id === residentId ? { ...resident, [field]: value } : resident
    ));
  };

  const handleNewResidentChange = (field, value) => {
     setNewResident(prev => ({
       ...prev,
       [field]: value
     }));
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
    setNewResident({
      nomComplet: "",
      dateNaissance: "",
      cin: "",
      genre: "homme",
      telephone: "",
      relation_type: "",
      is_proprietaire: false,
      parent_id: null
    });
  };

  // Filtrage et tri des résidences avec la searchQuery passée en props
  const filteredResidences = resList
    .filter((residence) => {
      const matchesSearch =
        residence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residence.proprietaire.toLowerCase().includes(searchQuery.toLowerCase());
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
  const currentResidences = filteredResidences.slice(indexOfFirstResidence, indexOfLastResidence);
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

  // Calcul des totaux généraux
  const totalResidences = resList.length;
  const totalResidents = resList.reduce((total, residence) => total + (residence.totalResidents || 0), 0);
  const totalHommes = resList.reduce((total, residence) => total + (residence.hommes || 0), 0);
  const totalFemmes = resList.reduce((total, residence) => total + (residence.femmes || 0), 0);

  // Fonction utilitaire pour calculer l'âge
  const calculerAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Fonction utilitaire pour vérifier si majeur
  const estMajeur = (dateNaissance) => {
    return calculerAge(dateNaissance) >= 18;
  };

  return (
    <div className="h-full flex">
      {/* Section principale des résidences */}
      <div className={`transition-all duration-300 ease-in-out ${
        showModal ? "w-1/2" : "w-full"
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-gray-200/60 bg-transparent">
            <h1 className="font-bold text-3xl text-gray-800 bg-white backdrop-blur-sm py-1.5 px-4 rounded-2xl border border-gray-200/60">Résidences</h1>
          </div>

          {/* Statistiques */}
          <div className="border-gray-200/60 bg-transparent">
            <div className="grid grid-cols-4 gap-4 ml-12 mr-12">
              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalResidences}</div>
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

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalResidents}</div>
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

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalHommes}</div>
                    <div className="text-xs text-gray-600 mt-1">Hommes</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-blue-600">
                  <span>{Math.round((totalHommes / totalResidents) * 100)}%</span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{totalFemmes}</div>
                    <div className="text-xs text-gray-600 mt-1">Femmes</div>
                  </div>
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-pink-600">
                  <span>{Math.round((totalFemmes / totalResidents) * 100)}%</span>
                  <span className="text-gray-500 ml-1">of total</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTE DES RÉSIDENCES - PARTIE FONCTIONNELLE */}
          <div className="flex-1 overflow-y-auto bg-transparent">
            <div className="p-3 space-y-3 mr-3 ml-4">
              {currentResidences.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-600 text-lg mb-2">
                    Aucune résidence trouvée
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Aucune résidence ne correspond à votre recherche "{searchQuery}"
                  </p>
                </div>
              ) : (
                currentResidences.map((residence) => (
                  <div
                    key={residence.id}
                    className={`backdrop-blur-sm border rounded-lg hover:shadow-md transition-all duration-200 ${
                      selectedResidence && selectedResidence.id === residence.id && showModal
                        ? "bg-blue-50 border-blue-200 shadow-md" // Résidence sélectionnée
                        : "bg-white border-gray-200/60" // Résidence normale
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                            {residence.photos && residence.photos.length > 0 ? (
                              <img
                                src={residence.photos[0]}
                                alt={residence.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.warn('Image failed to load in list:', residence.photos[0]);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Home size={16} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm truncate ${
                              selectedResidence && selectedResidence.id === residence.id && showModal
                                ? "text-blue-800" // Texte bleu pour la résidence sélectionnée
                                : "text-gray-800" // Texte normal
                            }`}>
                              {residence.name}
                            </h3>
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin size={12} className={
                                selectedResidence && selectedResidence.id === residence.id && showModal
                                  ? "text-blue-600" // Icône bleue pour la résidence sélectionnée
                                  : "text-gray-600" // Icône normale
                              } />
                              <span className={`text-xs truncate ${
                                selectedResidence && selectedResidence.id === residence.id && showModal
                                  ? "text-blue-600" // Texte bleu pour la résidence sélectionnée
                                  : "text-gray-600" // Texte normal
                              }`}>
                                {residence.adresse}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleViewDetails(residence)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                              selectedResidence && selectedResidence.id === residence.id && showModal
                                ? "bg-blue-600 text-white hover:bg-blue-700" // Bouton bleu pour la résidence sélectionnée
                                : "bg-blue-600 text-white hover:bg-blue-700" // Bouton normal
                            }`}
                            title="Détails"
                          >
                            <Eye size={14} />
                            <span className="text-xs">Details</span>
                          </button>
                          <button
                            onClick={() => handleViewOnMap(residence)}
                            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                            title="Carte"
                          >
                            <Map size={14} />
                            <span className="text-xs">Carte</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
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

      {/* Modal de détails/édition qui change de contenu */}
      {showModal && selectedResidence && (
        <div className="w-1/2 bg-transparent rounded-r-3xl overflow-hidden shadow-xl border-l border-gray-200/60">
          <div className="h-full flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-transparent">
              <h2 className="text-xl bg-white py-3 px-6 rounded-2xl font-bold text-gray-800">
                {isEditMode ? "Les résidents" : "Détails Résidence"}
              </h2>
              <div className="flex items-center space-x-2">
                {isEditMode && (
                  <button
                    onClick={handleAddResident}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <Plus size={14} />
                    <span>Ajouter</span>
                  </button>
                )}
                <button
                  onClick={isEditMode ? handleCancelEdit : handleCloseModal}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Contenu du modal avec scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isEditMode ? (
                /* MODE DÉTAILS */
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
                                console.warn('Image failed to load in carousel:', selectedResidence.photos[currentPhotoIndex]);
                                e.target.style.display = 'none';
                              }}
                            />
                            
                            {/* Bouton supprimer la photo actuelle - SEULEMENT s'il y a des photos */}
                            <button
                              onClick={() => handleDeletePhoto(currentPhotoIndex)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                              title="Supprimer cette photo"
                            >
                              <X size={16} />
                            </button>
                            
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
                                          ? 'bg-white' 
                                          : 'bg-white/50'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-200"
                            onClick={() => photoInputRef.current?.click()}
                          >
                            <div className="text-center">
                              <Plus size={32} className="text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-500">Aucune image</div>
                              <div className="text-xs text-gray-400">Cliquez pour ajouter des photos</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Input fichier caché */}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </div>

                    {/* Informations de localisation */}
                    <div className="flex-1">
                      <div className="h-40 flex flex-col justify-center space-y-4 relative">
                        {!isEditingResidenceInfo ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-gray-800">{selectedResidence.lot || '-'}</div>
                              <button 
                                onClick={startEditResidenceInfo} 
                                className="text-white transition-colors ml-6 mb-10"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                            </div>
                            <div className="font-bold text-gray-800">{selectedResidence.quartier || '-'}</div>
                            <div className="font-bold text-gray-800">{selectedResidence.ville || ''}</div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={resInfoDraft.lot} 
                              onChange={(e) => setResInfoDraft(prev => ({ ...prev, lot: e.target.value }))} 
                              placeholder="Lot" 
                              className="px-2 py-1 border rounded text-sm w-full" 
                            />
                            <input 
                              type="text" 
                              value={resInfoDraft.quartier} 
                              onChange={(e) => setResInfoDraft(prev => ({ ...prev, quartier: e.target.value }))} 
                              placeholder="Quartier" 
                              className="px-2 py-1 border rounded text-sm w-full" 
                            />
                            <input 
                              type="text" 
                              value={resInfoDraft.ville} 
                              onChange={(e) => setResInfoDraft(prev => ({ ...prev, ville: e.target.value }))} 
                              placeholder="Ville" 
                              className="px-2 py-1 border rounded text-sm w-full" 
                            />
                            <div className="flex space-x-2 mt-2">
                              <button onClick={saveResidenceInfo} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Enregistrer</button>
                              <button onClick={cancelEditResidenceInfo} className="px-3 py-2 bg-gray-100 rounded text-sm">Annuler</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Liste des résidents */}
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg border border-gray-200/60 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Naissance</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">CIN</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Téléphone</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Genre</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/30">
                          {selectedResidence.residents && selectedResidence.residents.length > 0 ? (
                            selectedResidence.residents.map((resident) => (
                              <tr key={resident.id} className="hover:bg-gray-50/30">
                                <td className="px-4 py-3 text-sm text-gray-800">{resident.nomComplet}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {resident.dateNaissance ? new Date(resident.dateNaissance).toLocaleDateString('fr-FR') : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {resident.dateNaissance && estMajeur(resident.dateNaissance) && resident.cin 
                                    ? resident.cin 
                                    : '-'
                                  }
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{resident.telephone || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {resident.genre === 'homme' ? 'H' : 'F'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {resident.is_proprietaire ? 'Propriétaire' : 
                                   resident.relation_type === 'enfant' ? 'Enfant' :
                                   resident.relation_type === 'parent' ? 'Parent' :
                                   resident.relation_type === 'conjoint' ? 'Conjoint' :
                                   'Locataire'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-4 py-3 text-sm text-gray-500 text-center">
                                Aucun résident enregistré
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bouton pour passer en mode édition */}
                  <div className="flex mt-6 pt-4 border-t border-gray-200/60">
                    <button
                      onClick={handleEditResidents}
                      className="w-full px-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Ajouter des résidents
                    </button>
                  </div>
                </>
              ) : (
                /* MODE ÉDITION */
                <>
                  {/* Tableau d'édition des résidents */}
                  <div className="mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Naissance</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">CIN</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Téléphone</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Genre</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Propriétaire</th>
                            <th className="border border-gray-200/60 px-3 py-2 text-left text-xs font-medium text-gray-500">Relation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedResidents.map((resident) => {
                            const age = resident.dateNaissance ? calculerAge(resident.dateNaissance) : 0;
                            const majeur = age >= 18;

                            return (
                              <tr key={resident.id} className="hover:bg-gray-50/30">
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="text"
                                    value={resident.nomComplet || ""}
                                    onChange={(e) => handleResidentChange(resident.id, "nomComplet", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                    placeholder="Nom complet"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="date"
                                    value={resident.dateNaissance || ""}
                                    onChange={(e) => handleResidentChange(resident.id, "dateNaissance", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  {majeur ? (
                                    <input
                                      type="text"
                                      value={resident.cin || ""}
                                      onChange={(e) => handleResidentChange(resident.id, "cin", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                      placeholder="CIN"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <input
                                    type="tel"
                                    value={resident.telephone || ""}
                                    onChange={(e) => handleResidentChange(resident.id, "telephone", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                    placeholder="0341234567"
                                  />
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <select
                                    value={resident.genre || "homme"}
                                    onChange={(e) => handleResidentChange(resident.id, "genre", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  >
                                    <option value="homme">H</option>
                                    <option value="femme">F</option>
                                  </select>
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <select
                                    value={resident.is_proprietaire ? "true" : "false"}
                                    onChange={(e) => handleResidentChange(resident.id, "is_proprietaire", e.target.value === "true")}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  >
                                    <option value="false">Locataire</option>
                                    <option value="true">Propriétaire</option>
                                  </select>
                                </td>
                                <td className="border border-gray-200/60 px-3 py-2">
                                  <select
                                    value={resident.relation_type || ""}
                                    onChange={(e) => handleResidentChange(resident.id, "relation_type", e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white/50"
                                  >
                                    <option value="">Aucune</option>
                                    <option value="parent">Parent</option>
                                    <option value="enfant">Enfant</option>
                                    <option value="conjoint">Conjoint</option>
                                    <option value="ami">Ami</option>
                                    <option value="autre">Autre</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    onClick={() => handleRemoveResident(resident.id)}
                                    className="p-1 rounded-md text-red-600 hover:bg-red-50"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Petit formulaire pour ajouter une nouvelle personne (mode édition) */}
                  <div className="mt-4 mb-4 p-3 bg-white/30 rounded border border-gray-200/60">
                    <h4 className="font-medium text-gray-800 mb-3">Ajouter un nouveau résident</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newResident.nomComplet}
                        onChange={(e) => handleNewResidentChange('nomComplet', e.target.value)}
                        placeholder="Nom complet"
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={newResident.dateNaissance}
                        onChange={(e) => handleNewResidentChange('dateNaissance', e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={newResident.cin}
                        onChange={(e) => handleNewResidentChange('cin', e.target.value)}
                        placeholder="CIN"
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="tel"
                        value={newResident.telephone}
                        onChange={(e) => handleNewResidentChange('telephone', e.target.value)}
                        placeholder="Téléphone"
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={newResident.genre}
                        onChange={(e) => handleNewResidentChange('genre', e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                      <select
                        value={newResident.is_proprietaire ? "true" : "false"}
                        onChange={(e) => handleNewResidentChange('is_proprietaire', e.target.value === "true")}
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="false">Locataire</option>
                        <option value="true">Propriétaire</option>
                      </select>
                      <select
                        value={newResident.relation_type}
                        onChange={(e) => handleNewResidentChange('relation_type', e.target.value)}
                        className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Type de relation</option>
                        <option value="parent">Parent</option>
                        <option value="enfant">Enfant</option>
                        <option value="conjoint">Conjoint</option>
                        <option value="ami">Ami</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleAddResident}
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Ajouter la personne
                      </button>
                    </div>
                  </div>

                  {/* Boutons de sauvegarde/annulation */}
                  <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200/60">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
    </div>
  );
}