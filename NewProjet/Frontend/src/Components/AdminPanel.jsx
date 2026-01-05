import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  UserPlus, 
  Bell, 
  CheckCircle, 
  LogOut, 
  Shield,
  Trash2, 
  Power,
  Search,
  UserCheck,
  Clock,
  Lock,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// base API pour Vite
const API_BASE = import.meta.env.VITE_API_BASE || '';

const AdminPanel = ({ onLogout, currentUser }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [passwordChangeRequests, setPasswordChangeRequests] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    immatricule: '',
    nom_complet: '',
    role: 'agent'
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'demandes') {
      fetchAllRequests();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      const data = await response.json();
      if (response.ok) setUsers(data);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  const fetchAllRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les demandes de réinitialisation
      const resetResponse = await fetch(`${API_BASE}/api/auth/reset-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les demandes de changement de mot de passe
      const changeResponse = await fetch(`${API_BASE}/api/auth/password-change-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resetResponse.status === 401 || changeResponse.status === 401) {
        onLogout();
        return;
      }

      const resetData = await resetResponse.json();
      const changeData = await changeResponse.json();

      if (resetResponse.ok) setResetRequests(resetData);
      if (changeResponse.ok) setPasswordChangeRequests(changeData);
    } catch (error) {
      console.error('Erreur récupération demandes:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // FONCTION POUR APPROUVER LA RÉINITIALISATION
  const handleApproveReset = async (requestId) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette demande de réinitialisation ?')) {
      return;
    }

    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/approve-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          newPassword
        })
      });

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Mot de passe réinitialisé avec succès !\n\nNouveau mot de passe: ${data.newPassword}\n\nCommuniquez ce mot de passe à l'utilisateur.`);
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur approbation reset:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // FONCTION POUR APPROUVER LE CHANGEMENT DE MOT DE PASSE
  const handleApprovePasswordChange = async (requestId) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver ce changement de mot de passe ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/approve-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert('✅ Changement de mot de passe approuvé avec succès !');
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Erreur approbation changement:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // FONCTION POUR (DÉ)ACTIVER UN UTILISATEUR
  const handleDeactivateUser = async (userId, currentStatus) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      if (response.ok) {
        alert(`✅ Utilisateur ${action} avec succès`);
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        alert(data.message || `Erreur lors de la ${action}`);
      }
    } catch (error) {
      console.error(`Erreur ${action} utilisateur:`, error);
      alert('Erreur de connexion au serveur');
    }
  };

  // FONCTION POUR SUPPRIMER UN UTILISATEUR
  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      if (response.ok) {
        alert('✅ Utilisateur supprimé avec succès');
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // FONCTION POUR CRÉER UN NOUVEL UTILISATEUR
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.immatricule.trim() || !newUser.nom_complet.trim()) {
      alert('Immatricule et nom complet requis');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        immatricule: newUser.immatricule.trim(),
        nom_complet: newUser.nom_complet.trim(),
        role: newUser.role,
        fokontany_code: newUser.fokontany_code ? newUser.fokontany_code.trim() : null
      };
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? 'Bearer ' + token : ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || data.error || 'Erreur création utilisateur';
        alert(msg);
      } else {
        setShowUserForm(false);
        setNewUser({ immatricule: '', nom_complet: '', role: 'agent', fokontany_code: '' });
        fetchUsers();
        alert('Utilisateur créé. Mot de passe retourné : ' + (data.user?.password || '—'));
      }
    } catch (err) {
      console.error('create user error', err);
      alert('Erreur serveur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user =>
    user.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.immatricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination des utilisateurs
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Réinitialiser à la première page quand on change de recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getRoleBadge = (role) => {
    const roles = {
      admin: { color: 'bg-gray-800 text-white', text: 'Administrateur' },
      secretaire: { color: 'bg-gray-600 text-white', text: 'Secrétaire' },
      agent: { color: 'bg-gray-400 text-gray-900', text: 'Agent' }
    };
    return roles[role] || roles.agent;
  };

  const getStatusBadge = (isActive) => ({
    color: isActive ? 'bg-gray-300 text-gray-800' : 'bg-gray-700 text-white',
    text: isActive ? 'Actif' : 'Inactif'
  });

  // Calcul du nombre total de demandes pour la notification
  const totalDemands = resetRequests.length + passwordChangeRequests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-3 rounded-2xl shadow-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
                  Administration SIGAP
                </h1>
                <p className="text-black text-sm flex items-center space-x-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Connecté en tant que {currentUser?.nom_complet}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Bell className="w-5 h-5" />
                {totalDemands > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {totalDemands}
                  </span>
                )}
              </button>
              
              {/* Bouton Déconnexion - Gris avec border rouge par défaut, rouge au hover */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600  hover:text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-red-200 hover:bg-red-600 hover:border-red-600"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-lg border-b border-gray-200/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 bg-gray-100/50 rounded-2xl p-1.5 w-fit">
            {[
              { id: 'users', icon: Users, label: 'Utilisateurs', count: users.length },
              { id: 'demandes', icon: Key, label: 'Demandes', count: totalDemands }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-800 shadow-lg shadow-gray-500/10'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header avec recherche et actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Gestion des Utilisateurs
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredUsers.length} utilisateur(s) trouvé(s) • Page {currentPage} sur {totalPages}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-200 w-64"
                  />
                </div>
                
                <button
                  onClick={() => setShowUserForm(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <UserPlus size={18} />
                  <span>Nouvel Utilisateur</span>
                </button>
              </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              {currentUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 w-16 h-16 mb-4" />
                  <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer un nouvel utilisateur'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200/60 bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          Date de création
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/40">
                      {currentUsers.map((user) => {
                        const roleBadge = getRoleBadge(user.role);
                        const statusBadge = getStatusBadge(user.is_active);
                        
                        return (
                          <tr key={user.id} className="hover:bg-gray-50/30 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-2 rounded-xl">
                                  <UserCheck className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800">{user.nom_complet}</div>
                                  <div className="text-gray-600 text-sm">@{user.username}</div>
                                  <div className="text-gray-400 text-xs">{user.immatricule}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color} shadow-sm`}>
                                {roleBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} shadow-sm`}>
                                {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {/* Bouton Activer/Désactiver - Gris */}
                                <button
                                  onClick={() => handleDeactivateUser(user.id, user.is_active)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    user.is_active 
                                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={user.is_active ? 'Désactiver' : 'Activer'}
                                >
                                  <Power size={16} />
                                </button>
                                {/* Bouton Supprimer - Rouge */}
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
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
        )}

        {activeTab === 'demandes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Demandes en Attente
                </h2>
                <p className="text-gray-600 mt-1">
                  {totalDemands} demande(s) nécessitent votre attention
                </p>
              </div>
              <button
                onClick={fetchAllRequests}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <RefreshCw size={16} />
                <span>Actualiser</span>
              </button>
            </div>

            {/* Demandes de réinitialisation */}
            {resetRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-gray-600" />
                  <span>Demandes de Réinitialisation ({resetRequests.length})</span>
                </h3>
                <div className="grid gap-4">
                  {resetRequests.map((request) => {
                    const roleBadge = getRoleBadge(request.role);
                    
                    return (
                      <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-3 rounded-xl">
                              <Key className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">
                                <span className="text-gray-800 font-bold">🔐 {request.nom_complet}</span> demande la réinitialisation de son mot de passe
                              </h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><strong>Immatricule:</strong> {request.immatricule}</span>
                                <span><strong>Username:</strong> @{request.username}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                                  {roleBadge.text}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 text-gray-500 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleApproveReset(request.id)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <CheckCircle size={16} />
                            <span>Générer nouveau mot de passe</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Demandes de changement de mot de passe */}
            {passwordChangeRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span>Demandes de Changement de Mot de Passe ({passwordChangeRequests.length})</span>
                </h3>
                <div className="grid gap-4">
                  {passwordChangeRequests.map((request) => {
                    const roleBadge = getRoleBadge(request.role);
                    
                    return (
                      <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-3 rounded-xl">
                              <Lock className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">
                                <span className="text-gray-800 font-bold">🔄 {request.nom_complet}</span> veut personnaliser son mot de passe
                              </h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><strong>Immatricule:</strong> {request.immatricule}</span>
                                <span><strong>Username:</strong> @{request.username}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                                  {roleBadge.text}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 text-gray-500 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleApprovePasswordChange(request.id)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <CheckCircle size={16} />
                            <span>Approuver le changement</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aucune demande */}
            {totalDemands === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-12 text-center">
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune demande en attente</h3>
                <p className="text-gray-600">Toutes les demandes ont été traitées.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création d'utilisateur */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Nouvel Utilisateur</h3>
              <button
                onClick={() => setShowUserForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600">✕</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Immatricule *
                </label>
                <input
                  type="text"
                  value={newUser.immatricule}
                  onChange={(e) => setNewUser({...newUser, immatricule: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: AGENT001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={newUser.nom_complet}
                  onChange={(e) => setNewUser({...newUser, nom_complet: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: Jean Rakoto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="agent">Agent</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Fokontany (optionnel)
                </label>
                <input
                  type="text"
                  value={newUser.fokontany_code || ''}
                  onChange={(e) => setNewUser({...newUser, fokontany_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: TSIMENATSE_001"
                />
                <p className="text-xs text-gray-400 mt-1">Si l'utilisateur est un agent/secrétaire, renseignez le code du fokontany auquel il appartient.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-700 text-sm">
                  <strong>Note:</strong> Le nom d'utilisateur sera généré automatiquement à partir de l'immatricule et un mot de passe aléatoire sera créé.
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 px-4 rounded-lg font-semibold hover:from-gray-800 hover:to-gray-950 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création...</span>
                    </div>
                  ) : (
                    'Créer l\'utilisateur'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;