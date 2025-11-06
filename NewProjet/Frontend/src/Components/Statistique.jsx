import React from "react";
import { Users, Home, Building2, Map, Clock, ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const Statistique = ({ user, onBack }) => {
  // Exemple de données pour les graphiques (à remplacer par tes vraies données)
  const habitantsData = [
    { mois: "Jan", habitants: 120 },
    { mois: "Fév", habitants: 150 },
    { mois: "Mar", habitants: 180 },
    { mois: "Avr", habitants: 210 },
    { mois: "Mai", habitants: 260 },
    { mois: "Juin", habitants: 320 },
    { mois: "Juil", habitants: 360 },
    { mois: "Août", habitants: 400 },
  ];

  // === Données pour les activités mensuelles ===
  const activiteData = [
    { mois: "Jan", activites: 35 },
    { mois: "Fév", activites: 45 },
    { mois: "Mar", activites: 60 },
    { mois: "Avr", activites: 75 },
    { mois: "Mai", activites: 80 },
    { mois: "Juin", activites: 70 },
    { mois: "Juil", activites: 90 },
    { mois: "Août", activites: 100 },
  ];

  // === Données des dernières activités ===
  const dernieresActivites = [
    {
      id: 1,
      titre: "Nouvelle résidence ajoutée",
      temps: "Il y a 5 minutes",
      couleur: "bg-blue-500",
    },
    {
      id: 2,
      titre: "Nouvel appartement ajouté",
      temps: "Il y a 2 heures",
      couleur: "bg-green-500",
    },
    {
      id: 3,
      titre: "Nouvelle personne ajoutée",
      temps: "Il y a 1 jour",
      couleur: "bg-purple-500",
    },
    {
      id: 4,
      titre: "Mise à jour des données",
      temps: "Il y a 2 jours",
      couleur: "bg-orange-500",
    },
  ];

  // === Données pour la répartition des habitants ===
  const repartitionData = [
    { name: "Résidence A", value: 35, color: "#E74C3C" },
    { name: "Résidence B", value: 25, color: "#E67E22" },
    { name: "Résidence C", value: 20, color: "#F1C40F" },
    { name: "Résidence D", value: 20, color: "#27AE60" },
  ];
  

  return (
    <div className="h-[70vh] flex flex-col">
      {/* TITRE + BOUTON RETOUR */}
      <div className="bg-[#C0392B] p-6 rounded-2xl shadow-sm hover:shadow-md transition sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Bonjour,{" "}
            <span className="text-white">{user?.name || "Jean D."}</span> 👋
          </h2>
          <p className="text-white mt-1">
            Voici un aperçu général des activités du Fokontany.
          </p>
        </div>
        {/* BOUTON RETOUR */}
        <button
          onClick={onBack}
          className="flex items-center space-x-1 bg-white text-[#C0392B] px-3 py-2 rounded-lg shadow hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
      </div>

      {/* CARTES STATISTIQUES */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hidden space-y-8 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
          {/* Carte 1 */}
          <div className="bg-blue-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Résidences</p>
                <h3 className="text-2xl font-bold text-white mt-1">12</h3>
                <p className="text-white text-sm">Résidences</p>
              </div>
              <div className="bg-[#E67E22]/10 p-3 rounded-full">
                <Users className="text-[#FFFFFF] w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Carte 2 */}
          <div className="bg-green-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Personnes</p>
                <h3 className="text-2xl font-bold text-white mt-1">327</h3>
                <p className="text-white text-sm">Habitants</p>
              </div>
              <div className="bg-[#E67E22]/10 p-3 rounded-full">
                <Building2 className="text-[#FFFFFF] w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Carte 3 */}
          <div className="bg-purple-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Démarches</p>
                <h3 className="text-2xl font-bold text-white mt-1">458</h3>
                <p className="text-white text-sm">En cours</p>
              </div>
              <div className="bg-[#27AE60]/10 p-3 rounded-full">
                <Home className="text-[#FFFFFF] w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Carte 4 */}
          <div className="bg-orange-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Croissance</p>
                <h3 className="text-2xl font-bold text-white mt-1">+12%</h3>
                <p className="text-white text-sm">Ce mois</p>
              </div>
              <div className="bg-[#2980B9]/10 p-3 rounded-full">
                <Map className="text-[#FFFFFF] w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* === Graphiques === */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* === Graphique 1 : Évolution des habitants === */}
          <div className="bg-white shadow rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Évolution des habitants
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={habitantsData}>
                <defs>
                  <linearGradient
                    id="colorHabitants"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" stroke="#888" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="habitants"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorHabitants)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* === Graphique 2 : Activités mensuelles === */}
          <div className="bg-white shadow rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Activités mensuelles
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activiteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" stroke="#888" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="activites"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* === Dernières activités + Répartition des habitants === */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Dernières activités */}
          <div className="bg-white shadow rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" /> Dernières activités
            </h3>
            <ul className="space-y-4">
              {dernieresActivites.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${item.couleur}`}
                    ></span>
                    <span className="text-gray-800 font-medium">
                      {item.titre}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{item.temps}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Répartition des habitants */}
          <div className="bg-white shadow rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Répartition des habitants
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={repartitionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {repartitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistique;
