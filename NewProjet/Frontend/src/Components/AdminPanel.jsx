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
  Clock
} from 'lucide-react';

const AdminPanel = ({ onLogout, currentUser }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    immatricule: '',
    nom_complet: '',
    role: 'agent'
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reset-requests') {
      fetchResetRequests();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
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

  const fetchResetRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/reset-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      const data = await response.json();
      if (response.ok) setResetRequests(data);
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
      const response = await fetch('http://localhost:5000/api/auth/approve-reset', {
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
        fetchResetRequests(); // Recharger les demandes
      } else {
        alert(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur approbation reset:', error);
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          immatricule: newUser.immatricule.trim(),
          nom_complet: newUser.nom_complet.trim(),
          role: newUser.role
        })
      });

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Utilisateur créé avec succès!\n\nUsername: ${data.user.username}\nMot de passe: ${data.user.password}\n\nNotez bien ces informations !`);
        setShowUserForm(false);
        setNewUser({ immatricule: '', nom_complet: '', role: 'agent' });
        fetchUsers();
      } else {
        alert(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.immatricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const roles = {
      admin: { color: 'from-purple-500 to-pink-500', text: 'Administrateur' },
      secretaire: { color: 'from-blue-500 to-cyan-500', text: 'Secrétaire' },
      agent: { color: 'from-green-500 to-emerald-500', text: 'Agent' }
    };
    return roles[role] || roles.agent;
  };

  const getStatusBadge = (isActive) => ({
    color: isActive ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500',
    text: isActive ? 'Actif' : 'Inactif'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Administration SIGAP
                </h1>
                <p className="text-slate-600 text-sm flex items-center space-x-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Connecté en tant que {currentUser?.nom_complet}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors">
                <Bell className="w-5 h-5" />
                {resetRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {resetRequests.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-lg border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 bg-slate-100/50 rounded-2xl p-1.5 w-fit">
            {[
              { id: 'users', icon: Users, label: 'Utilisateurs', count: users.length },
              { id: 'reset-requests', icon: Key, label: 'Demandes', count: resetRequests.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-lg shadow-blue-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-300 text-slate-700'
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
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gestion des Utilisateurs
                </h2>
                <p className="text-slate-600 mt-1">
                  {users.length} utilisateur(s) dans le système
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 w-64"
                  />
                </div>
                
                <button
                  onClick={() => setShowUserForm(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <UserPlus size={18} />
                  <span>Nouvel Utilisateur</span>
                </button>
              </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-slate-300 w-16 h-16 mb-4" />
                  <p className="text-slate-500 text-lg">Aucun utilisateur trouvé</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer un nouvel utilisateur'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200/60 bg-slate-50/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Date de création
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40">
                      {filteredUsers.map((user) => {
                        const roleBadge = getRoleBadge(user.role);
                        const statusBadge = getStatusBadge(user.is_active);
                        
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/30 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 rounded-xl">
                                  <UserCheck className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">{user.nom_complet}</div>
                                  <div className="text-slate-600 text-sm">@{user.username}</div>
                                  <div className="text-slate-400 text-xs">{user.immatricule}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${roleBadge.color} text-white shadow-sm`}>
                                {roleBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusBadge.color} text-white shadow-sm`}>
                                {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDeactivateUser(user.id, user.is_active)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    user.is_active 
                                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                                  }`}
                                  title={user.is_active ? 'Désactiver' : 'Activer'}
                                >
                                  <Power size={16} />
                                </button>
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
          </div>
        )}

        {activeTab === 'reset-requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Demandes de Réinitialisation
                </h2>
                <p className="text-slate-600 mt-1">
                  {resetRequests.length} demande(s) en attente
                </p>
              </div>
            </div>

            {resetRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-12 text-center">
                <div className="bg-gradient-to-br from-green-100 to-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucune demande en attente</h3>
                <p className="text-slate-600">Toutes les demandes de réinitialisation ont été traitées.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {resetRequests.map((request) => {
                  const roleBadge = getRoleBadge(request.role);
                  
                  return (
                    <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-3 rounded-xl">
                            <Clock className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg">{request.nom_complet}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                              <span><strong>Immatricule:</strong> {request.immatricule}</span>
                              <span><strong>Username:</strong> @{request.username}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${roleBadge.color} text-white`}>
                                {roleBadge.text}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1 text-slate-500 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleApproveReset(request.id)}
                          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        >
                          <CheckCircle size={16} />
                          <span>Approuver</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <h3 className="text-xl font-bold text-slate-800">Nouvel Utilisateur</h3>
              <button
                onClick={() => setShowUserForm(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <span className="text-slate-400 hover:text-slate-600">✕</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Immatricule *
                </label>
                <input
                  type="text"
                  value={newUser.immatricule}
                  onChange={(e) => setNewUser({...newUser, immatricule: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: AGENT001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={newUser.nom_complet}
                  onChange={(e) => setNewUser({...newUser, nom_complet: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: Jean Rakoto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="agent">Agent</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">
                  <strong>Note:</strong> Le nom d'utilisateur sera généré automatiquement à partir de l'immatricule et un mot de passe aléatoire sera créé.
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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