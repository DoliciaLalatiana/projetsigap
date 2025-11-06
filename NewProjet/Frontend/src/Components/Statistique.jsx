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
  User
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
  
  // Données spécifiques au fokontany Tsimenantsy
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
      ]
    }
  };

  const data = fokontanyData[selectedFokontany];

  const dernieresActivites = [
    {
      id: 1,
      titre: "Nouvelle résidence cartographiée",
      temps: "Il y a 5 minutes",
      couleur: "from-red-500 to-pink-500",
      icon: MapPin,
      statut: "success"
    },
    {
      id: 2,
      titre: "Recensement habitants mis à jour",
      temps: "Il y a 2 heures",
      couleur: "from-green-500 to-emerald-500",
      icon: Users,
      statut: "processing"
    },
    {
      id: 3,
      titre: "Rapport Tsimenantsy généré",
      temps: "Il y a 1 jour",
      couleur: "from-blue-500 to-cyan-500",
      icon: Satellite,
      statut: "completed"
    },
    {
      id: 4,
      titre: "Zone Antanetibe digitalisée",
      temps: "Il y a 2 jours",
      couleur: "from-orange-500 to-amber-500",
      icon: Layers,
      statut: "completed"
    },
  ];

  const genererPDF = () => {
    const date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport SIGAP - ${selectedFokontany}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
          }
          
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="white" fill-opacity="0.1"><circle cx="50" cy="50" r="2"/></svg>');
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
          }
          
          .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
          }
          
          .content {
            padding: 40px;
          }
          
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #10b981;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #10b981;
            text-align: center;
          }
          
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
          }
          
          .stat-label {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
          }
          
          .table-container {
            background: #f8fafc;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 15px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th {
            background: #10b981;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
          }
          
          td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .progress-bar {
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            height: 8px;
            margin: 8px 0;
          }
          
          .progress-fill {
            height: 100%;
            background: #10b981;
            border-radius: 10px;
          }
          
          .badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
          }
          
          .signature {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            text-align: right;
          }
          
          .footer {
            background: #1f2937;
            color: white;
            text-align: center;
            padding: 25px;
            font-size: 14px;
          }
          
          .footer p {
            margin: 5px 0;
          }
          
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
            }
            
            .container {
              box-shadow: none !important;
              border-radius: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 RAPPORT SIGAP OFFICIEL</h1>
            <div class="subtitle">
              Fokontany ${selectedFokontany} • ${date}
            </div>
          </div>
          
          <div class="content">
            <!-- Statistiques Principales -->
            <div class="section">
              <h2 class="section-title">📈 Aperçu Général</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${data.residences}</div>
                  <div class="stat-label">Résidences Cartographiées</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.habitants}</div>
                  <div class="stat-label">Habitants Enregistrés</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.densite}</div>
                  <div class="stat-label">Densité (hab./résidence)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.zones}</div>
                  <div class="stat-label">Zones Cartographiées</div>
                </div>
              </div>
            </div>
            
            <!-- Démographie -->
            <div class="section">
              <h2 class="section-title">👥 Démographie</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Groupe d'âge</th>
                      <th>Hommes</th>
                      <th>Femmes</th>
                      <th>Total</th>
                      <th>Répartition</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.pyramideAges.map(age => `
                      <tr>
                        <td><strong>${age.groupe} ans</strong></td>
                        <td>${age.hommes}</td>
                        <td>${age.femmes}</td>
                        <td><strong>${age.hommes + age.femmes}</strong></td>
                        <td>
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((age.hommes + age.femmes) / data.habitants * 100).toFixed(1)}%"></div>
                          </div>
                          ${((age.hommes + age.femmes) / data.habitants * 100).toFixed(1)}%
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Densité par Zone -->
            <div class="section">
              <h2 class="section-title">🗺️ Analyse Spatiale</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Densité</th>
                      <th>Résidences</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.densiteData.map(zone => `
                      <tr>
                        <td><strong>${zone.zone}</strong></td>
                        <td>${zone.densite} hab.</td>
                        <td>${zone.residences}</td>
                        <td><span class="badge">+${zone.progression}%</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Évolution -->
            <div class="section">
              <h2 class="section-title">📊 Évolution Mensuelle</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Résidences</th>
                      <th>Habitants</th>
                      <th>Croissance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.croissanceData.map((item, index) => {
                      const prevResidences = index > 0 ? data.croissanceData[index-1].residences : item.residences;
                      const prevHabitants = index > 0 ? data.croissanceData[index-1].habitants : item.habitants;
                      const croissanceResidences = index > 0 ? ((item.residences - prevResidences) / prevResidences * 100).toFixed(1) : 0;
                      const croissanceHabitants = index > 0 ? ((item.habitants - prevHabitants) / prevHabitants * 100).toFixed(1) : 0;
                      
                      return `
                        <tr>
                          <td><strong>${item.mois}</strong></td>
                          <td>${item.residences}</td>
                          <td>${item.habitants}</td>
                          <td>
                            <div>Résidences: <span style="color: ${croissanceResidences > 0 ? '#10b981' : '#ef4444'}">${croissanceResidences > 0 ? '+' : ''}${croissanceResidences}%</span></div>
                            <div>Habitants: <span style="color: ${croissanceHabitants > 0 ? '#10b981' : '#ef4444'}">${croissanceHabitants > 0 ? '+' : ''}${croissanceHabitants}%</span></div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Signature -->
            <div class="signature">
              <p><strong>Généré automatiquement par le Système SIGAP</strong></p>
              <p>Chef de Fokontany: <strong>${user?.name || "Jean Rakoto"}</strong></p>
              <p>Date de génération: ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Système d'Information Géographique pour l'Aménagement du Territoire</strong></p>
            <p>© ${new Date().getFullYear()} SIGAP - Ministère de l'Aménagement du Territoire</p>
            <p>Document confidentiel - Usage officiel uniquement</p>
          </div>
        </div>
        
        <script>
          // Impression automatique après chargement
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* EN-TÊTE FIXE */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl shadow-2xl p-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
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
                    <span className="text-sm">Chef: {user?.name || "Jean Rakoto"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{new Date().toLocaleDateString('fr-FR')}</span>
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
              <button
                onClick={onBack}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg"
              >
                <ArrowLeft size={16} />
                <span className="font-semibold text-sm">Retour</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU CENTRAL SCROLLABLE */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* STATISTIQUES PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Résidences", 
                value: data.residences, 
                change: "+25%", 
                icon: Home, 
                gradient: "from-red-500 to-pink-500",
                description: "Cartographiées",
                detail: `${data.menages} ménages • ${data.messages} messages`
              },
              { 
                title: "Habitants", 
                value: data.habitants, 
                change: "+18%", 
                icon: Users, 
                gradient: "from-green-500 to-emerald-500",
                description: "Enregistrés",
                detail: `${data.hommes}H / ${data.femmes}F`
              },
              { 
                title: "Densité", 
                value: data.densite, 
                change: "+5.2%", 
                icon: Building2, 
                gradient: "from-blue-500 to-cyan-500",
                description: "hab./résidence",
                detail: "Moyenne nationale: 28.3"
              },
              { 
                title: "Zones", 
                value: data.zones, 
                change: "+1", 
                icon: MapPin, 
                gradient: "from-purple-500 to-indigo-500",
                description: "secteurs actifs",
                detail: "100% couverture"
              }
            ].map((card, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-lg`}>
                    <card.icon className="text-white w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-sm font-semibold">{card.change}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{card.description}</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {card.value}
                </h3>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-gray-400 text-xs mt-1">{card.detail}</p>
              </div>
            ))}
          </div>

          {/* GRAPHIQUES */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Évolution démographique */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  📈 Évolution Démographique
                </h3>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">Résidences</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">Habitants</span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.croissanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Bar 
                      dataKey="residences" 
                      name="Résidences" 
                      fill="url(#gradientRed)" 
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="habitants" 
                      name="Habitants" 
                      fill="url(#gradientBlue)" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pyramide des âges */}
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
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700 w-16 text-sm">{groupe.groupe}</span>
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

          {/* TABLEAUX DÉTAILLÉS */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Densité par zone */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                🗺️ Analyse Spatiale
              </h3>
              <div className="space-y-3">
                {data.densiteData.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800">{zone.zone}</p>
                      <p className="text-gray-500 text-sm">{zone.residences} résidences</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{zone.densite}</p>
                      <p className="text-green-500 text-sm font-medium">+{zone.progression}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activités récentes */}
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
                    <div className={`bg-gradient-to-br ${item.couleur} p-3 rounded-xl shadow-md`}>
                      <item.icon className="text-white w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">
                        {item.titre}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{item.temps}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      item.statut === 'success' ? 'bg-green-500' : 
                      item.statut === 'processing' ? 'bg-blue-500 animate-pulse' : 
                      'bg-gray-400'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER FIXE */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-1">
                  <Navigation className="text-white w-3 h-3" />
                </div>
                <span className="text-sm font-semibold text-gray-700">SIGAP v2.1</span>
              </div>
              <div className="text-xs text-gray-500">
                Fokontany {selectedFokontany} • Données mises à jour en temps réel
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Chef: {user?.name || "Jean Rakoto"}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date().toLocaleDateString('fr-FR')}</span>
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