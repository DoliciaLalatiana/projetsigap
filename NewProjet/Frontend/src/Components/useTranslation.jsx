import { useLanguage } from './LanguageContext';

// Textes de traduction pour toute l'application
const translations = {
  fr: {
    // Textes communs
    welcome: "Bienvenue",
    login: "Connexion",
    register: "S'inscrire",
    email: "Email",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    forgotPassword: "Mot de passe oublié?",
    rememberMe: "Se souvenir de moi",
    dontHaveAccount: "Vous n'avez pas de compte?",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    // Ajoutez tous les textes de votre application ici
  },
  mg: {
    // Textes communs
    welcome: "Tongasoa",
    login: "Hiditra",
    register: "Hisoratra anarana",
    email: "Mailaka",
    password: "Teny miafina",
    confirmPassword: "Hamarinina ny teny miafina",
    forgotPassword: "Hadino ny teny miafina?",
    rememberMe: "Tsarovy aho",
    dontHaveAccount: "Tsy manana kaonty ianao?",
    alreadyHaveAccount: "Manana kaonty efa ianao?",
    // Ajoutez tous les textes de votre application ici
  }
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return { t, language };
};