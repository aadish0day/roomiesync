import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building2, Utensils, AlertTriangle, ShieldCheck, CheckCircle2, Ban, Eye, Search, DollarSign, Activity, Trash2, RefreshCw, UserCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export default function AdminDashboardPage({ currentUser, onNavigate }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProperties: 0,
    totalMealPlans: 0,
    settledExpenses: 0,
    reports: [],
    users: []
  });
  const [usersList, setUsersList] = useState([]);
  const [propertiesList, setPropertiesList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const data = await apiService.getAdminStats();
      if (data) {
        setStats({
          totalUsers: Number(data.totalUsers) || 0,
          activeProperties: Number(data.activeProperties) || 0,
          totalMealPlans: Number(data.totalMealPlans) || 0,
          settledExpenses: Number(data.settledExpenses) || 0,
          reports: Array.isArray(data.reports) ? data.reports : [],
          users: Array.isArray(data.users) ? data.users : []
        });
        if (Array.isArray(data.users)) setUsersList(data.users);
        if (Array.isArray(data.reports)) setReportsList(data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      setActionError("Could not fetch latest administrator stats from backend.");
    }

    try {
      const props = await apiService.getProperties();
      if (Array.isArray(props)) {
        setPropertiesList(props);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleVerifyUser = async (id) => {
    setActionError('');
    setActionSuccess('');
    const user = (Array.isArray(usersList) ? usersList : []).find(u => u.id === id || u._id === id);
    if (!user) return;
    const newVerifiedState = !user.isVerified;

    // Optimistically update state
    setUsersList(prev => (Array.isArray(prev) ? prev.map(u => (u.id === id || u._id === id) ? { ...u, isVerified: newVerifiedState } : u) : []));

    try {
      await apiService.toggleVerifyUser(id, newVerifiedState);
      setActionSuccess(`User "${user.name || user.email}" ${newVerifiedState ? 'verified' : 'unverified'} successfully.`);
    } catch (err) {
      console.error("Failed to update user verification:", err);
      setActionError("Failed to update user verification on server. Changes reverted.");
      // Revert on failure
      setUsersList(prev => (Array.isArray(prev) ? prev.map(u => (u.id === id || u._id === id) ? { ...u, isVerified: !newVerifiedState } : u) : []));
    }
  };

  const handleRemoveUser = async (id) => {
    setActionError('');
    setActionSuccess('');
    const userToRemove = (Array.isArray(usersList) ? usersList : []).find(u => u.id === id || u._id === id);
    if (!userToRemove) return;

    // Optimistically update state
    setUsersList(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== id && u._id !== id) : []));
    setStats(prev => ({
      ...prev,
      totalUsers: Math.max(0, (Number(prev.totalUsers) || 1) - 1)
    }));

    try {
      await apiService.removeUser(id);
      setActionSuccess(`Account for "${userToRemove.name || userToRemove.email}" removed.`);
    } catch (err) {
      console.error("Failed to remove user:", err);
      setActionError("Failed to remove user account on server. Changes reverted.");
      // Revert on failure
      if (userToRemove) {
        setUsersList(prev => [userToRemove, ...(Array.isArray(prev) ? prev : [])]);
        setStats(prev => ({
          ...prev,
          totalUsers: (Number(prev.totalUsers) || 0) + 1
        }));
      }
    }
  };

  const handleToggleVerifyProperty = async (id, currentStatus) => {
    setActionError('');
    setActionSuccess('');
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';

    setPropertiesList(prev => (Array.isArray(prev) ? prev.map(p => (p.id === id || p._id === id) ? { ...p, status: nextStatus } : p) : []));

    try {
      await apiService.toggleVerifyProperty(id, nextStatus);
      setActionSuccess(`Property listing status marked as ${nextStatus}.`);
    } catch (err) {
      console.error("Failed to update property status:", err);
      setActionError("Failed to update property status. Reverted.");
      setPropertiesList(prev => (Array.isArray(prev) ? prev.map(p => (p.id === id || p._id === id) ? { ...p, status: currentStatus } : p) : []));
    }
  };

  const handleRemoveProperty = async (id) => {
    setActionError('');
    setActionSuccess('');
    const propToRemove = (Array.isArray(propertiesList) ? propertiesList : []).find(p => p.id === id || p._id === id);
    if (!propToRemove) return;

    setPropertiesList(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== id && p._id !== id) : []));
    setStats(prev => ({
      ...prev,
      activeProperties: Math.max(0, (Number(prev.activeProperties) || 1) - 1)
    }));

    try {
      await apiService.deleteProperty(id);
      setActionSuccess(`Property listing "${propToRemove.title}" removed.`);
    } catch (err) {
      console.error("Failed to remove property:", err);
      setActionError("Failed to remove property. Reverted.");
      setPropertiesList(prev => [propToRemove, ...(Array.isArray(prev) ? prev : [])]);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    setActionError('');
    setActionSuccess('');
    const reportToUpdate = (Array.isArray(reportsList) ? reportsList : []).find(r => r.id === reportId || r._id === reportId);
    if (!reportToUpdate) return;
    const oldStatus = reportToUpdate.status;

    // Optimistically update state
    const updatedReports = (Array.isArray(reportsList) ? reportsList : []).map(r => 
      (r.id === reportId || r._id === reportId) ? { ...r, status: action } : r
    );
    setReportsList(updatedReports);
    setStats(prev => ({ ...prev, reports: updatedReports }));

    if (action === 'User Banned' && reportToUpdate.targetUserId) {
      const matchUser = usersList.find(u => u.id === reportToUpdate.targetUserId || u._id === reportToUpdate.targetUserId || u.name === reportToUpdate.targetUserId);
      if (matchUser) {
        handleRemoveUser(matchUser.id || matchUser._id);
      }
    }

    try {
      await apiService.resolveReport(reportId, action);
      setActionSuccess(`Report resolution marked as: "${action}".`);
    } catch (err) {
      console.error("Failed to resolve report:", err);
      setActionError("Failed to update report resolution on server. Changes reverted.");
      // Revert on failure
      const revertedReports = (Array.isArray(reportsList) ? reportsList : []).map(r => 
        (r.id === reportId || r._id === reportId) ? { ...r, status: oldStatus } : r
      );
      setReportsList(revertedReports);
      setStats(prev => ({ ...prev, reports: revertedReports }));
    }
  };

  const pendingReportsCount = (Array.isArray(reportsList) ? reportsList : []).filter(r => r?.status === 'Under Review').length;

  const filteredUsers = (Array.isArray(usersList) ? usersList : []).filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
  });

  const filteredProperties = (Array.isArray(propertiesList) ? propertiesList : []).filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q) || (p.type || '').toLowerCase().includes(q);
  });

  const filteredReports = (Array.isArray(reportsList) ? reportsList : []).filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (r.targetUserId || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q);
  });

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in-50 duration-200">
      
      {/* Role Notice if not System Admin */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>
              You are viewing the Administrator Control Center as <strong>{currentUser?.name || 'User'}</strong> ({currentUser?.role || 'Guest'}).
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('auth')}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Sign In as System Admin
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bento-card p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest theme-text-accent">
              System Administration
            </span>
            <span className="theme-badge-emerald px-2 py-0.5 rounded text-[10px] font-mono-numbers font-bold">
              Live MongoDB
            </span>
          </div>
          <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display">
            <span>Admin Control Center</span>
            <LayoutDashboard className="w-6 h-6 text-[var(--accent-gold)]" />
          </h1>
          <p className="theme-text-sub text-xs max-w-xl">
            Platform KPI analytics, user account verification, fraud moderation queue, and live property listing controls.
          </p>
        </div>

        {/* Tab Navigation Chips */}
        <div className="flex flex-wrap items-center gap-1.5 glass-panel p-1.5 rounded-2xl text-xs">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeTab === 'overview' ? 'gradient-btn text-white shadow-md' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeTab === 'users' ? 'gradient-btn text-white shadow-md' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            Users ({Array.isArray(usersList) ? usersList.length : 0})
          </button>
          <button
            onClick={() => { setActiveTab('properties'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeTab === 'properties' ? 'gradient-btn text-white shadow-md' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            Properties ({Array.isArray(propertiesList) ? propertiesList.length : 0})
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'gradient-btn text-white shadow-md' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            <span>Moderation Queue</span>
            {pendingReportsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-2 rounded-xl theme-btn-secondary transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ml-1"
          >
            <RefreshCw className={`w-4 h-4 theme-text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl theme-badge-emerald text-xs font-semibold flex items-center gap-2 animate-in fade-in-50 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--accent-emerald)]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Admin KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold theme-text-muted tracking-wider">Registered Users</span>
            <div className="p-2.5 rounded-xl theme-badge-primary">
              <Users className="w-5 h-5 text-[var(--brand-accent)]" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold theme-text-main font-mono-numbers block tracking-tight">
              {usersList.length || stats.totalUsers || 0}
            </span>
            <span className="text-[11px] text-[var(--accent-emerald)] font-bold block mt-1">
              ✓ Active Profiles in DB
            </span>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold theme-text-muted tracking-wider">Active Listings</span>
            <div className="p-2.5 rounded-xl theme-badge-amber">
              <Building2 className="w-5 h-5 text-[var(--accent-gold)]" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold theme-text-main font-mono-numbers block tracking-tight">
              {propertiesList.length || stats.activeProperties || 0}
            </span>
            <span className="text-[11px] theme-text-accent font-bold block mt-1">
              Rooms & PGs Listed
            </span>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold theme-text-muted tracking-wider">Meal Subscribers</span>
            <div className="p-2.5 rounded-xl theme-badge-emerald">
              <Utensils className="w-5 h-5 text-[var(--accent-emerald)]" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold theme-text-main font-mono-numbers block tracking-tight">
              {stats.totalMealPlans || 0}
            </span>
            <span className="text-[11px] text-[var(--accent-emerald)] font-bold block mt-1">
              Active Mess Subscriptions
            </span>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold theme-text-muted tracking-wider">Settled Expenses</span>
            <div className="p-2.5 rounded-xl theme-badge-emerald">
              <DollarSign className="w-5 h-5 text-[var(--accent-emerald)]" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-[var(--accent-emerald)] font-mono-numbers block tracking-tight">
              ₹{(stats.settledExpenses || 0).toLocaleString()}
            </span>
            <span className="text-[11px] theme-text-muted font-bold block mt-1">
              Processed in Platform
            </span>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* System Health */}
          <div className="lg:col-span-7 bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <h3 className="text-base font-bold theme-text-main flex items-center gap-2 font-display">
              <Activity className="w-5 h-5 text-[var(--accent-emerald)]" /> 
              <span>System Infrastructure & Health</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bento-card-static">
                <span className="theme-text-sub font-semibold">MongoDB Database Engine</span>
                <span className="px-2.5 py-1 rounded-full theme-badge-emerald text-[10px] font-bold">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bento-card-static">
                <span className="theme-text-sub font-semibold">JWT Authentication Service</span>
                <span className="px-2.5 py-1 rounded-full theme-badge-emerald text-[10px] font-bold">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bento-card-static">
                <span className="theme-text-sub font-semibold">AI Weighted Compatibility Engine</span>
                <span className="px-2.5 py-1 rounded-full theme-badge-emerald text-[10px] font-bold">Active (0ms latency)</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bento-card-static">
                <span className="theme-text-sub font-semibold">Expense Split Ledger Engine</span>
                <span className="px-2.5 py-1 rounded-full theme-badge-emerald text-[10px] font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Moderation Summary */}
          <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <div className="space-y-3">
              <h3 className="text-base font-bold theme-text-main flex items-center gap-2 font-display">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-gold)]" /> 
                <span>Pending Moderation Queue</span>
              </h3>
              <p className="text-xs theme-text-sub leading-relaxed">
                There are currently <strong className="theme-text-accent font-mono-numbers">{pendingReportsCount}</strong> user reports awaiting administrator investigation.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-3.5 gradient-btn text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Open Moderation Queue ({pendingReportsCount}) →
            </button>
          </div>

        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bento-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold theme-text-main font-display">User Account Directory</h3>
              <span className="text-xs theme-text-muted font-mono-numbers">Showing {filteredUsers.length} of {usersList.length} accounts</span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 theme-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full theme-input py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[var(--brand-accent)] rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {filteredUsers.length === 0 ? (
              <div className="bento-card-static p-8 text-center theme-text-muted text-xs">
                No user accounts matching "{searchQuery}".
              </div>
            ) : (
              filteredUsers.map((u) => {
                const uId = u.id || u._id;
                return (
                  <div key={uId} className="p-4 rounded-2xl bento-card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img 
                          src={u.avatar} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--surface-border)]" 
                          alt={u.name || 'User'} 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-accent)] font-bold flex items-center justify-center text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold theme-text-main text-sm font-display">{u.name || 'User Account'}</h4>
                          {u.isVerified && (
                            <span className="theme-badge-emerald px-1.5 py-0.2 rounded text-[9px] font-bold">✓ Verified</span>
                          )}
                        </div>
                        <p className="theme-text-sub text-xs">
                          {u.email || 'No email provided'} • Role: <strong className="theme-text-accent capitalize">{u.role || 'Roommate'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleVerifyUser(uId)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                          u.isVerified ? 'theme-badge-emerald' : 'theme-btn-secondary'
                        }`}
                      >
                        {u.isVerified ? '✓ Verified' : 'Verify Account'}
                      </button>

                      <button
                        onClick={() => handleRemoveUser(uId)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="bento-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold theme-text-main font-display">Platform Property Listings</h3>
              <span className="text-xs theme-text-muted font-mono-numbers">Showing {filteredProperties.length} of {propertiesList.length} listings</span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 theme-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search location or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full theme-input py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[var(--brand-accent)] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full bento-card-static p-8 text-center theme-text-muted text-xs">
                No active property listings matching "{searchQuery}".
              </div>
            ) : (
              filteredProperties.map((prop) => {
                const propId = prop.id || prop._id;
                const isVerified = prop.status === 'verified';
                return (
                  <div key={propId} className="p-4 rounded-2xl bento-card-static space-y-3 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold theme-text-main text-sm font-display truncate">{prop.title || 'Property Listing'}</h4>
                        <span className="theme-badge-primary px-2 py-0.5 rounded text-[10px] font-bold">
                          {prop.type || 'PG'}
                        </span>
                      </div>
                      <p className="theme-text-sub text-xs">{prop.location || 'Location details'}</p>
                      <div className="flex items-center justify-between pt-2 border-t theme-border text-xs">
                        <span className="font-bold text-[var(--accent-emerald)] font-mono-numbers">
                          ₹{(Number(prop.price) || 0).toLocaleString()} / mo
                        </span>
                        <span className="theme-text-muted text-[11px]">Owner: {prop.ownerContact || prop.ownerName || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t theme-border justify-end">
                      <button
                        onClick={() => handleToggleVerifyProperty(propId, prop.status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                          isVerified ? 'theme-badge-emerald' : 'theme-btn-secondary'
                        }`}
                      >
                        {isVerified ? '✓ Verified Listing' : 'Verify Listing'}
                      </button>
                      <button
                        onClick={() => handleRemoveProperty(propId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Fraud Reports Queue Tab */}
      {activeTab === 'reports' && (
        <div className="bento-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold theme-text-main font-display">Moderation & Fraud Reports Queue</h3>
              <span className="text-xs theme-text-muted font-mono-numbers">Reports: {reportsList.length}</span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 theme-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search target user or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full theme-input py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[var(--brand-accent)] rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {filteredReports.length === 0 ? (
              <div className="bento-card-static p-8 text-center theme-text-muted text-xs space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[var(--accent-emerald)] mx-auto mb-1" />
                <p className="theme-text-main font-bold">No Pending Moderation Reports</p>
                <p className="theme-text-sub">The community queue is clean and clear of pending fraud reports.</p>
              </div>
            ) : (
              filteredReports.map((rep) => {
                const repId = rep.id || rep._id;
                return (
                  <div key={repId} className="p-4 rounded-2xl bento-card-static flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-500 dark:text-rose-400 font-mono-numbers text-xs">
                          Target: {rep.targetUserId || 'Unknown'}
                        </span>
                        <span className="theme-badge-amber px-2 py-0.5 rounded text-[10px] font-mono-numbers">
                          {rep.createdAt || 'Recent'}
                        </span>
                      </div>
                      <p className="theme-text-sub italic text-xs">"{rep.reason || 'Fraud report logged'}"</p>
                      <span className="text-[10px] theme-text-muted block">Reported by: {rep.reportedBy || 'Member'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.status === 'Under Review' ? (
                        <>
                          <button
                            onClick={() => handleResolveReport(repId, 'User Banned')}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Ban Account</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(repId, 'Report Dismissed')}
                            className="px-3.5 py-2 rounded-xl theme-btn-secondary text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <span className="theme-badge-primary px-3 py-1.5 rounded-xl font-bold text-xs">
                          Status: {rep.status || 'Resolved'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
