import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Home, CreditCard, Utensils, Sparkles, MapPin, DollarSign, 
  ShieldCheck, FileText, ArrowRight, CheckCircle2, Calendar, Star, Clock, AlertCircle, Plus 
} from 'lucide-react';
import { apiService } from '../services/api';

const DATA_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><circle cx='12' cy='8' r='4'/><path d='M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'/></svg>";
const DATA_PROPERTY_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>";

export default function DashboardPage({ currentUser, onNavigate }) {
  const [userProfile, setUserProfile] = useState({});
  const [properties, setProperties] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [userExpenses, setUserExpenses] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchDashboardData = async () => {
      const userId = currentUser?.id || currentUser?._id;
      if (!userId) {
        if (isMounted.current) setLoading(false);
        return;
      }
      try {
        if (isMounted.current) setLoading(true);

        const safeGetProfile = (id) => apiService.getProfile(id).catch(() => ({}));
        const safeGetProperties = () => apiService.getProperties().catch(() => []);
        const safeGetMealPlans = () => apiService.getMealPlans().catch(() => []);
        const safeGetNotifications = (id) => apiService.getNotifications(id).catch(() => []);
        const safeGetUsers = () => apiService.getUsers().catch(() => []);
        const safeGetExpenses = () => apiService.getExpenses().catch(() => []);
        const safeGetSubscriptions = (id) => apiService.getSubscriptions(id).catch(() => []);

        const [prof, props, meals, notifs, users, exps, subs] = await Promise.all([
          safeGetProfile(userId),
          safeGetProperties(),
          safeGetMealPlans(),
          safeGetNotifications(userId),
          safeGetUsers(),
          safeGetExpenses(),
          safeGetSubscriptions(userId)
        ]);

        if (!isMounted.current) return;

        setUserProfile(prof || {});
        setProperties(Array.isArray(props) ? props : []);
        setMealPlans(Array.isArray(meals) ? meals : []);
        setNotifications(Array.isArray(notifs) ? notifs : []);
        setUserExpenses(Array.isArray(exps) ? exps : []);
        setUserSubscriptions(Array.isArray(subs) ? subs : []);

        // Filter candidates & calculate matching compatibility safely
        const otherUsers = (users || []).filter(u => u && (u.id || u._id) !== userId && u.role === 'user').slice(0, 3);
        const candidatesWithProfiles = await Promise.all(
          (otherUsers || []).map(async (u) => {
            const uId = u?.id || u?._id;
            const uProf = uId ? await safeGetProfile(uId) : {};
            
            let score = 50;
            const safeUProf = uProf || {};
            const safeProf = prof || {};

            if (safeUProf.foodPref && safeProf.foodPref && safeUProf.foodPref === safeProf.foodPref) score += 15;
            if (safeUProf.sleepSchedule && safeProf.sleepSchedule && safeUProf.sleepSchedule === safeProf.sleepSchedule) score += 15;
            if (Math.abs((safeUProf.cleanliness || 3) - (safeProf.cleanliness || 3)) <= 1) score += 10;
            if (safeUProf.smokingDrinking && safeProf.smokingDrinking && safeUProf.smokingDrinking === safeProf.smokingDrinking) score += 10;

            return { 
              ...u, 
              profile: safeUProf, 
              compatibilityScore: Math.min(score, 99) 
            };
          })
        );

        if (!isMounted.current) return;

        candidatesWithProfiles.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
        setTopCandidates(candidatesWithProfiles);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted.current = false;
    };
  }, [currentUser?.id, currentUser?._id]);

  const handleImageError = (e, fallbackUri) => {
    e.target.onerror = null;
    e.target.src = fallbackUri;
  };

  // Dynamic Profile Score Calculation
  const calculateProfileScore = () => {
    let filled = 0;
    const totalFields = 7;
    if (userProfile?.occupation) filled++;
    if (userProfile?.foodPref) filled++;
    if (userProfile?.sleepSchedule) filled++;
    if (userProfile?.cleanliness) filled++;
    if (userProfile?.smokingDrinking) filled++;
    if (userProfile?.preferredLocation) filled++;
    if (userProfile?.bio) filled++;

    return Math.max(Math.round((filled / totalFields) * 100), 25);
  };

  const profileScore = calculateProfileScore();
  const topCandidate = (topCandidates || [])[0];

  // Dynamic Expenses Calculation
  const pendingUserExpenses = (userExpenses || []).filter(e => e?.status === 'Pending');
  const userPendingTotal = (pendingUserExpenses || []).reduce((acc, e) => acc + (Number(e?.amount || 0) / 2), 0);

  // Active Subscription & Booking
  const activeSub = (userSubscriptions || [])[0];
  const activeSubPlan = activeSub ? (mealPlans || []).find(m => (m?.id || m?._id) === activeSub.planId) : null;
  const topProperty = (properties || [])[0];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <Clock className="w-8 h-8 text-[var(--brand-accent)] animate-spin mb-3" />
        <p className="text-sm theme-text-sub font-medium">Loading your co-living dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      
      {/* Welcome Banner & Profile Readiness Card */}
      <div className="bento-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <img
            src={currentUser?.avatar || DATA_AVATAR_FALLBACK}
            alt=""
            onError={(e) => handleImageError(e, DATA_AVATAR_FALLBACK)}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/40 shadow-xl shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold theme-text-accent uppercase tracking-widest">Co-Living Hub</span>
              <span className="theme-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded-md">Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main font-display tracking-tight flex items-center gap-2">
              <span>Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}</span>
              <Sparkles className="w-5 h-5 text-[var(--accent-gold)] shrink-0 inline" />
            </h1>
            <p className="theme-text-sub text-xs mt-1">
              {userProfile?.occupation || 'Not specified'} • Preferred: <span className="theme-text-main font-semibold">{userProfile?.preferredLocation || 'Not specified'}</span>
            </p>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="bento-card-static p-4 rounded-2xl w-full md:w-80 z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold theme-text-main font-display">Profile Score</span>
              <span className="font-mono-numbers theme-text-accent font-bold">{profileScore}%</span>
            </div>
            <div className="w-44 h-2 rounded-full bento-card-static overflow-hidden">
              <div className="h-full bg-[var(--brand-accent)] rounded-full transition-all duration-500" style={{ width: `${profileScore}%` }}></div>
            </div>
            <span className="text-[10px] theme-text-muted mt-1 block">Improves matching accuracy</span>
          </div>

          <button
            onClick={() => onNavigate?.('profile')}
            className="gradient-btn px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            Edit
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Top Roommate Match */}
        <div 
          className="bento-card p-5 flex flex-col justify-between group hover:border-[var(--surface-border-accent)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" 
          onClick={() => onNavigate?.('matching')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Top Match Score</span>
            <div className="p-2 rounded-xl theme-badge-amber">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold theme-text-main font-mono-numbers">
                {topCandidate ? `${topCandidate.compatibilityScore}%` : '0%'}
              </span>
              <span className="text-xs text-[var(--accent-gold)] font-bold">Match Score</span>
            </div>
            <p className="text-xs theme-text-sub mt-1 flex items-center gap-1">
              <span>Candidate:</span>
              <span className="theme-text-main font-bold truncate">
                {topCandidate ? topCandidate.name : 'No candidates yet'}
              </span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] theme-text-accent font-semibold">
            <span>Browse Candidates</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Expense Balance */}
        <div 
          className="bento-card p-5 flex flex-col justify-between group hover:border-[var(--surface-border-accent)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" 
          onClick={() => onNavigate?.('expenses')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Shared Settlement</span>
            <div className="p-2 rounded-xl theme-badge-emerald">
              <CreditCard className="w-4 h-4 text-[var(--accent-emerald)]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--accent-emerald)] font-mono-numbers">
                ₹{userPendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs theme-text-sub mt-1 truncate">
              {(pendingUserExpenses || []).length > 0 ? `${pendingUserExpenses.length} pending bill(s)` : 'All bills settled'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] text-[var(--accent-emerald)] font-semibold">
            <span>Settle Expense</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Scheduled Visits */}
        <div 
          className="bento-card p-5 flex flex-col justify-between group hover:border-[var(--surface-border-accent)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" 
          onClick={() => onNavigate?.('properties')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Booked Site Visit</span>
            <div className="p-2 rounded-xl theme-badge-primary">
              <Calendar className="w-4 h-4 text-[var(--brand-accent)]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold theme-text-main font-mono-numbers truncate">
                {topProperty?.title ? topProperty.title.split(' ')[0] : 'No Visits'}
              </span>
            </div>
            <p className="text-xs theme-text-sub mt-1 truncate">
              {topProperty ? topProperty.location : 'Schedule a property visit'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] theme-text-accent font-semibold">
            <span>View Booking Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 4: Meal Plan */}
        <div 
          className="bento-card p-5 flex flex-col justify-between group hover:border-[var(--surface-border-accent)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" 
          onClick={() => onNavigate?.('meals')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Meal Plan Status</span>
            <div className="p-2 rounded-xl theme-badge-amber">
              <Utensils className="w-4 h-4 text-[var(--accent-gold)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold theme-text-main font-display truncate">
                {activeSubPlan ? activeSubPlan.providerName : 'No Active Plan'}
              </span>
            </div>
            <div className="text-xs text-[var(--accent-emerald)] font-semibold mt-1 flex items-center gap-1">
              {activeSub ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0" />
                  <span>Active {activeSub.duration} Plan</span>
                </>
              ) : (
                <span>Explore thali plans</span>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-[11px] theme-text-accent font-semibold">
            <span>Weekly Thali Menu</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Main Asymmetric Bento Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bento Box 1: Roommate Matching Quick Launcher */}
        <div className="bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl theme-badge-amber flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--accent-gold)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold theme-text-main font-display">Roommate Matching Engine</h2>
                  <p className="theme-text-sub text-xs">Weighted algorithm matching sleep, food diet & cleanliness</p>
                </div>
              </div>

              <span className="theme-badge-amber text-xs font-bold px-2.5 py-1 rounded-full font-mono-numbers">
                AI Powered
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {(topCandidates || []).slice(0, 2).map((cand) => (
                <div key={cand?.id || cand?._id || cand?.name} className="bento-card-static p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={cand?.avatar || DATA_AVATAR_FALLBACK} 
                      alt="" 
                      onError={(e) => handleImageError(e, DATA_AVATAR_FALLBACK)}
                      className="w-10 h-10 rounded-lg object-cover" 
                    />
                    <div>
                      <h4 className="text-xs font-bold theme-text-main">{cand?.name || 'Candidate'}</h4>
                      <p className="text-[11px] theme-text-muted">{cand?.profile?.occupation || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono-numbers text-[var(--accent-gold)] font-bold block">{cand?.compatibilityScore || 50}% Match</span>
                    <span className="text-[10px] theme-text-muted">{cand?.profile?.foodPref || 'Not specified'}</span>
                  </div>
                </div>
              ))}
              {(topCandidates || []).length === 0 && (
                <div className="text-center py-4 bento-card-static rounded-xl">
                  <p className="text-xs theme-text-muted">No candidate matches available right now.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('matching')}
            className="w-full py-3.5 gradient-btn font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Launch Roommate Matcher</span>
          </button>
        </div>

        {/* Bento Box 2: Featured Room & PG Showcase */}
        <div className="bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl theme-badge-emerald flex items-center justify-center">
                  <Home className="w-5 h-5 text-[var(--accent-emerald)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold theme-text-main font-display">Featured Verified PG & Flat</h2>
                  <p className="theme-text-sub text-xs">Direct landlord contact with no brokerage</p>
                </div>
              </div>

              <span className="theme-badge-emerald text-xs font-bold px-2.5 py-1 rounded-full">
                Verified
              </span>
            </div>

            {topProperty ? (
              <div className="bento-card-static p-4 rounded-xl space-y-3 mb-6">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold theme-text-main">{topProperty.title || 'Featured Property'}</h4>
                    <p className="text-xs theme-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{topProperty.location || 'Location N/A'}</span>
                    </p>
                  </div>
                  <span className="font-mono-numbers font-extrabold text-sm theme-text-accent whitespace-nowrap">
                    ₹{topProperty.price?.toLocaleString() || '0'} / mo
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(topProperty.amenities || []).slice(0, 4).map((a, i) => (
                    <span key={i} className="text-[10px] theme-text-sub bento-card-static px-2 py-0.5 rounded-md">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bento-card-static rounded-xl mb-6">
                <p className="text-xs theme-text-muted">No properties available at the moment.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate?.('properties')}
            className="w-full py-3.5 theme-btn-secondary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <span>Search All Available Rooms</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Quick Action Dock */}
      <div className="bento-card p-6">
        <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider mb-4 font-display">
          Quick Command Shortcuts
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate?.('expenses')}
            className="bento-card-static p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl theme-badge-emerald group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5 text-[var(--accent-emerald)]" />
            </div>
            <span className="text-xs font-semibold theme-text-main">Log Shared Bill</span>
          </button>

          <button
            onClick={() => onNavigate?.('agreement')}
            className="bento-card-static p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl theme-badge-primary group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
            </div>
            <span className="text-xs font-semibold theme-text-main">Generate Agreement PDF</span>
          </button>

          <button
            onClick={() => onNavigate?.('meals')}
            className="bento-card-static p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl theme-badge-amber group-hover:scale-110 transition-transform">
              <Utensils className="w-5 h-5 text-[var(--accent-gold)]" />
            </div>
            <span className="text-xs font-semibold theme-text-main">Order Thali Subscription</span>
          </button>

          <button
            onClick={() => onNavigate?.('reviews')}
            className="bento-card-static p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl theme-badge-primary group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-[var(--brand-accent)]" />
            </div>
            <span className="text-xs font-semibold theme-text-main">Write Community Review</span>
          </button>
        </div>
      </div>

      {/* Activity Feed Footer */}
      <div className="bento-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider font-display">
            Recent Living Activity Feed
          </h3>
          <button onClick={() => onNavigate?.('notifications')} className="text-xs theme-text-accent font-semibold flex items-center gap-1">
            <span>View All ({(notifications || []).length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {(notifications || []).length > 0 ? (
            (notifications || []).slice(0, 3).map((notif) => (
              <div key={notif?.id || notif?._id || notif?.title} className="bento-card-static p-3 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg theme-badge-primary shrink-0">
                    <AlertCircle className="w-4 h-4 text-[var(--brand-accent)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold theme-text-main">{notif?.title || 'Notification'}</h4>
                    <p className="text-[11px] theme-text-sub">{notif?.message || ''}</p>
                  </div>
                </div>
                <span className="text-[10px] theme-text-muted whitespace-nowrap font-mono-numbers">
                  {notif?.createdAt ? notif.createdAt.split('T')[0] : 'Just now'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 bento-card-static rounded-xl">
              <p className="text-xs theme-text-muted">No recent activity notifications for your account yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
