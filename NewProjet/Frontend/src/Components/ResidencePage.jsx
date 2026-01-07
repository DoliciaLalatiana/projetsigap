import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from 'react-i18next';
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
  Plus,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const ImageModal = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNext, 
  onPrev,
  onAddImage
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useTranslation();

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

  const handleAddImageClick = () => {
    if (onAddImage) {
      onAddImage();
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={handleOverlayClick}
      />
      
      <div 
        className="relative rounded-xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '85vw',
          maxHeight: '75vh',
          height: 'auto',
          width: 'auto'
        }}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[75vh] object-contain"
        />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleAddImageClick}
            className="flex items-center justify-center hover:bg-white/90 rounded-full transition-all duration-200"
            style={{ 
              width: '36px', 
              height: '36px',
              color: '#374151',
              backgroundColor: 'rgba(243, 244, 246, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(209, 213, 219, 0.5)'
            }}
            title={t('addImage') || "Ajouter une image"}
          >
            <Plus size={18} />
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center justify-center hover:bg-white/90 rounded-full transition-all duration-200"
            style={{ 
              width: '36px', 
              height: '36px',
              color: '#374151',
              backgroundColor: 'rgba(243, 244, 246, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(209, 213, 219, 0.5)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 text-gray-800 text-sm rounded-full px-3 py-1.5 font-medium"
          style={{
            backgroundColor: 'rgba(243, 244, 246, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(209, 213, 219, 0.5)'
          }}
        >
          {currentIndex + 1}/{images.length}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 flex items-center justify-center hover:bg-white/90 rounded-full transition-all duration-200"
              style={{ 
                width: '44px', 
                height: '44px',
                color: '#374151',
                backgroundColor: 'rgba(243, 244, 243, 0.9)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(209, 213, 219, 0.5)'
            }}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={onNext}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center justify-center shadow-2xl hover:bg-white/90 rounded-full transition-all duration-200"
              style={{ 
                width: '44px', 
                height: '44px',
                color: '#374151',
                backgroundColor: 'rgba(243, 244, 246, 0.9)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(209, 213, 219, 0.5)'
              }}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

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
  const { t } = useTranslation();
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
        setDateError(t('dateFormatError') || "Format de date invalide. Utilisez jj/mm/aaaa");
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
      setDateError(t('invalidDate') || "Date invalide");
      return false;
    }

    const MAX_YEAR = 2025;
    if (year > MAX_YEAR) {
      setDateError(t('maxYearError', { year: MAX_YEAR }) || `L'année maximum est ${MAX_YEAR}`);
      return false;
    }

    const MIN_YEAR = 1900;
    if (year < MIN_YEAR) {
      setDateError(t('minYearError') || "L'année semble trop ancienne");
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(year, month - 1, day);

    if (inputDate > today) {
      setDateError(t('futureDateError') || "La date de naissance ne peut pas être dans le futur");
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
        setDateError(t('incompleteDate') || "Date incomplète. Format: jj/mm/aaaa");
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
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={handleCancel}
      />
      
      <div 
        className="relative bg-gray-100 rounded-3xl shadow-2xl w-[480px] h-auto max-h-[600px] overflow-hidden flex flex-col transform transition-all ml-24"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">
            {t('addResident')}
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

        <div className="flex-1 overflow-y-auto px-6 py-4 ml-4">
          <div className="space-y-4">
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
                placeholder={t('lastName')}
                maxLength={50}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

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
                placeholder={t('firstName')}
                maxLength={50}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="pl-4">
              <div className="mb-2 text-sm font-medium text-gray-700">
                {t('gender')}
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
                      accentColor: '#3B82F6'
                    }}
                  />
                  <span className="text-gray-700 text-sm">
                    {t('male')}
                  </span>
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
                      accentColor: '#3B82F6'
                    }}
                  />
                  <span className="text-gray-700 text-sm">
                    {t('female')}
                  </span>
                </label>
              </div>
            </div>

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
                placeholder={`${t('birthDate')} (jj/mm/aaaa)`}
                maxLength={10}
              />
              {dateError && (
                <p className="mt-1 text-xs text-red-600">{dateError}</p>
              )}
            </div>

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
                  placeholder={t('cin')}
                  maxLength={12}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px rgba(209, 213, 219, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('fieldForAdultsOnly')}
                </p>
              </div>
            )}

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
                placeholder={t('phone')}
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

        <div className="flex space-x-3 px-6 py-4 border-gray-300 bg-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs py-2.5"
            style={{
              maxWidth: '200px',
              borderColor: '#E5E7EB'
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs py-2.5"
            style={{
              maxWidth: '200px'
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ResidentsList = ({ 
  residents, 
  onBackToResidences, 
  searchQuery,
  onViewOnMap,
  residencesList 
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10;
  
  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = residents.slice(indexOfFirstResident, indexOfLastResident);
  const totalPages = Math.ceil(residents.length / residentsPerPage);

  const formatGenre = (genre) => {
    if (genre === "homme") return t('male');
    if (genre === "femme") return t('female');
    return genre;
  };

  const extractNomPrenom = (nomComplet) => {
    if (!nomComplet) return { nom: "", prenom: "" };
    const parts = nomComplet.split(" ");
    if (parts.length === 1) return { nom: parts[0], prenom: "" };
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(" "),
    };
  };

  const formatDateHyphen = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

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
              {t('searchResults')}: "{searchQuery}"
            </h1>
          </div>
        </div>

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
                    {t('residentsFound')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            {/* En-tête du tableau avec des colonnes alignées */}
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
                    {t('number')}
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
                    {t('lastName')}
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
                    {t('firstName')}
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
                    {t('gender')}
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
                    {t('birthDate')}
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
                    {t('cin')}
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
                    {t('phone')}
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
                    {t('actions')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {currentResidents.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                    </div>
                    <h3 className="font-semibold mb-2" style={{ fontSize: '18px', color: '#000000' }}>
                      {t('noResidentRegistered')}
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
                        {/* Numéro - aligné avec l'en-tête */}
                        <div style={{ width: '60px', padding: '0 12px' }}>
                          <span 
                            className="font-medium block text-center"
                            style={{ 
                              fontSize: '14px', 
                              color: '#6B7280',
                              textAlign: 'center'
                            }}
                          >
                            {(currentPage - 1) * residentsPerPage + index + 1}
                          </span>
                        </div>
                        
                        {/* Nom - aligné avec l'en-tête */}
                        <div style={{ flex: 1, padding: '0 12px' }}>
                          <div 
                            className="font-semibold"
                            style={{ 
                              fontSize: '14px', 
                              color: '#000000'
                            }}
                          >
                            {displayNom}
                          </div>
                        </div>
                        
                        {/* Prénom - aligné avec l'en-tête */}
                        <div style={{ flex: 1, padding: '0 12px' }}>
                          <div 
                            className="font-semibold"
                            style={{ 
                              fontSize: '14px', 
                              color: '#000000'
                            }}
                          >
                            {prenom || "-"}
                          </div>
                        </div>
                        
                        {/* Genre - aligné avec l'en-tête (centré) */}
                        <div style={{ width: '120px', padding: '0 12px' }}>
                          <div className="flex items-center justify-center">
                            {formatGenre(resident.genre) === t('male') ? (
                              <Mars className="w-4 h-4 text-black mr-2" />
                            ) : (
                              <Venus className="w-4 h-4 text-black mr-2" />
                            )}
                            <span className="text-sm font-medium text-black">
                              {formatGenre(resident.genre)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Date de naissance - aligné avec l'en-tête */}
                        <div style={{ width: '150px', padding: '0 12px' }}>
                          <div 
                            className="text-sm text-gray-600"
                            style={{ textAlign: 'left' }}
                          >
                            {resident.dateNaissance ? formatDateHyphen(resident.dateNaissance) : "-"}
                          </div>
                        </div>
                        
                        {/* CIN - aligné avec l'en-tête */}
                        <div style={{ width: '120px', padding: '0 12px' }}>
                          <div 
                            className="text-sm font-mono text-gray-600"
                            style={{ textAlign: 'left' }}
                          >
                            {resident.cin || "-"}
                          </div>
                        </div>
                        
                        {/* Téléphone - aligné avec l'en-tête */}
                        <div style={{ width: '150px', padding: '0 12px' }}>
                          <div 
                            className="text-sm text-gray-600"
                            style={{ textAlign: 'left' }}
                          >
                            {resident.telephone ? `+261 ${resident.telephone}` : "-"}
                          </div>
                        </div>
                        
                        {/* Actions - aligné avec l'en-tête (centré) */}
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
                                  color: '#000000',
                                  margin: '0 auto'
                                }}
                                title={t('viewOnMap')}
                              >
                                <Map size={14} className="mr-2" style={{ color: '#000000' }} />
                                {t('map')}
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
  const { t, i18n } = useTranslation();
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
  const [residencesPerPage] = useState(3);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newResident, setNewResident] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    cin: "",
    telephone: "",
    sexe: "homme",
  });

  const [searchMode, setSearchMode] = useState("residences");
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [dateInput, setDateInput] = useState("");
  const [dateError, setDateError] = useState("");
  const [allResidents, setAllResidents] = useState([]);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const nomInputRef = useRef(null);
  const prenomInputRef = useRef(null);
  const dateNaissanceInputRef = useRef(null);
  const cinInputRef = useRef(null);
  const telephoneInputRef = useRef(null);
  const sexeSelectRef = useRef(null);
  const photoInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const [residentPage, setResidentPage] = useState(1);
  const [residentsPerPageInModal] = useState(3);

  // Fonction pour changer de langue
  const switchLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'mg' : 'fr';
    i18n.changeLanguage(newLang);
  };

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
          name: r.nom_residence || r.name || r.lot || `Lot ${r.id}`,
          photos: Array.isArray(r.photos)
            ? r.photos
                .filter((photo) => photo && photo.trim() !== "")
                .map((photo) => {
                  // CORRECTION ICI : Utiliser directement l'URL retournée par l'API
                  if (typeof photo === "string") {
                    // Si l'API retourne déjà une URL complète, l'utiliser directement
                    if (photo.startsWith("http")) {
                      return photo;
                    }
                    // Sinon, ajouter le BASE_URL si nécessaire
                    return `${API_BASE}${photo.startsWith("/") ? "" : "/"}${photo}`;
                  }
                  return photo;
                })
            : [],
          lot: r.lot || "",
          quartier: r.quartier || "",
          ville: r.ville || "",
          proprietaire: r.nom_proprietaire || r.proprietaire || "",
          nom_residence: r.nom_residence || "",
          nom_proprietaire: r.nom_proprietaire || "",
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

  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.toLowerCase().trim();
      
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
      
      if (filtered.length > 0) {
        setSearchMode("residents");
      } else {
        setSearchMode("residences");
      }
    } else {
      setSearchMode("residences");
      setFilteredResidents([]);
    }
  }, [searchQuery, allResidents]);

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

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  // CORRECTION PRINCIPALE : Fonction pour charger les photos
  const loadResidencePhotos = async (residenceId) => {
    try {
      console.log("Chargement des photos pour la résidence:", residenceId);
      const resp = await fetch(
        `${API_BASE}/api/residences/${residenceId}/photos`
      );
      if (resp.ok) {
        const photos = await resp.json();
        console.log("Photos reçues de l'API:", photos);
        
        // Retourner directement les URLs complètes
        return photos.map((photo) => {
          return photo.url || `${API_BASE}/uploads/residences/${photo.filename}`;
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
          return photo.url;
        });

        setSelectedResidence((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), ...newPhotoUrls],
        }));

        setResList((list) =>
          list.map((r) =>
            r.id === selectedResidence.id ? { ...r, photos: [...(r.photos || []), ...newPhotoUrls] } : r
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
          return p.url === photoUrl;
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
      
      if (onEnterDetail) {
        onEnterDetail();
      }

      const photos = await loadResidencePhotos(residence.id);
      console.log("Loaded photos URLs:", photos);

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

      const nomResidence = residence.nom_residence || residence.nomResidence || residence.name || residence.lot || "";
      const nomProprietaire = residence.nom_proprietaire || residence.nomProprietaire || residence.proprietaire || "";

      setSelectedResidence({
        ...base,
        photos: photos,
        residents: normalizedPersons,
        totalResidents: totalRealResidents,
        hommes: hommesReal,
        femmes: femmesReal,
        name: nomResidence,
        proprietaire: nomProprietaire,
        nom_residence: nomResidence,
        nom_proprietaire: nomProprietaire
      });

      setIsPhotoExpanded(false);
      setIsFullScreenPhoto(false);
      setResidentPage(1);

      setShowModal(true);
    } catch (e) {
      console.error("Error loading residence details:", e);
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

      const nomResidence = residence.nom_residence || residence.nomResidence || residence.name || residence.lot || "";
      const nomProprietaire = residence.nom_proprietaire || residence.nomProprietaire || residence.proprietaire || "";

      setSelectedResidence({
        ...residence,
        photos: residence.photos || [],
        residents: residence.residents || [],
        totalResidents: totalRealResidents,
        hommes: hommesReal,
        femmes: femmesReal,
        name: nomResidence,
        proprietaire: nomProprietaire,
        nom_residence: nomResidence,
        nom_proprietaire: nomProprietaire
      });
      setResidentPage(1);
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

  const handleAddImageInModal = () => {
    console.log("Ouvrir le sélecteur de fichiers ou le formulaire d'ajout");
    
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handleDirectPhotoUpload = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
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

  const extractNomPrenom = (nomComplet) => {
    if (!nomComplet) return { nom: "", prenom: "" };
    const parts = nomComplet.split(" ");
    if (parts.length === 1) return { nom: parts[0], prenom: "" };
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(" "),
    };
  };

  const handleBackToResidences = () => {
    setSearchMode("residences");
  };

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
      const nomResidence = residence.nom_residence?.toLowerCase() || "";
      const nomProprietaire = residence.nom_proprietaire?.toLowerCase() || "";

      return (
        name.includes(searchTerm) ||
        lot.includes(searchTerm) ||
        quartier.includes(searchTerm) ||
        ville.includes(searchTerm) ||
        adresse.includes(searchTerm) ||
        proprietaire.includes(searchTerm) ||
        nomResidence.includes(searchTerm) ||
        nomProprietaire.includes(searchTerm)
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

  const indexOfLastResidence = currentPage * residencesPerPage;
  const indexOfFirstResidence = indexOfLastResidence - residencesPerPage;
  const currentResidences = filteredResidences.slice(
    indexOfFirstResidence,
    indexOfLastResidence
  );
  const totalPages = Math.ceil(filteredResidences.length / residencesPerPage);

  // Pagination pour les résidents dans la modal
  const indexOfLastResidentInModal = residentPage * residentsPerPageInModal;
  const indexOfFirstResidentInModal = indexOfLastResidentInModal - residentsPerPageInModal;
  const currentResidentsInModal = selectedResidence?.residents
    ? selectedResidence.residents.slice(indexOfFirstResidentInModal, indexOfLastResidentInModal)
    : [];
  const totalResidentPages = selectedResidence?.residents
    ? Math.ceil(selectedResidence.residents.length / residentsPerPageInModal)
    : 0;

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

  const estMajeur = (dateNaissance) => {
    return calculerAge(dateNaissance) >= 18;
  };

  const formatDateHyphen = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatGenre = (genre) => {
    if (genre === "homme") return t('male');
    if (genre === "femme") return t('female');
    return genre;
  };

  const ResidentListHeader = () => (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'left', width: '200px' }}
        >
          {t('lastName')}
        </th>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'left', width: '200px' }}
        >
          {t('firstName')}
        </th>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'center', width: '120px' }}
        >
          {t('gender')}
        </th>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'left', width: '150px' }}
        >
          {t('birthDate')}
        </th>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'left', width: '120px' }}
        >
          {t('cin')}
        </th>
        <th 
          className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
          style={{ textAlign: 'left', width: '150px' }}
        >
          {t('tel')}
        </th>
      </tr>
    </thead>
  );

  const ResidentRow = ({ resident }) => {
    const { nom, prenom } = extractNomPrenom(resident.nomComplet);
    const isMineur = resident.dateNaissance && !estMajeur(resident.dateNaissance);
    const displayNom = nom ? nom.toUpperCase() : "-";

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        {/* Nom - aligné avec l'en-tête */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'left', width: '200px' }}
        >
          <div className="font-semibold text-gray-800">
            {displayNom}
          </div>
        </td>
        
        {/* Prénom - aligné avec l'en-tête */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'left', width: '200px' }}
        >
          <div className="font-semibold text-gray-800">
            {prenom || "-"}
          </div>
        </td>
        
        {/* Genre - aligné avec l'en-tête (centré) */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'center', width: '120px' }}
        >
          <div className="flex items-center justify-center">
            {formatGenre(resident.genre) === t('male') ? (
              <Mars className="w-4 h-4 text-black mr-2" />
            ) : (
              <Venus className="w-4 h-4 text-black mr-2" />
            )}
            <span className="text-sm font-medium text-black">
              {formatGenre(resident.genre)}
            </span>
          </div>
        </td>
        
        {/* Date de naissance - aligné avec l'en-tête */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'left', width: '150px' }}
        >
          <div className="text-sm text-gray-600">
            {resident.dateNaissance 
              ? formatDateHyphen(resident.dateNaissance) 
              : "-"}
          </div>
        </td>
        
        {/* CIN - aligné avec l'en-tête */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'left', width: '120px' }}
        >
          <div 
            className={`text-sm font-mono ${
              isMineur ? "text-gray-500 italic" : "text-gray-600"
            }`}
          >
            {isMineur ? `-- ${t('minor')} --` : resident.cin || "-"}
          </div>
        </td>
        
        {/* Téléphone - aligné avec l'en-tête */}
        <td 
          className="px-4 py-3"
          style={{ textAlign: 'left', width: '150px' }}
        >
          <div className="text-sm text-gray-600">
            {resident.telephone ? `+261 ${resident.telephone}` : "-"}
          </div>
        </td>
      </tr>
    );
  };

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

  return (
    <>
      <div className="h-full flex">
        {!showModal && (
          <div className="w-full">
            <div 
              className="h-full flex flex-col p-6 space-y-6 min-h-screen"
              style={{ 
                padding: '24px 32px'
              }}
            >
              <div>
                <h1 
                  className="text-black"
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#000000'
                  }}
                >
                  {t('residencesList')}
                </h1>
              </div>

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
                          {t('residences')}
                        </div>
                      </div>
                    </div>
                  </div>

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
                          {t('residents')}
                        </div>
                      </div>
                    </div>
                  </div>

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
                          {t('men')}
                        </div>
                      </div>
                    </div>
                  </div>

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
                          {t('women')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 mb-4">
                <div 
                  className="bg-white rounded-2xl flex flex-col"
                  style={{
                    width: '100%',
                    minHeight: 'calc(4 * 68px + 48px + 2px + 20px + 48px)',
                    borderRadius: '22px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    padding: '24px',
                    overflow: 'hidden'
                  }}
                >
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
                          {t('number')}
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
                          {t('photo')}
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
                          {t('address')}
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
                          {t('residents')}
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
                          {t('actions')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    {currentResidences.length === 0 ? (
                      <div 
                        className="h-full flex items-center justify-center"
                        style={{ minHeight: '280px' }}
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
                              ? `${t('noResultsFor')} "${searchQuery}"`
                              : t('noResidenceFound')}
                          </h3>
                          <p 
                            className="text-gray-600"
                            style={{ 
                              fontSize: '14px',
                              color: '#6B7280'
                            }}
                          >
                            {searchQuery 
                              ? t('tryAnotherSearch')
                              : t('noResidenceFound')}
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
                                    {residence.nom_residence || residence.name}
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
                                        {residence.nom_proprietaire || residence.proprietaire}
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
                                    {totalResidents} {t('residentsCount').toLowerCase()}{totalResidents !== 1 ? 's' : ''}
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
                                      title={t('viewOnMap')}
                                    >
                                      <Map size={14} className="mr-2" style={{ color: '#000000' }} />
                                      {t('map')}
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
                                    title={t('viewDetails')}
                                  >
                                    <Eye size={14} className="mr-2" style={{ color: '#000000' }} />
                                    {t('details')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

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

        {showModal && selectedResidence && (
          <div className="w-full">
            <div className="h-full flex flex-col p-6">
              <div className="mb-6">
                <div className="flex items-center">
                  <button
                    onClick={handleCloseModal}
                    className="mr-3 bg-gray-200 border-white-400 hover:bg-white rounded-xl transition-colors flex items-center justify-center shadow-3xl"
                    style={{ 
                      width: '30px', 
                      height: '30px',
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
                    {selectedResidence.nom_residence || selectedResidence.name || selectedResidence.lot}
                  </h1>
                </div>
              </div>

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
                  <div 
                    className="mr-6 flex-shrink-0 cursor-pointer relative group"
                    onClick={() => {
                      if (!selectedResidence.photos || selectedResidence.photos.length === 0) {
                        handleDirectPhotoUpload();
                      } 
                      else {
                        handleOpenImageModal(currentPhotoIndex);
                      }
                    }}
                    style={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '12px',
                      backgroundColor: (!selectedResidence.photos || selectedResidence.photos.length === 0) ? '#E5E7EB' : 'transparent',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {selectedResidence.photos && selectedResidence.photos.length > 0 ? (
                      <>
                        <img
                          src={selectedResidence.photos[currentPhotoIndex]}
                          alt={`Photo ${currentPhotoIndex + 1} de ${selectedResidence.name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn(
                              "Image failed to load in details:",
                              selectedResidence.photos[currentPhotoIndex]
                            );
                            e.target.style.display = "none";
                            e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-gray-200");
                          }}
                        />
                        
                        {selectedResidence.photos.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage();
                              }}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                              style={{ 
                                width: '28px', 
                                height: '28px'
                              }}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage();
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                              style={{ 
                                width: '28px', 
                                height: '28px'
                              }}
                            >
                              <ChevronRight size={16} />
                            </button>
                            
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                              {selectedResidence.photos.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    index === currentPhotoIndex 
                                      ? 'bg-white' 
                                      : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-1 backdrop-blur-sm">
                          {currentPhotoIndex + 1}/{selectedResidence.photos.length}
                        </div>
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-3">
                          <Camera size={24} style={{ color: '#6B7280' }} />
                        </div>
                        <span className="text-xs text-gray-600">
                          {t('addPhoto')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex">
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
                          {selectedResidence.nom_residence || selectedResidence.name || t('nameNotSpecified')}
                        </h2>
                        
                        <div className="flex items-center mb-2">
                          <MapPin size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                          <span 
                            className="text-gray-700"
                            style={{ 
                              fontSize: '14px',
                              color: '#374151'
                            }}
                          >
                            {selectedResidence.adresse || t('addressNotAvailable')}
                          </span>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <Users size={14} className="text-gray-500 mr-2" style={{ color: '#6B7280' }} />
                          <span 
                            className="font-medium text-gray-700"
                            style={{ 
                              fontSize: '14px',
                              color: '#374151'
                            }}
                          >
                            {selectedResidence.totalResidents || 0} {t('residents')}
                          </span>
                        </div>
                        
                        <div className="flex items-center pt-2">
                          <div className="flex items-center mr-4">
                            <span 
                              className="font-medium"
                              style={{ 
                                fontSize: '14px',
                                color: '#000000'
                              }}
                            >
                              {selectedResidence.hommes || 0} {t('men')}
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
                              {selectedResidence.femmes || 0} {t('women')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div 
                  className="font-semibold"
                  style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000'
                  }}
                >
                  {t('residentsListTitle')}
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
                   {t('addResidentButton')}
                </button>
              </div>

              <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden">
                <div className="flex-shrink-0">
                  <table className="w-full">
                    <ResidentListHeader />
                  </table>
                </div>

                <div className="flex-1">
                  <table className="w-full">
                    <tbody>
                      {currentResidentsInModal.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-16 text-center">
                            <div className="text-center">
                              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                              <div 
                                className="text-gray-500 mb-4"
                                style={{ 
                                  fontSize: '14px',
                                  color: '#6B7280'
                                }}
                              >
                                {t('noResidentRegistered')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentResidentsInModal.map((resident) => (
                          <ResidentRow
                            key={resident.id}
                            resident={resident}
                          />
                        ))
                      )}
                      
                      {Array.from({ length: Math.max(0, residentsPerPageInModal - currentResidentsInModal.length) }).map((_, index) => (
                        <tr key={`empty-${index}`} className="border-b border-gray-200" style={{ height: '60px' }}>
                          <td colSpan="6" className="px-4 py-3 bg-white"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalResidentPages > 1 && (
                  <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
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
                          onClick={() => setResidentPage(prev => Math.max(1, prev - 1))}
                          disabled={residentPage === 1}
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
                                <span className="text-gray-400" style={{ fontSize: '14px', color: '#6B7280' }}>
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => setResidentPage(prev => Math.min(totalResidentPages, prev + 1))}
                          disabled={residentPage === totalResidentPages}
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
        )}

        <input
          type="file"
          ref={photoInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
        />
      </div>

      <ImageModal
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
        images={selectedResidence?.photos || []}
        currentIndex={currentImageIndex}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        onAddImage={handleAddImageInModal}
      />

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
    </>
  );
}