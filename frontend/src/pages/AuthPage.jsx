import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Lock, Mail, User, Sparkles, Building2, Utensils, ArrowRight, CheckCircle2, UserCheck, ShieldAlert
} from 'lucide-react';
import { apiService } from '../services/api';

export default function AuthPage({ onLoginSuccess, onReturnHome }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const demoAccounts = [
    {
      roleId: 'user',
      label: 'Aarav Sharma',
      subText: 'Roommate Seeker',
      email: 'aarav@example.com',
      badge: 'theme-badge-primary',
      icon: User
    },
    {
      roleId: 'landlord',
      label: 'Vikram Sethi',
      subText: 'Property Owner',
      email: 'landlord@example.com',
      badge: 'theme-badge-amber',
      icon: Building2
    },
    {
      roleId: 'mess',
      label: 'Chef Sunita',
      subText: 'Mess Provider',
      email: 'mess@example.com',
      badge: 'theme-badge-emerald',
      icon: Utensils
    },
    {
      roleId: 'admin',
      label: 'System Admin',
      subText: 'Administrator',
      email: 'admin@roomiesync.com',
      badge: 'theme-badge-primary',
      icon: ShieldCheck
    }
  ];

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleModeSwitch = (mode) => {
    setError('');
    setSuccessMsg('');
    if (mode === 'forgot') {
      setShowForgot(true);
    } else if (mode === 'register') {
      setShowForgot(false);
      setIsRegister(true);
    } else {
      setShowForgot(false);
      setIsRegister(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = (email || '').trim();
    const trimmedName = (name || '').trim();

    if (showForgot) {
      if (!trimmedEmail) {
        setError('Please enter your registered email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setError('Please enter a valid email address (e.g. user@domain.com).');
        return;
      }
      setSuccessMsg(`Password reset instructions sent to ${trimmedEmail}`);
      return;
    }

    if (isRegister) {
      if (!trimmedName) {
        setError('Please enter your full name.');
        return;
      }
      if (trimmedName.length < 2) {
        setError('Name must be at least 2 characters long.');
        return;
      }
      if (!trimmedEmail) {
        setError('Please enter your email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiService.register(trimmedName, trimmedEmail, password, role);
        if (!isMounted.current) return;
        
        const userData = res?.user || res || {};
        const rawId = userData.id || userData._id || `usr_${Date.now()}`;
        const userId = rawId.toString();
        const normalizedUser = {
          ...userData,
          id: userId,
          _id: userId,
          name: userData.name || trimmedName,
          email: userData.email || trimmedEmail,
          role: userData.role || role
        };
        if (res?.token) {
          localStorage.setItem('token', res.token);
        }
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (onLoginSuccess) {
          onLoginSuccess(normalizedUser);
        }
      } catch (err) {
        if (!isMounted.current) return;
        setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    } else {
      if (!trimmedEmail) {
        setError('Please enter your email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiService.login(trimmedEmail, password);
        if (!isMounted.current) return;

        const userData = res?.user || res || {};
        const rawId = userData.id || userData._id || `usr_${Date.now()}`;
        const userId = rawId.toString();
        const normalizedUser = {
          ...userData,
          id: userId,
          _id: userId,
          name: userData.name || (trimmedEmail.includes('@') ? trimmedEmail.split('@')[0] : 'User'),
          email: userData.email || trimmedEmail,
          role: userData.role || 'user'
        };
        if (res?.token) {
          localStorage.setItem('token', res.token);
        }
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (onLoginSuccess) {
          onLoginSuccess(normalizedUser);
        }
      } catch (err) {
        if (!isMounted.current) return;
        setError(err.response?.data?.error || err.message || 'Invalid email or password.');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
  };

  const handleQuickDemoUser = (acc) => {
    setEmail(acc.email);
    setName(acc.label);
    setRole(acc.roleId);
    setPassword('password123');
    setError('');
    setSuccessMsg(`Selected demo profile: ${acc.label} (${acc.subText})`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bento-card-static shadow-2xl border border-[var(--surface-border)]">
        
        {/* Left Hero Side (7 Cols on Large) */}
        <div className="lg:col-span-7 p-8 md:p-12 bg-[var(--surface-card)] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--surface-border)] relative overflow-hidden space-y-8">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-[var(--brand-glow)] transition-transform duration-200 hover:scale-105">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight theme-text-main font-display">RoomieSync</h1>
                <span className="text-xs theme-text-accent font-semibold tracking-wider uppercase">Smart Co-Living Platform</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold theme-text-main leading-tight font-display">
              Find Your Ideal Roommate & Co-Living Space.
            </h2>
            <p className="theme-text-sub text-sm leading-relaxed">
              Experience weighted lifestyle matching, verified room listings, home-cooked meal subscriptions, and digital roommate contracts in one seamless app.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bento-card-static p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--surface-border-accent)]">
                <Sparkles className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
                <span className="theme-text-sub font-medium">Weighted AI Compatibility Engine</span>
              </div>
              <div className="bento-card-static p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--surface-border-accent)]">
                <Building2 className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
                <span className="theme-text-sub font-medium">100% Verified Flat & PG Listings</span>
              </div>
              <div className="bento-card-static p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--surface-border-accent)]">
                <Utensils className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                <span className="theme-text-sub font-medium">Daily Home Chef Mess Plans</span>
              </div>
              <div className="bento-card-static p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--surface-border-accent)]">
                <ShieldCheck className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
                <span className="theme-text-sub font-medium">Instant Digital PDF Contracts</span>
              </div>
            </div>
          </div>

          {/* 1-Click Demo User Shortcuts Grid */}
          <div className="pt-6 border-t theme-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold theme-text-main font-display flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[var(--brand-accent)]" />
                <span>1-Click Demo User Login Shortcuts</span>
              </span>
              <span className="text-[10px] theme-text-muted">Click to Auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((acc) => {
                const DemoIcon = acc.icon;
                const isSelected = email === acc.email;

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickDemoUser(acc)}
                    className={`p-3 rounded-xl text-left flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group ${
                      isSelected
                        ? 'bento-card border-[var(--surface-border-accent)] bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-accent)]'
                        : 'theme-btn-secondary hover:border-[var(--surface-border-accent)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <DemoIcon className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
                      <div className="truncate">
                        <span className="font-bold theme-text-main block text-xs truncate">{acc.label}</span>
                        <span className="text-[10px] theme-text-muted block truncate">{acc.subText}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-accent)] shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Form Side (5 Cols on Large) */}
        <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-[var(--surface-card)] space-y-6">
          <div>
            <h3 className="text-2xl font-bold theme-text-main mb-1 font-display">
              {showForgot ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="theme-text-sub text-xs">
              {showForgot 
                ? 'Enter your email to receive reset instructions' 
                : isRegister 
                ? 'Fill in your details to join RoomieSync' 
                : 'Sign in to access your matches & dashboard'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in-50 duration-200">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl theme-badge-emerald text-xs font-medium flex items-center gap-2 animate-in fade-in-50 duration-200">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && !showForgot && (
              <div className="animate-in fade-in-50 duration-200">
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 theme-text-muted absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full theme-input py-2.5 pl-10 pr-4 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--brand-accent)]/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold theme-text-sub mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 theme-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full theme-input py-2.5 pl-10 pr-4 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--brand-accent)]/30"
                />
              </div>
            </div>

            {!showForgot && (
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 theme-text-muted absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full theme-input py-2.5 pl-10 pr-4 text-xs outline-none font-mono-numbers transition-all duration-200 focus:ring-2 focus:ring-[var(--brand-accent)]/30"
                  />
                </div>
              </div>
            )}

            {isRegister && !showForgot && (
              <div className="animate-in fade-in-50 duration-200">
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full theme-input py-2.5 px-3 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--brand-accent)]/30"
                >
                  <option value="user">Roommate Seeker (Standard User)</option>
                  <option value="landlord">Property Owner / Landlord</option>
                  <option value="mess">Home Chef / Mess Provider</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
            )}

            {!showForgot && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 theme-text-sub cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="rounded theme-border bg-[var(--bg-base)] text-[var(--brand-primary)] focus:ring-0 cursor-pointer" 
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('forgot')}
                  className="theme-text-accent hover:underline font-medium text-xs transition-all duration-200 active:scale-95"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] disabled:opacity-50 text-white text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-[var(--brand-glow)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              {isLoading ? 'Processing...' : showForgot ? 'Send Reset Link' : isRegister ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t theme-border text-center text-xs theme-text-sub space-y-3">
            {showForgot ? (
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="theme-text-accent hover:underline font-semibold transition-all duration-200 active:scale-95"
              >
                Back to Sign In
              </button>
            ) : isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="theme-text-accent hover:underline font-semibold transition-all duration-200 active:scale-95"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  className="theme-text-accent hover:underline font-semibold transition-all duration-200 active:scale-95"
                >
                  Create one now
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => onReturnHome && onReturnHome()}
              className="block w-full text-center theme-text-muted hover:theme-text-main underline underline-offset-4 pt-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Back to Landing Page
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
