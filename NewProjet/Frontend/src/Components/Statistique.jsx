import React, { useState } from "react";
import {
  Users,
  Filter,
  Printer,
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

const Statistique = ({ onBack }) => {
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
    <div className="h-full flex flex-col">
      {/* Header avec contrôles à droite */}
      <div className="flex-shrink-0 flex items-center justify-between p-8 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="font-bold text-3xl text-gray-800 bg-white py-1.5 px-4 rounded-2xl">
          Statistiques
        </h1>
        
        {/* Contrôles en haut à droite */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedFokontany}
              onChange={(e) => setSelectedFokontany(e.target.value)}
              className="bg-transparent outline-none text-sm focus:ring-0 focus:border-transparent"
            >
              <option value="Tsimenantsy">Tsimenantsy</option>
            </select>
          </div>
          <button
            onClick={genererPDF}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm"
          >
            <Printer size={14} />
            <span>Générer PDF</span>
          </button>
        </div>
      </div>

      {/* Statistiques compactes */}
      <div className="flex-shrink-0 p-4 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-4 gap-4 ml-12 mr-12">
          
          {/* Résidences */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.residences}
                </div>
                <div className="text-xs text-gray-600 mt-1">Résidences</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <span>▲ 25%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>

          {/* Habitants */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.habitants}
                </div>
                <div className="text-xs text-gray-600 mt-1">Habitants</div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <span>▲ 18%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>

          {/* Hommes */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.hommes}
                </div>
                <div className="text-xs text-gray-600 mt-1">Hommes</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <span>{Math.round((data.hommes / data.habitants) * 100)}%</span>
              <span className="text-gray-500 ml-1">of total</span>
            </div>
          </div>

          {/* Femmes */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.femmes}
                </div>
                <div className="text-xs text-gray-600 mt-1">Femmes</div>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-pink-600">
              <span>{Math.round((data.femmes / data.habitants) * 100)}%</span>
              <span className="text-gray-500 ml-1">of total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable SEULEMENT */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-10">
        <div className="p-6 space-y-6 bg-gradient-to-r from-blue-50 to-indigo-50 h-full">
          
          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Évolution Démographique */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Évolution Démographique
                </h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                    Résidences
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                    Habitants
                  </span>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.croissanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="residences" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="habitants" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pyramide des Âges */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Pyramide des Âges
                </h3>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">Hommes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                    <span className="text-xs text-gray-600">Femmes</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {data.pyramideAges.map((groupe, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <span className="w-12 font-medium text-gray-700">{groupe.groupe}</span>
                    <div className="flex-1 flex h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="bg-blue-500 transition-all duration-300"
                        style={{ width: `${(groupe.hommes / 100) * 100}%` }}
                      />
                      <div
                        className="bg-pink-500 transition-all duration-300"
                        style={{ width: `${(groupe.femmes / 100) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs">
                      <span className="text-blue-600">♂{groupe.hommes}</span>
                      <span className="text-pink-600 ml-1">♀{groupe.femmes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analyse Spatiale */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">
              Analyse Spatiale par Zone
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {data.densiteData.map((zone, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{zone.zone}</p>
                    <p className="text-gray-500 text-xs">{zone.residences} résidences</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{zone.densite}</p>
                    <p className="text-green-500 text-xs">+{zone.progression}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistique;