import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, User, Users, Home, Utensils, FileText, 
  CreditCard, Star, Bell, LayoutDashboard, LogOut, Sparkles, ChevronDown, Moon, Sun, Building2, Menu, X, CheckCircle2 
} from 'lucide-react';

import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import MatchingPage from './pages/MatchingPage';
import PropertiesPage from './pages/PropertiesPage';
import MealPlansPage from './pages/MealPlansPage';
import AgreementPage from './pages/AgreementPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import ReviewsPage from './pages/ReviewsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import OwnerPanelPage from './pages/OwnerPanelPage';
import { apiService } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const userId = (parsed.id || parsed._id || '').toString();
        if (!userId) return null;
        return {
          ...parsed,
          id: userId,
          _id: userId
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState('landing');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;
    apiService.getNotifications(userId)
      .then(notifs => {
        if (isMounted) {
          if (Array.isArray(notifs)) {
            setUnreadCount(notifs.filter(n => n && !n.isRead).length);
          } else {
            setUnreadCount(0);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching notification count:", err);
        if (isMounted) setUnreadCount(0);
      });

    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?._id]);

  // Navbar State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const servicesDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('light-theme', theme === 'light');
    html.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const navigateTo = (module, replace = false) => {
    if (!module) return;
    setActiveModule(module);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setUserDropdownOpen(false);
    const state = { module };
    const url = `#${module}`;
    if (replace) {
      window.history.replaceState(state, '', url);
    } else {
      window.history.pushState(state, '', url);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const module = event.state?.module || window.location.hash.slice(1) || 'landing';
      setActiveModule(module);
    };

    const handleClickOutside = (event) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target)) {
        setServicesDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('mousedown', handleClickOutside);

    const hashModule = window.location.hash.slice(1);
    if (hashModule) {
      setActiveModule(hashModule);
      window.history.replaceState({ module: hashModule }, '', window.location.href);
    } else {
      window.history.replaceState({ module: activeModule }, '', `#${activeModule}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUnreadCount(0);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setUserDropdownOpen(false);
    navigateTo('auth');
  };

  const handleLoginSuccess = (user) => {
    if (!user) return;
    const userId = (user.id || user._id || `usr_${Date.now()}`).toString();
    const normalizedUser = {
      ...user,
      id: userId,
      _id: userId
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    const targetModule = normalizedUser.role === 'admin' ? 'admin' : normalizedUser.role === 'landlord' ? 'owner' : 'dashboard';
    navigateTo(targetModule);
  };

  const handleProfileUpdated = (updated) => {
    if (!updated) return;
    const profileData = updated.profile || updated;
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const merged = { ...prevUser, ...profileData };
      const userId = (merged.id || merged._id || prevUser.id || prevUser._id || '').toString();
      const normalized = {
        ...merged,
        id: userId,
        _id: userId
      };
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    });
  };

  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'matching', label: 'Match Roommates', icon: Users },
    { id: 'properties', label: 'Explore Rooms & PGs', icon: Home },
  ];

  const serviceNavItems = [
    { id: 'meals', label: 'Meal Subscriptions', desc: 'Home-cooked daily thalis & healthy mess plans', icon: Utensils },
    { id: 'expenses', label: 'Expense Tracker', desc: 'Split rent, utilities & groceries easily', icon: CreditCard },
    { id: 'agreement', label: 'Digital Agreement', desc: 'Customizable house rules & PDF contract', icon: FileText },
    { id: 'reviews', label: 'Reviews & Trust', desc: 'Ratings & fake user reporting system', icon: Star },
    ...(currentUser?.role === 'landlord' ? [{ id: 'owner', label: 'PG Owner Panel', desc: 'Manage your listed rooms & site visits', icon: Building2 }] : []),
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', desc: 'System stats & user moderation queue', icon: LayoutDashboard }] : []),
  ];

  const isServiceActive = serviceNavItems.some(item => item.id === activeModule);

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden max-w-full">
      
      {/* Floating Island Header */}
      <header className="sticky top-3 z-50 px-4 max-w-7xl mx-auto w-full">
        <div className="bento-card-static backdrop-blur-xl bg-[var(--surface-card)]/90 border border-[var(--surface-border)] shadow-xl shadow-black/10 rounded-2xl px-4 py-2.5 flex items-center justify-between transition-all">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none transition-transform duration-200 hover:scale-105 active:scale-95" 
            onClick={() => navigateTo(currentUser ? 'dashboard' : 'landing')}
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-md shadow-[var(--brand-glow)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold theme-text-main tracking-tight font-display flex items-center gap-1.5">
                RoomieSync
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              {primaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      isActive
                        ? 'bg-[var(--brand-primary)] text-white shadow-sm border border-[var(--surface-border-accent)]'
                        : 'theme-text-sub hover:theme-text-main hover:bg-[var(--surface-card-hover)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'theme-text-muted'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Living Hub Dropdown */}
              <div className="relative" ref={servicesDropdownRef}>
                <button
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    isServiceActive || servicesDropdownOpen
                      ? 'bg-[var(--brand-primary)] text-white border border-[var(--surface-border-accent)] shadow-sm'
                      : 'theme-text-sub hover:theme-text-main hover:bg-[var(--surface-card-hover)]'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isServiceActive || servicesDropdownOpen ? 'text-amber-300' : 'text-[var(--accent-gold)]'}`} />
                  <span>Living Hub</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Panel */}
                {servicesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bento-card p-2 shadow-2xl border border-[var(--surface-border-accent)] z-50 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="px-3 py-2 text-[10px] uppercase font-bold theme-text-muted tracking-wider border-b border-[var(--surface-border)] mb-1">
                      Co-Living Services
                    </div>
                    {serviceNavItems.map(s => {
                      const SIcon = s.icon;
                      const isSActive = activeModule === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => navigateTo(s.id)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 ${
                            isSActive ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'hover:bg-[var(--surface-card-hover)]'
                          }`}
                        >
                          <div className={`p-2 rounded-lg bento-card-static ${isSActive ? 'text-white bg-white/10' : 'text-[var(--brand-accent)]'} shrink-0 mt-0.5 transition-colors duration-200`}>
                            <SIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-xs font-bold font-display ${isSActive ? 'text-white' : 'theme-text-main'}`}>{s.label}</div>
                            <div className={`text-[10px] leading-tight mt-0.5 ${isSActive ? 'text-white/80' : 'theme-text-muted'}`}>{s.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            
            {/* Notification Bell */}
            {currentUser && (
              <button
                onClick={() => navigateTo('notifications')}
                className={`p-2 rounded-xl theme-btn-secondary relative transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${activeModule === 'notifications' ? 'border-[var(--brand-accent)] text-[var(--brand-accent)] bg-[var(--brand-primary)]/10' : ''}`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent-emerald)] ring-2 ring-[var(--surface-card)] animate-ping"></span>
                )}
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle light / dark theme"
              className="p-2 rounded-xl theme-btn-secondary transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:rotate-12"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--accent-gold)]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-800" />
              )}
            </button>

            {/* User Profile Pill */}
            {currentUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 theme-btn-secondary p-1 pr-2.5 rounded-xl text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:border-[var(--brand-accent)]"
                >
                  <div className="relative">
                    <img 
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'} 
                      alt={currentUser.name || 'User'} 
                      className="w-7 h-7 rounded-lg object-cover ring-2 ring-[var(--brand-accent)]/40" 
                    />
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] absolute bottom-0 right-0 ring-1 ring-black"></span>
                  </div>
                  <span className="font-semibold theme-text-main max-w-[90px] truncate hidden sm:inline">
                    {(currentUser.name || 'User').split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 theme-text-muted transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Options Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-56 bento-card p-2 shadow-2xl border border-[var(--surface-border-accent)] z-50 animate-in fade-in-50 zoom-in-95 duration-200 text-xs">
                    <div className="p-3 border-b border-[var(--surface-border)] mb-1">
                      <p className="font-bold theme-text-main font-display">{currentUser.name || 'User'}</p>
                      <p className="theme-text-muted text-[10px] truncate">{currentUser.email || ''}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase font-bold theme-badge-emerald px-2 py-0.5 rounded-md">
                        {currentUser.role || 'user'} Account
                      </span>
                    </div>

                    <button
                      onClick={() => navigateTo('profile')}
                      className="w-full px-3 py-2 rounded-xl text-left theme-text-sub hover:theme-text-main hover:bg-[var(--surface-card-hover)] flex items-center gap-2 transition-all duration-200 hover:translate-x-0.5 active:scale-98"
                    >
                      <User className="w-4 h-4 text-[var(--brand-accent)]" />
                      <span>Edit Lifestyle Profile</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-semibold transition-all duration-200 hover:translate-x-0.5 active:scale-98"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigateTo('auth')}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-bold px-4 py-2 text-xs rounded-xl shadow-md shadow-[var(--brand-glow)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            {currentUser && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl theme-btn-secondary transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {currentUser && mobileMenuOpen && (
          <div className="lg:hidden mt-2 bento-card p-4 space-y-2 border border-[var(--surface-border-accent)] animate-in fade-in-50 slide-in-from-top-2 duration-200 shadow-2xl">
            <div className="text-[10px] uppercase font-bold theme-text-muted tracking-wider mb-2">Navigation</div>
            {primaryNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  activeModule === item.id 
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                    : 'theme-text-sub hover:bg-[var(--surface-card-hover)] hover:translate-x-1'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}

            <div className="text-[10px] uppercase font-bold theme-text-muted tracking-wider pt-3 border-t border-[var(--surface-border)] mb-2">
              Living Hub Services
            </div>
            {serviceNavItems.map(s => (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  activeModule === s.id 
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                    : 'theme-text-sub hover:bg-[var(--surface-card-hover)] hover:translate-x-1'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main View Area */}
      <main className="flex-1">
        {!currentUser ? (
          activeModule === 'auth' || activeModule === 'admin' ? (
            <AuthPage
              onLoginSuccess={handleLoginSuccess}
              onReturnHome={() => navigateTo('landing')}
              adminNotice={activeModule === 'admin'}
            />
          ) : (
            <LandingPage onNavigate={navigateTo} />
          )
        ) : activeModule === 'profile' ? (
          <ProfilePage user={currentUser} onProfileUpdated={handleProfileUpdated} />
        ) : activeModule === 'dashboard' ? (
          <DashboardPage currentUser={currentUser} onNavigate={navigateTo} />
        ) : activeModule === 'landing' ? (
          <LandingPage onNavigate={navigateTo} />
        ) : activeModule === 'matching' ? (
          <MatchingPage currentUser={currentUser} />
        ) : activeModule === 'properties' ? (
          <PropertiesPage currentUser={currentUser} />
        ) : activeModule === 'meals' ? (
          <MealPlansPage currentUser={currentUser} />
        ) : activeModule === 'agreement' ? (
          <AgreementPage currentUser={currentUser} />
        ) : activeModule === 'expenses' ? (
          <ExpenseTrackerPage currentUser={currentUser} />
        ) : activeModule === 'reviews' ? (
          <ReviewsPage currentUser={currentUser} />
        ) : activeModule === 'notifications' ? (
          <NotificationsPage currentUser={currentUser} />
        ) : activeModule === 'owner' ? (
          <OwnerPanelPage currentUser={currentUser} />
        ) : activeModule === 'admin' ? (
          <AdminDashboardPage currentUser={currentUser} onNavigate={navigateTo} />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-[var(--surface-border)] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs theme-text-sub">
          <div className="space-y-2 theme-text-main">
            <p className="text-sm font-semibold theme-text-main font-display">Contact RoomieSync</p>
            <p>
              Email: <a href="mailto:support@roomiesync.com" className="theme-text-accent hover:underline font-mono-numbers transition-colors duration-200">support@roomiesync.com</a>
            </p>
            <p>
              Phone: <a href="tel:+1234567890" className="theme-text-accent hover:underline font-mono-numbers transition-colors duration-200">+1 (234) 567-890</a>
            </p>
            <p className="theme-text-muted max-w-xl">Need help with roommate matches, agreements, or expense tracking? Reach out and our support team will get back to you quickly.</p>
          </div>
          <div className="theme-text-muted text-left sm:text-right">
            <p className="theme-text-sub">RoomieSync © {new Date().getFullYear()}</p>
            <p className="theme-text-muted">Secure shared living made simple.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
