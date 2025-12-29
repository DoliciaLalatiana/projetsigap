import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "LotLabel": "Numéro de lot *",
      "Next": "Suivant",
      "Back": "Retour",
      "Confirm": "Confirmer",
      "AddPerson": "Ajouter une personne",
      "Remove": "Supprimer",
      "FirstName": "Prénom",
      "LastName": "Nom",
      "BirthDate": "Date de naissance",
      "CIN": "Numéro CIN",
      "Minor": "Mineur",
      "Sex": "Sexe",
      "Male": "Masculin",
      "Female": "Féminin",
      "Phone": "Téléphone (optionnel)",
      "SelectedFokontany": "Fokontany sélectionné",
      "SaveSuccessResidence": "Résidence enregistrée",
      "SaveError": "Erreur lors de l'enregistrement",
      "AddAnotherPerson": "Ajouter une autre personne",
      "Language": "FR/MG",
      "ChangeLanguage": "FR / MG",
      "title": "Paramètres du profil",
      "profilePhoto": "Changer la photo de profil",
      "immatriculation": "Immatriculation",
      "username": "Nom d'utilisateur",
      "changePassword": "Changer le mot de passe",
      "passwordChangeTitle": "Modification du mot de passe",
      "secureProcess": "Processus sécurisé",
      "secureProcessDesc": "Votre mot de passe sera modifié de façon sécurisée.",
      "cancel": "Annuler",
      "sending": "Envoi...",
      "sendRequest": "Envoyer",
      "logout": "Se déconnecter",
      "oldPassword": "Ancien mot de passe",
      "newPassword": "Nouveau mot de passe",
      "confirmPassword": "Confirmer le mot de passe",
      "oldPasswordPlaceholder": "Ancien mot de passe",
      "newPasswordPlaceholder": "Nouveau mot de passe",
      "confirmPasswordPlaceholder": "Confirmer le mot de passe",
      // AJOUTEZ CES CLÉS MANQUANTES :
      "photoTooLarge": "La photo est trop volumineuse (max 5MB)",
      "invalidImage": "Format d'image invalide",
      "photoUpdated": "Photo mise à jour avec succès",
      "connectionError": "Erreur de connexion",
      "allFieldsRequired": "Tous les champs sont obligatoires",
      "passwordsDontMatch": "Les mots de passe ne correspondent pas",
      "passwordTooShort": "Le mot de passe doit contenir au moins 6 caractères",
      "passwordChangeRequest": "Demande de changement de mot de passe envoyée"
    }
  },
  mg: {
    translation: {
      "LotLabel": "Nomeraon'ny lot *",
      "Next": "Manaraka",
      "Back": "Miverina",
      "Confirm": "Manamafy",
      "AddPerson": "Manampy olona",
      "Remove": "Esory",
      "FirstName": "Anarana",
      "LastName": "Fanampin'anarana",
      "BirthDate": "Daty nahaterahana",
      "CIN": "Nomeraon'ny CIN",
      "Minor": "Zanakely",
      "Sex": "Seks",
      "Male": "Lehilahy",
      "Female": "Vehivavy",
      "Phone": "Telefaona (tsy voatery)",
      "SelectedFokontany": "Fokontany voafidy",
      "SaveSuccessResidence": "Voatahiry ny trano fonenana",
      "SaveError": "Nisy olana tamin'ny fitahirizana",
      "AddAnotherPerson": "Manampy olona hafa",
      "Language": "FR/MG",
      "ChangeLanguage": "FR / MG",
      "title": "Toe-javatra momba ny mombamomba",
      "profilePhoto": "Ovay ny sary mombamomba",
      "immatriculation": "Fanamarihana",
      "username": "Anaran'ny mpampiasa",
      "changePassword": "Ovay ny tenimiafina",
      "passwordChangeTitle": "Fanovana tenimiafina",
      "secureProcess": "Dingana azo antoka",
      "secureProcessDesc": "Ny tenimiafinao dia hovaina amin'ny fomba azo antoka.",
      "cancel": "Fanafoanana",
      "sending": "Mandefa...",
      "sendRequest": "Alefaso",
      "logout": "Mivoaka",
      "oldPassword": "Teny miafina taloha",
      "newPassword": "Teny miafina vaovao",
      "confirmPassword": "Hamarino ny tenimiafina",
      "oldPasswordPlaceholder": "Teny miafina taloha",
      "newPasswordPlaceholder": "Teny miafina vaovao",
      "confirmPasswordPlaceholder": "Hamarino ny tenimiafina",
      // AJOUTEZ CES CLÉS MANQUANTES :
      "photoTooLarge": "Be loatra ny haben'ny sary (5MB farafahakeliny)",
      "invalidImage": "Endrika sary tsy azo ekena",
      "photoUpdated": "Nohavaozina soa aman-tsara ny sary",
      "connectionError": "Olana amin'ny fifandraisana",
      "allFieldsRequired": "Tsy maintsy fenoina ny saha rehetra",
      "passwordsDontMatch": "Tsy mifanaraka ny tenimiafina",
      "passwordTooShort": "Tokony ho 6 farafahakeliny ny isan'ny litera ao amin'ny tenimiafina",
      "passwordChangeRequest": "Nalefa ny fangatahana fanovana tenimiafina"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Important pour éviter les problèmes
    }
  });

// --- debug helper: expose et log changements de langue ---
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}
i18n.on && i18n.on('languageChanged', (lng) => {
  console.info('[i18n] languageChanged ->', lng);
});

export default i18n;