import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Filter, CheckCircle, XCircle, Send, Eye, ShieldCheck, 
  Heart, UserCheck, Flame, Search, MapPin, DollarSign, Utensils, Moon, Briefcase, Smile, CheckCircle2, Clock, Star, X, Check
} from 'lucide-react';
import { apiService } from '../services/api';
import { calculateCompatibility } from '../services/matchingEngine';

const DATA_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><circle cx='12' cy='8' r='4'/><path d='M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'/></svg>";

export default function MatchingPage({ currentUser }) {
  const [userProfile, setUserProfile] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('All');
  const [foodFilter, setFoodFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [requestedIds, setRequestedIds] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      const userId = currentUser?.id || currentUser?._id;
      if (!userId) {
        if (isMounted.current) setLoading(false);
        return;
      }
      try {
        if (isMounted.current) setLoading(true);

        const safeGetProfile = (id) => apiService.getProfile(id).catch(() => ({}));
        const safeGetUsers = () => apiService.getUsers().catch(() => []);

        const [myProfile, users] = await Promise.all([
          safeGetProfile(userId),
          safeGetUsers()
        ]);

        if (!isMounted.current) return;
        setUserProfile(myProfile || {});

        const otherUsers = (users || []).filter(u => u && (u.id || u._id) !== userId && u.role === 'user');
        
        const candidatePromises = (otherUsers || []).map(async (u) => {
          const uId = u?.id || u?._id;
          const prof = uId ? await safeGetProfile(uId) : {};
          const score = calculateCompatibility(myProfile || {}, prof || {});
          return { user: u || {}, profile: prof || {}, score: score || 50 };
        });

        const candidateList = await Promise.all(candidatePromises);
        if (!isMounted.current) return;

        candidateList.sort((a, b) => (b.score || 0) - (a.score || 0));
        setCandidates(candidateList);
        setMatchRequests([]);
      } catch (err) {
        console.error('Failed to fetch matching data:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [currentUser?.id, currentUser?._id]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DATA_AVATAR_FALLBACK;
  };

  const filteredCandidates = (candidates || []).filter(item => {
    if (!item) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (item.user?.name || '').toLowerCase().includes(q);
      const locMatch = (item.profile?.preferredLocation || '').toLowerCase().includes(q);
      const occMatch = (item.profile?.occupation || '').toLowerCase().includes(q);
      if (!nameMatch && !locMatch && !occMatch) return false;
    }

    if (foodFilter !== 'All' && item.profile?.foodPref !== foodFilter) return false;
    if (budgetFilter !== 'All') {
      const maxB = Array.isArray(item.profile?.budget) && item.profile.budget.length === 2 
        ? Number(item.profile.budget[1]) 
        : 25000;
      if (budgetFilter === 'Under15k' && maxB > 15000) return false;
      if (budgetFilter === '15k-25k' && (maxB < 15000 || maxB > 25000)) return false;
    }
    return true;
  });

  const handleSendMatch = (candidateId) => {
    if (!candidateId) return;
    setRequestedIds(prev => (prev || []).includes(candidateId) ? prev : [...(prev || []), candidateId]);
  };

  const handleRespond = (reqId, status) => {
    if (!reqId) return;
    setMatchRequests(prev => (prev || []).map(r => r?.id === reqId ? { ...r, status } : r));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <Sparkles className="w-8 h-8 text-[var(--accent-gold)] animate-spin mb-3" />
        <p className="text-sm theme-text-sub font-medium">Finding potential roommate matches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold theme-text-accent uppercase tracking-widest">Matching Engine</span>
            <span className="theme-badge-amber text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono-numbers">
              <Flame className="w-3 h-3 text-[var(--accent-gold)]" /> AI Weighted 6-Factor
            </span>
          </div>
          <h1 className="text-3xl font-extrabold theme-text-main font-display tracking-tight">
            Find Your Ideal Roommate
          </h1>
          <p className="theme-text-sub text-xs mt-1">
            Algorithmically scored based on budget overlap, food diet, sleep rhythm, and cleanliness habits.
          </p>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, role or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full theme-input py-2 pl-10 pr-4 text-xs outline-none"
            />
          </div>

          {/* Filters Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={foodFilter}
              onChange={(e) => setFoodFilter(e.target.value)}
              className="theme-input px-3 py-2 text-xs outline-none font-medium flex-1 sm:flex-initial"
            >
              <option value="All">All Diets</option>
              <option value="Veg">Vegetarian</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Vegan">Vegan</option>
            </select>

            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="theme-input px-3 py-2 text-xs outline-none font-medium flex-1 sm:flex-initial font-mono-numbers"
            >
              <option value="All">All Budgets</option>
              <option value="Under15k">Under ₹15,000</option>
              <option value="15k-25k">₹15k - ₹25k</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incoming Match Requests Banner */}
      {(matchRequests || []).length > 0 && (
        <div className="bento-card p-6 border-[var(--surface-border-accent)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold theme-text-accent uppercase tracking-wider flex items-center gap-2 font-display">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" /> Pending Roommate Match Requests Received
            </h2>
            <span className="text-xs theme-badge-emerald px-2.5 py-0.5 rounded-full font-mono-numbers">
              {(matchRequests || []).filter(r => r?.status === 'pending').length} Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(matchRequests || []).map(req => (
              <div key={req?.id || req?.fromUser?.name} className="p-4 rounded-2xl bento-card-static flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={req?.fromUser?.avatar || DATA_AVATAR_FALLBACK} 
                    alt="" 
                    onError={handleImageError}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[var(--brand-accent)]/40" 
                  />
                  <div>
                    <h4 className="text-sm font-bold theme-text-main font-display">{req?.fromUser?.name || 'User'}</h4>
                    <p className="text-xs text-[var(--accent-emerald)] font-bold font-mono-numbers">{req?.score || 50}% High Match Score</p>
                  </div>
                </div>

                {req?.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(req.id, 'accepted')}
                      className="px-3.5 py-2 rounded-xl gradient-btn text-xs font-bold flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, 'rejected')}
                      className="px-3 py-2 rounded-xl theme-btn-secondary text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${req?.status === 'accepted' ? 'theme-badge-emerald' : 'theme-badge-amber'}`}>
                    {req?.status === 'accepted' ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Match Accepted</span>
                      </>
                    ) : (
                      <span>Request Declined</span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(filteredCandidates || []).length === 0 ? (
          <div className="col-span-full bento-card p-12 text-center text-xs theme-text-muted">
            No candidate roommate profiles match your selected filters. Try broadening your criteria.
          </div>
        ) : (
          (filteredCandidates || []).map(({ user, profile, score }) => {
            const userId = user?.id || user?._id;
            const isRequested = (requestedIds || []).includes(userId);
            const hobbies = (profile && Array.isArray(profile.hobbies)) ? profile.hobbies : [];
            const candidateScore = typeof score === 'number' ? score : 50;

            return (
              <div key={userId || user?.name} className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
                
                {/* Score Tag Pill */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full theme-badge-amber flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                  <span className="text-xs font-extrabold font-mono-numbers">
                    {candidateScore}% Match
                  </span>
                </div>

                <div>
                  {/* Candidate Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={user?.avatar || DATA_AVATAR_FALLBACK} 
                      alt={user?.name || ''} 
                      onError={handleImageError}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/30 shrink-0" 
                    />
                    <div>
                      <h3 className="text-base font-bold theme-text-main group-hover:theme-text-accent transition-colors font-display">{user?.name || 'User'}</h3>
                      <p className="text-xs theme-text-sub flex items-center gap-1">
                        <Briefcase className="w-3 h-3 theme-text-muted" />
                        <span>{profile?.occupation || 'Not specified'}</span>
                      </p>
                      <p className="text-[11px] theme-text-accent font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{profile?.preferredLocation || 'Not specified'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio quote */}
                  <p className="text-xs theme-text-sub line-clamp-2 mb-4 italic bento-card-static p-2.5 rounded-xl">
                    "{profile?.bio || 'No bio provided.'}"
                  </p>

                  {/* Lifestyle Attribute Metrics */}
                  <div className="space-y-2 text-xs mb-5">
                    
                    {/* Budget Bar */}
                    <div className="bento-card-static p-2.5 rounded-xl flex items-center justify-between">
                      <span className="theme-text-muted flex items-center gap-1 text-[11px]">
                        <DollarSign className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Max Rent:
                      </span>
                      <span className="font-bold text-[var(--accent-emerald)] font-mono-numbers text-xs">
                        ₹{(profile?.budget?.[1] || 0).toLocaleString()} / mo
                      </span>
                    </div>

                    {/* Food & Sleep Split */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bento-card-static p-2.5 rounded-xl">
                        <span className="theme-text-muted block text-[10px]">Diet:</span>
                        <span className="font-bold theme-text-main flex items-center gap-1 mt-0.5">
                          <Utensils className="w-3 h-3 theme-text-accent" /> {profile?.foodPref || 'Not specified'}
                        </span>
                      </div>
                      <div className="bento-card-static p-2.5 rounded-xl">
                        <span className="theme-text-muted block text-[10px]">Sleep:</span>
                        <span className="font-bold theme-text-main flex items-center gap-1 mt-0.5">
                          <Moon className="w-3 h-3 text-[var(--accent-gold)]" /> {profile?.sleepSchedule || 'Flexible'}
                        </span>
                      </div>
                    </div>

                    {/* Hobbies Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(hobbies || []).map((h, i) => (
                        <span key={i} className="text-[10px] theme-btn-secondary px-2 py-0.5 rounded-md font-medium">
                          #{h}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--surface-border)]">
                  <button
                    onClick={() => setSelectedCandidate({ user, profile: profile || {}, score: candidateScore })}
                    className="flex-1 py-2.5 rounded-xl theme-btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                    <span>Breakdown</span>
                  </button>

                  <button
                    onClick={() => handleSendMatch(userId)}
                    disabled={isRequested}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      isRequested
                        ? 'theme-btn-secondary opacity-70 cursor-not-allowed text-[var(--accent-emerald)]'
                        : 'gradient-btn'
                    }`}
                  >
                    {isRequested ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                        <span>Requested</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Deep Analytics Compatibility Breakdown Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 theme-text-muted hover:theme-text-main p-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src={selectedCandidate.user?.avatar || DATA_AVATAR_FALLBACK} 
                onError={handleImageError}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]" 
                alt="" 
              />
              <div>
                <h3 className="text-xl font-bold theme-text-main font-display">{selectedCandidate.user?.name || 'Candidate'}</h3>
                <p className="text-xs theme-text-accent font-medium">{selectedCandidate.profile?.occupation || 'Not specified'}</p>
                <p className="text-[11px] theme-text-muted">{selectedCandidate.profile?.preferredLocation || 'Not specified'}</p>
              </div>
            </div>

            {/* Score Ring Banner */}
            <div className="mb-6 p-4 rounded-2xl bento-card-static text-center border border-[var(--surface-border-accent)]">
              <span className="text-3xl font-extrabold theme-text-accent font-mono-numbers block">
                {selectedCandidate.score || 50}% Overall Compatibility
              </span>
              <p className="text-[11px] theme-text-muted mt-1">Weighted against your profile preferences</p>
            </div>

            {/* Dimensional Breakdown */}
            <div className="space-y-3 text-xs mb-6">
              <div className="bento-card-static p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-semibold">
                  <span className="theme-text-sub">Budget Overlap (25% Weight)</span>
                  <span className="text-[var(--accent-emerald)] font-mono-numbers">High Alignment</span>
                </div>
                <div className="w-full h-1.5 bento-card-static rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-emerald)] w-[95%]"></div>
                </div>
              </div>

              <div className="bento-card-static p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-semibold">
                  <span className="theme-text-sub">Dietary Match (20% Weight)</span>
                  <span className="theme-text-accent">
                    {userProfile?.foodPref && selectedCandidate.profile?.foodPref && userProfile.foodPref === selectedCandidate.profile.foodPref 
                      ? 'Exact Match (100%)' 
                      : 'Compatible (75%)'}
                  </span>
                </div>
                <div className="w-full h-1.5 bento-card-static rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--brand-accent)] w-[85%]"></div>
                </div>
              </div>

              <div className="bento-card-static p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-semibold">
                  <span className="theme-text-sub">Sleep Rhythm (20% Weight)</span>
                  <span className="text-[var(--accent-gold)] font-mono-numbers">{selectedCandidate.profile?.sleepSchedule || 'Flexible'}</span>
                </div>
                <div className="w-full h-1.5 bento-card-static rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-gold)] w-[90%]"></div>
                </div>
              </div>

              <div className="bento-card-static p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-semibold">
                  <span className="theme-text-sub">Cleanliness Rating (15% Weight)</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.max(1, Math.min(5, Number(selectedCandidate.profile?.cleanliness) || 4))
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-500/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-full h-1.5 bento-card-static rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-gold)] w-[80%]"></div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleSendMatch(selectedCandidate.user?.id || selectedCandidate.user?._id);
                setSelectedCandidate(null);
              }}
              className="w-full py-3 gradient-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Roommate Request Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
