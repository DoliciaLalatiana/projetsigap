import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  Home,
  Users,
  Eye,
  MapPin,
  User,
  Map,
  ChevronLeft,
  ChevronRight,
  Camera,
  Mars,
  Venus,
  Phone,
  Calendar,
  Building,
  X,
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Composant modal pour l'agrandissement d'image
const ImageModal = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNext, 
  onPrev 
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted || !isOpen || !images || images.length === 0) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay avec assombrissement */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleOverlayClick}
      />
      
      {/* Modal d'image */}
      <div 
        className="relative bg-white rounded-lg overflow-hidden w-[80vw] max-w-4xl h-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="text-sm text-gray-600">
            Image {currentIndex + 1} sur {images.length}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            style={{ 
              width: '32px', 
              height: '32px',
              color: '#374151'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu de l'image */}
        <div className="flex-1 relative flex items-center justify-center p-4 bg-gray-900">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-[calc(85vh-80px)] object-contain"
          />

          {/* Flèches de navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                style={{ 
                  width: '40px', 
                  height: '40px'
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                style={{ 
                  width: '40px', 
                  height: '40px'
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// NOUVEAU COMPOSANT : Modal pour ajouter des photos
const AddPhotosModal = ({
  isOpen,
  onClose,
  onUpload,
  selectedResidence,
  photoInputRef
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      const urls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Cleanup preview URLs
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setPreviewUrls([]);
    }
  }, [selectedFiles]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !selectedResidence) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
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
      
      if (onUpload && result.photos && result.photos.length > 0) {
        onUpload(result.photos);
      }
      
      setSelectedFiles([]);
      setPreviewUrls([]);
      onClose();
      
    } catch (err) {
      console.warn("Erreur lors de l'upload des photos:", err);
      alert("Erreur lors de l'upload des photos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const handleClickAddPhotos = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  if (!isMounted || !isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-100 rounded-3xl shadow-2xl w-[500px] h-auto max-h-[600px] overflow-hidden flex flex-col transform transition-all ml-24"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">
            Ajouter des photos à la résidence
          </h2>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors p-2 shadow-2xl"
            style={{ 
              width: '40px', 
              height: '40px',
              backgroundColor: 'white',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Bouton pour sélectionner des fichiers */}
            <div
              onClick={handleClickAddPhotos}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              style={{ backgroundColor: 'white' }}
            >
              <Upload size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Cliquez pour sélectionner des photos
              </p>
              <p className="text-gray-500 text-sm mt-1">
                PNG, JPG, JPEG jusqu'à 10MB
              </p>
              <input
                type="file"
                ref={photoInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>

            {/* Prévisualisation des photos sélectionnées */}
            {previewUrls.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">
                  Photos à uploader ({selectedFiles.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {selectedFiles[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information sur la résidence */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Résidence concernée :</h4>
              <p className="text-gray-800 font-semibold">{selectedResidence?.name}</p>
              <p className="text-gray-600 text-sm">{selectedResidence?.adresse}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 px-6 py-4 border-gray-300 bg-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs py-2.5"
            style={{
              maxWidth: '200px',
              borderColor: '#E5E7EB'
            }}
            disabled={isUploading}
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              maxWidth: '200px'
            }}
          >
            {isUploading ? 'Upload en cours...' : 'Uploader les photos'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Composant modal séparé pour l'ajout de résident
const AddResidentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  newResident, 
  setNewResident,
  dateInput,
  setDateInput,
  dateError,
  setDateError,
  nomInputRef,
  prenomInputRef,
  dateNaissanceInputRef,
  cinInputRef,
  telephoneInputRef
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && nomInputRef.current) {
      setTimeout(() => {
        nomInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

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
        case "save":
          onSave();
          break;
        default:
          break;
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isMounted || !isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay avec diminution de luminosité */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={handleCancel}
      />
      
      {/* Modal principal - MODIFIÉ POUR ARRONDI ET COULEUR GRIS CLAIR */}
      <div 
        className="relative bg-gray-100 rounded-3xl shadow-2xl w-[480px] h-auto max-h-[600px] overflow-hidden flex flex-col transform transition-all ml-24"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du modal - MODIFIÉ POUR LE BOUTON X AVEC SHADOW */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">
            Ajouter un résident
          </h2>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors p-2 shadow-2xl"
            style={{ 
              width: '40px', 
              height: '40px',
              backgroundColor: 'white',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Contenu du modal */}
        <div className="flex-1 overflow-y-auto px-6 py-4 ml-4">
          {/* Formulaire avec champs en blanc */}
          <div className="space-y-4">
            {/* Champ Nom */}
            <div>
              <input
                ref={nomInputRef}
                type="text"
                value={newResident.nom}
                onChange={(e) =>
                  handleNewResidentChange("nom", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, "prenom")}
                className="w-full px-3 py-2.5 bg-white rounded-lg text-sm placeholder-gray-500"
                style={{
                  maxWidth: '300px',
                  border: '1px solid #E5E7EB',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease'
                }}
                placeholder="Nom"
                maxLength={50}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Champ Prénom */}
            <div>
              <input
                ref={prenomInputRef}
                type="text"
                value={newResident.prenom}
                onChange={(e) =>
                  handleNewResidentChange("prenom", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, "dateNaissance")}
                className="w-full px-3 py-2.5 bg-white rounded-lg text-sm placeholder-gray-500"
                style={{
                  maxWidth: '300px',
                  border: '1px solid #E5E7EB',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease'
                }}
                placeholder="Prénom"
                maxLength={50}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Sélection Sexe - Radio boutons en couleur bleu */}
            <div className="pl-4">
              <div className="mb-2 text-sm font-medium text-gray-700">
                Sexe
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sexe"
                    value="homme"
                    checked={newResident.sexe === "homme"}
                    onChange={(e) =>
                      handleNewResidentChange("sexe", e.target.value)
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    style={{
                      accentColor: '#3B82F6' // Couleur bleue pour les radios
                    }}
                  />
                  <span className="text-gray-700 text-sm">Masculin</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sexe"
                    value="femme"
                    checked={newResident.sexe === "femme"}
                    onChange={(e) =>
                      handleNewResidentChange("sexe", e.target.value)
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    style={{
                      accentColor: '#3B82F6' // Couleur bleue pour les radios
                    }}
                  />
                  <span className="text-gray-700 text-sm">Féminin</span>
                </label>
              </div>
            </div>

            {/* Champ Date de naissance */}
            <div>
              <input
                ref={dateNaissanceInputRef}
                type="text"
                value={dateInput}
                onChange={handleDateChange}
                onFocus={(e) => {
                  handleDateFocus(e);
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onKeyDown={handleDateKeyDown}
                onBlur={(e) => {
                  handleDateBlur();
                  e.target.style.boxShadow = 'none';
                }}
                className="w-full px-3 py-2.5 bg-white rounded-lg text-sm font-mono text-left placeholder-gray-500"
                style={{
                  maxWidth: '300px',
                  border: dateError ? '1px solid #EF4444' : '1px solid #E5E7EB',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                }}
                placeholder="Date de naissance (jj/mm/aaaa)"
                maxLength={10}
              />
              {dateError && (
                <p className="mt-1 text-xs text-red-600">{dateError}</p>
              )}
            </div>

            {/* Section CIN (conditionnelle pour majeurs) */}
            {estMajeurFromInput() && (
              <div className="animate-fadeIn">
                <input
                  ref={cinInputRef}
                  type="text"
                  value={newResident.cin}
                  onChange={(e) =>
                    handleNewResidentChange("cin", e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(e, "telephone")}
                  className="w-full px-3 py-2.5 bg-white rounded-lg text-sm font-mono placeholder-gray-500"
                  style={{
                    maxWidth: '300px',
                    border: '1px solid #E5E7EB',
                    outline: 'none',
                    transition: 'box-shadow 0.2s ease'
                  }}
                  placeholder="CIN"
                  maxLength={12}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Champ réservé aux personnes majeures uniquement
                </p>
              </div>
            )}

            {/* Champ Téléphone */}
            <div>
              <input
                ref={telephoneInputRef}
                type="text"
                value={newResident.telephone}
                onChange={(e) =>
                  handleNewResidentChange("telephone", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, "save")}
                className="w-full px-3 py-2.5 bg-white rounded-lg text-sm font-mono placeholder-gray-500"
                style={{
                  maxWidth: '300px',
                  border: '1px solid #E5E7EB',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease'
                }}
                placeholder="Téléphone"
                maxLength={10}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className="flex space-x-3 px-6 py-4 border-gray-300 bg-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs py-2.5"
            style={{
              maxWidth: '200px',
              borderColor: '#E5E7EB'
            }}
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs py-2.5"
            style={{
              maxWidth: '200px'
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// NOUVEAU COMPOSANT : RésidentsList pour afficher directement les résidents
const ResidentsList = ({ 
  residents, 
  onBackToResidences, 
  searchQuery,
  onViewOnMap,
  residencesList 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10;
  
  // Pagination
  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = residents.slice(indexOfFirstResident, indexOfLastResident);
  const totalPages = Math.ceil(residents.length / residentsPerPage);

  // Fonction pour formater le genre
  const formatGenre = (genre) => {
    return genre === "homme" ? "Masculin" : "Féminin";
  };

  // Fonction pour extraire le nom et prénom
  const extractNomPrenom = (nomComplet) => {
    if (!nomComplet) return { nom: "", prenom: "" };
    const parts = nomComplet.split(" ");
    if (parts.length === 1) return { nom: parts[0], prenom: "" };
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(" "),
    };
  };

  // Fonction pour formater la date
  const formatDateHyphen = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fonction pour trouver la résidence d'un résident
  const findResidenceForResident = (residentId) => {
    const resident = residents.find(r => r.id === residentId);
    if (resident && resident.residence_id) {
      return residencesList.find(r => r.id === resident.residence_id);
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-full flex flex-col p-6 space-y-6 min-h-screen" style={{ padding: '24px 32px' }}>
        {/* Titre et bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBackToResidences}
              className="mr-3 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
              style={{ 
                width: '20px', 
                height: '20px',
                color: '#374151'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 
              className="text-black"
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#000000'
              }}
            >
              Résultats de recherche: "{searchQuery}"
            </h1>
          </div>
        </div>

        {/* Statistiques */}
        <div>
          <div className="grid grid-cols-4 gap-5">
            <div 
              className="flex items-center p-4"
              style={{
                height: '92px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center w-full">
                <div 
                  className="flex items-center justify-center mr-4"
                  style={{ width: '48px', height: '48px' }}
                >
                  <Users 
                    size={24} 
                    style={{ color: '#000000' }}
                  />
                </div>
                <div>
                  <div 
                    className="font-semibold text-black"
                    style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#000000'
                    }}
                  >
                    {residents.length}
                  </div>
                  <div 
                    className="text-gray-600"
                    style={{ 
                      fontSize: '12.5px',
                      color: '#6B7280'
                    }}
                  >
                    Résidents trouvés
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des résidents */}
        <div className="flex-1 mb-4">
          <div 
            className="bg-white rounded-2xl flex flex-col"
            style={{
              width: '100%',
              minHeight: '500px',
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              padding: '24px',
              overflow: 'hidden'
            }}
          >
            {/* En-tête du tableau */}
            <div className="flex-shrink-0 mb-1">
              <div className="flex items-center" style={{ height: '48px' }}>
                <div style={{ width: '60px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    N°
                  </div>
                </div>
                
                <div style={{ flex: 1, padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Nom
                  </div>
                </div>
                
                <div style={{ flex: 1, padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Prénom
                  </div>
                </div>
                
                <div style={{ width: '120px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold text-center"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Sexe
                  </div>
                </div>
                
                <div style={{ width: '150px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Date de naissance
                  </div>
                </div>
                
                <div style={{ width: '120px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    CIN
                  </div>
                </div>
                
                <div style={{ width: '150px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Téléphone
                  </div>
                </div>
                
                <div style={{ width: '120px', padding: '0 12px' }}>
                  <div 
                    className="font-semibold text-center"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280'
                    }}
                  >
                    Actions
                  </div>
                </div>
              </div>
            </div>

            {/* Corps du tableau */}
            <div className="flex-1 overflow-hidden">
              {currentResidents.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                    </div>
                    <h3 className="font-semibold mb-2" style={{ fontSize: '18px', color: '#000000' }}>
                      Aucun résident trouvé
                    </h3>
                  </div>
                </div>
              ) : (
                <div>
                  {currentResidents.map((resident, index) => {
                    const { nom, prenom } = extractNomPrenom(resident.nomComplet);
                    const displayNom = nom ? nom.toUpperCase() : "-";
                    const residence = findResidenceForResident(resident.id);
                    
                    return (
                      <div 
                        key={resident.id} 
                        className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        style={{ height: '60px' }}
                      >
                        <div style={{ width: '60px', padding: '0 12px' }}>
                          <span className="font-medium" style={{ fontSize: '14px', color: '#6B7280' }}>
                            {(currentPage - 1) * residentsPerPage + index + 1}
                          </span>
                        </div>
                        
                        <div style={{ flex: 1, padding: '0 12px' }}>
                          <div className="font-semibold" style={{ fontSize: '14px', color: '#000000' }}>
                            {displayNom}
                          </div>
                        </div>
                        
                        <div style={{ flex: 1, padding: '0 12px' }}>
                          <div className="font-semibold" style={{ fontSize: '14px', color: '#000000' }}>
                            {prenom || "-"}
                          </div>
                        </div>
                        
                        <div style={{ width: '120px', padding: '0 12px' }}>
                          <div className="flex items-center justify-center">
                            {formatGenre(resident.genre) === "Masculin" ? (
                              <Mars className="w-4 h-4 text-black mr-2" />
                            ) : (
                              <Venus className="w-4 h-4 text-black mr-2" />
                            )}
                            <span className="text-sm font-medium text-black">
                              {formatGenre(resident.genre)}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ width: '150px', padding: '0 12px' }}>
                          <div className="text-sm text-gray-600">
                            {resident.dateNaissance ? formatDateHyphen(resident.dateNaissance) : "-"}
                          </div>
                        </div>
                        
                        <div style={{ width: '120px', padding: '0 12px' }}>
                          <div className="text-sm font-mono text-gray-600">
                            {resident.cin || "-"}
                          </div>
                        </div>
                        
                        <div style={{ width: '150px', padding: '0 12px' }}>
                          <div className="text-sm text-gray-600">
                            {resident.telephone ? `+261 ${resident.telephone}` : "-"}
                          </div>
                        </div>
                        
                        <div style={{ width: '120px', padding: '0 12px' }}>
                          <div className="text-center">
                            {residence && onViewOnMap && (
                              <button
                                onClick={() => onViewOnMap(residence)}
                                className="flex items-center justify-center bg-white border border-gray-300 text-black hover:bg-gray-50 transition-colors font-medium"
                                style={{
                                  height: '32px',
                                  borderRadius: '999px',
                                  padding: '0 12px',
                                  fontSize: '13px',
                                  borderColor: '#D1D5DB',
                                  color: '#000000'
                                }}
                                title="Voir sur la carte"
                              >
                                <Map size={14} className="mr-2" style={{ color: '#000000' }} />
                                Carte
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 pt-2" style={{ paddingTop: '16px' }}>
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2"
                    style={{
                      borderRadius: '999px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      height: '40px',
                      width: '220px',
                      justifyContent: 'center'
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '999px',
                        borderColor: '#D1D5DB'
                      }}
                    >
                      <ChevronLeft size={16} style={{ color: '#000000' }} />
                    </button>

                    <div className="flex items-center space-x-2">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`flex items-center justify-center font-medium transition-colors ${
                                currentPage === pageNum
                                  ? "bg-gray-900 text-white"
                                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                              }`}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                borderColor: '#D1D5DB'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span className="text-gray-400" style={{ fontSize: '14px', color: '#6B7280' }}>
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '999px',
                        borderColor: '#D1D5DB'
                      }}
                    >
                      <ChevronRight size={16} style={{ color: '#000000' }} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResidencePage({
  onBack,
  searchQuery,
  onSearchChange,
  onViewOnMap,
  detailMode,
  onEnterDetail,
  onExitDetail,
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

  // NOUVEAU ÉTAT : Mode de recherche (résidences vs résidents)
  const [searchMode, setSearchMode] = useState("residences"); // "residences" ou "residents"
  
  // NOUVEAU ÉTAT : Résidents filtrés par recherche
  const [filteredResidents, setFilteredResidents] = useState([]);

  // ÉTAT POUR GÉRER LA DATE DE NAISSANCE AVEC FORMAT VISIBLE
  const [dateInput, setDateInput] = useState("");

  // ÉTAT POUR GÉRER L'ERREUR DE DATE
  const [dateError, setDateError] = useState("");

  // NOUVEAUX ÉTATS : Pour stocker les résidents de toutes les résidences
  const [allResidents, setAllResidents] = useState([]);

  // NOUVEAUX ÉTATS POUR LA GESTION DES PHOTOS
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);

  // ÉTAT POUR LE MODAL D'AJOUT DE RÉSIDENT
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);

  // NOUVEAU ÉTAT POUR LE MODAL D'AJOUT DE PHOTOS
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);

  // ÉTAT POUR LE MODAL D'IMAGE
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // NOUVEAU EFFET : Lorsque la recherche change, filtrer les résidents
  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.toLowerCase().trim();
      
      // Filtrer les résidents
      const filtered = allResidents.filter((resident) => {
        const nomComplet = resident.nomComplet?.toLowerCase() || "";
        const nom = resident.nom?.toLowerCase() || "";
        const prenom = resident.prenom?.toLowerCase() || "";
        const cin = resident.cin?.toLowerCase() || "";
        const telephone = resident.telephone?.toLowerCase() || "";

        return (
          nomComplet.includes(searchTerm) ||
          nom.includes(searchTerm) ||
          prenom.includes(searchTerm) ||
          cin.includes(searchTerm) ||
          telephone.includes(searchTerm)
        );
      });
      
      setFilteredResidents(filtered);
      
      // Si on trouve des résidents, passer en mode "residents"
      if (filtered.length > 0) {
        setSearchMode("residents");
      } else {
        setSearchMode("residences");
      }
    } else {
      // Si pas de recherche, revenir au mode résidences
      setSearchMode("residences");
      setFilteredResidents([]);
    }
  }, [searchQuery, allResidents]);

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

        setSelectedResidence((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), ...newPhotoUrls],
        }));

        setResList((list) =>
          list.map((r) =>
            r.id === selectedResidence.id ? { ...r, photos: newPhotoUrls } : r
          )
        );
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

  // NOUVELLE FONCTION : Pour gérer l'upload de photos depuis le modal
  const handleUploadPhotos = (newPhotos) => {
    const newPhotoUrls = newPhotos.map((photo) => {
      if (photo.url.startsWith("http")) {
        return photo.url;
      }
      return `${API_BASE}${photo.url.startsWith("/") ? "" : "/"}${photo.url}`;
    });

    setSelectedResidence((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...newPhotoUrls],
    }));

    setResList((list) =>
      list.map((r) =>
        r.id === selectedResidence.id ? { 
          ...r, 
          photos: [...(r.photos || []), ...newPhotoUrls] 
        } : r
      )
    );
  };

  const handleViewDetails = async (residence) => {
    try {
      console.log("Opening details for residence:", residence.id);
      
      // NOUVEAU : Entrer en mode détail
      if (onEnterDetail) {
        onEnterDetail();
      }

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

      // Calculer le nombre réel de résidents
      const totalRealResidents = normalizedPersons.length;
      const hommesReal = normalizedPersons.filter(
        (person) =>
          person.genre === "homme" ||
          person.genre === "Homme" ||
          person.genre === "male"
      ).length;
      const femmesReal = normalizedPersons.filter(
        (person) =>
          person.genre === "femme" ||
          person.genre === "Femme" ||
          person.genre === "female"
      ).length;

      setSelectedResidence({
        ...base,
        photos: photos,
        residents: normalizedPersons,
        totalResidents: totalRealResidents,
        hommes: hommesReal,
        femmes: femmesReal,
      });

      setIsPhotoExpanded(false);
      setIsFullScreenPhoto(false);

      setShowModal(true);
    } catch (e) {
      console.error("Error loading residence details:", e);
      // Fallback au minimum
      const totalRealResidents = residence.residents ? residence.residents.length : 0;
      const hommesReal = residence.residents ? residence.residents.filter(
        (person) =>
          person.genre === "homme" ||
          person.genre === "Homme" ||
          person.genre === "male"
      ).length : 0;
      const femmesReal = residence.residents ? residence.residents.filter(
        (person) =>
          person.genre === "femme" ||
          person.genre === "Femme" ||
          person.genre === "female"
      ).length : 0;

      setSelectedResidence({
        ...residence,
        photos: residence.photos || [],
        residents: residence.residents || [],
        totalResidents: totalRealResidents,
        hommes: hommesReal,
        femmes: femmesReal,
      });
      setShowModal(true);
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
    
    // NOUVEAU : Sortir du mode détail quand on ferme le modal
    if (onExitDetail) {
      onExitDetail();
    }
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

  // Fonctions pour le carrousel d'images
  const handleNextImage = useCallback(() => {
    if (selectedResidence?.photos && selectedResidence.photos.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === selectedResidence.photos.length - 1 ? 0 : prev + 1
      );
    }
  }, [selectedResidence]);

  const handlePrevImage = useCallback(() => {
    if (selectedResidence?.photos && selectedResidence.photos.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedResidence.photos.length - 1 : prev - 1
      );
    }
  }, [selectedResidence]);

  const handleOpenImageModal = (index = 0) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  // NOUVELLE FONCTION : Ouvrir le modal d'ajout de photos
  const handleOpenAddPhotosModal = () => {
    setShowAddPhotosModal(true);
  };

  // NOUVELLE FONCTION : Fermer le modal d'ajout de photos
  const handleCloseAddPhotosModal = () => {
    setShowAddPhotosModal(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
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

      // Mettre à jour les statistiques
      const updatedResidents = [
        ...(selectedResidence?.residents || []),
        {
          id: created.id,
          nomComplet: created.nom_complet || nomComplet,
          dateNaissance: created.date_naissance || dateInput,
          cin: created.cin || newResident.cin || "",
          genre: created.genre || newResident.sexe || "homme",
          telephone: created.telephone || newResident.telephone || "",
        },
      ];

      const totalRealResidents = updatedResidents.length;
      const hommesReal = updatedResidents.filter(
        (person) =>
          person.genre === "homme" ||
          person.genre === "Homme" ||
          person.genre === "male"
      ).length;
      const femmesReal = updatedResidents.filter(
        (person) =>
          person.genre === "femme" ||
          person.genre === "Femme" ||
          person.genre === "female"
      ).length;

      setSelectedResidence((prev) => ({
        ...prev,
        residents: updatedResidents,
        totalResidents: totalRealResidents,
        hommes: hommesReal,
        femmes: femmesReal,
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

  // Fonction pour retourner à la liste des résidences
  const handleBackToResidences = () => {
    setSearchMode("residences");
  };

  // Filtrage et tri des résidences (recherche dans les résidences)
  const searchInResidences = () => {
    if (!searchQuery || searchQuery.trim() === "") {
      return resList;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    
    return resList.filter((residence) => {
      const name = residence.name?.toLowerCase() || "";
      const lot = residence.lot?.toLowerCase() || "";
      const quartier = residence.quartier?.toLowerCase() || "";
      const ville = residence.ville?.toLowerCase() || "";
      const adresse = residence.adresse?.toLowerCase() || "";
      const proprietaire = residence.proprietaire?.toLowerCase() || "";

      return (
        name.includes(searchTerm) ||
        lot.includes(searchTerm) ||
        quartier.includes(searchTerm) ||
        ville.includes(searchTerm) ||
        adresse.includes(searchTerm) ||
        proprietaire.includes(searchTerm)
      );
    });
  };

  const filteredResidences = searchInResidences()
    .filter((residence) => {
      const matchesStatus =
        statusFilter === "all" || residence.status === statusFilter;
      return matchesStatus;
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

  // Calcul de la pagination pour les résidences
  const indexOfLastResidence = currentPage * residencesPerPage;
  const indexOfFirstResidence = indexOfLastResidence - residencesPerPage;
  const currentResidences = filteredResidences.slice(
    indexOfFirstResidence,
    indexOfLastResidence
  );
  const totalPages = Math.ceil(filteredResidences.length / residencesPerPage);

  // Pagination pour les résidents dans le modal
  const [residentPage, setResidentPage] = useState(1);
  const residentsPerPageInModal = 10;
  const indexOfLastResident = residentPage * residentsPerPageInModal;
  const indexOfFirstResident = indexOfLastResident - residentsPerPageInModal;
  const currentResidentsInModal = selectedResidence?.residents
    ? selectedResidence.residents.slice(indexOfFirstResident, indexOfLastResident)
    : [];
  const totalResidentPages = selectedResidence?.residents
    ? Math.ceil(selectedResidence.residents.length / residentsPerPageInModal)
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

  // Composant pour afficher un résident dans la liste - MODIFIÉ
  const ResidentRow = ({ resident }) => {
    const { nom, prenom } = extractNomPrenom(resident.nomComplet);
    const isMineur = resident.dateNaissance && !estMajeur(resident.dateNaissance);
    const displayNom = nom ? nom.toUpperCase() : "-";

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-800">{displayNom}</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-800">{prenom || "-"}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            {formatGenre(resident.genre) === "Masculin" ? (
              <Mars className="w-4 h-4 text-black mr-2" />
            ) : (
              <Venus className="w-4 h-4 text-black mr-2" />
            )}
            <span className={`text-sm font-medium text-black`}>
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

  // Composant pour l'en-tête de la liste des résidents - MODIFIÉ
  const ResidentListHeader = () => (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          NOM
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          PRÉNOM
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          SEXE
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          DATE DE NAISSANCE
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          CIN
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
          TEL.
        </th>
      </tr>
    </thead>
  );

  // AFFICHER LA LISTE DES RÉSIDENTS SI ON EST EN MODE RECHERCHE
  if (searchMode === "residents" && searchQuery && searchQuery.trim() !== "") {
    return (
      <ResidentsList 
        residents={filteredResidents}
        onBackToResidences={handleBackToResidences}
        searchQuery={searchQuery}
        onViewOnMap={onViewOnMap}
        residencesList={resList}
      />
    );
  }

  // SINON, AFFICHER LA LISTE DES RÉSIDENCES
  return (
    <>
      <div className="h-full flex">
        {/* Section principale - cachée quand le modal est ouvert */}
        {!showModal && (
          <div className="w-full">
            {/* Conteneur principal SANS fond semi-transparent */}
            <div 
              className="h-full flex flex-col p-6 space-y-6 min-h-screen"
              style={{ 
                padding: '24px 32px'
              }}
            >
              {/* Titre principal seulement - SUPPRESSION DE LA BARRE DE RECHERCHE */}
              <div className="flex items-center justify-between">
                <h1 
                  className="text-black"
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#000000'
                  }}
                >
                  Liste des Résidences
                </h1>
                {/* Barre de recherche SUPPRIMÉE - utilisation de la barre de recherche principale de l'interface */}
              </div>

              {/* Section des cartes statistiques - TOUJOURS VISIBLE */}
              <div>
                <div className="grid grid-cols-4 gap-5">
                  {/* Carte 1: Nombre total de résidences */}
                  <div 
                    className="flex items-center p-4"
                    style={{
                      height: '92px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div 
                        className="flex items-center justify-center mr-4"
                        style={{ width: '48px', height: '48px' }}
                      >
                        <Home 
                          size={24} 
                          style={{ color: '#000000' }}
                        />
                      </div>
                      <div>
                        <div 
                          className="font-semibold text-black"
                          style={{ 
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          {statistics.totalResidences}
                        </div>
                        <div 
                          className="text-gray-600"
                          style={{ 
                            fontSize: '12.5px',
                            color: '#6B7280'
                          }}
                        >
                          Résidences
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte 2: Nombre total de résidents */}
                  <div 
                    className="flex items-center p-4"
                    style={{
                      height: '92px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div 
                        className="flex items-center justify-center mr-4"
                        style={{ width: '48px', height: '48px' }}
                      >
                        <Users 
                          size={24} 
                          style={{ color: '#000000' }}
                        />
                      </div>
                      <div>
                        <div 
                          className="font-semibold text-black"
                          style={{ 
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          {statistics.totalResidents}
                        </div>
                        <div 
                          className="text-gray-600"
                          style={{ 
                            fontSize: '12.5px',
                            color: '#6B7280'
                          }}
                        >
                          Résidents
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte 3: Hommes */}
                  <div 
                    className="flex items-center p-4"
                    style={{
                      height: '92px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div 
                        className="flex items-center justify-center mr-4"
                        style={{ width: '48px', height: '48px' }}
                      >
                        <Mars 
                          size={24} 
                          style={{ color: '#000000' }}
                        />
                      </div>
                      <div>
                        <div 
                          className="font-semibold text-black"
                          style={{ 
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          {statistics.totalHommes}
                        </div>
                        <div 
                          className="text-gray-600"
                          style={{ 
                            fontSize: '12.5px',
                            color: '#6B7280'
                          }}
                        >
                          Hommes
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte 4: Femmes */}
                  <div 
                    className="flex items-center p-4"
                    style={{
                      height: '92px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div 
                        className="flex items-center justify-center mr-4"
                        style={{ width: '48px', height: '48px' }}
                      >
                        <Venus 
                          size={24} 
                          style={{ color: '#000000' }}
                        />
                      </div>
                      <div>
                        <div 
                          className="font-semibold text-black"
                          style={{ 
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          {statistics.totalFemmes}
                        </div>
                        <div 
                          className="text-gray-600"
                          style={{ 
                            fontSize: '12.5px',
                            color: '#6B7280'
                          }}
                        >
                          Femmes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteneur principal du tableau avec spécifications exactes */}
              <div className="flex-1 mb-4">
                <div 
                  className="bg-white rounded-2xl flex flex-col"
                  style={{
                    width: '100%',
                    minHeight: 'calc(4 * 68px + 48px + 2px + 20px + 48px)', // 4 lignes + header + pagination + padding + margin
                    borderRadius: '22px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    padding: '24px',
                    overflow: 'hidden'
                  }}
                >
                  {/* En-tête du tableau */}
                  <div className="flex-shrink-0 mb-1">
                    <div className="flex items-center" style={{ height: '48px' }}>
                      <div style={{ width: '40px', padding: '0 12px' }}>
                        <div 
                          className="font-semibold"
                          style={{ 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}
                        >
                          N°
                        </div>
                      </div>
                      
                      <div style={{ width: '90px', padding: '0 12px' }}>
                        <div 
                          className="font-semibold text-center"
                          style={{ 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}
                        >
                          Photo
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, padding: '0 12px' }}>
                        <div 
                          className="font-semibold"
                          style={{ 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}
                        >
                          Adresse
                        </div>
                      </div>
                      
                      <div style={{ width: '160px', padding: '0 12px' }}>
                        <div 
                          className="font-semibold text-center"
                          style={{ 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}
                        >
                          Résidents
                        </div>
                      </div>
                      
                      <div style={{ width: '220px', padding: '0 12px' }}>
                        <div 
                          className="font-semibold text-right"
                          style={{ 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}
                        >
                          Actions
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corps du tableau - EXACTEMENT 4 LIGNES de 72px */}
                  <div className="flex-1 overflow-hidden">
                    {currentResidences.length === 0 ? (
                      <div 
                        className="h-full flex items-center justify-center"
                        style={{ minHeight: '280px' }} // 4 * 72px
                      >
                        <div className="text-center">
                          <div 
                            className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: '#E5E7EB' }}
                          >
                            <Home className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                          </div>
                          <h3 
                            className="font-semibold mb-2"
                            style={{ 
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#000000'
                            }}
                          >
                            {searchQuery 
                              ? `Aucun résultat trouvé pour "${searchQuery}"`
                              : "Aucune résidence n'est enregistrée"}
                          </h3>
                          <p 
                            className="text-gray-600"
                            style={{ 
                              fontSize: '14px',
                              color: '#6B7280'
                            }}
                          >
                            {searchQuery 
                              ? "Essayez une autre recherche (lot, nom, prénom, CIN, téléphone, etc.)"
                              : "Aucune résidence n'est enregistrée"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {currentResidences.map((residence, index) => {
                          const realResidents = allResidents.filter(
                            (resident) => resident.residence_id === residence.id
                          );
                          const totalRealResidents = realResidents.length;
                          const hommesReal = realResidents.filter(
                            (person) =>
                              person.genre === "homme" ||
                              person.genre === "Homme" ||
                              person.genre === "male"
                          ).length;
                          const femmesReal = realResidents.filter(
                            (person) =>
                              person.genre === "femme" ||
                              person.genre === "Femme" ||
                              person.genre === "female"
                          ).length;

                          const totalResidents = totalRealResidents > 0 ? totalRealResidents : (residence.totalResidents || 0);
                          const hommes = hommesReal > 0 ? hommesReal : (residence.hommes || 0);
                          const femmes = femmesReal > 0 ? femmesReal : (residence.femmes || 0);

                          return (
                            <div 
                              key={residence.id} 
                              className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors"
                              style={{ 
                                height: '72px',
                                borderBottomColor: '#E5E7EB'
                              }}
                            >
                              <div style={{ width: '40px', padding: '0 12px' }}>
                                <span 
                                  className="font-medium"
                                  style={{ 
                                    fontSize: '14px',
                                    color: '#6B7280'
                                  }}
                                >
                                  {(currentPage - 1) * residencesPerPage + index + 1}
                                </span>
                              </div>
                              
                              <div style={{ width: '90px', padding: '0 12px' }}>
                                <div 
                                  className="rounded-lg overflow-hidden flex items-center justify-center mx-auto"
                                  style={{ 
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '8px',
                                    backgroundColor: residence.photos && residence.photos.length > 0 ? 'transparent' : '#E5E7EB'
                                  }}
                                >
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
                                        e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Home size={20} style={{ color: '#9CA3AF' }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ flex: 1, padding: '0 12px' }}>
                                <div>
                                  <div 
                                    className="font-semibold mb-1"
                                    style={{ 
                                      fontSize: '14.5px',
                                      fontWeight: '600',
                                      color: '#000000'
                                    }}
                                  >
                                    {residence.name}
                                  </div>
                                  <div 
                                    className="text-gray-600"
                                    style={{ 
                                      fontSize: '12.5px',
                                      color: '#6B7280'
                                    }}
                                  >
                                    {residence.adresse}
                                  </div>
                                  {residence.proprietaire && (
                                    <div className="flex items-center mt-1">
                                      <span 
                                        className="text-xs"
                                        style={{ 
                                          fontSize: '12px',
                                          color: '#6B7280'
                                        }}
                                      >
                                        {residence.proprietaire}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ width: '160px', padding: '0 12px' }}>
                                <div className="text-center">
                                  <div 
                                    className="font-semibold mb-1"
                                    style={{ 
                                      fontSize: '13px',
                                      color: '#000000'
                                    }}
                                  >
                                    {totalResidents} résident{totalResidents !== 1 ? 's' : ''}
                                  </div>
                                  <div className="flex items-center justify-center space-x-3">
                                    <div className="flex items-center">
                                      <span 
                                        className="text-xs"
                                        style={{ 
                                          fontSize: '12px',
                                          color: '#6B7280'
                                        }}
                                      >
                                        {hommes}H
                                      </span>
                                    </div>
                                    <div className="text-gray-400">•</div>
                                    <div className="flex items-center">
                                      <span 
                                        className="text-xs"
                                        style={{ 
                                          fontSize: '12px',
                                          color: '#6B7280'
                                        }}
                                      >
                                        {femmes}F
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ width: '220px', padding: '0 12px' }}>
                                <div className="flex items-center justify-end space-x-2">
                                  {onViewOnMap && (
                                    <button
                                      onClick={() => onViewOnMap(residence)}
                                      className="flex items-center justify-center bg-white border border-gray-300 text-black hover:bg-gray-50 transition-colors font-medium"
                                      style={{
                                        height: '32px',
                                        borderRadius: '999px',
                                        padding: '0 12px',
                                        fontSize: '13px',
                                        borderColor: '#D1D5DB',
                                        color: '#000000'
                                      }}
                                      title="Voir sur la carte"
                                    >
                                      <Map size={14} className="mr-2" style={{ color: '#000000' }} />
                                      Carte
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleViewDetails(residence)}
                                    className="flex items-center justify-center bg-white border border-gray-300 text-black hover:bg-gray-50 transition-colors font-medium"
                                    style={{
                                      height: '32px',
                                      borderRadius: '999px',
                                      padding: '0 12px',
                                      fontSize: '13px',
                                      borderColor: '#D1D5DB',
                                      color: '#000000'
                                    }}
                                    title="Voir les détails"
                                    >
                                    <Eye size={14} className="mr-2" style={{ color: '#000000' }} />
                                    Détails
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pagination centrée - TOUJOURS VISIBLE à l'intérieur du conteneur */}
                  <div className="flex-shrink-0 pt-2" style={{ paddingTop: '16px' }}>
                    <div className="flex items-center justify-center">
                      <div 
                        className="flex items-center space-x-2 bg-white rounded-full px-4 py-2"
                        style={{
                          borderRadius: '999px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          height: '40px',
                          width: '220px',
                          justifyContent: 'center'
                        }}
                      >
                        {/* Bouton précédent - 36px */}
                        <button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '999px',
                            borderColor: '#D1D5DB'
                          }}
                        >
                          <ChevronLeft size={16} style={{ color: '#000000' }} />
                        </button>

                        {/* Numéros de page - 32px */}
                        <div className="flex items-center space-x-2">
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Afficher seulement les pages pertinentes
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`flex items-center justify-center font-medium transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-gray-900 text-white"
                                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                                  }`}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    borderColor: '#D1D5DB',
                                    color: currentPage === pageNum ? '#FFFFFF' : '#6B7280'
                                  }}
                                >
                                  {pageNum}
                                </button>
                              );
                            } else if (
                              pageNum === currentPage - 2 ||
                              pageNum === currentPage + 2
                            ) {
                              return (
                                <span 
                                  className="text-gray-400"
                                  style={{ 
                                    fontSize: '14px',
                                    color: '#6B7280'
                                  }}
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        {/* Bouton suivant - 36px */}
                        <button
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '999px',
                            borderColor: '#D1D5DB'
                          }}
                        >
                          <ChevronRight size={16} style={{ color: '#000000' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {showModal && selectedResidence && (
          <div className="w-full">
            <div className="h-full flex flex-col p-6">
              {/* Header avec bouton retour et titre */}
              <div className="mb-6">
                <div className="flex items-center">
                  <button
                    onClick={handleCloseModal}
                    className="mr-3 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      color: '#374151'
                    }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 
                    className="text-black font-bold"
                    style={{ 
                      fontSize: '30px',
                      fontWeight: '700',
                      color: '#000000'
                    }}
                  >
                    {selectedResidence.lot || selectedResidence.name}
                  </h1>
                  
                  {/* BOUTON POUR AJOUTER DES PHOTOS */}
                  <div className="ml-auto">
                    <button
                      onClick={handleOpenAddPhotosModal}
                      className="flex items-center justify-center bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                      style={{
                        height: '42px',
                        borderRadius: '24px',
                        padding: '0 16px',
                        fontSize: '14.5px'
                      }}
                    >
                      <Camera size={16} className="mr-2" />
                      Ajouter des photos
                    </button>
                  </div>
                </div>
              </div>

              {/* Grand bloc rectangulaire avec coins arrondis */}
              <div 
                className="mb-6 bg-white rounded-2xl p-6"
                style={{
                  width: '100%',
                  height: '170px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="flex h-full">
                  {/* Image rectangulaire gris clair avec coins arrondis - côté gauche - AGRANDIE */}
                  <div 
                    className="mr-6 flex-shrink-0 cursor-pointer relative group"
                    onClick={() => selectedResidence.photos && selectedResidence.photos.length > 0 && handleOpenImageModal(0)}
                    style={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '12px',
                      backgroundColor: selectedResidence.photos && selectedResidence.photos.length > 0 ? 'transparent' : '#E5E7EB',
                      overflow: 'hidden'
                    }}
                  >
                    {selectedResidence.photos && selectedResidence.photos.length > 0 ? (
                      <>
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
                            e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-gray-200");
                          }}
                        />
                        {/* Overlay au survol */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={32} style={{ color: '#9CA3AF' }} />
                      </div>
                    )}
                  </div>

                  {/* Conteneur pour les informations de résidence et propriétaire côte à côte */}
                  <div className="flex-1 flex">
                    {/* Informations de la résidence - côté gauche */}
                    <div className="flex-1 pr-8 flex flex-col justify-between">
                      <div>
                        <h2 
                          className="font-semibold text-black mb-3"
                          style={{ 
                            fontSize: '19px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          {selectedResidence.name}
                        </h2>
                        
                        {/* Deuxième ligne - avec icône */}
                        <div className="flex items-center mb-2">
                          <MapPin size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                          <span 
                            className="text-gray-700"
                            style={{ 
                              fontSize: '14px',
                              color: '#374151'
                            }}
                          >
                            {selectedResidence.adresse || "Adresse non disponible"}
                          </span>
                        </div>
                        
                        {/* Troisième ligne - avec icône */}
                        <div className="flex items-center mb-2">
                          <Users size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                          <span 
                            className="font-medium text-gray-700"
                            style={{ 
                              fontSize: '14px',
                              color: '#374151'
                            }}
                          >
                            {selectedResidence.totalResidents || 0} résidents
                          </span>
                        </div>
                        
                        {/* Quatrième ligne - répartition SANS border-t et avec simple "•" */}
                        <div className="flex items-center pt-2">
                          <div className="flex items-center mr-4">
                            <span 
                              className="font-medium"
                              style={{ 
                                fontSize: '14px',
                                color: '#000000'
                              }}
                            >
                              {selectedResidence.hommes || 0} Hommes
                            </span>
                          </div>
                          <div className="text-gray-400 mr-4">•</div>
                          <div className="flex items-center">
                            <span 
                              className="font-medium"
                              style={{ 
                                fontSize: '14px',
                                color: '#000000'
                              }}
                            >
                              {selectedResidence.femmes || 0} Femmes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations du propriétaire - côté droit */}
                    <div className="flex-1 pl-8 border-l border-gray-200 flex flex-col justify-between" style={{ borderLeftColor: '#E5E7EB' }}>
                      <div>
                        <h2 
                          className="font-semibold text-black mb-3"
                          style={{ 
                            fontSize: '19px',
                            fontWeight: '600',
                            color: '#000000'
                          }}
                        >
                          Propriétaire
                        </h2>
                        
                        {/* Nom du propriétaire */}
                        <div className="flex items-center mb-2">
                          <User size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                          <span 
                            className="font-medium text-gray-700"
                            style={{ 
                              fontSize: '14px',
                              color: '#374151'
                            }}
                          >
                            {selectedResidence.proprietaire || "Non spécifié"}
                          </span>
                        </div>
                        
                        {/* Téléphone du propriétaire */}
                        {selectedResidence.telephone && (
                          <div className="flex items-center mb-2">
                            <Phone size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                            <span 
                              className="text-gray-700"
                              style={{ 
                                fontSize: '14px',
                                color: '#374151'
                            }}
                          >
                              {selectedResidence.telephone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GALLERIE DE PHOTOS SUPPLEMENTAIRES SI IL Y EN A */}
              {selectedResidence.photos && selectedResidence.photos.length > 1 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 
                      className="font-semibold text-black"
                      style={{ 
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#000000'
                      }}
                    >
                      Photos de la résidence ({selectedResidence.photos.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {selectedResidence.photos.slice(1).map((photo, index) => (
                      <div 
                        key={index + 1}
                        className="relative group cursor-pointer"
                        onClick={() => handleOpenImageModal(index + 1)}
                      >
                        <div 
                          className="rounded-lg overflow-hidden"
                          style={{
                            width: '100%',
                            height: '120px',
                            backgroundColor: '#F3F4F6'
                          }}
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 2} de ${selectedResidence.name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn("Image failed to load in gallery:", photo);
                              e.target.style.display = "none";
                              e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-gray-200");
                            }}
                          />
                        </div>
                        {/* Bouton de suppression */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
                              handleDeletePhoto(index + 1);
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        {/* Overlay au survol */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RÉCUPÉRATION DES DONNÉES - Exemple de fonction pour extraire les noms */}
              {(() => {
                // Fonction pour récupérer les noms de la résidence et du propriétaire
                const residenceName = selectedResidence.name || "";
                const proprietaireName = selectedResidence.proprietaire || "";
                
                // Vous pouvez utiliser ces données comme bon vous semble
                console.log("Nom de la résidence:", residenceName);
                console.log("Nom du propriétaire:", proprietaireName);
                
                // Exemple d'utilisation: enregistrer dans une variable ou passer à une fonction
                const residenceData = {
                  residenceName: residenceName,
                  proprietaireName: proprietaireName,
                  // Autres données que vous voulez récupérer
                  adresse: selectedResidence.adresse || "",
                  totalResidents: selectedResidence.totalResidents || 0,
                  hommes: selectedResidence.hommes || 0,
                  femmes: selectedResidence.femmes || 0
                };
                
                // Vous pouvez utiliser residenceData comme vous le souhaitez
                // Par exemple, l'envoyer à une API, l'afficher, etc.
                
                return null; // Ne rien rendre dans le DOM
              })()}

              {/* En-tête de la liste des résidents avec bouton ajouter - même ligne, pas de background */}
              <div className="mb-4 flex items-center justify-between">
                <div 
                  className="font-semibold"
                  style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000'
                  }}
                >
                  Liste des résidents
                </div>
                <button
                  onClick={handleOpenAddResidentModal}
                  className="flex items-center justify-center text-white font-medium hover:bg-gray-800 transition-colors"
                  style={{
                    width: '180px',
                    height: '42px',
                    borderRadius: '24px',
                    backgroundColor: '#000000',
                    fontSize: '14.5px'
                  }}
                >
                  + Ajouter un résident
                </button>
              </div>

              {/* Section tableau des résidents AVEC SCROLL - MODIFIÉ */}
              <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden">
                {/* En-tête fixe */}
                <div className="flex-shrink-0">
                  <table className="w-full">
                    <ResidentListHeader />
                  </table>
                </div>

                {/* Corps du tableau avec scroll - MODIFIÉ */}
                {selectedResidence.residents && selectedResidence.residents.length > 0 ? (
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
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
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <div 
                        className="text-gray-500 mb-4"
                        style={{ 
                          fontSize: '14px',
                          color: '#6B7280'
                        }}
                      >
                        Aucun résident enregistré
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination pour les résidents - FIXE EN BAS */}
                {totalResidentPages > 1 && (
                  <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={prevResidentPage}
                        disabled={residentPage === 1}
                        className="flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          borderColor: '#D1D5DB'
                        }}
                      >
                        <ChevronLeft size={16} style={{ color: '#374151' }} />
                      </button>

                      <div className="flex items-center space-x-1">
                        {[...Array(totalResidentPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalResidentPages ||
                            (pageNum >= residentPage - 1 && pageNum <= residentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setResidentPage(pageNum)}
                                className={`flex items-center justify-center font-medium transition-colors ${
                                  residentPage === pageNum
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                                }`}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  borderColor: '#D1D5DB'
                                }}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === residentPage - 2 ||
                            pageNum === residentPage + 2
                          ) {
                            return (
                              <span 
                                className="text-gray-400"
                                style={{ fontSize: '14px' }}
                              >
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
                        className="flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          borderColor: '#D1D5DB'
                        }}
                      >
                        <ChevronRight size={16} style={{ color: '#374151' }} />
                      </button>
                    </div>
                  </div>
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

      {/* MODAL POUR AGRANDIR L'IMAGE */}
      <ImageModal
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
        images={selectedResidence?.photos || []}
        currentIndex={currentImageIndex}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
      />

      {/* MODAL POUR AJOUTER UN RÉSIDENT */}
      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={handleCloseAddResidentModal}
        onSave={handleSaveEdit}
        newResident={newResident}
        setNewResident={setNewResident}
        dateInput={dateInput}
        setDateInput={setDateInput}
        dateError={dateError}
        setDateError={setDateError}
        nomInputRef={nomInputRef}
        prenomInputRef={prenomInputRef}
        dateNaissanceInputRef={dateNaissanceInputRef}
        cinInputRef={cinInputRef}
        telephoneInputRef={telephoneInputRef}
      />

      {/* NOUVEAU MODAL POUR AJOUTER DES PHOTOS */}
      <AddPhotosModal
        isOpen={showAddPhotosModal}
        onClose={handleCloseAddPhotosModal}
        onUpload={handleUploadPhotos}
        selectedResidence={selectedResidence}
        photoInputRef={photoInputRef}
      />
    </>
  );
}