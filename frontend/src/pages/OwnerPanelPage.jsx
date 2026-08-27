import React, { useEffect, useState } from 'react';
import { 
  Home, CalendarDays, Building2, Plus, ListChecks, UserCircle, Phone, MapPin, DollarSign, X, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/api';
import { sanitizeInput, sanitizeUrl } from '../utils/sanitizer';

export default function OwnerPanelPage({ currentUser }) {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOwnerContact, setNewOwnerContact] = useState('');
  const [newType, setNewType] = useState('PG');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrls, setNewImageUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [props, bks] = await Promise.all([
          userId ? apiService.getOwnerProperties(userId) : apiService.getProperties(),
          userId ? apiService.getBookingsForOwner(userId) : Promise.resolve([])
        ]);

        if (isMounted) {
          setProperties(Array.isArray(props) ? props : []);
          setBookings(Array.isArray(bks) ? bks : []);
        }
      } catch (err) {
        console.error("Error fetching landlord data:", err);
        if (isMounted) {
          setProperties([]);
          setBookings([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?._id]);

  const handlePublishProperty = async (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedTitle = sanitizeInput(newTitle);
    const trimmedLocation = sanitizeInput(newLocation);
    const trimmedContact = sanitizeInput(newOwnerContact || currentUser?.email || '');
    const trimmedDesc = sanitizeInput(newDesc, { allowMultiline: true });
    const numPrice = Number(newPrice);

    if (!trimmedTitle) {
      setValidationError('Listing title is required.');
      return;
    }

    if (!trimmedLocation) {
      setValidationError('Property location address is required.');
      return;
    }

    if (newPrice === '' || isNaN(numPrice) || numPrice <= 0) {
      setValidationError('Rent price must be a valid positive number.');
      return;
    }

    if (!trimmedContact) {
      setValidationError('Owner contact details (phone number or email) are required.');
      return;
    }

    const imageList = newImageUrls
      .split(',')
      .map(url => sanitizeUrl(url))
      .filter(Boolean);

    const payload = {
      title: trimmedTitle,
      location: trimmedLocation,
      price: numPrice,
      type: sanitizeInput(newType) || 'PG',
      sharingType: newType === 'PG' ? 'Twin Sharing' : 'Private Room in Shared Flat',
      description: trimmedDesc || 'Co-living accommodation listing.',
      amenities: ['WiFi', 'Power Backup', 'Security 24/7'],
      images: imageList.length ? imageList : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      ownerName: sanitizeInput(currentUser?.name) || 'Property Owner',
      ownerContact: trimmedContact,
      ownerId: currentUser?.id || currentUser?._id || ''
    };

    try {
      const created = await apiService.addProperty(payload);
      const createdProperty = created && (created.id || created._id) ? created : { id: `prop_${Date.now()}`, ...payload };
      setProperties(prev => [createdProperty, ...(Array.isArray(prev) ? prev : [])]);
      setShowAddProperty(false);
      setNewTitle('');
      setNewLocation('');
      setNewPrice('');
      setNewOwnerContact('');
      setNewType('PG');
      setNewDesc('');
      setNewImageUrls('');
      setValidationError('');
    } catch (err) {
      console.error("Error adding property:", err);
      const serverErrMsg = err.response?.data?.error || err.message;
      setValidationError(`Failed to publish property: ${serverErrMsg}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      
      {/* Header Banner */}
      <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest theme-text-accent">
            Landlord Portal
          </span>
          <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display">
            <span>Property Owner Dashboard</span>
            <Building2 className="w-6 h-6 text-[var(--accent-gold)]" />
          </h1>
          <p className="theme-text-sub text-xs max-w-xl">
            Manage your co-living PG and flat listings, process prospective tenant visit requests, and publish new rooms.
          </p>
        </div>

        <button
          onClick={() => {
            setValidationError('');
            setShowAddProperty(true);
          }}
          className="gradient-btn px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Listing</span>
        </button>
      </div>

      {/* Overview KPI & Visit Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Owner Profile & KPI Badges (5 Cols) */}
        <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between space-y-6 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl theme-badge-primary flex items-center justify-center shrink-0">
              <UserCircle className="w-8 h-8 text-[var(--brand-accent)]" />
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold theme-text-muted tracking-widest block">
                Verified Owner
              </span>
              <h2 className="text-xl font-bold theme-text-main font-display truncate">{currentUser?.name || 'Property Owner'}</h2>
              <p className="text-xs theme-text-sub truncate">{currentUser?.email || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bento-card-static p-4 space-y-1">
              <span className="block theme-text-muted text-[10px] uppercase font-bold tracking-wider">
                Listings Live
              </span>
              <span className="text-3xl font-extrabold theme-text-main font-mono-numbers">
                {Array.isArray(properties) ? properties.length : 0}
              </span>
            </div>

            <div className="bento-card-static p-4 space-y-1">
              <span className="block theme-text-muted text-[10px] uppercase font-bold tracking-wider">
                Visit Requests
              </span>
              <span className="text-3xl font-extrabold theme-text-accent font-mono-numbers">
                {Array.isArray(bookings) ? bookings.length : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Visit Requests Feed (7 Cols) */}
        <div className="lg:col-span-7 bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--accent-emerald)]" />
            <h2 className="text-lg font-bold theme-text-main font-display">Recent Tenant Visit Requests</h2>
          </div>

          <div className="space-y-3 text-xs">
            {isLoading ? (
              <div className="bento-card-static p-8 text-center theme-text-muted text-xs">
                Loading visit requests...
              </div>
            ) : Array.isArray(bookings) && bookings.length > 0 ? bookings.map((booking) => (
              <div key={booking.id || booking._id} className="bento-card-static p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold theme-text-main text-sm font-display truncate">
                    {booking.property?.title || 'Property Visit Request'}
                  </h3>
                  <span className="theme-badge-emerald px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers">
                    Date: {booking.date || 'Scheduled'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs theme-text-sub pt-1">
                  <span className="flex items-center gap-1.5 font-mono-numbers">
                    <Phone className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                    <span>Requester ID: {booking.userId || 'Tenant'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                    <span>{booking.property?.location || 'Location Details'}</span>
                  </span>
                </div>
              </div>
            )) : (
              <div className="bento-card-static p-8 text-center theme-text-muted text-xs space-y-1">
                <p className="theme-text-main font-bold">No Visit Requests Yet</p>
                <p className="theme-text-sub">Prospective tenants will appear here when they request site visitations.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Property Listings & Management Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Property Listings Grid (8 Cols) */}
        <div className="lg:col-span-8 bento-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold theme-text-main font-display">Your Active Property Listings</h2>
              <p className="theme-text-sub text-xs">Review room availability, pricing, and amenities.</p>
            </div>
            <span className="text-xs uppercase font-bold theme-badge-primary px-3 py-1 rounded-full font-mono-numbers">
              {Array.isArray(properties) ? properties.length : 0} Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(properties) && properties.map((property) => (
              <div key={property.id || property._id} className="bento-card-static rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-40">
                  <img
                    src={Array.isArray(property.images) && property.images[0] ? property.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                    alt={property.title || 'Property'}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/85 dark:bg-black/85 p-3">
                    <h3 className="text-white font-bold text-xs font-display truncate">{property.title || 'Property'}</h3>
                    <p className="text-[10px] text-slate-300 truncate">{property.location || 'Location'}</p>
                  </div>
                </div>

                <div className="p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--accent-emerald)] font-mono-numbers text-sm">
                      ₹{(Number(property.price) || 0).toLocaleString()} / mo
                    </span>
                    <span className="theme-badge-primary px-2 py-0.5 rounded text-[10px] font-bold">
                      {property.type || 'PG'}
                    </span>
                  </div>

                  <p className="line-clamp-2 theme-text-sub text-[11px] leading-relaxed">
                    {property.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.isArray(property.amenities) && property.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="rounded-md bento-card-static px-2 py-0.5 text-[10px] theme-text-muted">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {(!Array.isArray(properties) || properties.length === 0) && !isLoading && (
              <div className="sm:col-span-2 bento-card-static p-12 text-center theme-text-muted text-xs space-y-2">
                <Building2 className="w-10 h-10 theme-text-muted mx-auto mb-1 opacity-40" />
                <p className="theme-text-main font-bold text-sm">No Active Property Listings</p>
                <p className="theme-text-sub text-xs">You have not published any co-living PG or flat listings yet. Click "Add New Listing" to publish one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Management Quick Tools (4 Cols) */}
        <div className="lg:col-span-4 bento-card p-6 space-y-4 transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[var(--brand-accent)]" />
            <h2 className="text-lg font-bold theme-text-main font-display">Owner Management Tools</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bento-card-static p-4 space-y-1 transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-bold theme-text-main font-display">Instant Listing Updates</p>
              <p className="theme-text-sub text-[11px] leading-relaxed">
                Add multiple room image links and update monthly rent prices seamlessly.
              </p>
            </div>

            <div className="bento-card-static p-4 space-y-1 transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-bold theme-text-main font-display">Tenant Visit Queue</p>
              <p className="theme-text-sub text-[11px] leading-relaxed">
                View instant notifications when potential roommates schedule flat visitations.
              </p>
            </div>

            <div className="bento-card-static p-4 space-y-1 transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-bold theme-text-main font-display">Direct Support</p>
              <p className="theme-text-sub text-[11px] leading-relaxed">
                Contact RoomieSync admin support if you require assistance with property verification.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Publish New Listing Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold theme-text-main font-display">Publish New PG / Flat</h3>
              <button 
                onClick={() => {
                  setValidationError('');
                  setShowAddProperty(false);
                }} 
                className="p-1 rounded-lg theme-btn-secondary theme-text-muted hover:theme-text-main transition-all duration-200 hover:scale-110 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handlePublishProperty} className="space-y-4 text-xs">
              <div>
                <label className="block theme-text-sub mb-1 font-semibold">
                  Listing Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Luxury Twin PG near Koramangala"
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block theme-text-sub mb-1 font-semibold">
                  Location / Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. HSR Layout Sector 4, Bangalore"
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block theme-text-sub mb-1 font-semibold">
                    Rent (₹ / month) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Enter monthly rent"
                    className="w-full theme-input p-3 outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block theme-text-sub mb-1 font-semibold">Property Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  >
                    <option value="PG">Co-Living PG</option>
                    <option value="Flat">Shared Flat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block theme-text-sub mb-1 font-semibold">
                  Owner Contact Details <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOwnerContact}
                  onChange={(e) => setNewOwnerContact(e.target.value)}
                  placeholder="e.g. Phone or email address"
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block theme-text-sub mb-1 font-semibold">Description</label>
                <textarea
                  rows="3"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide details regarding furnished amenities, deposit, etc."
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              <div>
                <label className="block theme-text-sub mb-1 font-semibold">Image URLs (Comma Separated)</label>
                <input
                  type="text"
                  value={newImageUrls}
                  onChange={(e) => setNewImageUrls(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 gradient-btn font-bold uppercase tracking-wider shadow-lg mt-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Publish Property Listing
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
