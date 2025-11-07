// 🏷️ Import des icônes depuis la librairie lucide-react
import { 
    Building2, Home, Users, MapPin, Plus, X, ChevronLeft, ChevronRight, Trash 
  } from "lucide-react";
  
  // 🏷️ Import de React et des hooks useState et useEffect
  import React, { useState, useEffect } from "react";
  
  // 📌 Composant principal Résidences
  export default function Residences() {
    // ⚡ State pour stocker toutes les résidences
    const [residences, setResidences] = useState([]);
  
    // ⚡ State pour stocker les infos de la résidence en cours d'ajout/modification
    const [newResidence, setNewResidence] = useState({
      id: null,
      nom: "",
      adresse: "",
      proprietaire: "",
      fokontany: "",
      latitude: "",
      longitude: "",
      habitants: "",
      image: null,
    });
  
    // ⚡ State pour gérer l'affichage du modal d'ajout/modification
    const [showModal, setShowModal] = useState(false);
  
    // ⚡ State pour afficher le modal de détails
    const [showDetails, setShowDetails] = useState(false);
  
    // ⚡ State pour stocker la résidence sélectionnée pour le modal détails
    const [selectedResidence, setSelectedResidence] = useState(null);
  
    // 🆕 State pour la confirmation de suppression
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [resToDelete, setResToDelete] = useState(null);
  
    // 📄 Pagination
    const [currentPage, setCurrentPage] = useState(1); // page actuelle
    const residencesPerPage = 8; // nombre de résidences par page
  
    // 🔢 Calcul des indices pour pagination
    const indexOfLastResidence = currentPage * residencesPerPage;
    const indexOfFirstResidence = indexOfLastResidence - residencesPerPage;
    const currentResidences = residences.slice(
      indexOfFirstResidence,
      indexOfLastResidence
    );
  
    // 📊 Calcul du nombre total de pages
    const totalPages = Math.ceil(residences.length / residencesPerPage);
  
    // 🔄 Fonction pour changer de page
    const goToPage = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    };
  
    // 📥 useEffect pour charger les résidences depuis le backend au chargement du composant
    useEffect(() => {
      fetch("http://localhost:8081/residences") // URL backend
        .then((res) => res.json()) // convertir la réponse en JSON
        .then((data) => {
          // 🔄 Formatage des données pour l'affichage
          const formatted = data.map((item) => ({
            id: item.id_res,
            nom: item.nom_res,
            proprietaire: item.propriete_res,
            adresse: item.adresse_res,
            fokontany: item.fkt_res,
            latitude: parseFloat(item.lat_res),
            longitude: parseFloat(item.long_res),
            habitants: item.nbr_res,
            image: item.img_res
              ? `http://localhost:8081/uploads/${item.img_res}`
              : null,
          }));
          setResidences(formatted); // stocker dans le state
        })
        .catch((err) => console.error("Erreur de chargement :", err));
    }, []); // [] → exécuter une seule fois au montage
  
    // 🔤 Gestion des champs texte (nom, adresse, propriétaire, etc.)
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewResidence({ ...newResidence, [name]: value });
    };
  
    // 🖼️ Gestion du fichier image
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) setNewResidence({ ...newResidence, image: file });
    };
  
    // ✏️ Fonction pour ouvrir le modal en mode édition
    const handleEditResidence = (res) => {
      setNewResidence({
        id: res.id,
        nom: res.nom,
        adresse: res.adresse,
        proprietaire: res.proprietaire,
        fokontany: res.fokontany,
        latitude: res.latitude,
        longitude: res.longitude,
        habitants: res.habitants,
        image: null, // on ne pré-remplit pas l'image
      });
      setShowModal(true);
    };
  
    // 🗑️ Fonction pour supprimer une résidence
    const handleDeleteResidence = async () => {
      if (!resToDelete) return; // si aucune résidence sélectionnée
  
      try {
        const response = await fetch(
          `http://localhost:8081/residences/${resToDelete.id}`,
          { method: "DELETE" } // requête DELETE
        );
        if (!response.ok) throw new Error("Erreur de suppression");
  
        // 🔄 Supprimer du state local
        setResidences(residences.filter((r) => r.id !== resToDelete.id));
  
        // 🔒 Fermer le modal de confirmation
        setShowDeleteConfirm(false);
        setResToDelete(null);
      } catch (err) {
        console.error("Erreur de suppression :", err);
        alert("❌ Une erreur est survenue lors de la suppression");
      }
    };
  
    // 🆕 Fonction pour ajouter ou modifier une résidence
    const handleAddResidence = async (e) => {
      e.preventDefault(); // empêcher le rechargement de page
  
      // ⚙️ Préparer les données pour l'API (FormData pour inclure l'image)
      const formData = new FormData();
      formData.append("nom_res", newResidence.nom);
      formData.append("propriete_res", newResidence.proprietaire);
      formData.append("adresse_res", newResidence.adresse);
      formData.append("fkt_res", newResidence.fokontany);
      formData.append("lat_res", newResidence.latitude);
      formData.append("long_res", newResidence.longitude);
      formData.append("nbr_res", newResidence.habitants);
      if (newResidence.image) formData.append("image", newResidence.image);
  
      try {
        // 🔀 Choisir POST pour ajout, PUT pour modification
        const url = newResidence.id
          ? `http://localhost:8081/residences/${newResidence.id}`
          : "http://localhost:8081/residences";
        const method = newResidence.id ? "PUT" : "POST";
  
        const response = await fetch(url, { method, body: formData });
        if (!response.ok) throw new Error("Erreur d’envoi au serveur");
  
        // 🔄 Recharger la liste des résidences depuis le backend
        const data = await fetch("http://localhost:8081/residences").then((r) =>
          r.json()
        );
        const formatted = data.map((item) => ({
          id: item.id_res,
          nom: item.nom_res,
          proprietaire: item.propriete_res,
          adresse: item.adresse_res,
          fokontany: item.fkt_res,
          latitude: parseFloat(item.lat_res),
          longitude: parseFloat(item.long_res),
          habitants: item.nbr_res,
          image: item.img_res
            ? `http://localhost:8081/uploads/${item.img_res}`
            : null,
        }));
        setResidences(formatted); // mise à jour du state
  
        // 🔒 Réinitialiser le modal
        setShowModal(false);
        setNewResidence({
          id: null,
          nom: "",
          adresse: "",
          proprietaire: "",
          fokontany: "",
          latitude: "",
          longitude: "",
          habitants: "",
          image: null,
        });
      } catch (err) {
        console.error("Erreur :", err);
      }
    };
  
    return (
      <div className="p-6 h-[80vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-[#C0392B]" />
              Résidences enregistrées
            </h2>
            <p className="text-gray-500 mt-1">
              Liste des habitations du Fokontany avec leurs informations de base.
            </p>
          </div>
  
          {/* Bouton Ajouter */}
          <button
            onClick={() => {
              setNewResidence({
                id: null,
                nom: "",
                adresse: "",
                proprietaire: "",
                fokontany: "",
                latitude: "",
                longitude: "",
                habitants: "",
                image: null,
              });
              setShowModal(true); // ouvrir modal
            }}
            className="px-4 py-2 bg-[#C0392B] text-white rounded-lg hover:bg-[#A93226] transition"
          >
            <Plus className="inline-block mr-1" /> Ajouter
          </button>
        </div>
  
        {/* LISTE DES RÉSIDENCES */}
        <div className="h-[80vh] overflow-y-auto pr-2 scrollbar-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentResidences.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Image */}
                <div className="h-30 w-full bg-gray-200 overflow-hidden">
                  {res.image ? (
                    <img
                      src={res.image}
                      alt={res.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Pas d’image
                    </div>
                  )}
                </div>
  
                {/* Informations */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {res.nom}
                    </h3>
                    <Home className="text-[#C0392B] w-5 h-5" />
                  </div>
  
                  <div className="text-gray-500 text-sm">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-[#E74C3C]" />
                      {res.adresse}
                    </p>
                    <p className="flex items-center mt-1">
                      <Users className="w-4 h-4 mr-2 text-[#27AE60]" />
                      {res.habitants} habitants
                    </p>
                    <p className="text-gray-700 mt-1 text-sm">
                      <span className="font-medium">Propriétaire :</span>{" "}
                      {res.proprietaire}
                    </p>
                    <p className="text-gray-700 mt-1 text-sm">
                      <span className="font-medium">Fokontany :</span>{" "}
                      {res.fokontany}
                    </p>
                  </div>
  
                  {/* Boutons actions */}
                  <div className="pt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedResidence(res);
                        setShowDetails(true);
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800  text-sm py-2 rounded-lg transition"
                    >
                      Détails
                    </button>
  
                    <button
                      onClick={() => handleEditResidence(res)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg transition"
                    >
                      Modifier
                    </button>
  
                    <button
                      onClick={() => {
                        setResToDelete(res);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* MODAL DE CONFIRMATION SUPPRESSION */}
        {showDeleteConfirm && resToDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Supprimer la résidence ?
              </h3>
              <p className="text-gray-600 mb-6">
                Voulez-vous vraiment supprimer le residence du {" "}
                <span className="font-semibold text-[#C0392B]">
                  {resToDelete.nom}
                </span>{" "}
                ?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteResidence}
                  className="px-4 py-2 bg-[#C0392B] text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* MODAL AJOUT / MODIF */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative animate-fadeIn">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Ajouter une habitation
              </h3>
  
              <form onSubmit={handleAddResidence} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom de la maison
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={newResidence.nom}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                  />
                </div>
  
                {/* Propriétaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Propriétaire
                  </label>
                  <input
                    type="text"
                    name="proprietaire"
                    value={newResidence.proprietaire}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                  />
                </div>
  
                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={newResidence.adresse}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                  />
                </div>
  
                {/* Fokontany */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fokontany
                  </label>
                  <input
                    type="text"
                    name="fokontany"
                    value={newResidence.fokontany}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                  />
                </div>
  
                {/* Coordonnées GPS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={newResidence.latitude}
                      onChange={handleInputChange}
                      required
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={newResidence.longitude}
                      onChange={handleInputChange}
                      required
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                    />
                  </div>
                </div>
  
                {/* Habitants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre d’habitants
                  </label>
                  <input
                    type="number"
                    name="habitants"
                    value={newResidence.habitants}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C0392B] outline-none"
                  />
                </div>
  
                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Image de la maison
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
  
                {/* Boutons */}
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C0392B] text-white rounded-lg hover:bg-[#A93226] transition"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
  
        {/* MODAL DÉTAILS */}
        {showDetails && selectedResidence && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-3 right-3 text-gray-400 hover:bg-[#A93226]"
              >
                <X className="w-5 h-5" />
              </button>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {selectedResidence.nom}
              </h3>
  
              {selectedResidence.image ? (
                <img
                  src={selectedResidence.image}
                  alt={selectedResidence.nom}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg mb-3">
                  Pas d’image
                </div>
              )}
  
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Adresse :</strong> {selectedResidence.adresse}
                </p>
                <p>
                  <strong>Propriétaire :</strong> {selectedResidence.proprietaire}
                </p>
                <p>
                  <strong>Fokontany :</strong> {selectedResidence.fokontany}
                </p>
                <p>
                  <strong>Habitants :</strong> {selectedResidence.habitants}
                </p>
                <p>
                  <strong>Coordonnées :</strong>{" "}
                  {selectedResidence.latitude && selectedResidence.longitude
                    ? `${selectedResidence.latitude.toFixed(
                        4
                      )}, ${selectedResidence.longitude.toFixed(4)}`
                    : "—"}
                </p>
              </div>
  
              <div className="pt-4 text-right">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-[#C0392B] text-white rounded-lg hover:bg-[#A93226]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex px-3 py-2 rounded-lg text-sm ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#C0392B] text-white hover:bg-[#A93226]"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mt-1" />
              <span>Précédent</span>
            </button>
  
            {/* Numéros de page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => goToPage(num)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  currentPage === num
                    ? "bg-[#C0392B] text-white border-[#C0392B]"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {num}
              </button>
            ))}
  
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex px-3 py-2 rounded-lg text-sm ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#C0392B] text-white hover:bg-[#A93226]"
              }`}
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4 mt-1" />
            </button>
          </div>
        )}
      </div>
    );
  };
  