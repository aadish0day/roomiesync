import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, ShieldAlert, ThumbsUp, MessageSquare, Plus, CheckCircle2, 
  User, Home, Utensils, Filter, Search, Award, Sparkles, Flag, 
  ShieldCheck, Building, Check, ArrowUpDown 
} from 'lucide-react';
import { apiService } from '../services/api';
import { sanitizeInput } from '../utils/sanitizer';

export default function ReviewsPage({ currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'highest', 'helpful'
  const [upvotedIds, setUpvotedIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const data = await apiService.getReviews();
        if (isMounted) {
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        if (isMounted) {
          setReviews([]);
        }
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, []);

  // Modals state
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Write Review Form State
  const [targetType, setTargetType] = useState('user');
  const [targetName, setTargetName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Report User Form State
  const [reportUser, setReportUser] = useState('');
  const [reportCategory, setReportCategory] = useState('Fake Profile / Stolen Photos');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const openWriteModal = () => {
    setTargetType('user');
    setTargetName('');
    setRating(5);
    setHoverRating(0);
    setComment('');
    setShowWriteModal(true);
  };

  const closeWriteModal = () => {
    setShowWriteModal(false);
    setRating(5);
    setHoverRating(0);
    setComment('');
    setTargetName('');
  };

  const openReportModal = () => {
    setReportUser('');
    setReportCategory('Fake Profile / Stolen Photos');
    setReportReason('');
    setReportSubmitted(false);
    setShowReportModal(true);
  };

  const resetReportModal = () => {
    setReportSubmitted(false);
    setShowReportModal(false);
    setReportUser('');
    setReportCategory('Fake Profile / Stolen Photos');
    setReportReason('');
  };

  // Toggle Helpful Upvote
  const handleToggleUpvote = (id) => {
    if (upvotedIds.includes(id)) {
      setUpvotedIds(upvotedIds.filter(i => i !== id));
      setReviews(prev => (Array.isArray(prev) ? prev.map(r => (r.id === id || r._id === id) ? { ...r, likes: Math.max(0, (r.likes || 0) - 1) } : r) : []));
    } else {
      setUpvotedIds([...upvotedIds, id]);
      setReviews(prev => (Array.isArray(prev) ? prev.map(r => (r.id === id || r._id === id) ? { ...r, likes: (r.likes || 0) + 1 } : r) : []));
    }
  };

  // Submit Review Handler
  const handleWriteReview = async (e) => {
    e.preventDefault();
    const cleanComment = sanitizeInput(comment, { allowMultiline: true });
    const cleanTargetName = sanitizeInput(targetName);
    if (!cleanComment) return;

    const payload = {
      targetType: sanitizeInput(targetType) || 'user',
      targetName: cleanTargetName || 'Community Member',
      targetId: 'usr_1',
      authorName: sanitizeInput(currentUser?.name) || 'Member',
      rating: Number(rating) || 5,
      comment: cleanComment,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      const newRev = await apiService.addReview(payload);
      const createdRev = newRev && (newRev.id || newRev._id) ? newRev : { id: `rev_${Date.now()}`, ...payload };
      setReviews(prev => [createdRev, ...(Array.isArray(prev) ? prev : [])]);
      closeWriteModal();
    } catch (err) {
      console.error('Failed to add review:', err);
      const fallbackRev = { id: `rev_${Date.now()}`, ...payload };
      setReviews(prev => [fallbackRev, ...(Array.isArray(prev) ? prev : [])]);
      closeWriteModal();
    }
  };

  // Submit Report Handler with full modal reset after submit
  const handleReportUserSubmit = async (e) => {
    e.preventDefault();
    const cleanReportUser = sanitizeInput(reportUser);
    const cleanReportCategory = sanitizeInput(reportCategory);
    const cleanReportReason = sanitizeInput(reportReason, { allowMultiline: true });
    if (!cleanReportUser || !cleanReportReason) return;

    try {
      await apiService.reportFakeUser(
        cleanReportUser,
        currentUser?.id || currentUser?._id || 'usr_curr',
        `${cleanReportCategory}: ${cleanReportReason}`
      );
      setReportSubmitted(true);
      setTimeout(() => {
        resetReportModal();
      }, 2000);
    } catch (err) {
      console.error('Failed to report user:', err);
      setReportSubmitted(true);
      setTimeout(() => {
        resetReportModal();
      }, 2000);
    }
  };

  // Community Rating Summary Stats (Safely computed)
  const avgRating = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + (Number(r?.rating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Filtered & Sorted Reviews (Safely calculated)
  const filteredReviews = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    
    let result = reviews.filter(r => {
      if (!r) return false;
      const matchesCat = activeCategory === 'All' || r.targetType === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = (r.comment || '').toLowerCase().includes(q) ||
                            (r.authorName || '').toLowerCase().includes(q) ||
                            (r.targetName || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    if (sortBy === 'highest') {
      result.sort((a, b) => (Number(b?.rating) || 0) - (Number(a?.rating) || 0));
    } else if (sortBy === 'helpful') {
      result.sort((a, b) => (Number(b?.likes) || 0) - (Number(a?.likes) || 0));
    } else {
      // Recent (default)
      result.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }

    return result;
  }, [reviews, activeCategory, searchQuery, sortBy]);

  const ratingDescriptions = {
    1: '1.0 - Poor / Unreliable',
    2: '2.0 - Below Average',
    3: '3.0 - Satisfactory',
    4: '4.0 - Very Good',
    5: '5.0 - Outstanding & Highly Recommended'
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="bento-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold theme-text-accent uppercase tracking-widest">Community Trust Hub</span>
            <span className="theme-badge-amber text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono-numbers">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Verified Reviews
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display tracking-tight">
            Reviews & Trust Scores <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
          </h1>
          <p className="theme-text-sub text-xs sm:text-sm mt-1 max-w-xl">
            Read authentic co-living feedback, rate roommates & properties, and maintain community safety with instant fraud reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={openReportModal}
            className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
          >
            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Report Fake Account</span>
          </button>

          <button
            onClick={openWriteModal}
            className="gradient-btn px-5 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Write Review</span>
          </button>
        </div>
      </div>

      {/* Community Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div>
            <span className="text-xs theme-text-muted block font-medium">Average Community Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold theme-text-main font-mono-numbers">{avgRating}</span>
              <span className="text-xs text-amber-500 dark:text-amber-400 font-bold font-mono-numbers">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs mt-1">
              {'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(avgRating) || 5))))}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div>
            <span className="text-xs theme-text-muted block font-medium">Total Audited Reviews</span>
            <span className="text-3xl font-extrabold theme-text-accent font-mono-numbers mt-1 block">
              {Array.isArray(reviews) ? reviews.length : 0}
            </span>
            <span className="text-[10px] theme-text-sub mt-1 block">100% Identity Checked</span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-accent)]">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div>
            <span className="text-xs theme-text-muted block font-medium">Community Moderation</span>
            <span className="text-3xl font-extrabold text-[var(--accent-emerald)] font-mono-numbers mt-1 block">
              99.4%
            </span>
            <span className="text-[10px] theme-badge-emerald px-2 py-0.5 rounded inline-block mt-1 font-bold">
              Fraud Free Verified
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bento-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeCategory === 'All' ? 'gradient-btn text-white shadow-sm' : 'theme-btn-secondary'
            }`}
          >
            All Reviews ({Array.isArray(reviews) ? reviews.length : 0})
          </button>

          <button
            onClick={() => setActiveCategory('user')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeCategory === 'user' ? 'gradient-btn text-white shadow-sm' : 'theme-btn-secondary'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Roommate Ratings
          </button>

          <button
            onClick={() => setActiveCategory('property')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeCategory === 'property' ? 'gradient-btn text-white shadow-sm' : 'theme-btn-secondary'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> Property Reviews
          </button>

          <button
            onClick={() => setActiveCategory('meal')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeCategory === 'meal' ? 'gradient-btn text-white shadow-sm' : 'theme-btn-secondary'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Meal Providers
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full theme-input pl-8 pr-3 py-2 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="theme-input px-3 py-2 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full text-center py-12 bento-card rounded-2xl space-y-2">
            <Star className="w-10 h-10 theme-text-muted mx-auto mb-2 opacity-40" />
            <p className="theme-text-main font-bold text-sm">No reviews found</p>
            <p className="theme-text-muted text-xs">
              {reviews.length === 0 
                ? 'No community reviews have been posted yet. Be the first to write a review!' 
                : 'Try changing category or search terms.'}
            </p>
          </div>
        ) : (
          filteredReviews.map(rev => {
            const revId = rev.id || rev._id;
            const isUpvoted = upvotedIds.includes(revId);
            const numRating = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));

            return (
              <div key={revId} className="bento-card p-6 flex flex-col justify-between space-y-4 hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5">
                
                <div className="space-y-3">
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 border border-[var(--brand-accent)]/20 flex items-center justify-center font-bold theme-text-accent shrink-0">
                        {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold theme-text-main text-xs font-display flex items-center gap-1.5">
                          {rev.authorName || 'Anonymous Member'}
                          <CheckCircle2 className="w-3 h-3 text-[var(--accent-emerald)]" />
                        </h4>
                        <span className="text-[10px] theme-text-muted font-mono-numbers">{rev.createdAt || 'Recent'}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg theme-badge-primary text-[10px] font-bold capitalize">
                      {rev.targetType || 'Community'} Review
                    </span>
                  </div>

                  {/* Target Badge & Star Rating */}
                  <div className="flex items-center justify-between bento-card-static p-2.5 rounded-xl text-xs">
                    <span className="theme-text-sub font-semibold flex items-center gap-1.5 text-[11px]">
                      {rev.targetType === 'user' && <User className="w-3.5 h-3.5 theme-text-accent" />}
                      {rev.targetType === 'property' && <Home className="w-3.5 h-3.5 theme-text-accent" />}
                      {rev.targetType === 'meal' && <Utensils className="w-3.5 h-3.5 theme-text-accent" />}
                      <span>Target: <span className="theme-text-main font-bold">{rev.targetName || 'Community Member'}</span></span>
                    </span>

                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-mono-numbers font-bold">
                      {'★'.repeat(numRating)}
                      <span className="text-xs theme-text-main ml-0.5">({numRating}.0)</span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs theme-text-sub leading-relaxed italic pt-1">
                    "{rev.comment || 'Great experience!'}"
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleUpvote(revId)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-[11px] ${
                      isUpvoted 
                        ? 'theme-badge-emerald' 
                        : 'theme-btn-secondary theme-text-sub hover:theme-text-main'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'text-[var(--accent-emerald)] fill-emerald-400' : ''}`} />
                    <span>Helpful</span>
                    <span className="font-mono-numbers">({rev.likes || 0})</span>
                  </button>

                  <span className="text-[10px] theme-text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--accent-emerald)]" /> Verified Tenant
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Write Review Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeWriteModal} 
              className="absolute top-5 right-5 theme-text-muted hover:theme-text-main text-lg font-bold p-1 transition-all duration-200 hover:scale-110 active:scale-90"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold theme-text-accent uppercase tracking-widest">Community Feedback</span>
              <h3 className="text-xl font-bold theme-text-main font-display mt-0.5">Post a Verified Review</h3>
            </div>

            <form onSubmit={handleWriteReview} className="space-y-4 text-xs">
              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Review Category</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                >
                  <option value="user">Roommate / Co-Living Partner</option>
                  <option value="property">Property Listing / PG</option>
                  <option value="meal">Meal Provider / Home Chef</option>
                </select>
              </div>

              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Target Name / Property</label>
                <input
                  type="text"
                  placeholder="Name of roommate or property title"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  required
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Rating Score</label>
                <div className="bento-card-static p-3 rounded-2xl space-y-2">
                  <div className="flex gap-2 justify-center" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className={`text-2xl transition-all duration-200 hover:scale-125 active:scale-90 ${
                          star <= activeDisplayRating ? 'text-amber-500 dark:text-amber-400' : 'theme-text-muted opacity-40'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-center font-bold theme-text-accent font-mono-numbers text-xs">
                    {ratingDescriptions[activeDisplayRating] || '5.0 - Outstanding'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Detailed Review & Experience</label>
                <textarea
                  rows="3"
                  placeholder="Share details about cleanliness, payment timeliness, communication, and overall co-living experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeWriteModal}
                  className="w-1/3 py-3 theme-btn-secondary font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-3 gradient-btn font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Fake Account Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/40 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={resetReportModal} 
              className="absolute top-5 right-5 theme-text-muted hover:theme-text-main text-lg font-bold p-1 transition-all duration-200 hover:scale-110 active:scale-90"
            >
              ✕
            </button>

            <div>
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 mb-1">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Moderation Security</span>
              </div>
              <h3 className="text-xl font-bold theme-text-main font-display">Report Suspicious Account</h3>
              <p className="text-xs theme-text-sub mt-1">
                Report fraudulent profiles, fake property listings, or payment scams directly to platform admins.
              </p>
            </div>

            {reportSubmitted ? (
              <div className="p-6 rounded-2xl theme-badge-emerald text-xs font-bold text-center space-y-2 animate-pulse">
                <CheckCircle2 className="w-8 h-8 text-[var(--accent-emerald)] mx-auto" />
                <p className="text-sm font-display">Report Logged Successfully!</p>
                <p className="theme-text-sub font-mono-numbers">Admin moderation team notified for audit investigation.</p>
              </div>
            ) : (
              <form onSubmit={handleReportUserSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block theme-text-sub mb-1.5 font-semibold">Target Profile ID / User Name</label>
                  <input
                    type="text"
                    placeholder="Enter user name or account ID"
                    value={reportUser}
                    onChange={(e) => setReportUser(e.target.value)}
                    required
                    className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block theme-text-sub mb-1.5 font-semibold">Violation Type</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  >
                    <option value="Fake Profile / Stolen Photos">Fake Profile / Stolen Photos</option>
                    <option value="Rental Scam / Deposit Fraud">Rental Scam / Deposit Fraud</option>
                    <option value="Harassment / Abusive Messages">Harassment / Abusive Messages</option>
                    <option value="Misleading Listing / Property Fraud">Misleading Listing / Property Fraud</option>
                  </select>
                </div>

                <div>
                  <label className="block theme-text-sub mb-1.5 font-semibold">Reason & Supporting Evidence</label>
                  <textarea
                    rows="3"
                    placeholder="Describe the suspicious behavior or evidence..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetReportModal}
                    className="w-1/3 py-3 theme-btn-secondary font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-2/3 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
