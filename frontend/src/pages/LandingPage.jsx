import React, { useState } from 'react';
import { 
  ShieldCheck, Home, Users, BookOpen, Sparkles, ArrowRight, 
  CheckCircle2, Star, Zap, Building2, Utensils, CreditCard, FileText, ChevronRight
} from 'lucide-react';

const DATA_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><circle cx='12' cy='8' r='4'/><path d='M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'/></svg>";
const DATA_PROPERTY_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>";

export default function LandingPage({ onNavigate }) {
  const [activePreview, setActivePreview] = useState('roommate');
  const [budgetVal, setBudgetVal] = useState(18000);

  const handleImageError = (e, fallbackUri) => {
    e.target.onerror = null;
    e.target.src = fallbackUri;
  };

  const socialProofStats = [
    { label: 'Verified Roommates', value: '4,850+', icon: Users, badge: 'Active Seekers' },
    { label: 'Shared Flats & PGs', value: '1,200+', icon: Building2, badge: 'Verified Units' },
    { label: 'Match Accuracy', value: '98.4%', icon: Sparkles, badge: 'AI Algorithm' },
    { label: 'Expenses Settled', value: '₹1.2M+', icon: CreditCard, badge: 'Zero Dispute' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-16">
      
      {/* Hero Section */}
      <section className="relative bento-card p-8 sm:p-12 md:p-16 overflow-hidden transition-all duration-300 border border-[var(--surface-border-accent)] shadow-2xl">
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 right-0 -translate-y-16 translate-x-16 w-96 h-96 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-16 -translate-x-16 w-80 h-80 bg-[var(--accent-gold)]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Hero Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Pill Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold theme-badge-primary transition-transform duration-200 hover:scale-105">
                <Zap className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                <span>AI-POWERED CO-LIVING MATCHMAKER</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold theme-badge-emerald transition-transform duration-200 hover:scale-105">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                <span>100% VERIFIED ROOMS</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold theme-badge-amber transition-transform duration-200 hover:scale-105">
                <Star className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                <span>ZERO BROKERAGE</span>
              </span>
            </div>

            {/* High Impact Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold theme-text-main leading-tight font-display tracking-tight">
              Find your ideal <span className="text-[var(--brand-accent)] font-extrabold">roommate & flat</span> in one seamless flow.
            </h1>

            <p className="theme-text-sub text-base sm:text-lg leading-relaxed max-w-2xl">
              RoomieSync combines AI compatibility matching, verified PG & flat listings, home chef meal subscriptions, and digital roommate contracts into one intelligent co-living ecosystem.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('auth')}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white px-8 py-4 text-sm font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--brand-glow)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate('auth')}
                className="theme-btn-secondary px-8 py-4 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
              >
                <span>Try Demo Shortcuts</span>
                <ChevronRight className="w-4 h-4 theme-text-accent transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Trust Bullet List */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs theme-text-sub border-t theme-border">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>Verified Identity Check</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>No Hidden Agent Fees</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>Instant PDF Contracts</span>
              </span>
            </div>

          </div>

          {/* Right Column - Interactive Preview Card */}
          <div className="lg:col-span-5">
            <div className="bento-card-static p-6 rounded-3xl space-y-5 shadow-2xl relative border border-[var(--surface-border-accent)]">
              
              {/* Card Header & Preview Switcher */}
              <div className="flex items-center justify-between pb-3 border-b theme-border">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider theme-text-accent font-display">
                  Live Platform Simulator
                </span>
              </div>

              {/* Preview Toggle Chips */}
              <div className="flex rounded-xl glass-panel p-1 gap-1 text-xs">
                <button
                  onClick={() => setActivePreview('roommate')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 active:scale-95 ${
                    activePreview === 'roommate' 
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                      : 'theme-text-sub hover:theme-text-main hover:bg-[var(--surface-card-hover)]'
                  }`}
                >
                  Roommate Match
                </button>
                <button
                  onClick={() => setActivePreview('property')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 active:scale-95 ${
                    activePreview === 'property' 
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                      : 'theme-text-sub hover:theme-text-main hover:bg-[var(--surface-card-hover)]'
                  }`}
                >
                  PG Room Preview
                </button>
              </div>

              {/* Dynamic Preview Content */}
              {activePreview === 'roommate' ? (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-4 bento-card p-4 transition-all duration-200 hover:-translate-y-0.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      alt="Ananya Sharma"
                      onError={(e) => handleImageError(e, DATA_AVATAR_FALLBACK)}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--brand-accent)]/50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm theme-text-main font-display">Ananya Sharma</h3>
                        <span className="theme-badge-emerald px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers">
                          94% Match
                        </span>
                      </div>
                      <p className="text-xs theme-text-sub">UX Designer • Koramangala</p>
                      <p className="text-[11px] theme-text-accent font-mono-numbers font-semibold mt-1">
                        Budget: ₹15,000 - ₹22,000 / mo
                      </p>
                    </div>
                  </div>

                  {/* Interactive Budget Slider */}
                  <div className="bento-card-static p-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="theme-text-sub">Simulate Rent Budget</span>
                      <span className="theme-text-accent font-mono-numbers">₹{budgetVal.toLocaleString()} / mo</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="35000"
                      step="1000"
                      value={budgetVal}
                      onChange={(e) => setBudgetVal(Number(e.target.value))}
                      className="w-full accent-[var(--brand-primary)] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="theme-badge-primary p-2.5 rounded-xl font-medium transition-transform duration-200 hover:scale-102">
                      🥗 Vegetarian Only
                    </div>
                    <div className="theme-badge-amber p-2.5 rounded-xl font-medium transition-transform duration-200 hover:scale-102">
                      🌅 Early Bird (10 PM)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="bento-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
                    <img
                      src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"
                      alt="Modern PG Room"
                      onError={(e) => handleImageError(e, DATA_PROPERTY_FALLBACK)}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm theme-text-main font-display">Skyline Co-Living Suites</h3>
                        <span className="theme-badge-primary px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers">
                          2 Beds Left
                        </span>
                      </div>
                      <p className="text-xs theme-text-sub">HSR Layout Sector 3, Bangalore</p>
                      <p className="text-xs font-bold text-[var(--accent-emerald)] font-mono-numbers">
                        ₹14,500 / month • WiFi + Daily Cleaning
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button inside simulator */}
              <button
                onClick={() => onNavigate('auth')}
                className="w-full py-3 theme-btn-secondary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
              >
                <span>Unlock Full Access</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-accent)] transition-transform duration-200 group-hover:translate-x-1" />
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* Social Proof Counter */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {socialProofStats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={idx} 
              className="bento-card p-6 flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--surface-border-accent)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold theme-text-accent tracking-widest">
                  {stat.badge}
                </span>
                <IconComponent className="w-5 h-5 theme-text-accent" />
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black theme-text-main font-mono-numbers block tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs theme-text-sub font-medium block mt-1">
                  {stat.label}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Feature Bento Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest theme-text-accent">
            Comprehensive Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold theme-text-main font-display">
            Everything you need for hassle-free shared living.
          </h2>
          <p className="theme-text-sub text-sm">
            Designed to address every hassle in finding roommates, discovering PG rooms, managing meals, and splitting bills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1 - AI Matching */}
          <div className="md:col-span-2 bento-card p-8 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-accent)]">
            <div className="space-y-3 max-w-lg">
              <div className="w-12 h-12 rounded-2xl theme-badge-primary flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Sparkles className="w-6 h-6 text-[var(--brand-accent)]" />
              </div>
              <h3 className="text-2xl font-bold theme-text-main font-display">
                Weighted AI Lifestyle Compatibility
              </h3>
              <p className="theme-text-sub text-sm leading-relaxed">
                Our algorithm scores compatibility based on budget overlap, sleep cycles, dietary preferences, cleanliness expectations, and smoking/drinking habits to minimize roommate friction.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t theme-border text-xs">
              <div className="bento-card-static p-3 text-center transition-all duration-200 hover:-translate-y-0.5">
                <span className="block font-bold theme-text-main font-mono-numbers">35%</span>
                <span className="theme-text-muted text-[10px]">Budget Weight</span>
              </div>
              <div className="bento-card-static p-3 text-center transition-all duration-200 hover:-translate-y-0.5">
                <span className="block font-bold theme-text-main font-mono-numbers">25%</span>
                <span className="theme-text-muted text-[10px]">Habits Weight</span>
              </div>
              <div className="bento-card-static p-3 text-center transition-all duration-200 hover:-translate-y-0.5">
                <span className="block font-bold theme-text-main font-mono-numbers">20%</span>
                <span className="theme-text-muted text-[10px]">Diet & Sleep</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2 - Verified Rooms */}
          <div className="bento-card p-8 flex flex-col justify-between space-y-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-accent)]">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl theme-badge-amber flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Building2 className="w-6 h-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="text-xl font-bold theme-text-main font-display">
                Verified PG & Flat Search
              </h3>
              <p className="theme-text-sub text-xs leading-relaxed">
                Filter verified property listings by location, monthly rent, amenities, and room sharing type with direct site visit booking.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('auth')} 
              className="theme-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
            >
              <span>Explore Listings</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-accent)] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bento Card 3 - Home Chef Mess */}
          <div className="bento-card p-8 flex flex-col justify-between space-y-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-accent)]">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl theme-badge-emerald flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Utensils className="w-6 h-6 text-[var(--accent-emerald)]" />
              </div>
              <h3 className="text-xl font-bold theme-text-main font-display">
                Home Chef Meal Plans
              </h3>
              <p className="theme-text-sub text-xs leading-relaxed">
                Subscribe to weekly & monthly home-cooked thalis and tiffin mess providers right from your dashboard.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('auth')} 
              className="theme-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--accent-emerald)] hover:text-[var(--accent-emerald)]"
            >
              <span>View Mess Plans</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-emerald)] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bento Card 4 - Digital Agreements */}
          <div className="bento-card p-8 flex flex-col justify-between space-y-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-accent)]">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl theme-badge-primary flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <FileText className="w-6 h-6 text-[var(--brand-accent)]" />
              </div>
              <h3 className="text-xl font-bold theme-text-main font-display">
                Digital House Agreements
              </h3>
              <p className="theme-text-sub text-xs leading-relaxed">
                Generate legally structured, PDF-exportable roommate agreements covering house rules, notice periods, and deposit terms.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('auth')} 
              className="theme-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
            >
              <span>Generate Contract</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-accent)] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bento Card 5 - Expense Tracker */}
          <div className="bento-card p-8 flex flex-col justify-between space-y-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-accent)]">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl theme-badge-amber flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <CreditCard className="w-6 h-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="text-xl font-bold theme-text-main font-display">
                Smart Split Expense Tracker
              </h3>
              <p className="theme-text-sub text-xs leading-relaxed">
                Log shared rent, utility, and grocery expenses. Track balances and settle debts with one click.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('auth')} 
              className="theme-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
            >
              <span>Manage Expenses</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-gold)] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bento-card p-8 sm:p-12 text-center space-y-6 relative overflow-hidden border border-[var(--surface-border-accent)] shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold theme-text-main font-display">
            Ready to find your ideal co-living match?
          </h2>
          <p className="theme-text-sub text-sm">
            Sign up in under 60 seconds or test out the platform using our 1-click quick demo accounts.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('auth')}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white px-8 py-4 text-sm font-bold tracking-wider uppercase rounded-xl w-full sm:w-auto shadow-lg shadow-[var(--brand-glow)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Login / Create Account
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
