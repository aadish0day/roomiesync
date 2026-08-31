import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, CheckCircle2, ShieldCheck, UserCheck, Plus, 
  Trash2, ArrowRight, Clock, Sparkles, Calendar, DollarSign, Eye, 
  Edit3, Check, Users, Home, AlertCircle, Shield, X
} from 'lucide-react';
import { apiService } from '../services/api';
import { downloadAgreementPDF } from '../services/pdfGenerator';
import { sanitizeInput, sanitizeForPDF } from '../utils/sanitizer';

export default function AgreementPage({ currentUser }) {
  const [agreements, setAgreements] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [downloadNotice, setDownloadNotice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAgreements = async () => {
      try {
        const userId = currentUser?.id || currentUser?._id;
        const data = await apiService.getAgreements(userId);
        if (isMounted) {
          setAgreements(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch agreements:', err);
        if (isMounted) {
          setAgreements([]);
        }
      }
    };
    fetchAgreements();
    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?._id]);

  // Form & Live Draft State with clean initial values
  const [r1Name, setR1Name] = useState(currentUser?.name || '');
  const [r2Name, setR2Name] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [totalRent, setTotalRent] = useState('');
  const [r1Share, setR1Share] = useState(50);
  const [r2Share, setR2Share] = useState(50);
  const [deposit, setDeposit] = useState('');
  const [rentDueDate, setRentDueDate] = useState('');

  // House Rules Presets
  const presetClauses = [
    { id: 'quiet', title: 'Quiet Hours Policy', desc: 'Enforced after 11:00 PM on weekdays' },
    { id: 'guest', title: 'Guest Policy', desc: 'Overnight guests permitted with 24h prior mutual notice' },
    { id: 'rent', title: 'Rent Due Date', desc: 'Rent & utility shares payable on or before 5th of each month' },
    { id: 'clean', title: 'Cleanliness Code', desc: 'Shared areas (kitchen, living room) cleaned immediately after use' },
    { id: 'smoke', title: 'Smoking & Party Policy', desc: 'Strictly no smoking in indoor shared premises' }
  ];

  const [activePresets, setActivePresets] = useState(['quiet', 'guest', 'rent', 'clean', 'smoke']);
  const [customRules, setCustomRules] = useState([
    'Shared utility bills (WiFi, Water, Electricity) split 50/50'
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Toggle Preset House Rule
  const handleTogglePreset = (presetId) => {
    setActivePresets(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(presetId)
        ? current.filter(p => p !== presetId)
        : [...current, presetId];
    });
  };

  const handleSelectAllPresets = () => {
    if (activePresets.length === presetClauses.length) {
      setActivePresets([]);
    } else {
      setActivePresets(presetClauses.map(p => p.id));
    }
  };

  // Add Custom Rule safely trimmed & sanitized
  const handleAddCustomRule = () => {
    const cleanRule = sanitizeInput(newRuleInput);
    if (cleanRule) {
      setCustomRules(prev => [...(Array.isArray(prev) ? prev : []), cleanRule]);
      setNewRuleInput('');
    }
  };

  // Remove Custom Rule
  const handleRemoveCustomRule = (index) => {
    setCustomRules(prev => (Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []));
  };

  // Compile All Active Clauses safely for PDF & Data
  const getAllActiveClauses = () => {
    const selectedPresets = presetClauses
      .filter(p => (activePresets || []).includes(p.id))
      .map(p => `${sanitizeInput(p.title)}: ${sanitizeInput(p.desc)}`);
    const cleanCustom = (customRules || []).map(r => sanitizeInput(r)).filter(Boolean);
    return [...selectedPresets, ...cleanCustom];
  };

  // Handle PDF Export cleanly with safe defaults & special character sanitization
  const handleDownload = (agreementObj) => {
    const activeClauses = getAllActiveClauses();
    const safeAgreement = {
      id: sanitizeInput(agreementObj?.id || agreementObj?._id || 'AGR-DOC'),
      createdAt: sanitizeInput(agreementObj?.createdAt || new Date().toISOString().split('T')[0]),
      roommate1Name: sanitizeForPDF(agreementObj?.roommate1Name || r1Name || 'Tenant 1'),
      roommate2Name: sanitizeForPDF(agreementObj?.roommate2Name || r2Name || 'Tenant 2'),
      propertyAddress: sanitizeForPDF(agreementObj?.propertyAddress || propertyAddress || 'Address Not Specified'),
      totalRent: Number(agreementObj?.totalRent) || Number(totalRent) || 0,
      roommate1Share: Number(agreementObj?.roommate1Share) || Number(r1Share) || 50,
      roommate2Share: Number(agreementObj?.roommate2Share) || Number(r2Share) || 50,
      securityDeposit: Number(agreementObj?.securityDeposit) || Number(deposit) || 0,
      rentDueDate: sanitizeForPDF(agreementObj?.rentDueDate || rentDueDate || 'Monthly Due Date'),
      houseRules: (Array.isArray(agreementObj?.houseRules) && agreementObj.houseRules.length > 0
        ? agreementObj.houseRules
        : (activeClauses.length > 0 ? activeClauses : ['Standard co-living cleanliness & quiet hours rules apply'])
      ).map(r => sanitizeForPDF(r)),
      status: sanitizeInput(agreementObj?.status || 'Verified & Signed')
    };

    downloadAgreementPDF(safeAgreement);
    setDownloadNotice(`Downloaded Agreement PDF for #${safeAgreement.id}`);
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  // Create & Save Agreement safely with sanitized strings
  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    const cleanR1 = sanitizeInput(r1Name) || 'Tenant 1';
    const cleanR2 = sanitizeInput(r2Name) || 'Tenant 2';
    const cleanAddress = sanitizeInput(propertyAddress) || 'Premises Address';
    const cleanDueDate = sanitizeInput(rentDueDate) || 'Monthly Due Date';
    const allRules = getAllActiveClauses();

    const payload = {
      roommate1Name: cleanR1,
      roommate2Name: cleanR2,
      propertyAddress: cleanAddress,
      totalRent: Number(totalRent) || 0,
      roommate1Share: Number(r1Share) || 50,
      roommate2Share: Number(r2Share) || 50,
      securityDeposit: Number(deposit) || 0,
      rentDueDate: cleanDueDate,
      houseRules: allRules,
      status: 'Verified & Signed',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      const created = await apiService.addAgreement(payload);
      const createdAgreement = created && (created.id || created._id) ? created : { id: `AGR-${Date.now()}`, ...payload };
      setAgreements(prev => [createdAgreement, ...(Array.isArray(prev) ? prev : [])]);
      handleDownload(createdAgreement);
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to create agreement:', err);
      const fallbackAgreement = { id: `AGR-${Date.now()}`, ...payload };
      setAgreements(prev => [fallbackAgreement, ...(Array.isArray(prev) ? prev : [])]);
      handleDownload(fallbackAgreement);
      setActiveTab('list');
    }
  };

  // Live Calculated Shares
  const totalRentNum = Number(totalRent) || 0;
  const r1ShareNum = Number(r1Share) || 0;
  const r2ShareNum = Number(r2Share) || 0;
  const r1RentAmount = (totalRentNum * r1ShareNum) / 100;
  const r2RentAmount = (totalRentNum * r2ShareNum) / 100;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="bento-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold theme-text-accent uppercase tracking-widest">Legal & Contracts</span>
            <span className="theme-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono-numbers">
              <ShieldCheck className="w-3 h-3 text-[var(--accent-emerald)]" /> E-Signature Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display tracking-tight">
            Digital Roommate Agreement Studio <FileText className="w-7 h-7 theme-text-accent" />
          </h1>
          <p className="theme-text-sub text-xs sm:text-sm mt-1 max-w-xl">
            Draft legal roommate contracts, toggle house rules clauses, generate PDF exports, and manage active co-living terms.
          </p>
        </div>

        <div className="flex items-center gap-2 bento-card-static p-1.5 rounded-2xl text-xs w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeTab === 'list' ? 'gradient-btn text-white shadow-sm' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            My Agreements ({Array.isArray(agreements) ? agreements.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              activeTab === 'create' ? 'gradient-btn text-white shadow-sm' : 'theme-text-sub hover:theme-text-main'
            }`}
          >
            + Agreement Generator
          </button>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadNotice && (
        <div className="bento-card p-4 theme-badge-emerald font-bold text-xs flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-2 font-mono-numbers">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" /> {downloadNotice}
          </span>
          <button onClick={() => setDownloadNotice(null)} className="p-1 transition-transform duration-200 hover:scale-110 active:scale-90" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {!Array.isArray(agreements) || agreements.length === 0 ? (
            <div className="text-center py-16 bento-card rounded-3xl space-y-4">
              <FileText className="w-12 h-12 theme-text-muted mx-auto opacity-40" />
              <div>
                <h3 className="text-lg font-bold theme-text-main font-display">No Agreements Found</h3>
                <p className="text-xs theme-text-sub mt-1">You haven't generated any roommate contracts yet. Click below to draft your first agreement.</p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="gradient-btn px-6 py-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                + Create Agreement Now
              </button>
            </div>
          ) : (
            agreements.map(agr => {
              const agrId = agr.id || agr._id;
              const rent = Number(agr?.totalRent) || 0;
              const s1 = Number(agr?.roommate1Share) || 50;
              const s2 = Number(agr?.roommate2Share) || 50;
              const share1Amt = (rent * s1) / 100;
              const share2Amt = (rent * s2) / 100;

              return (
                <div key={agrId} className="bento-card p-6 md:p-8 space-y-6 transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--surface-border)]">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-3 py-0.5 rounded-full theme-badge-emerald text-[11px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> {agr.status || 'Verified & Signed'}
                        </span>
                        <span className="text-xs theme-text-muted font-mono-numbers">Document ID: #{agrId}</span>
                      </div>
                      <h3 className="text-xl font-bold theme-text-main font-display">{agr.propertyAddress || 'Property Location'}</h3>
                      <p className="text-xs theme-text-sub mt-0.5 font-mono-numbers">Created on: {agr.createdAt || 'Recent'}</p>
                    </div>

                    <button
                      onClick={() => handleDownload(agr)}
                      className="gradient-btn px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Agreement PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bento-card-static p-4 rounded-xl space-y-1">
                      <span className="theme-text-muted font-semibold block mb-2">Contracting Roommates</span>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 theme-text-accent" />
                        <div>
                          <p className="font-bold theme-text-main">{agr.roommate1Name || 'Tenant 1'} <span className="text-[10px] theme-text-muted">(Tenant 1)</span></p>
                          <p className="font-bold theme-text-accent">{agr.roommate2Name || 'Tenant 2'} <span className="text-[10px] theme-text-muted">(Tenant 2)</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bento-card-static p-4 rounded-xl space-y-1">
                      <span className="theme-text-muted font-semibold block mb-2">Rent & Deposit Breakdown</span>
                      <p className="font-bold theme-text-accent text-sm font-mono-numbers">
                        Total Rent: ₹{rent.toLocaleString()}/mo
                      </p>
                      <p className="theme-text-sub text-[11px] font-mono-numbers">
                        Shares: {s1}% (₹{share1Amt.toLocaleString()}) / {s2}% (₹{share2Amt.toLocaleString()})
                      </p>
                      <p className="theme-text-muted text-[10px] font-mono-numbers">
                        Security Deposit: ₹{(Number(agr.securityDeposit) || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="bento-card-static p-4 rounded-xl space-y-1">
                      <span className="theme-text-muted font-semibold block mb-2">Clause Status</span>
                      <p className="font-bold theme-text-main text-sm">
                        {Array.isArray(agr.houseRules) ? agr.houseRules.length : 5} Active House Rules Clauses
                      </p>
                      <span className="theme-badge-emerald px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Both Parties Signed</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Generator & Live Studio View */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bento-card p-6 md:p-8 space-y-6">
            <div>
              <span className="text-[10px] font-bold theme-text-accent uppercase tracking-widest">Contract Builder</span>
              <h2 className="text-xl font-bold theme-text-main font-display mt-0.5">Draft Custom Roommate Agreement</h2>
            </div>

            <form onSubmit={handleCreateAgreement} className="space-y-6 text-xs">
              
              {/* Roommate Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Primary Roommate (Tenant 1)</label>
                  <input
                    type="text"
                    placeholder="Enter Tenant 1 Full Name"
                    value={r1Name}
                    onChange={(e) => setR1Name(e.target.value)}
                    required
                    className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Co-Tenant Roommate (Tenant 2)</label>
                  <input
                    type="text"
                    placeholder="Enter Tenant 2 Full Name"
                    value={r2Name}
                    onChange={(e) => setR2Name(e.target.value)}
                    required
                    className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Property Address */}
              <div>
                <label className="block theme-text-sub font-semibold mb-1.5">Premises / Property Address</label>
                <input
                  type="text"
                  placeholder="Enter Flat / PG Full Address"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  required
                  className="w-full theme-input p-3 outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Total Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 30000"
                    value={totalRent}
                    onChange={(e) => setTotalRent(e.target.value)}
                    required
                    min="1"
                    className="w-full theme-input p-3 outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Tenant 1 Share %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={r1Share}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                      setR1Share(val);
                      setR2Share(100 - val);
                    }}
                    required
                    className="w-full theme-input p-3 outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Tenant 2 Share %</label>
                  <input
                    type="number"
                    value={r2Share}
                    readOnly
                    className="w-full theme-input p-3 opacity-60 outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    required
                    min="0"
                    className="w-full theme-input p-3 outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block theme-text-sub font-semibold mb-1.5">Rent Payment Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 5th of each month"
                    value={rentDueDate}
                    onChange={(e) => setRentDueDate(e.target.value)}
                    className="w-full theme-input p-3 outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
                  />
                </div>
              </div>

              {/* House Rules Clause Toggles */}
              <div className="pt-4 border-t border-[var(--surface-border)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold theme-text-main font-display">House Rules & Clause Toggles</h4>
                    <p className="text-xs theme-text-muted">Select preset clauses to incorporate into agreement document</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPresets}
                      className="text-xs font-bold theme-text-accent hover:underline"
                    >
                      {activePresets.length === presetClauses.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="theme-badge-primary text-[10px] font-bold px-2 py-0.5 rounded font-mono-numbers">
                      {(activePresets?.length || 0) + (customRules?.length || 0)} Active Clauses
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {presetClauses.map((preset) => {
                    const isActive = (activePresets || []).includes(preset.id);
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleTogglePreset(preset.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-accent)] theme-text-main'
                            : 'bento-card-static theme-text-sub opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs font-display">{preset.title}</p>
                          <p className="text-[11px] theme-text-muted">{preset.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold shrink-0 transition-all duration-200 ${
                          isActive 
                            ? 'bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]' 
                            : 'border-[var(--surface-border)]'
                        }`}>
                          {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Clauses */}
                <div className="pt-3 space-y-3">
                  <span className="font-bold theme-text-main block">Custom Rules & Additional Clauses</span>
                  <div className="space-y-2">
                    {Array.isArray(customRules) && customRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => handleCustomRuleChange(idx, e.target.value)}
                          placeholder="e.g. Quiet hours after 11 PM on weekdays"
                          className="flex-1 theme-input p-2.5 text-xs outline-none focus:border-[var(--brand-accent)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRule(idx)}
                          className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                          title="Delete clause"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom rule clause (e.g., No indoor smoking, split wifi bill)..."
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomRule();
                        }
                      }}
                      className="flex-1 theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustomRule} 
                      className="px-4 py-3 theme-btn-secondary text-xs font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Clause</span>
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 gradient-btn font-bold uppercase tracking-wider text-xs shadow-xl flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Generate & Download Agreement PDF</span>
              </button>
            </form>
          </div>

          {/* Document Live Preview Side Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6 bento-card p-6 md:p-8 border border-[var(--surface-border-accent)] space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--surface-border)]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 theme-text-accent" />
                  <span className="font-bold theme-text-main font-display text-sm">Live Document Preview</span>
                </div>
                <span className="theme-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded font-mono-numbers">
                  PREVIEW DRAFT
                </span>
              </div>

              {/* Certificate/Document Container */}
              <div className="bento-card-static p-6 rounded-2xl space-y-5 text-xs">
                
                {/* Contract Title */}
                <div className="text-center border-b border-[var(--surface-border)] pb-4 space-y-1">
                  <h3 className="text-base font-extrabold theme-text-main font-display tracking-tight uppercase">
                    Digital Roommate Agreement
                  </h3>
                  <p className="theme-text-muted text-[10px] font-mono-numbers">
                    Document Ref: AGR-LIVE-SPEC
                  </p>
                </div>

                {/* Section 1: Parties */}
                <div className="space-y-1.5">
                  <span className="font-bold theme-text-accent uppercase tracking-wider text-[10px]">
                    1. Contracting Parties & Property
                  </span>
                  <div className="bento-card p-3 rounded-xl space-y-1">
                    <p className="theme-text-main font-semibold">Tenant 1: <span className="theme-text-accent">{r1Name || 'Tenant 1'}</span></p>
                    <p className="theme-text-main font-semibold">Tenant 2: <span className="theme-text-accent">{r2Name || 'Tenant 2'}</span></p>
                    <p className="theme-text-muted text-[11px] mt-1 italic">{propertyAddress || 'Address Not Specified'}</p>
                  </div>
                </div>

                {/* Section 2: Financial Schedule */}
                <div className="space-y-1.5">
                  <span className="font-bold theme-text-accent uppercase tracking-wider text-[10px]">
                    2. Financial Split Schedule
                  </span>
                  <div className="bento-card p-3 rounded-xl space-y-1 font-mono-numbers">
                    <p className="theme-text-main font-bold">
                      Total Monthly Rent: ₹{totalRentNum.toLocaleString()}
                    </p>
                    <div className="flex justify-between text-[11px] theme-text-sub">
                      <span>• {r1Name || 'Tenant 1'}: {r1ShareNum}% (₹{r1RentAmount.toLocaleString()})</span>
                      <span>• {r2Name || 'Tenant 2'}: {r2ShareNum}% (₹{r2RentAmount.toLocaleString()})</span>
                    </div>
                    <p className="theme-text-muted text-[11px]">
                      Security Deposit: ₹{(Number(deposit) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Section 3: House Rules List */}
                <div className="space-y-1.5">
                  <span className="font-bold theme-text-accent uppercase tracking-wider text-[10px]">
                    3. Included House Clauses ({getAllActiveClauses().length})
                  </span>
                  <div className="bento-card p-3 rounded-xl space-y-1.5 max-h-40 overflow-y-auto">
                    {getAllActiveClauses().length === 0 ? (
                      <p className="text-[11px] theme-text-muted italic">No house rules clauses currently selected.</p>
                    ) : (
                      getAllActiveClauses().map((clause, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-1.5 text-[11px] theme-text-sub">
                          <Check className="w-3.5 h-3.5 theme-text-accent shrink-0 mt-0.5" />
                          <span>{clause}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Digital Signatures */}
                <div className="pt-2 border-t border-[var(--surface-border)] grid grid-cols-2 gap-3 text-center">
                  <div className="bento-card p-2 rounded-xl border-dashed">
                    <span className="text-[10px] theme-text-muted block">Signed by Tenant 1</span>
                    <span className="font-bold theme-text-accent text-[11px] block">{r1Name || 'Tenant 1'}</span>
                    <span className="text-[9px] theme-badge-emerald px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="bento-card p-2 rounded-xl border-dashed">
                    <span className="text-[10px] theme-text-muted block">Signed by Tenant 2</span>
                    <span className="font-bold theme-text-accent text-[11px] block">{r2Name || 'Tenant 2'}</span>
                    <span className="text-[9px] theme-badge-emerald px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Verified</span>
                    </span>
                  </div>
                </div>

              </div>

              <button
                onClick={() => handleDownload({
                  id: 'LIVE_DRAFT',
                  roommate1Name: r1Name,
                  roommate2Name: r2Name,
                  propertyAddress,
                  totalRent: Number(totalRent),
                  roommate1Share: Number(r1Share),
                  roommate2Share: Number(r2Share),
                  securityDeposit: Number(deposit),
                  rentDueDate,
                  houseRules: getAllActiveClauses()
                })}
                className="w-full py-3 theme-btn-secondary font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF Preview</span>
              </button>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
