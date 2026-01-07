import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Home,
  Printer,
  Mars,
  Venus
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const Statistique = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [selectedFokontany, setSelectedFokontany] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Fonction pour obtenir les noms des mois selon la langue
  const getLocalizedMonths = () => {
    const currentLang = i18n.language;
    
    if (currentLang === 'mg') {
      // Mois en malgache
      return ["Janoary", "Febroary", "Martsa", "Aprily", "Mey", "Jona", 
              "Jolay", "Aogositra", "Septambra", "Oktobra", "Novambra", "Desambra"];
    }
    
    // Par défaut en français
    return ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", 
            "Juil", "Août", "Sep", "Oct", "Nov", "Dec"];
  };

  // Charger l'utilisateur courant et son fokontany
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const headers = { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        };
        
        // Récupérer l'utilisateur connecté
        const userResponse = await fetch(`${API_BASE}/api/auth/me`, { headers });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
          
          // Déterminer le fokontany de l'utilisateur
          let userFokontany = "Ampasikibo"; // Valeur par défaut
          
          if (userData.fokontany && userData.fokontany.nom) {
            userFokontany = userData.fokontany.nom;
          } else if (userData.fokontany_name) {
            userFokontany = userData.fokontany_name;
          } else if (userData.fokontany) {
            userFokontany = userData.fokontany;
          }
          
          console.log("Fokontany de l'utilisateur:", userFokontany);
          setSelectedFokontany(userFokontany);
        }
      } catch (error) {
        console.error("Erreur chargement utilisateur:", error);
      }
    };

    loadCurrentUser();
  }, []);

  // Charger les données réelles depuis l'API en fonction du fokontany sélectionné
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!selectedFokontany) return;
      
      try {
        setLoading(true);
        
        // 1. Charger les résidences du fokontany sélectionné
        const residencesResp = await fetch(`${API_BASE}/api/residences?fokontany=${encodeURIComponent(selectedFokontany)}`);
        const residences = residencesResp.ok ? await residencesResp.json() : [];
        
        // 2. Charger toutes les personnes
        const token = localStorage.getItem("token");
        const headers = token 
          ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" };
          
        const personsResp = await fetch(`${API_BASE}/api/persons`, { headers });
        const allPersons = personsResp.ok ? await personsResp.json() : [];

        // 3. Calculer les statistiques
        const totalResidences = residences.length;
        
        // Filtrer les personnes qui sont dans les résidences du fokontany sélectionné
        const residentsInResidences = allPersons.filter(person => 
          residences.some(residence => residence.id === person.residence_id)
        );

        const totalResidents = residentsInResidences.length;
        const totalHommes = residentsInResidences.filter(person => 
          person.genre === 'homme' || person.genre === 'Homme' || person.genre === 'male'
        ).length;
        const totalFemmes = residentsInResidences.filter(person => 
          person.genre === 'femme' || person.genre === 'Femme' || person.genre === 'female'
        ).length;

        // 4. Calculer la densité (approximative)
        const densite = totalResidences > 0 ? (totalResidents / totalResidences).toFixed(1) : 0;

        // 5. Calculer la pyramide des âges
        const pyramideAges = calculerPyramideAges(residentsInResidences);

        // 6. Données de croissance (simulées basées sur les données actuelles)
        const croissanceData = genererDonneesCroissance(totalResidences, totalResidents);

        // 7. Données de densité par zone (basées sur les quartiers réels)
        const densiteData = calculerDensiteParZone(residences, residentsInResidences);

        setStatistics({
          totalResidences,
          totalResidents,
          totalHommes,
          totalFemmes,
          densite: parseFloat(densite),
          zones: new Set(residences.map(r => r.quartier).filter(Boolean)).size,
          menages: totalResidences,
          messages: 0,
          croissanceData,
          densiteData,
          pyramideAges
        });

      } catch (error) {
        console.error("Erreur chargement statistiques:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedFokontany) {
      fetchStatistics();
    }
  }, [selectedFokontany]);

  // Recharger les données quand la langue change
  useEffect(() => {
    if (statistics) {
      // Regénérer les données de croissance avec les mois localisés
      const newCroissanceData = genererDonneesCroissance(
        statistics.totalResidences, 
        statistics.totalResidents
      );
      
      setStatistics(prev => ({
        ...prev,
        croissanceData: newCroissanceData
      }));
    }
  }, [i18n.language]);

  // Fonction pour calculer la pyramide des âges
  const calculerPyramideAges = (persons) => {
    const groupes = [
      { groupe: "0-18", min: 0, max: 18 },
      { groupe: "19-35", min: 19, max: 35 },
      { groupe: "36-60", min: 36, max: 60 },
      { groupe: "60+", min: 61, max: 120 }
    ];

    return groupes.map(groupe => {
      const personnesGroupe = persons.filter(person => {
        if (!person.date_naissance && !person.dateNaissance) return false;
        
        const dateNaissance = person.date_naissance || person.dateNaissance;
        const age = calculerAge(dateNaissance);
        return age >= groupe.min && age <= groupe.max;
      });

      const hommes = personnesGroupe.filter(p => 
        p.genre === 'homme' || p.genre === 'Homme' || p.genre === 'male'
      ).length;
      
      const femmes = personnesGroupe.filter(p => 
        p.genre === 'femme' || p.genre === 'Femme' || p.genre === 'female'
      ).length;

      return {
        groupe: groupe.groupe,
        hommes,
        femmes
      };
    });
  };

  // Fonction pour calculer l'âge
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

  // Générer des données de croissance basées sur les données actuelles
  const genererDonneesCroissance = (totalResidences, totalResidents) => {
    const mois = getLocalizedMonths();
    const data = [];
    
    // Simulation de croissance progressive
    let residences = Math.max(1, Math.round(totalResidences * 0.3));
    let habitants = Math.max(1, Math.round(totalResidents * 0.3));
    
    mois.forEach(mois => {
      data.push({
        mois,
        residences: Math.min(residences, totalResidences),
        habitants: Math.min(habitants, totalResidents)
      });
      
      // Augmentation progressive
      residences = Math.min(residences + Math.round(totalResidences / 12), totalResidences);
      habitants = Math.min(habitants + Math.round(totalResidents / 12), totalResidents);
    });

    return data;
  };

  // Calculer la densité par zone/quartier
  const calculerDensiteParZone = (residences, persons) => {
    const zones = {};
    
    residences.forEach(residence => {
      const zone = residence.quartier || t("unspecifiedZone");
      if (!zones[zone]) {
        zones[zone] = {
          residences: 0,
          residents: 0
        };
      }
      zones[zone].residences++;
      
      // Compter les résidents de cette résidence
      const residentsZone = persons.filter(p => p.residence_id === residence.id);
      zones[zone].residents += residentsZone.length;
    });

    return Object.entries(zones).map(([zone, data], index) => ({
      zone,
      densite: data.residences > 0 ? Math.round(data.residents / data.residences) : 0,
      residences: data.residences,
      progression: Math.round(Math.random() * 20) + 5
    }));
  };

  const genererPDF = () => {
    if (!statistics) return;

    const locale = i18n.language === 'mg' ? 'mg-MG' : 'fr-FR';
    const date = new Date().toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t("statistics")} SIGAP - ${selectedFokontany}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("statistics")} SIGAP - ${selectedFokontany}</h1>
          <p>${t("date")}: ${date}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>${t("address")}</h3>
            <p>${statistics.totalResidences}</p>
          </div>
          <div class="stat-card">
            <h3>${t("residents")}</h3>
            <p>${statistics.totalResidents}</p>
          </div>
        </div>
        
        <h2>${t("demographics")}</h2>
        <table>
          <thead>
            <tr>
              <th>${t("ageGroup")}</th>
              <th>${t("men")}</th>
              <th>${t("women")}</th>
              <th>${t("total")}</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.pyramideAges.map(age => `
              <tr>
                <td>${age.groupe} ${t("years")}</td>
                <td>${age.hommes}</td>
                <td>${age.femmes}</td>
                <td>${age.hommes + age.femmes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p>${t("generatedBy")} SIGAP</p>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loadingStatistics")}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("errorLoadingStatistics")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header avec contrôles à droite */}
      <div className="flex-shrink-0 flex items-center justify-between p-8 border-gray-200/60 bg-transparent">
        <div className="flex flex-col">
          <h1 className="font-bold text-3xl text-gray-800">
            {t("statistics")}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {t("overviewOfPopulationData")} - {selectedFokontany}
          </p>
        </div>
        
        {/* Contrôles en haut à droite - SEULEMENT le bouton PDF */}
        <div className="flex items-center space-x-4">
          {/* Affichage simple du fokontany (non éditable) */}
          <div className="flex items-center space-x-2 bg-white backdrop-blur-sm border border-gray-300/60 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-800">
              {selectedFokontany || t("loading")}
            </span>
          </div>
          
          <button
            onClick={genererPDF}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm"
          >
            <Printer size={14} />
            <span>{t("generatePDF")}</span>
          </button>
        </div>
      </div>

      {/* Statistiques compactes - alignées avec le titre */}
      <div className="flex-shrink-0 p-4 border-gray-200/60 bg-transparent">
        <div className="grid grid-cols-4 gap-4 ml-2 mr-2">
          
          {/* Adresses */}
          <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Home className="w-4 h-4 text-gray-800" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {statistics.totalResidences}
                </div>
                <div className="text-xs text-gray-600">{t("address")}</div>
              </div>
            </div>
            <div className="mt-auto flex items-center text-xs">
              <span className="text-gray-700">▲ 25%</span>
              <span className="text-gray-500 ml-1">{t("vsLastMonth")}</span>
            </div>
          </div>

          {/* Résidents */}
          <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-800" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {statistics.totalResidents}
                </div>
                <div className="text-xs text-gray-600">{t("residents")}</div>
              </div>
            </div>
            <div className="mt-auto flex items-center text-xs">
              <span className="text-gray-700">▲ 18%</span>
              <span className="text-gray-500 ml-1">{t("vsLastMonth")}</span>
            </div>
          </div>

          {/* Hommes */}
          <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Mars className="w-4 h-4 text-gray-800" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {statistics.totalHommes}
                </div>
                <div className="text-xs text-gray-600">{t("men")}</div>
              </div>
            </div>
            <div className="mt-auto flex items-center text-xs">
              <span className="text-gray-700">{Math.round((statistics.totalHommes / statistics.totalResidents) * 100)}%</span>
              <span className="text-gray-500 ml-1">{t("ofTotal")}</span>
            </div>
          </div>

          {/* Femmes */}
          <div className="bg-white backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/60 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Venus className="w-4 h-4 text-gray-800" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {statistics.totalFemmes}
                </div>
                <div className="text-xs text-gray-600">{t("women")}</div>
              </div>
            </div>
            <div className="mt-auto flex items-center text-xs">
              <span className="text-gray-700">{Math.round((statistics.totalFemmes / statistics.totalResidents) * 100)}%</span>
              <span className="text-gray-500 ml-1">{t("ofTotal")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable SEULEMENT */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-10">
        <div className="p-6 space-y-6 bg-transparent h-full">
          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Évolution Démographique */}
            <div className="bg-white backdrop-blur-sm border border-gray-200/60 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {t("demographicEvolution")}
                </h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                    {t("address")}
                  </span>
                  <span className="px-2 py-1 bg-gray-300 text-gray-800 rounded-full text-xs">
                    {t("residents")}
                  </span>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.croissanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="mois" fontSize={10} stroke="#666" />
                    <YAxis fontSize={10} stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="residences" fill="#404040" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="habitants" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pyramide des Âges */}
            <div className="bg-white backdrop-blur-sm border border-gray-200/60 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {t("agePyramid")}
                </h3>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-800 rounded"></div>
                    <span className="text-xs text-gray-600">{t("men")}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    <span className="text-xs text-gray-600">{t("women")}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {statistics.pyramideAges.map((groupe, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <span className="w-12 font-medium text-gray-700">{groupe.groupe}</span>
                    <div className="flex-1 flex h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="bg-gray-800 transition-all duration-300"
                        style={{ width: `${(groupe.hommes / (groupe.hommes + groupe.femmes)) * 100}%` }}
                      />
                      <div
                        className="bg-gray-400 transition-all duration-300"
                        style={{ width: `${(groupe.femmes / (groupe.hommes + groupe.femmes)) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs">
                      <span className="text-gray-800">♂{groupe.hommes}</span>
                      <span className="text-gray-600 ml-1">♀{groupe.femmes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistique;