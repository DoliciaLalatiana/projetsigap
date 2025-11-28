import React from 'react';
import { useLanguage } from './LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      title={language === 'fr' ? 'Changer en Malagasy' : 'Hiova amin\'ny frantsay'}
    >
      {language === 'fr' ? (
        // Drapeau français (bandes verticales)
        <div className="w-full h-full flex">
          <div className="w-1/3 bg-blue-600"></div>
          <div className="w-1/3 bg-white"></div>
          <div className="w-1/3 bg-red-600"></div>
        </div>
      ) : (
        // Drapeau malgache CORRIGÉ : bande verticale blanche à gauche, bandes horizontales rouge et verte à droite
        <div className="w-full h-full flex">
          {/* Bande verticale blanche */}
          <div className="w-1/3 bg-white"></div>
          {/* Partie droite avec bandes horizontales */}
          <div className="w-2/3 flex flex-col">
            <div className="h-1/2 bg-red-600"></div>
            <div className="h-1/2 bg-green-600"></div>
          </div>
        </div>
      )}
    </button>
  );
};

export default LanguageSwitcher;