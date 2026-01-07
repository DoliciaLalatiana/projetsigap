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
  ChevronRight,
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// base API pour Vite
const API_BASE = import.meta.env.VITE_API_BASE || '';

const AdminPanel = ({ onLogout, currentUser }) => {
  const { t, i18n } = useTranslation();
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
  const [itemsPerPage] = useState(3);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'demandes') {
      fetchAllRequests();
    }
  }, [activeTab]);

  // Fonction pour changer la langue
  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'mg' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Obtenir le texte du bouton de langue
  const getLanguageButtonText = () => {
    return i18n.language === 'fr' ? 'FR' : 'MG';
  };

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
      alert(t('connectionError'));
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
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR APPROUVER LA RÉINITIALISATION
  const handleApproveReset = async (requestId) => {
    if (!confirm(i18n.language === 'fr' 
      ? 'Êtes-vous sûr de vouloir approuver cette demande de réinitialisation ?'
      : 'Azo antoka fa te-hankato ity fangatahana famerenana ity ve ianao?')) {
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
        alert(i18n.language === 'fr' 
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(i18n.language === 'fr'
          ? `✅ Mot de passe réinitialisé avec succès !\n\nNouveau mot de passe: ${data.newPassword}\n\nCommuniquez ce mot de passe à l'utilisateur.`
          : `✅ Nohavaozina soa aman-tsara ny tenimiafina !\n\nTeni miafina vaovao: ${data.newPassword}\n\nAmpitaho ity tenimiafina ity amin'ny mpampiasa.`);
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error('Erreur approbation reset:', error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR REJETER LA RÉINITIALISATION
  const handleRejectReset = async (requestId) => {
    if (!confirm(i18n.language === 'fr' 
      ? 'Êtes-vous sûr de vouloir rejeter cette demande de réinitialisation ?'
      : 'Azo antoka fa te-handà ity fangatahana famerenana ity ve ianao?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/reject-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (response.status === 401) {
        alert(i18n.language === 'fr' 
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(i18n.language === 'fr'
          ? '✅ Demande de réinitialisation rejetée avec succès.'
          : '✅ Noterenana ny fangatahana famerenana tenimiafina.');
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error('Erreur rejet reset:', error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR APPROUVER LE CHANGEMENT DE MOT DE PASSE
  const handleApprovePasswordChange = async (requestId) => {
    if (!confirm(i18n.language === 'fr'
      ? 'Êtes-vous sûr de vouloir approuver ce changement de mot de passe ?'
      : 'Azo antoka fa te-hankato ity fanovana tenimiafina ity ve ianao?')) {
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
        alert(i18n.language === 'fr'
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + t('passwordChangeSuccess'));
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error('Erreur approbation changement:', error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR REJETER LE CHANGEMENT DE MOT DE PASSE
  const handleRejectPasswordChange = async (requestId) => {
    if (!confirm(i18n.language === 'fr'
      ? 'Êtes-vous sûr de vouloir rejeter ce changement de mot de passe ?'
      : 'Azo antoka fa te-handà ity fanovana tenimiafina ity ve ianao?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/reject-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (response.status === 401) {
        alert(i18n.language === 'fr'
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(i18n.language === 'fr'
          ? '✅ Demande de changement de mot de passe rejetée avec succès.'
          : '✅ Noterenana ny fangatahana fanovana tenimiafina.');
        fetchAllRequests(); // Recharger les demandes
      } else {
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error('Erreur rejet changement:', error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR (DÉ)ACTIVER UN UTILISATEUR
  const handleDeactivateUser = async (userId, currentStatus) => {
    const action = currentStatus ? t('deactivate') : t('activate');
    const actionText = currentStatus ? 'désactiver' : 'activer';
    const actionTextMg = currentStatus ? 'hanala' : 'hamelona';
    
    if (!confirm(i18n.language === 'fr'
      ? `Êtes-vous sûr de vouloir ${actionText} cet utilisateur ?`
      : `Azo antoka fa te-${actionTextMg} ity mpampiasa ity ve ianao?`)) {
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
        alert(i18n.language === 'fr'
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      if (response.ok) {
        alert(`✅ ${t('user')} ${actionText} ${t('success')}`);
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error(`Erreur ${actionText} utilisateur:`, error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR SUPPRIMER UN UTILISATEUR
  const handleDeleteUser = async (userId) => {
    if (!confirm(i18n.language === 'fr'
      ? 'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?'
      : 'Azo antoka fa te-hamafa tanteraka ity mpampiasa ity ve ianao?')) {
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
        alert(i18n.language === 'fr'
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Tapitra ny fotoam-pidirana. Midiram-pidirana indray azafady.');
        onLogout();
        return;
      }

      if (response.ok) {
        alert('✅ ' + t('user') + ' ' + t('delete') + ' ' + t('success'));
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        alert(data.message || t('error'));
      }
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      alert(t('connectionError'));
    }
  };

  // FONCTION POUR CRÉER UN NOUVEL UTILISATEUR
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.immatricule.trim() || !newUser.nom_complet.trim()) {
      alert(t('allFieldsRequired'));
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
        const msg = data.message || data.error || t('error');
        alert(msg);
      } else {
        setShowUserForm(false);
        setNewUser({ immatricule: '', nom_complet: '', role: 'agent', fokontany_code: '' });
        fetchUsers();
        alert(i18n.language === 'fr'
          ? 'Utilisateur créé. Mot de passe retourné : ' + (data.user?.password || '—')
          : 'Noforonina ny mpampiasa. Tenimiafina niverina : ' + (data.user?.password || '—'));
      }
    } catch (err) {
      console.error('create user error', err);
      alert(t('serverError'));
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
      admin: { 
        color: 'bg-gray-800 text-white', 
        text: t('administratorRole')
      },
      secretaire: { 
        color: 'bg-gray-600 text-white', 
        text: t('secretaryRole')
      },
      agent: { 
        color: 'bg-gray-400 text-gray-900', 
        text: t('agentRole')
      }
    };
    return roles[role] || roles.agent;
  };

  const getStatusBadge = (isActive) => ({
    color: isActive ? 'bg-gray-300 text-gray-800' : 'bg-gray-700 text-white',
    text: isActive ? t('active') : t('inactive')
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
                  {t('adminTitle')}
                </h1>
                <p className="text-black text-sm flex items-center space-x-1">
                  <UserCheck className="w-4 h-4" />
                  <span>{t('connectedAs')} {currentUser?.nom_complet}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Bouton de changement de langue */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200"
                title={i18n.language === 'fr' ? 'Passer en malgache' : 'Mivily amin\'ny frantsay'}
              >
                <span className="font-medium">{getLanguageButtonText()}</span>
              </button>
              
              {/* Bouton de notification */}
              <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Bell className="w-5 h-5" />
                {totalDemands > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {totalDemands}
                  </span>
                )}
              </button>
              
              {/* Bouton Déconnexion */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-red-200 hover:bg-red-600 hover:border-red-600"
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
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
              { id: 'users', icon: Users, label: t('users'), count: users.length },
              { id: 'demandes', icon: Key, label: t('requests'), count: totalDemands }
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
                  {t('usersManagement')}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredUsers.length} {t('usersFound')} • {t('page')} {currentPage} {t('of')} {totalPages}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('searchUser')}
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
                  <span>{t('newUser')}</span>
                </button>
              </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              {currentUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 w-16 h-16 mb-4" />
                  <p className="text-gray-500 text-lg">{t('noUsersFound')}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 
                      t('tryModifySearch') : 
                      t('startByCreatingUser')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200/60 bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          {t('user')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          {t('role')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          {t('status')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          {t('creationDate')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider">
                          {t('actions')}
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
                              {new Date(user.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'mg-MG')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {/* Bouton Activer/Désactiver */}
                                <button
                                  onClick={() => handleDeactivateUser(user.id, user.is_active)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    user.is_active 
                                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={user.is_active ? t('deactivate') : t('activate')}
                                >
                                  <Power size={16} />
                                </button>
                                {/* Bouton Supprimer */}
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                                  title={t('deleteUser')}
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
                  {t('pendingRequests')}
                </h2>
                <p className="text-gray-600 mt-1">
                  {totalDemands} {t('requestsNeedAttention')}
                </p>
              </div>
              <button
                onClick={fetchAllRequests}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <RefreshCw size={16} />
                <span>{t('refresh')}</span>
              </button>
            </div>

            {/* Demandes de réinitialisation */}
            {resetRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-gray-600" />
                  <span>{t('resetRequests')} ({resetRequests.length})</span>
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
                                <span className="text-gray-800 font-bold">🔐 {request.nom_complet}</span> {t('resetPasswordRequest')}
                              </h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><strong>{t('registrationNumber')}</strong> {request.immatricule}</span>
                                <span><strong>{t('usernameField')}</strong> @{request.username}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                                  {roleBadge.text}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 text-gray-500 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{t('requestedOn')} {new Date(request.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'mg-MG')} {i18n.language === 'fr' ? 'à' : 'amin\'ny'} {new Date(request.created_at).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'mg-MG')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRejectReset(request.id)}
                              className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-red-200 transition-all duration-200 hover:scale-105"
                            >
                              <XCircle size={16} />
                              <span>{t('reject')}</span>
                            </button>
                            <button
                              onClick={() => handleApproveReset(request.id)}
                              className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            >
                              <CheckCircle size={16} />
                              <span>{t('generateNewPassword')}</span>
                            </button>
                          </div>
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
                  <span>{t('passwordChangeRequests')} ({passwordChangeRequests.length})</span>
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
                                <span className="text-gray-800 font-bold">🔄 {request.nom_complet}</span> {t('wantsToCustomizePassword')}
                              </h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><strong>{t('registrationNumber')}</strong> {request.immatricule}</span>
                                <span><strong>{t('usernameField')}</strong> @{request.username}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                                  {roleBadge.text}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 text-gray-500 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{t('requestedOn')} {new Date(request.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'mg-MG')} {i18n.language === 'fr' ? 'à' : 'amin\'ny'} {new Date(request.created_at).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'mg-MG')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRejectPasswordChange(request.id)}
                              className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-red-200 transition-all duration-200 hover:scale-105"
                            >
                              <XCircle size={16} />
                              <span>{t('reject')}</span>
                            </button>
                            <button
                              onClick={() => handleApprovePasswordChange(request.id)}
                              className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            >
                              <CheckCircle size={16} />
                              <span>{t('approveChange')}</span>
                            </button>
                          </div>
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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noPendingRequestsFound')}</h3>
                <p className="text-gray-600">{t('allRequestsProcessed')}</p>
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
              <h3 className="text-xl font-bold text-gray-800">{t('newUser')}</h3>
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
                  {t('registrationField')} *
                </label>
                <input
                  type="text"
                  value={newUser.immatricule}
                  onChange={(e) => setNewUser({...newUser, immatricule: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder={i18n.language === 'fr' ? "Ex: AGENT001" : "Ohatra: AGENT001"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  value={newUser.nom_complet}
                  onChange={(e) => setNewUser({...newUser, nom_complet: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder={i18n.language === 'fr' ? "Ex: Jean Rakoto" : "Ohatra: Jean Rakoto"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('roleField')}
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="agent">{t('agent')}</option>
                  <option value="secretaire">{t('secretary')}</option>
                  <option value="admin">{t('administrator')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fokontanyCode')} ({t('optional')})
                </label>
                <input
                  type="text"
                  value={newUser.fokontany_code || ''}
                  onChange={(e) => setNewUser({...newUser, fokontany_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder={i18n.language === 'fr' ? "Ex: TSIMENATSE_001" : "Ohatra: TSIMENATSE_001"}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {i18n.language === 'fr' 
                    ? 'Si l\'utilisateur est un agent/secrétaire, renseignez le code du fokontany auquel il appartient.'
                    : 'Raha mpampiasa mpiasam-panjakana/mpanoratra ianao, ampio ny kaodin\'ny fokontany izay anjarany.'}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-700 text-sm">
                  <strong>{t('note')}</strong> {t('usernameGenerated')}
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 px-4 rounded-lg font-semibold hover:from-gray-800 hover:to-gray-950 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('creating')}</span>
                    </div>
                  ) : (
                    t('createUser')
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