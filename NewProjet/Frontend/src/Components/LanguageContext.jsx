import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'fr';
  });

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'mg' : 'fr';
    setLanguage(newLanguage);
    localStorage.setItem('appLanguage', newLanguage);
    
    // Notifier tous les composants du changement
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLanguage } 
    }));
  };

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};