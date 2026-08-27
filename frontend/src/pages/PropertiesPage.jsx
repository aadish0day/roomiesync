import React, { useState, useEffect, useRef } from 'react';
import { Home, MapPin, Search, Filter, Plus, Calendar, ShieldCheck, Phone, X, Eye, Users, RefreshCw, CheckCircle2, Building, Sparkles, ShieldAlert } from 'lucide-react';
import { apiService } from '../services/api';

const DATA_PROPERTY_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 24 24' fill='%231f2937' stroke='%239ca3af' stroke-width='1.5'><rect width='100%' height='100%' fill='%23374151'/><path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>";

export default function PropertiesPage({ currentUser }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sharingFilter, setSharingFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState(30000);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('details'); // 'details' | 'book'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Add Property
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('Flat');
  const [newSharingType, setNewSharingType] = useState('Private Room in Shared Flat');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrls, setNewImageUrls] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [addPropertyError, setAddPropertyError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAmenities = ['WiFi', 'AC', 'Power Backup', 'Washing Machine', 'Housekeeping', 'Gym', 'Balcony', 'Biometric Lock', 'Security 24/7', '3 Meals Daily'];

  const isMounted = useRef(true);
  const bookingTimeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;

    const fetchProperties = async () => {
      try {
        if (isMounted.current) setLoading(true);
        const data = await apiService.getProperties().catch(() => []);
        if (isMounted.current) {
          setProperties(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    fetchProperties();

    return () => {
      isMounted.current = false;
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
    };
  }, []);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DATA_PROPERTY_FALLBACK;
  };

  const handleToggleAmenity = (amenity) => {
    if ((selectedAmenities || []).includes(amenity)) {
      setSelectedAmenities((selectedAmenities || []).filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...(selectedAmenities || []), amenity]);
    }
  };

  const hasActiveFilters = searchTerm || locationFilter || typeFilter !== 'All' || sharingFilter !== 'All' || maxBudget < 30000;

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('All');
    setSharingFilter('All');
    setMaxBudget(30000);
  };

  const filteredProps = (properties || []).filter(p => {
    if (!p) return false;
    const matchesSearch = (p.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (p.location || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (p.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesLoc = !locationFilter || (p.location || '').toLowerCase().includes((locationFilter || '').toLowerCase());
    const matchesBudget = typeof p.price === 'number' ? p.price <= maxBudget : true;
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const matchesSharing = sharingFilter === 'All' || (p.sharingType && p.sharingType.toLowerCase().includes((sharingFilter || '').toLowerCase()));
    return matchesSearch && matchesLoc && matchesBudget && matchesType && matchesSharing;
  });

  const openPropertyModal = (prop, tab = 'details') => {
    setSelectedProperty(prop);
    setActiveModalTab(tab);
    setSelectedImageIndex(0);
    setBookingConfirmed(false);
    setBookingError('');
  };

  const closePropertyModal = () => {
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current);
    }
    setSelectedProperty(null);
    setSelectedImageIndex(0);
    setBookingConfirmed(false);
    setBookingError('');
    setActiveModalTab('details');
  };

  const resetAddPropertyForm = () => {
    setNewTitle('');
    setNewLocation('');
    setNewPrice('');
    setNewType('Flat');
    setNewSharingType('Private Room in Shared Flat');
    setNewDesc('');
    setNewImageUrls('');
    setSelectedAmenities([]);
    setAddPropertyError('');
  };

  const openAddModal = () => {
    resetAddPropertyForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    resetAddPropertyForm();
    setShowAddModal(false);
  };

  const handleBookVisit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedProperty) return;

    if (!bookingDate) {
      setBookingError('Please select a visit date.');
      return;
    }

    const userId = currentUser?.id || currentUser?._id || 'usr_guest';
    const propId = selectedProperty.id || selectedProperty._id;
    try {
      await apiService.bookProperty(propId, userId, bookingDate);
      if (!isMounted.current) return;
      setBookingConfirmed(true);

      bookingTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          closePropertyModal();
        }
      }, 2400);
    } catch (err) {
      if (!isMounted.current) return;
      console.error('Failed to book property visit:', err);
      setBookingError(err.response?.data?.error || err.message || 'Failed to schedule visit. Please try again.');
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setAddPropertyError('');

    const trimmedTitle = (newTitle || '').trim();
    const trimmedLocation = (newLocation || '').trim();
    const parsedPrice = Number(newPrice);

    if (!trimmedTitle) {
      setAddPropertyError('Please enter a property title.');
      return;
    }
    if (trimmedTitle.length < 3) {
      setAddPropertyError('Property title must be at least 3 characters.');
      return;
    }
    if (!trimmedLocation) {
      setAddPropertyError('Please enter a location/address.');
      return;
    }
    if (!newPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      setAddPropertyError('Please enter a valid monthly rent (greater than 0).');
      return;
    }

    const imageList = (newImageUrls || '')
      .split(',')
      .map(url => url.trim())
      .filter(url => url.startsWith('http://') || url.startsWith('https://'));

    const ownerId = currentUser?.id || currentUser?._id || '';

    setIsSubmitting(true);
    try {
      const created = await apiService.addProperty({
        title: trimmedTitle,
        location: trimmedLocation,
        price: parsedPrice,
        type: newType,
        sharingType: newSharingType,
        description: (newDesc || '').trim() || 'Spacious modern co-living accommodation.',
        amenities: (selectedAmenities || []).length ? selectedAmenities : ['WiFi', 'Power Backup'],
        images: imageList.length ? imageList : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
        ownerName: currentUser?.name || 'Property Owner',
        ownerContact: currentUser?.email || '',
        ownerId
      });

      if (!isMounted.current) return;

      if (created) {
        setProperties(prev => [created, ...(prev || [])]);
      }
      closeAddModal();
    } catch (err) {
      if (!isMounted.current) return;
      console.error('Failed to add property listing:', err);
      setAddPropertyError(err.response?.data?.error || err.message || 'Failed to publish property listing.');
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <Home className="w-8 h-8 text-[var(--brand-accent)] animate-spin mb-3" />
        <p className="text-sm theme-text-sub font-medium">Loading property listings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full theme-badge-primary text-[11px] font-bold uppercase tracking-wider">
              Verified Co-Living & PGs
            </span>
            <span className="text-xs theme-text-muted font-mono-numbers">
              {(filteredProps || []).length} Available
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold theme-text-main flex items-center gap-3 font-display tracking-tight">
            Property Listings <Home className="w-7 h-7 text-[var(--brand-accent)]" />
          </h1>
          <p className="theme-text-sub text-sm mt-1 max-w-xl">
            Explore curated, verified PGs and shared flats with zero brokerage and instant site visit scheduling.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="gradient-btn px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property Listing</span>
        </button>
      </div>

      {/* Clean Search & Filter Header Bar */}
      <div className="bento-card-static p-4 sm:p-6 mb-8 shadow-md rounded-2xl border border-[var(--surface-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold theme-text-main flex items-center gap-2 font-display">
            <Filter className="w-4 h-4 theme-text-accent" /> Search & Filter Properties
          </h2>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs theme-text-accent hover:underline flex items-center gap-1 font-medium transition-all duration-200 active:scale-95"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search title, location, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full theme-input py-2.5 pl-10 pr-3.5 text-xs outline-none rounded-xl"
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full theme-input py-2.5 px-3.5 text-xs outline-none rounded-xl appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              <option value="Koramangala">Koramangala, Bangalore</option>
              <option value="HSR Layout">HSR Layout, Bangalore</option>
              <option value="Indiranagar">Indiranagar, Bangalore</option>
              <option value="Whitefield">Whitefield, Bangalore</option>
              <option value="BTM Layout">BTM Layout, Bangalore</option>
            </select>
            <MapPin className="w-3.5 h-3.5 theme-text-muted absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Property Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full theme-input py-2.5 px-3.5 text-xs outline-none rounded-xl appearance-none cursor-pointer"
            >
              <option value="All">All Property Types (PG & Flat)</option>
              <option value="Flat">Shared Flat / Apartment</option>
              <option value="PG">Co-Living PG</option>
            </select>
            <Building className="w-3.5 h-3.5 theme-text-muted absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Sharing Type Filter */}
          <div className="relative">
            <select
              value={sharingFilter}
              onChange={(e) => setSharingFilter(e.target.value)}
              className="w-full theme-input py-2.5 px-3.5 text-xs outline-none rounded-xl appearance-none cursor-pointer"
            >
              <option value="All">All Sharing Types</option>
              <option value="Private">Private Room</option>
              <option value="Twin">Twin / Double Sharing</option>
              <option value="Single">Single Bedroom</option>
            </select>
            <Users className="w-3.5 h-3.5 theme-text-muted absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Rent Slider Bar */}
        <div className="mt-4 pt-4 border-t border-[var(--surface-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="theme-text-sub font-semibold">Max Rent Budget:</span>
            <span className="px-3 py-1 rounded-lg bento-card-static text-[var(--accent-emerald)] font-extrabold font-mono-numbers text-sm">
              ₹{maxBudget.toLocaleString()} / mo
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="theme-text-muted font-mono-numbers">₹8k</span>
            <input
              type="range"
              min="8000"
              max="35000"
              step="1000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-[var(--brand-accent)] cursor-pointer h-2 bento-card-static rounded-lg"
            />
            <span className="theme-text-muted font-mono-numbers">₹35k</span>
          </div>
        </div>
      </div>

      {/* Properties Bento Grid */}
      {(filteredProps || []).length === 0 ? (
        <div className="bento-card-static p-12 text-center rounded-3xl">
          <Home className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold theme-text-main font-display mb-1">No Matching Properties Found</h3>
          <p className="theme-text-sub text-xs mb-4">Try adjusting your price range or clearing location filters.</p>
          <button 
            onClick={resetFilters} 
            className="theme-btn-secondary px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredProps || []).map(prop => (
            <div
              key={prop?.id || prop?._id || prop?.title}
              className="bento-card overflow-hidden flex flex-col justify-between group rounded-2xl border border-[var(--surface-border)] hover:border-[var(--surface-border-accent)] transition-all duration-300 shadow-sm"
            >
              <div>
                {/* Hero Image with Aspect Ratio */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-card)]">
                  <img
                    src={prop?.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                    alt={prop?.title || ''}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                    <span className="px-2.5 py-1 rounded-full glass-panel text-[11px] font-bold theme-text-accent border border-[var(--surface-border-accent)] backdrop-blur-md">
                      {prop?.type || 'PG'} • {prop?.sharingType || 'Shared'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full theme-badge-emerald text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Verified
                    </span>
                  </div>

                  {(prop?.images || []).length > 1 && (
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md glass-panel text-[10px] font-mono-numbers theme-text-main">
                      +{(prop.images || []).length - 1} photos
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1 theme-text-accent text-xs font-semibold mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{prop?.location || 'Location N/A'}</span>
                  </div>

                  <h3 className="text-base font-bold theme-text-main mb-2 group-hover:theme-text-accent transition-colors line-clamp-1 font-display">
                    {prop?.title || 'Untitled Property'}
                  </h3>

                  <p className="text-xs theme-text-sub line-clamp-2 leading-relaxed mb-4">
                    {prop?.description || ''}
                  </p>

                  {/* Amenities Micro Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(prop?.amenities || []).slice(0, 4).map((amenity, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bento-card-static theme-text-sub text-[10px] font-medium border border-[var(--surface-border)]">
                        {amenity}
                      </span>
                    ))}
                    {(prop?.amenities || []).length > 4 && (
                      <span className="px-2 py-1 rounded-lg bento-card-static theme-text-muted text-[10px] font-mono-numbers">
                        +{(prop.amenities || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-3 border-t border-[var(--surface-border)] flex items-center justify-between mt-auto bg-[var(--surface-card)]">
                <div>
                  <span className="text-[10px] theme-text-muted block font-bold uppercase tracking-wider">Rent</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-extrabold text-[var(--accent-emerald)] font-mono-numbers">
                      ₹{prop?.price?.toLocaleString() || '0'}
                    </span>
                    <span className="text-[10px] theme-text-muted">/mo</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPropertyModal(prop, 'details')}
                    className="theme-btn-secondary px-3 py-2 text-xs font-semibold flex items-center gap-1 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                  <button
                    onClick={() => openPropertyModal(prop, 'book')}
                    className="gradient-btn px-3.5 py-2 text-xs font-semibold flex items-center gap-1 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Details & Book Visit Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closePropertyModal}
              className="absolute top-4 right-4 p-2 rounded-full bento-card-static theme-text-muted hover:theme-text-main transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-3 border-b border-[var(--surface-border)] pb-4 mb-6">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`pb-2 text-sm font-bold font-display transition-all duration-200 hover:-translate-y-0.5 active:scale-95 relative ${
                  activeModalTab === 'details' ? 'theme-text-main' : 'theme-text-muted hover:theme-text-sub'
                }`}
              >
                Property Details
                {activeModalTab === 'details' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-accent)] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveModalTab('book')}
                className={`pb-2 text-sm font-bold font-display transition-all duration-200 hover:-translate-y-0.5 active:scale-95 relative flex items-center gap-1.5 ${
                  activeModalTab === 'book' ? 'theme-text-main' : 'theme-text-muted hover:theme-text-sub'
                }`}
              >
                <Calendar className="w-4 h-4 text-[var(--accent-emerald)]" /> Book Site Visit
                {activeModalTab === 'book' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-emerald)] rounded-full" />
                )}
              </button>
            </div>

            {/* Gallery Image Display */}
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 relative bg-[var(--surface-card)] border border-[var(--surface-border)]">
              <img
                src={selectedProperty.images?.[selectedImageIndex] || selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                onError={handleImageError}
                className="w-full h-full object-cover"
                alt={selectedProperty.title || ''}
              />
              <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-xl text-xs font-bold theme-text-main font-mono-numbers border border-[var(--surface-border-accent)]">
                ₹{selectedProperty.price?.toLocaleString() || '0'} / month
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full theme-badge-emerald text-xs font-bold flex items-center gap-1 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Verified Listing
                </span>
              </div>
            </div>

            {/* Thumbnails Bar */}
            {(selectedProperty.images || []).length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(selectedProperty.images || []).map((image, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 w-20 rounded-xl overflow-hidden shrink-0 border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      idx === selectedImageIndex ? 'border-[var(--brand-accent)] ring-2 ring-[var(--brand-glow)]' : 'border-[var(--surface-border)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`Thumbnail ${idx + 1}`} 
                      onError={handleImageError}
                      className="h-full w-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Content Tabs */}
            {activeModalTab === 'details' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold theme-text-main mb-1 font-display">
                    {selectedProperty.title || 'Untitled Property'}
                  </h2>
                  <p className="text-xs theme-text-accent flex items-center gap-1 font-medium">
                    <MapPin className="w-4 h-4" /> {selectedProperty.location || 'Location N/A'}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bento-card-static p-3 text-xs">
                    <span className="theme-text-muted block text-[10px] uppercase font-bold">Property Type</span>
                    <span className="theme-text-main font-bold mt-0.5 block">{selectedProperty.type || 'Flat'}</span>
                  </div>
                  <div className="bento-card-static p-3 text-xs">
                    <span className="theme-text-muted block text-[10px] uppercase font-bold">Occupancy</span>
                    <span className="theme-text-main font-bold mt-0.5 block">{selectedProperty.sharingType || 'Shared Room'}</span>
                  </div>
                  <div className="bento-card-static p-3 text-xs">
                    <span className="theme-text-muted block text-[10px] uppercase font-bold">Rent & Security</span>
                    <span className="theme-text-accent font-mono-numbers font-bold mt-0.5 block">
                      ₹{selectedProperty.price?.toLocaleString() || '0'} / mo
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold theme-text-muted uppercase tracking-wider mb-2 font-display">
                    About Property
                  </h4>
                  <p className="text-xs theme-text-sub leading-relaxed bento-card-static p-4 rounded-xl">
                    {selectedProperty.description || 'No detailed description available.'}
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xs font-bold theme-text-muted uppercase tracking-wider mb-2 font-display">
                    Included Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProperty.amenities || []).map((amenity, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bento-card-static theme-text-main text-xs font-medium border border-[var(--surface-border)] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Landlord Contact Box */}
                <div className="p-4 rounded-2xl bento-card-static border border-[var(--surface-border-accent)] flex items-center justify-between text-xs">
                  <div>
                    <span className="theme-text-main font-bold block text-sm">{selectedProperty.ownerName || 'Property Owner'}</span>
                    <span className="theme-text-muted">Verified Property Partner</span>
                  </div>
                  {selectedProperty.ownerContact && (
                    <a
                      href={`tel:${selectedProperty.ownerContact}`}
                      className="flex items-center gap-2 theme-badge-emerald px-4 py-2 rounded-xl font-bold font-mono-numbers transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{selectedProperty.ownerContact}</span>
                    </a>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveModalTab('book')}
                    className="gradient-btn px-6 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Calendar className="w-4 h-4" /> Book Site Visit Now
                  </button>
                </div>
              </div>
            ) : (
              /* Book Visit Form Tab */
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold theme-text-main font-display mb-1">
                    Schedule a Visit to {selectedProperty.title || 'Property'}
                  </h3>
                  <p className="theme-text-sub text-xs">
                    Choose your convenient date & time slot. The property manager will guide you on site.
                  </p>
                </div>

                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {bookingConfirmed ? (
                  <div className="p-6 rounded-2xl theme-badge-emerald text-center space-y-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-10 h-10 text-[var(--accent-emerald)] mx-auto" />
                    <h4 className="text-base font-bold theme-text-main font-display">Visit Scheduled Successfully!</h4>
                    <p className="text-xs theme-text-sub">
                      Your request for <span className="font-bold text-[var(--accent-emerald)]">{bookingDate} ({bookingTimeSlot})</span> has been received. {selectedProperty.ownerName || 'Property Partner'} will reach out via call shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookVisit} className="bento-card-static p-6 rounded-2xl space-y-4 text-xs">
                    <div>
                      <label className="block theme-text-sub font-semibold mb-1.5">Select Visit Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full theme-input p-3 outline-none font-mono-numbers rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block theme-text-sub font-semibold mb-1.5">Preferred Time Slot</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '05:00 PM - 07:00 PM'].map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setBookingTimeSlot(slot)}
                            className={`p-2.5 rounded-xl border text-center font-medium font-mono-numbers transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                              bookingTimeSlot === slot ? 'theme-badge-primary border-[var(--brand-accent)]' : 'bento-card-static theme-text-sub'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bento-card-static text-[11px] theme-text-muted flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--accent-gold)] shrink-0 mt-0.5" />
                      <span>Zero visit fees. You can reschedule or cancel visit anytime from your notifications dashboard.</span>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3.5 gradient-btn font-bold text-xs rounded-xl shadow-lg uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      Confirm Visit Request
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Property Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeAddModal}
              className="absolute top-4 right-4 p-2 rounded-full bento-card-static theme-text-muted hover:theme-text-main transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold theme-text-main font-display mb-1 flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--brand-accent)]" /> Add New Property Listing
              </h3>
              <p className="text-xs theme-text-sub">List your flat or PG for verified tech professionals & students.</p>
            </div>

            {addPropertyError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{addPropertyError}</span>
              </div>
            )}

            <form onSubmit={handleAddPropertySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block theme-text-sub font-semibold mb-1">Property Title</label>
                <input
                  type="text"
                  placeholder="e.g. Luxury 2BHK Room in Koramangala 5th Block"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full theme-input p-3 outline-none rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block theme-text-sub font-semibold mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. HSR Layout Sector 1, Bangalore"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full theme-input p-3 outline-none rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block theme-text-sub font-semibold mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter monthly rent"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full theme-input p-3 outline-none font-mono-numbers rounded-xl text-[var(--accent-emerald)] font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block theme-text-sub font-semibold mb-1">Property Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full theme-input p-3 outline-none rounded-xl appearance-none cursor-pointer"
                  >
                    <option value="Flat">Shared Flat</option>
                    <option value="PG">Co-Living PG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block theme-text-sub font-semibold mb-1">Sharing / Occupancy Type</label>
                <select
                  value={newSharingType}
                  onChange={(e) => setNewSharingType(e.target.value)}
                  className="w-full theme-input p-3 outline-none rounded-xl appearance-none cursor-pointer"
                >
                  <option value="Private Room in Shared Flat">Private Room in Shared Flat</option>
                  <option value="Twin Sharing Room">Twin Sharing Room</option>
                  <option value="Single Bedroom Apartment">Single Bedroom Apartment</option>
                  <option value="3BHK Master Bedroom">3BHK Master Bedroom</option>
                </select>
              </div>

              <div>
                <label className="block theme-text-sub font-semibold mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your property, house rules, nearby metro, etc."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full theme-input p-3 outline-none rounded-xl resize-none"
                />
              </div>

              {/* Amenities Selection Pills */}
              <div>
                <label className="block theme-text-sub font-semibold mb-1.5">Select Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {(availableAmenities || []).map(amenity => {
                    const isSelected = (selectedAmenities || []).includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                          isSelected ? 'theme-badge-primary border-[var(--brand-accent)]' : 'bento-card-static theme-text-muted hover:theme-text-sub'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block theme-text-sub font-semibold mb-1">Image URLs (comma separated)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..., https://..."
                  value={newImageUrls}
                  onChange={(e) => setNewImageUrls(e.target.value)}
                  className="w-full theme-input p-3 outline-none rounded-xl"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3.5 gradient-btn disabled:opacity-50 font-bold text-xs rounded-xl uppercase tracking-wider shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
