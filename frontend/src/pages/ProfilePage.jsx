import React, { useState, useEffect } from 'react';
import { 
  User, Briefcase, MapPin, DollarSign, Utensils, Moon, Sparkles, Heart, CheckCircle2, Save, Cigarette, Star, ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';
import { sanitizeInput } from '../utils/sanitizer';

export default function ProfilePage({ user, onProfileUpdated }) {
  const [occupation, setOccupation] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [foodPref, setFoodPref] = useState('Veg');
  const [sleepSchedule, setSleepSchedule] = useState('Flexible');
  const [cleanliness, setCleanliness] = useState(3);
  const [smokingDrinking, setSmokingDrinking] = useState('Non-Smoker / Non-Drinker');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [bio, setBio] = useState('');
  const [hobbiesInput, setHobbiesInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profile = await apiService.getProfile(userId);
        if (isMounted && profile) {
          if (profile.occupation) setOccupation(profile.occupation);
          if (profile.budget && Array.isArray(profile.budget)) {
            setMinBudget(profile.budget[0] ?? '');
            setMaxBudget(profile.budget[1] ?? '');
          }
          if (profile.foodPref) setFoodPref(profile.foodPref);
          if (profile.sleepSchedule) setSleepSchedule(profile.sleepSchedule);
          if (profile.cleanliness !== undefined && profile.cleanliness !== null) {
            setCleanliness(profile.cleanliness);
          }
          if (profile.smokingDrinking) setSmokingDrinking(profile.smokingDrinking);
          if (profile.preferredLocation) setPreferredLocation(profile.preferredLocation);
          if (profile.bio) setBio(profile.bio);
          if (profile.hobbies) {
            setHobbiesInput(Array.isArray(profile.hobbies) ? profile.hobbies.join(', ') : profile.hobbies);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    loadProfile();

    return () => { isMounted = false; };
  }, [user?.id, user?._id]);

  const handleSave = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?._id;
    if (!userId) {
      console.warn("No user ID available for profile update");
      return;
    }

    const rawHobbies = typeof hobbiesInput === 'string'
      ? hobbiesInput.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(hobbiesInput) ? hobbiesInput : []);
    const hobbiesArray = rawHobbies.map(h => sanitizeInput(h)).filter(Boolean);

    const profilePayload = {
      occupation: sanitizeInput(occupation) || '',
      budget: [Number(minBudget) || 0, Number(maxBudget) || 0],
      foodPref: sanitizeInput(foodPref) || 'Veg',
      sleepSchedule: sanitizeInput(sleepSchedule) || 'Flexible',
      cleanliness: Number(cleanliness) || 3,
      smokingDrinking: sanitizeInput(smokingDrinking) || 'Non-Smoker / Non-Drinker',
      preferredLocation: sanitizeInput(preferredLocation) || '',
      bio: sanitizeInput(bio, { allowMultiline: true }),
      hobbies: hobbiesArray
    };

    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await apiService.updateProfile(userId, profilePayload);
      const updatedProfile = res?.profile || res || profilePayload;
      setSavedSuccess(true);

      const fullUpdatedUser = {
        ...user,
        ...updatedProfile,
        id: userId,
        _id: userId
      };

      if (onProfileUpdated) {
        onProfileUpdated(fullUpdatedUser);
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const cleanStarCount = Math.max(1, Math.min(5, Math.round(Number(cleanliness)) || 1));

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      
      {/* Header Banner */}
      <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest theme-text-accent">
            Lifestyle Profile Setup
          </span>
          <h1 className="text-3xl font-extrabold theme-text-main font-display flex items-center gap-2">
            <span>Profile & Preferences</span>
            <Sparkles className="w-6 h-6 text-[var(--accent-gold)]" />
          </h1>
          <p className="theme-text-sub text-xs mt-1 max-w-xl">
            Your preferences feed into the Weighted AI Compatibility Engine to connect you with like-minded roommates.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl theme-badge-emerald text-xs font-bold shrink-0 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span>Profile Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Summary Card (4 Cols on Large) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card p-6 flex flex-col items-center text-center space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-28 h-28 rounded-3xl object-cover ring-4 ring-[var(--brand-accent)]/30 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-[var(--brand-primary)]/20 text-[var(--brand-accent)] font-bold flex items-center justify-center text-3xl shadow-xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="w-4 h-4 rounded-full bg-[var(--accent-emerald)] absolute bottom-1 right-1 ring-2 ring-[var(--surface-card)]" title="Active Seeker"></span>
            </div>

            <div>
              <h2 className="text-xl font-bold theme-text-main font-display">{user?.name || 'User'}</h2>
              <span className="text-xs theme-text-accent font-medium block mt-0.5">{user?.email || ''}</span>
              <span className="inline-block mt-2 text-[10px] uppercase font-bold theme-badge-primary px-2.5 py-0.5 rounded-full">
                {user?.role || 'user'} Account
              </span>
            </div>
            
            <div className="w-full bento-card-static p-4 text-left text-xs space-y-3">
              <div className="flex items-center gap-2.5 theme-text-sub">
                <Briefcase className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
                <span className="truncate">{occupation || 'Occupation Not Specified'}</span>
              </div>
              <div className="flex items-center gap-2.5 theme-text-sub">
                <MapPin className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
                <span className="truncate">{preferredLocation || 'Location Not Specified'}</span>
              </div>
              <div className="flex items-center gap-2.5 theme-text-sub">
                <DollarSign className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                <span className="font-mono-numbers font-bold text-xs">
                  ₹{Number(minBudget || 0).toLocaleString()} - ₹{Number(maxBudget || 0).toLocaleString()} / mo
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 gradient-btn flex items-center justify-center gap-2 text-xs uppercase font-bold tracking-wider shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Preferences Matrix (8 Cols on Large) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Card 1: Personal & Location Details */}
          <div className="bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider flex items-center gap-2 font-display">
              <User className="w-4 h-4 text-[var(--brand-accent)]" /> 
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Preferred Location</label>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  placeholder="e.g. HSR Layout, Bangalore"
                />
              </div>
            </div>
          </div>

          {/* Bento Card 2: Budget Range */}
          <div className="bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider flex items-center gap-2 font-display">
                <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" /> 
                <span>Monthly Rent Budget Range</span>
              </h3>
              <span className="text-xs font-bold text-[var(--accent-emerald)] font-mono-numbers">
                ₹{Number(minBudget || 0).toLocaleString()} - ₹{Number(maxBudget || 0).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Min Budget (₹ / mo)</label>
                <input
                  type="number"
                  step="1000"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Max Budget (₹ / mo)</label>
                <input
                  type="number"
                  step="1000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  placeholder="25000"
                />
              </div>
            </div>
          </div>

          {/* Bento Card 3: Lifestyle Habits Grid */}
          <div className="bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider flex items-center gap-2 font-display">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" /> 
              <span>Lifestyle Habits & Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Dietary Preference</label>
                <select
                  value={foodPref}
                  onChange={(e) => setFoodPref(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                >
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Jain">Jain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Sleep Schedule</label>
                <select
                  value={sleepSchedule}
                  onChange={(e) => setSleepSchedule(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                >
                  <option value="Early Bird">Early Bird (10 PM - 6 AM)</option>
                  <option value="Night Owl">Night Owl (1 AM - 8 AM)</option>
                  <option value="Flexible">Flexible Schedule</option>
                </select>
              </div>

              {/* Cleanliness Slider */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold theme-text-sub">
                    Cleanliness Expectations Level
                  </label>
                  <span className="font-bold text-[var(--accent-gold)] font-mono-numbers flex items-center gap-1">
                    <span>{cleanliness} / 5 Stars</span>
                    <span>({'⭐'.repeat(cleanStarCount)})</span>
                  </span>
                </div>

                <div className="bento-card-static p-3 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={cleanliness}
                    onChange={(e) => setCleanliness(e.target.value)}
                    className="w-full accent-[var(--brand-accent)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Smoking & Drinking Habits</label>
                <select
                  value={smokingDrinking}
                  onChange={(e) => setSmokingDrinking(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                >
                  <option value="Non-Smoker / Non-Drinker">Non-Smoker & Non-Drinker</option>
                  <option value="Non-Smoker / Social Drinker">Non-Smoker / Social Drinker</option>
                  <option value="Social Smoker / Social Drinker">Social Smoker & Social Drinker</option>
                </select>
              </div>

            </div>
          </div>

          {/* Bento Card 4: Bio & Hobbies */}
          <div className="bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
            <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider flex items-center gap-2 font-display">
              <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" /> 
              <span>Bio & Hobbies</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Hobbies & Interests (Comma Separated)</label>
                <input
                  type="text"
                  value={hobbiesInput}
                  onChange={(e) => setHobbiesInput(e.target.value)}
                  placeholder="e.g. Coding, Badminton, Reading, Gaming"
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-sub mb-1.5">Bio / Description</label>
                <textarea
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a brief introduction about yourself..."
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                ></textarea>
              </div>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
