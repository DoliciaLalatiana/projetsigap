import React, { useState } from "react";
import {
  Users,
  Home,
  Building2,
  MapPin,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Zap,
  Navigation,
  Layers,
  Satellite,
  Filter,
  Printer,
  Calendar,
  User,
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

const Statistique = ({ user, onBack }) => {
  const [selectedFokontany, setSelectedFokontany] = useState("Tsimenantsy");

  const fokontanyData = {
    Tsimenantsy: {
      residences: 15,
      habitants: 445,
      hommes: 218,
      femmes: 227,
      densite: 35.8,
      zones: 4,
      menages: 132,
      messages: 152,
      croissanceData: [
        { mois: "Jan", residences: 8, habitants: 240 },
        { mois: "Fév", residences: 9, habitants: 265 },
        { mois: "Mar", residences: 10, habitants: 290 },
        { mois: "Avr", residences: 11, habitants: 315 },
        { mois: "Mai", residences: 12, habitants: 345 },
        { mois: "Juin", residences: 13, habitants: 380 },
        { mois: "Juil", residences: 14, habitants: 410 },
        { mois: "Août", residences: 15, habitants: 445 },
      ],
      densiteData: [
        { zone: "Amboditsiry", densite: 45, residences: 6, progression: 12 },
        { zone: "Ankadindramamy", densite: 32, residences: 4, progression: 8 },
        { zone: "Andranomena", densite: 28, residences: 3, progression: 5 },
        { zone: "Antanetibe", densite: 38, residences: 5, progression: 15 },
      ],
      pyramideAges: [
        { groupe: "0-18", hommes: 45, femmes: 43 },
        { groupe: "19-35", hommes: 68, femmes: 72 },
        { groupe: "36-60", hommes: 85, femmes: 88 },
        { groupe: "60+", hommes: 20, femmes: 24 },
      ],
    },
  };

  const data = fokontanyData[selectedFokontany];

  const dernieresActivites = [
    {
      id: 1,
      titre: "Nouvelle résidence cartographiée",
      temps: "Il y a 5 minutes",
      couleur: "from-red-500 to-pink-500",
      icon: MapPin,
      statut: "success",
    },
    {
      id: 2,
      titre: "Recensement habitants mis à jour",
      temps: "Il y a 2 heures",
      couleur: "from-green-500 to-emerald-500",
      icon: Users,
      statut: "processing",
    },
    {
      id: 3,
      titre: "Rapport Tsimenantsy généré",
      temps: "Il y a 1 jour",
      couleur: "from-blue-500 to-cyan-500",
      icon: Satellite,
      statut: "completed",
    },
    {
      id: 4,
      titre: "Zone Antanetibe digitalisée",
      temps: "Il y a 2 jours",
      couleur: "from-orange-500 to-amber-500",
      icon: Layers,
      statut: "completed",
    },
  ];

  const genererPDF = () => {
    const date = new Date().toLocaleDateString("fr-FR", {
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
        <title>Rapport SIGAP - ${selectedFokontany}</title>
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
          <h1>Rapport SIGAP - ${selectedFokontany}</h1>
          <p>Date: ${date}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Résidences</h3>
            <p>${data.residences}</p>
          </div>
          <div class="stat-card">
            <h3>Habitants</h3>
            <p>${data.habitants}</p>
          </div>
        </div>
        
        <h2>Démographie</h2>
        <table>
          <thead>
            <tr>
              <th>Groupe d'âge</th>
              <th>Hommes</th>
              <th>Femmes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.pyramideAges.map(age => `
              <tr>
                <td>${age.groupe} ans</td>
                <td>${age.hommes}</td>
                <td>${age.femmes}</td>
                <td>${age.hommes + age.femmes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p>Généré automatiquement par SIGAP</p>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl shadow-2xl p-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg"
              >
                <ArrowLeft size={16} />
                <span className="font-semibold text-sm">Retour</span>
              </button>

              {user?.role === 'admin' && (
                <a href="/admin" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Admin
                </a>
              )}

              <div className="relative">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                  <BarChart3 className="text-white w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-lg">
                  <Zap className="text-white w-2 h-2" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Tableau de Bord Fokontany
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-1">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedFokontany}
                      onChange={(e) => setSelectedFokontany(e.target.value)}
                      className="bg-transparent border-none text-sm focus:outline-none focus:ring-0"
                    >
                      <option value="Tsimenantsy">Tsimenantsy</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      Chef: {user?.name || "Jean Rakoto"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date().toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={genererPDF}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg"
              >
                <Printer size={16} />
                <span className="font-semibold text-sm">Générer PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Résidences",
                value: data.residences,
                change: "+25%",
                icon: Home,
                gradient: "from-red-500 to-pink-500",
                description: "Cartographiées",
                detail: `${data.menages} ménages • ${data.messages} messages`,
              },
              {
                title: "Habitants",
                value: data.habitants,
                change: "+18%",
                icon: Users,
                gradient: "from-green-500 to-emerald-500",
                description: "Enregistrés",
                detail: `${data.hommes}H / ${data.femmes}F`,
              },
              {
                title: "Densité",
                value: data.densite,
                change: "+5.2%",
                icon: Building2,
                gradient: "from-blue-500 to-cyan-500",
                description: "hab./résidence",
                detail: "Moyenne nationale: 28.3",
              },
              {
                title: "Zones",
                value: data.zones,
                change: "+1",
                icon: MapPin,
                gradient: "from-purple-500 to-indigo-500",
                description: "secteurs actifs",
                detail: "100% couverture",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-lg`}
                  >
                    <card.icon className="text-white w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-sm font-semibold">
                        {card.change}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {card.description}
                    </span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {card.value}
                </h3>
                <p className="text-gray-600 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-gray-400 text-xs mt-1">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  📈 Évolution Démographique
                </h3>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                    Résidences
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    Habitants
                  </span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.croissanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      opacity={0.5}
                    />
                    <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="residences"
                      name="Résidences"
                      fill="#ef4444"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="habitants"
                      name="Habitants"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  👥 Pyramide des Âges
                </h3>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">Hommes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-pink-500 rounded"></div>
                    <span className="text-xs text-gray-600">Femmes</span>
                  </div>
                </div>
              </div>
              <div className="h-80 space-y-4">
                {data.pyramideAges.map((groupe, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <span className="font-semibold text-gray-700 w-16 text-sm">
                      {groupe.groupe}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="flex h-8 rounded-lg overflow-hidden shadow-sm">
                        <div
                          className="bg-blue-500 transition-all duration-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                          style={{ width: `${(groupe.hommes / 100) * 100}%` }}
                        >
                          {groupe.hommes > 15 && `${groupe.hommes}%`}
                        </div>
                        <div
                          className="bg-pink-500 transition-all duration-500 flex items-center justify-start pl-2 text-white text-xs font-medium"
                          style={{ width: `${(groupe.femmes / 100) * 100}%` }}
                        >
                          {groupe.femmes > 15 && `${groupe.femmes}%`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600 min-w-20">
                      <div className="font-semibold">♂ {groupe.hommes}%</div>
                      <div className="font-semibold">♀ {groupe.femmes}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                🗺️ Analyse Spatiale
              </h3>
              <div className="space-y-3">
                {data.densiteData.map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{zone.zone}</p>
                      <p className="text-gray-500 text-sm">
                        {zone.residences} résidences
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {zone.densite}
                      </p>
                      <p className="text-green-500 text-sm font-medium">
                        +{zone.progression}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                📋 Journal des Activités
              </h3>
              <div className="space-y-4">
                {dernieresActivites.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div
                      className={`bg-gradient-to-br ${item.couleur} p-3 rounded-xl shadow-md`}
                    >
                      <item.icon className="text-white w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">
                        {item.titre}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{item.temps}</p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.statut === "success"
                          ? "bg-green-500"
                          : item.statut === "processing"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-1">
                  <Navigation className="text-white w-3 h-3" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  SIGAP v2.1
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Fokontany {selectedFokontany} • Données mises à jour en temps
                réel
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Chef: {user?.name || "Jean Rakoto"}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                ● En ligne
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistique;