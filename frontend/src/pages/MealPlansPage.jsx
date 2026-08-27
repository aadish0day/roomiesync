import React, { useState, useEffect } from 'react';
import { Utensils, Star, Calendar, CheckCircle2, Clock, ShieldCheck, HeartHandshake, ChevronRight, ChevronDown, ChevronUp, XCircle, Leaf, Flame, ShoppingBag, Sparkles, X, Filter } from 'lucide-react';
import { apiService } from '../services/api';

export default function MealPlansPage({ currentUser }) {
  const [mealPlans, setMealPlans] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subDuration, setSubDuration] = useState('Monthly'); // 'Weekly' | 'Monthly'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliverySlot, setDeliverySlot] = useState('Both Lunch & Dinner');
  const [subSuccess, setSubSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Expanded accordion state for provider weekly menu previews
  const [expandedMenuId, setExpandedMenuId] = useState(null);

  // Filter state for meal plans
  const [dietaryFilter, setDietaryFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const plans = await apiService.getMealPlans();
        setMealPlans(Array.isArray(plans) ? plans : []);
        
        const userId = currentUser?.id || currentUser?._id;
        if (userId) {
          const subs = await apiService.getSubscriptions(userId);
          setActiveSubscriptions(Array.isArray(subs) ? subs : []);
        } else {
          setActiveSubscriptions([]);
        }
      } catch (err) {
        console.error('Failed to fetch meal plans or subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id, currentUser?._id]);

  const toggleMenuAccordion = (planId) => {
    if (!planId) return;
    setExpandedMenuId(prev => (prev === planId ? null : planId));
  };

  const openSubscriptionModal = (plan) => {
    setSelectedPlan(plan);
    setSubDuration('Monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeliverySlot('Both Lunch & Dinner');
    setSubSuccess(false);
  };

  const closeSubscriptionModal = () => {
    setSelectedPlan(null);
    setSubDuration('Monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeliverySlot('Both Lunch & Dinner');
    setSubSuccess(false);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const userId = currentUser?.id || currentUser?._id || 'usr_guest';
    const planId = selectedPlan.id || selectedPlan._id;
    try {
      const sub = await apiService.subscribeMeal(planId, userId, subDuration);
      setActiveSubscriptions(prev => [{ ...(sub || {}), startDate, deliverySlot, duration: subDuration }, ...(prev || [])]);
      setSubSuccess(true);
      setTimeout(() => {
        closeSubscriptionModal();
      }, 2400);
    } catch (err) {
      console.error('Failed to subscribe to meal plan:', err);
    }
  };

  const handleCancelSub = (subId) => {
    if (!subId) return;
    setActiveSubscriptions(prev => (prev || []).filter(s => (s?.id !== subId && s?._id !== subId)));
  };

  const filteredPlans = (mealPlans || []).filter(plan => {
    if (!plan) return false;
    if (dietaryFilter === 'All') return true;
    const dietaryStr = (plan.dietary || '').toLowerCase();
    if (dietaryFilter === 'Veg') return dietaryStr.includes('veg') && !dietaryStr.includes('non');
    if (dietaryFilter === 'Non-Veg') return dietaryStr.includes('non');
    if (dietaryFilter === 'Vegan') return dietaryStr.includes('vegan');
    return true;
  });

  // Calculate pricing breakdown for modal dynamically based on weekly vs monthly selection
  const getPricingBreakdown = () => {
    if (!selectedPlan) return { base: 0, packaging: 0, discount: 0, total: 0 };
    const isWeekly = subDuration === 'Weekly';
    const basePrice = isWeekly
      ? Number(selectedPlan.weeklyPrice || 0)
      : Number(selectedPlan.monthlyPrice || 0);
    const packagingFee = isWeekly ? 150 : 450;
    const discount = isWeekly ? 0 : Math.round(basePrice * 0.15);
    const total = Math.max(0, basePrice + packagingFee - discount);
    return { base: basePrice, packaging: packagingFee, discount, total };
  };

  const pricing = getPricingBreakdown();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <Utensils className="w-8 h-8 text-[var(--accent-gold)] animate-spin mb-3" />
        <p className="text-sm theme-text-sub font-medium">Loading meal plans and thali subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full theme-badge-amber text-[11px] font-bold uppercase tracking-wider">
              Home-Cooked & Hygienic
            </span>
            <span className="text-xs theme-text-muted font-mono-numbers">
              Daily Doorstep Delivery
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold theme-text-main flex items-center gap-3 font-display tracking-tight">
            Meal Subscriptions <Utensils className="w-7 h-7 text-[var(--accent-gold)]" />
          </h1>
          <p className="theme-text-sub text-sm mt-1 max-w-xl">
            Subscribe to fresh, nutritious daily thalis & chef-curated meal boxes delivered right to your apartment.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="theme-btn-secondary px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Clock className="w-4 h-4 text-[var(--brand-accent)]" />
          <span>{showHistory ? 'View Meal Providers' : `My Subscriptions (${(activeSubscriptions || []).length})`}</span>
        </button>
      </div>

      {/* Subscription History View */}
      {showHistory ? (
        <div className="bento-card p-6 sm:p-8 rounded-3xl border border-[var(--surface-border)] shadow-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--surface-border)]">
            <div>
              <h2 className="text-xl font-bold theme-text-main flex items-center gap-2 font-display">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent-emerald)]" /> My Active & Past Meal Subscriptions
              </h2>
              <p className="theme-text-sub text-xs mt-0.5">Manage your active thali subscriptions, pause deliveries, or cancel anytime.</p>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="gradient-btn px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Browse Meal Providers
            </button>
          </div>

          {(activeSubscriptions || []).length === 0 ? (
            <div className="text-center py-12 bento-card-static rounded-2xl">
              <ShoppingBag className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold theme-text-main font-display mb-1">No Active Subscriptions</h3>
              <p className="text-xs theme-text-sub mb-4">You haven't subscribed to any meal provider yet.</p>
              <button 
                onClick={() => setShowHistory(false)} 
                className="gradient-btn px-5 py-2.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Explore Thali Providers
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeSubscriptions || []).map(sub => {
                const plan = (mealPlans || []).find(p => (p?.id || p?._id) === sub?.planId);
                const subId = sub?.id || sub?._id || sub?.planId;
                return (
                  <div
                    key={subId}
                    className="p-5 rounded-2xl bento-card-static border border-[var(--surface-border)] hover:border-[var(--surface-border-accent)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {plan?.image && (
                        <img
                          src={plan.image}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/30 shrink-0"
                          alt={plan?.providerName || ''}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md theme-badge-emerald text-[10px] font-bold">
                            {plan?.dietary || 'Veg'}
                          </span>
                          <span className="text-[10px] font-bold theme-badge-primary px-2 py-0.5 rounded-md uppercase">
                            {sub?.duration || 'Monthly'} Plan
                          </span>
                        </div>
                        <h4 className="text-base font-bold theme-text-main font-display">{plan?.providerName || 'Meal Plan Subscription'}</h4>
                        <p className="text-xs theme-text-sub mt-0.5">
                          Started on <span className="font-mono-numbers font-semibold">{sub?.startDate || 'N/A'}</span> • {sub?.deliverySlot || 'Lunch & Dinner'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--surface-border)]">
                      <span className="px-3 py-1.5 rounded-xl theme-badge-emerald text-xs font-bold flex items-center gap-1 font-mono-numbers">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>

                      <button
                        onClick={() => handleCancelSub(subId)}
                        className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-500/20 flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Providers Grid View */
        <div>
          {/* Dietary Filter Bar */}
          <div className="bento-card-static p-4 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--surface-border)]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 theme-text-accent" />
              <span className="text-xs font-bold theme-text-main font-display">Dietary Preference:</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {[
                { label: 'All Plans', key: 'All', icon: Utensils },
                { label: 'Pure Veg', key: 'Veg', icon: Leaf },
                { label: 'Non-Veg Options', key: 'Non-Veg', icon: Flame },
                { label: 'Vegan', key: 'Vegan', icon: Leaf }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setDietaryFilter(item.key)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    dietaryFilter === item.key
                      ? 'theme-badge-primary border-[var(--brand-accent)]'
                      : 'bento-card-static theme-text-sub hover:theme-text-main'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Bento Cards Grid */}
          {(filteredPlans || []).length === 0 ? (
            <div className="bento-card-static p-12 text-center rounded-3xl">
              <Utensils className="w-12 h-12 text-[var(--accent-gold)] mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-bold theme-text-main font-display mb-1">No Meal Plans Found</h3>
              <p className="theme-text-sub text-xs mb-4">No meal providers match your selected dietary filter.</p>
              <button
                onClick={() => setDietaryFilter('All')}
                className="theme-btn-secondary px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(filteredPlans || []).map(plan => {
                const planId = plan?.id || plan?._id;
                const isAccordionOpen = expandedMenuId === planId;
                const dietaryStr = (plan?.dietary || '').toLowerCase();
                const isPureVeg = dietaryStr.includes('pure veg') || plan?.dietary === 'Pure Veg';
                const isVegan = dietaryStr.includes('vegan');

                return (
                  <div
                    key={planId || plan?.providerName}
                    className="bento-card p-6 flex flex-col justify-between group rounded-3xl border border-[var(--surface-border)] hover:border-[var(--surface-border-accent)] transition-all duration-300 shadow-md relative overflow-hidden"
                  >
                    <div>
                      {/* Header Row: Provider Image, Badge & Rating */}
                      <div className="flex items-start gap-4 mb-5">
                        {plan?.image && (
                          <div className="relative shrink-0">
                            <img
                              src={plan.image}
                              alt={plan?.providerName || ''}
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/30 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute -bottom-2 -right-2 glass-panel p-1 rounded-lg border border-[var(--surface-border-accent)]">
                              <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {/* Food Diet Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                isPureVeg
                                  ? 'theme-badge-emerald'
                                  : isVegan
                                  ? 'theme-badge-primary'
                                  : 'theme-badge-amber'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {plan?.dietary || 'Veg'}
                            </span>

                            {/* Rating Badge */}
                            <div className="flex items-center gap-1 text-[var(--accent-gold)] text-xs font-bold font-mono-numbers bento-card-static px-2 py-0.5 rounded-md">
                              <Star className="w-3.5 h-3.5 fill-[var(--accent-gold)] text-[var(--accent-gold)]" />
                              <span>{plan?.rating || 4.5}</span>
                              <span className="theme-text-muted font-normal text-[10px]">({plan?.reviewCount || 0})</span>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold theme-text-main group-hover:theme-text-accent transition-colors font-display line-clamp-1">
                            {plan?.providerName || 'Provider'}
                          </h3>

                          <p className="text-xs theme-text-sub line-clamp-1 mt-0.5">
                            {plan?.chefName || 'Chef'} • {plan?.cuisine || 'Home Style'}
                          </p>

                          {/* Meal Schedule Timings */}
                          <div className="mt-3 flex items-center gap-2 text-[11px] theme-text-muted bento-card-static px-2.5 py-1.5 rounded-xl border border-[var(--surface-border)] font-mono-numbers">
                            <Clock className="w-3.5 h-3.5 text-[var(--brand-accent)] shrink-0" />
                            <span>Lunch: 12:30-2:30 PM | Dinner: 7:30-9:30 PM</span>
                          </div>
                        </div>
                      </div>

                      {/* Weekly Thali Menu Accordion */}
                      <div className="bento-card-static p-4 rounded-2xl mb-6 border border-[var(--surface-border)]">
                        <button
                          onClick={() => toggleMenuAccordion(planId)}
                          className="w-full flex items-center justify-between text-xs font-bold theme-text-main font-display hover:theme-text-accent transition-all duration-200 active:scale-95"
                        >
                          <span className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-[var(--accent-gold)]" />
                            Weekly Thali Menu Highlights
                          </span>
                          <div className="flex items-center gap-1 text-xs theme-text-accent">
                            <span>{isAccordionOpen ? 'Hide Full Menu' : 'View 7-Day Menu'}</span>
                            {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* Always show top 2 days preview */}
                        {!isAccordionOpen ? (
                          <div className="mt-3 space-y-2 text-xs pt-2 border-t border-[var(--surface-border)]">
                            {Object.entries(plan?.weeklyMenu || {}).slice(0, 2).map(([day, item]) => (
                              <div key={day} className="flex gap-2 text-xs">
                                <span className="font-semibold theme-text-accent w-20 shrink-0">{day}:</span>
                                <span className="theme-text-sub line-clamp-1">{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Expanded Weekly Menu Accordion */
                          <div className="mt-3 space-y-2 text-xs pt-3 border-t border-[var(--surface-border)] animate-in fade-in duration-200">
                            {Object.entries(plan?.weeklyMenu || {}).map(([day, item]) => (
                              <div key={day} className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-[var(--surface-border)]/50 last:border-b-0 gap-1">
                                <span className="font-bold theme-text-accent w-24 shrink-0 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" /> {day}
                                </span>
                                <span className="theme-text-sub text-xs sm:text-right">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Subscribe Footer */}
                    <div className="pt-4 border-t border-[var(--surface-border)] flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] theme-text-muted block font-bold uppercase tracking-wider">
                          Monthly Subscription
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-[var(--accent-emerald)] font-mono-numbers">
                            ₹{plan?.monthlyPrice?.toLocaleString() || '0'}
                          </span>
                          <span className="text-[10px] theme-text-muted">/mo</span>
                        </div>
                      </div>

                      <button
                        onClick={() => openSubscriptionModal(plan)}
                        className="gradient-btn px-5 py-2.5 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4" /> Subscribe Plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeSubscriptionModal}
              className="absolute top-4 right-4 p-2 rounded-full bento-card-static theme-text-muted hover:theme-text-main transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Provider Card Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--surface-border)]">
              {selectedPlan.image && (
                <img
                  src={selectedPlan.image}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/30 shrink-0"
                  alt={selectedPlan.providerName || ''}
                />
              )}
              <div>
                <span className="px-2 py-0.5 rounded-md theme-badge-emerald text-[10px] font-bold">
                  {selectedPlan.dietary || 'Veg'}
                </span>
                <h3 className="text-lg font-bold theme-text-main font-display mt-0.5">{selectedPlan.providerName || 'Provider'}</h3>
                <p className="text-xs theme-text-accent font-medium">{selectedPlan.cuisine || 'Home Style'}</p>
              </div>
            </div>

            {subSuccess ? (
              <div className="p-6 rounded-2xl theme-badge-emerald text-center space-y-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-10 h-10 text-[var(--accent-emerald)] mx-auto" />
                <h4 className="text-lg font-bold theme-text-main font-display">Subscription Activated! 🎉</h4>
                <p className="text-xs theme-text-sub">
                  Your <span className="font-bold text-[var(--accent-emerald)]">{subDuration}</span> plan starts on <span className="font-bold font-mono-numbers">{startDate}</span>. Daily fresh thalis will be delivered during {deliverySlot}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-6 text-xs">
                {/* Duration Toggle Buttons */}
                <div>
                  <label className="block theme-text-sub font-semibold mb-2">Select Subscription Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSubDuration('Weekly')}
                      className={`p-3.5 rounded-2xl border text-center font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 relative ${
                        subDuration === 'Weekly'
                          ? 'theme-badge-primary border-[var(--brand-accent)] ring-2 ring-[var(--brand-glow)]'
                          : 'bento-card-static theme-text-sub hover:theme-text-main'
                      }`}
                    >
                      <span>Weekly Trial (7 Days)</span>
                      <span className="block text-base theme-text-main mt-1 font-mono-numbers font-extrabold">
                        ₹{selectedPlan.weeklyPrice?.toLocaleString() || '0'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubDuration('Monthly')}
                      className={`p-3.5 rounded-2xl border text-center font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 relative ${
                        subDuration === 'Monthly'
                          ? 'theme-badge-primary border-[var(--brand-accent)] ring-2 ring-[var(--brand-glow)]'
                          : 'bento-card-static theme-text-sub hover:theme-text-main'
                      }`}
                    >
                      <span className="absolute -top-2.5 right-3 theme-badge-amber text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Save 15%
                      </span>
                      <span>Monthly Plan (30 Days)</span>
                      <span className="block text-base text-[var(--accent-emerald)] mt-1 font-mono-numbers font-extrabold">
                        ₹{selectedPlan.monthlyPrice?.toLocaleString() || '0'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Date Selector & Delivery Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block theme-text-sub font-semibold mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 theme-text-accent" /> Start Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full theme-input p-3 outline-none font-mono-numbers rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block theme-text-sub font-semibold mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 theme-text-accent" /> Preferred Delivery Slot
                    </label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full theme-input p-3 outline-none rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="Both Lunch & Dinner">Both Lunch & Dinner</option>
                      <option value="Lunch Only (12:30 - 2:00 PM)">Lunch Only (12:30 - 2:00 PM)</option>
                      <option value="Dinner Only (7:30 - 9:00 PM)">Dinner Only (7:30 - 9:00 PM)</option>
                    </select>
                  </div>
                </div>

                {/* Detailed Pricing Breakdown using font-mono-numbers */}
                <div className="bento-card-static p-4 rounded-2xl space-y-2 border border-[var(--surface-border)]">
                  <h4 className="font-bold theme-text-main font-display text-xs mb-2 uppercase tracking-wider">
                    Pricing Breakdown ({subDuration} Plan)
                  </h4>

                  <div className="flex justify-between theme-text-sub">
                    <span>Base Subscription Fee</span>
                    <span className="font-mono-numbers font-bold theme-text-main">
                      ₹{pricing.base?.toLocaleString() || '0'}
                    </span>
                  </div>

                  <div className="flex justify-between theme-text-sub">
                    <span>Hygienic Packaging & Delivery</span>
                    <span className="font-mono-numbers font-bold theme-text-main">
                      +₹{pricing.packaging?.toLocaleString() || '0'}
                    </span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-[var(--accent-emerald)]">
                      <span>Monthly Plan Discount (15%)</span>
                      <span className="font-mono-numbers font-bold">
                        -₹{pricing.discount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--surface-border)] flex justify-between items-center text-sm">
                    <span className="font-bold theme-text-main font-display">Total Amount</span>
                    <span className="font-extrabold text-[var(--accent-emerald)] font-mono-numbers text-base">
                      ₹{pricing.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bento-card-static text-[11px] theme-text-muted flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-gold)] shrink-0 mt-0.5" />
                  <span>Pause, resume, or skip daily meals anytime via app. No lock-in period.</span>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 gradient-btn font-bold text-xs rounded-xl shadow-lg uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Confirm & Pay ₹{pricing.total?.toLocaleString() || '0'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
