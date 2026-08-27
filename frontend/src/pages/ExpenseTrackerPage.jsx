import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Plus, DollarSign, CheckCircle2, PieChart, ArrowUpRight, 
  ArrowDownLeft, Trash2, Filter, Search, Users, TrendingUp, Sparkles, 
  Clock, AlertCircle, Receipt, ShieldCheck, Check, RefreshCw 
} from 'lucide-react';
import { apiService } from '../services/api';

export default function ExpenseTrackerPage({ currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [expensesData, usersData] = await Promise.all([
          apiService.getExpenses().catch(() => []),
          apiService.getUsers().catch(() => [])
        ]);
        if (isMounted) {
          setExpenses(Array.isArray(expensesData) ? expensesData : []);
          setUsersList(Array.isArray(usersData) ? usersData : []);
        }
      } catch (err) {
        console.error('Failed to fetch expense tracking data:', err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Dynamic available roommates based on API users and logged in user
  const availableRoommates = useMemo(() => {
    const names = (usersList || []).map(u => u?.name).filter(Boolean);
    if (currentUser?.name && !names.includes(currentUser.name)) {
      names.unshift(currentUser.name);
    }
    return names.length > 0 ? names : [currentUser?.name || 'You'];
  }, [currentUser?.name, usersList]);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [category, setCategory] = useState('Rent');
  const [paidBy, setPaidBy] = useState(currentUser?.name || '');
  const [selectedSplit, setSelectedSplit] = useState(availableRoommates);

  // Sync selected split default when available roommates changes
  useEffect(() => {
    setSelectedSplit(availableRoommates);
  }, [availableRoommates]);

  useEffect(() => {
    if (currentUser?.name && !paidBy) {
      setPaidBy(currentUser.name);
    }
  }, [currentUser?.name]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  const openAddExpenseModal = () => {
    setTitle('');
    setAmount('');
    setAmountError('');
    setCategory('Rent');
    setPaidBy(currentUser?.name || '');
    setSelectedSplit(availableRoommates);
    setShowAddModal(true);
  };

  const closeAddExpenseModal = () => {
    setShowAddModal(false);
    setTitle('');
    setAmount('');
    setAmountError('');
  };

  // Add Expense Handler with strict validation (Amount > 0)
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    
    if (!title.trim()) {
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Expense amount must be greater than 0');
      return;
    }
    setAmountError('');

    const validSplit = (Array.isArray(selectedSplit) && selectedSplit.length > 0)
      ? selectedSplit.filter(person => availableRoommates.includes(person))
      : availableRoommates;

    const payload = {
      title: title.trim(),
      amount: numAmount,
      category: category || 'Rent',
      paidBy: paidBy.trim() || currentUser?.name || 'Member',
      splitBetween: validSplit.length > 0 ? validSplit : availableRoommates,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    try {
      const newExp = await apiService.addExpense(payload);
      const createdExp = newExp && (newExp.id || newExp._id) ? newExp : { id: `exp_${Date.now()}`, ...payload };
      setExpenses(prev => [createdExp, ...(Array.isArray(prev) ? prev : [])]);
      closeAddExpenseModal();
    } catch (err) {
      console.error('Failed to add expense:', err);
      // Fallback local insertion if API fails
      const fallbackExp = { id: `exp_${Date.now()}`, ...payload };
      setExpenses(prev => [fallbackExp, ...(Array.isArray(prev) ? prev : [])]);
      closeAddExpenseModal();
    }
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => (Array.isArray(prev) ? prev.filter(e => (e?.id !== id && e?._id !== id)) : []));
  };

  const handleToggleStatus = (id) => {
    setExpenses(prev => (Array.isArray(prev) ? prev.map(e => {
      if (e?.id === id || e?._id === id) {
        const nextStatus = e.status === 'Settled' ? 'Pending' : 'Settled';
        return { ...e, status: nextStatus };
      }
      return e;
    }) : []));
  };

  const handleToggleSplitUser = (person) => {
    if (selectedSplit.includes(person)) {
      if (selectedSplit.length > 1) {
        setSelectedSplit(selectedSplit.filter(p => p !== person));
      }
    } else {
      setSelectedSplit([...selectedSplit, person]);
    }
  };

  const handleSelectAllSplit = () => {
    if (selectedSplit.length === availableRoommates.length) {
      setSelectedSplit([availableRoommates[0]]);
    } else {
      setSelectedSplit([...availableRoommates]);
    }
  };

  const handleSettleBalance = () => {
    setExpenses(prev => (Array.isArray(prev) ? prev.map(e => ({ ...e, status: 'Settled' })) : []));
    setSettlementSuccess(true);
    setTimeout(() => setSettlementSuccess(false), 3000);
  };

  // KPI Calculations (Safely handling empty expense lists & zero division)
  const totalSpent = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [expenses]);

  const rentSpent = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses
      .filter(e => e?.category === 'Rent')
      .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [expenses]);

  const utilSpent = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses
      .filter(e => e?.category === 'Utilities')
      .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [expenses]);

  const grocerySpent = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses
      .filter(e => e?.category === 'Groceries')
      .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [expenses]);

  const maintenanceSpent = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses
      .filter(e => e?.category === 'Maintenance' || e?.category === 'Subscriptions')
      .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }, [expenses]);

  const pendingExpensesCount = useMemo(() => {
    if (!Array.isArray(expenses)) return 0;
    return expenses.filter(e => e?.status !== 'Settled').length;
  }, [expenses]);

  // Debt & Balance Settlement summary computation (Safely calculated)
  const netDebtInfo = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return { totalDebt: 0, text: 'All roommate balances are fully settled up! No outstanding debts.' };
    }
    const unsettled = expenses.filter(e => e?.status !== 'Settled');
    if (unsettled.length === 0) {
      return { totalDebt: 0, text: 'All roommate balances are fully settled up! No outstanding debts.' };
    }

    const balances = {};
    let totalUnsettled = 0;

    unsettled.forEach(exp => {
      const amt = Number(exp?.amount) || 0;
      if (amt <= 0) return;
      totalUnsettled += amt;

      const payer = exp?.paidBy || availableRoommates[0];
      const splitList = Array.isArray(exp?.splitBetween) && exp.splitBetween.length > 0 
        ? exp.splitBetween 
        : availableRoommates;
      
      const share = amt / splitList.length;

      balances[payer] = (balances[payer] || 0) + amt;
      splitList.forEach(person => {
        balances[person] = (balances[person] || 0) - share;
      });
    });

    let debtor = '';
    let maxOwed = 0;
    let creditor = '';
    let maxCred = 0;

    Object.entries(balances).forEach(([person, bal]) => {
      if (bal < -maxOwed) {
        maxOwed = -bal;
        debtor = person;
      }
      if (bal > maxCred) {
        maxCred = bal;
        creditor = person;
      }
    });

    if (maxOwed > 0 && debtor && creditor && debtor !== creditor) {
      return {
        totalDebt: maxOwed,
        debtor,
        creditor,
        text: `${debtor} owes ${creditor}`
      };
    }

    return {
      totalDebt: totalUnsettled > 0 ? totalUnsettled / 2 : 0,
      text: 'Pending shared balance settlements recorded.'
    };
  }, [expenses, availableRoommates]);

  // Category Breakdown Data
  const categoriesList = [
    { name: 'Rent', amount: rentSpent, color: 'bg-teal-500' },
    { name: 'Utilities', amount: utilSpent, color: 'bg-amber-500' },
    { name: 'Groceries', amount: grocerySpent, color: 'bg-emerald-500' },
    { name: 'Maintenance', amount: maintenanceSpent, color: 'bg-indigo-500' },
  ];

  // Filtered Expenses List
  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter(exp => {
      if (!exp) return false;
      const titleStr = String(exp.title || '').toLowerCase();
      const paidByStr = String(exp.paidBy || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = titleStr.includes(q) || paidByStr.includes(q);
      const matchesCategory = selectedCategoryFilter === 'All' || exp.category === selectedCategoryFilter;
      const matchesStatus = selectedStatusFilter === 'All' || exp.status === selectedStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header Banner */}
      <div className="bento-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold theme-text-accent uppercase tracking-widest">Financial Command Center</span>
            <span className="theme-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono-numbers">
              <ShieldCheck className="w-3 h-3 text-[var(--accent-emerald)]" /> Live Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display tracking-tight">
            Shared Expenses & Ledger <CreditCard className="w-7 h-7 theme-text-accent" />
          </h1>
          <p className="theme-text-sub text-xs sm:text-sm mt-1 max-w-xl">
            Split household bills, monitor real-time monthly categories, manage roommate balances, and maintain transparent co-living settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={openAddExpenseModal}
            className="gradient-btn px-5 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Shared Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Total Household Spend</span>
            <div className="p-2 rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-accent)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold theme-text-main font-mono-numbers">
              ₹{totalSpent.toLocaleString()}
            </div>
            <div className="mt-2 text-[10px] theme-text-accent flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> {Array.isArray(expenses) ? expenses.length : 0} Total Transactions Logged
            </div>
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Rent Share</span>
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold theme-text-accent font-mono-numbers">
              ₹{rentSpent.toLocaleString()}
            </div>
            <span className="text-[10px] theme-text-muted block mt-2 font-medium">
              Monthly Lease Base • Shared Split
            </span>
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Utilities (WiFi, Power, Water)</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold theme-text-main font-mono-numbers">
              ₹{utilSpent.toLocaleString()}
            </div>
            <span className="text-[10px] theme-badge-amber px-2 py-0.5 rounded inline-block mt-2 font-bold font-mono-numbers">
              Auto Split
            </span>
          </div>
        </div>

        <div className="bento-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs theme-text-muted font-medium">Groceries & Supplies</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold theme-text-main font-mono-numbers">
              ₹{grocerySpent.toLocaleString()}
            </div>
            <span className="text-[10px] theme-text-muted block mt-2 font-medium">
              Shared Stock & Kitchen Supplies
            </span>
          </div>
        </div>
      </div>

      {/* Roommate Balance Settlement Banner */}
      <div className="bento-card p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-l-4 border-l-[var(--brand-accent)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="theme-badge-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Settlement Ledger
            </span>
            {pendingExpensesCount > 0 ? (
              <span className="theme-badge-amber text-[10px] font-bold px-2 py-0.5 rounded font-mono-numbers">
                {pendingExpensesCount} Unsettled Items
              </span>
            ) : (
              <span className="theme-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded">
                All Settled Up!
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold theme-text-main font-display">
            Roommate Net Balance Settlement
          </h3>
          <p className="text-xs theme-text-sub max-w-2xl leading-relaxed">
            {netDebtInfo.totalDebt > 0 ? (
              <>
                {netDebtInfo.text} <span className="font-bold theme-text-accent font-mono-numbers">₹{netDebtInfo.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> for shared household bills.
              </>
            ) : (
              netDebtInfo.text
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          {settlementSuccess && (
            <span className="text-xs theme-badge-emerald font-bold px-3 py-2 rounded-xl flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" /> Settlement Recorded!
            </span>
          )}
          <button
            onClick={handleSettleBalance}
            disabled={pendingExpensesCount === 0}
            className={`gradient-btn px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 w-full lg:w-auto transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              pendingExpensesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Settle All Balances Now</span>
          </button>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bento-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold theme-text-main font-display">Expense Category Breakdown</h3>
            <p className="text-xs theme-text-muted mt-0.5">Distribution of total monthly spend across household categories</p>
          </div>
          <span className="text-xs font-bold theme-text-accent font-mono-numbers">
            {totalSpent > 0 ? '100% Allocated' : '0% Allocated'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoriesList.map((cat, idx) => {
            const percentageNum = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
            const percentageStr = percentageNum > 0 ? percentageNum.toFixed(1) : '0.0';
            return (
              <div key={idx} className="bento-card-static p-4 rounded-xl space-y-2 transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold theme-text-main font-display">{cat.name}</span>
                  <div className="flex items-center gap-2 font-mono-numbers">
                    <span className="theme-text-sub font-semibold">₹{cat.amount.toLocaleString()}</span>
                    <span className="theme-text-accent font-bold text-[11px]">({percentageStr}%)</span>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bento-card-static overflow-hidden">
                  <div 
                    className={`h-full ${cat.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${percentageNum}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense History Table Log & Filters */}
      <div className="bento-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold theme-text-main font-display">Expense History Log</h3>
            <p className="text-xs theme-text-muted mt-0.5">Audited transaction records for shared household spending</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
              <input
                type="text"
                placeholder="Search expense..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full theme-input pl-8 pr-3 py-2 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="theme-input px-3 py-2 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
            >
              <option value="All">All Categories</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Groceries">Groceries</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Subscriptions">Subscriptions</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="theme-input px-3 py-2 text-xs outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bento-card-static rounded-2xl space-y-2">
              <Receipt className="w-10 h-10 theme-text-muted mx-auto mb-2 opacity-50" />
              <p className="theme-text-main font-bold text-sm">No expenses found</p>
              <p className="theme-text-muted text-xs">
                {expenses.length === 0 
                  ? 'No household expenses have been logged yet. Click "Log Shared Expense" to get started.' 
                  : 'Try adjusting your search query or filter selections.'}
              </p>
            </div>
          ) : (
            filteredExpenses.map(exp => {
              const expId = exp.id || exp._id;
              return (
                <div 
                  key={expId} 
                  className="bento-card-static p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-[var(--surface-border-accent)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 border border-[var(--brand-accent)]/20 flex items-center justify-center text-[var(--brand-accent)] shrink-0 font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold theme-text-main text-sm font-display">{exp.title || 'Untitled Expense'}</h4>
                      <div className="flex flex-wrap items-center gap-2 theme-text-muted mt-0.5">
                        <span>Paid by <span className="theme-text-accent font-semibold">{exp.paidBy || 'Member'}</span></span>
                        <span>•</span>
                        <span className="font-mono-numbers">{exp.date || 'Recent'}</span>
                      </div>
                      {Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] theme-text-muted">Split with:</span>
                          <div className="flex flex-wrap gap-1">
                            {exp.splitBetween.map((person, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 text-[10px] rounded-full bento-card-static theme-text-sub font-medium">
                                {person}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-[var(--surface-border)] pt-3 md:pt-0">
                    <span className="px-3 py-1 rounded-lg bento-card-static theme-text-sub font-semibold">
                      {exp.category || 'General'}
                    </span>
                    
                    <span className="font-extrabold theme-text-main text-base font-mono-numbers">
                      ₹{(Number(exp.amount) || 0).toLocaleString()}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(expId)}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                        exp.status === 'Settled' ? 'theme-badge-emerald' : 'theme-badge-amber'
                      }`}
                    >
                      {exp.status || 'Pending'}
                    </button>

                    <button 
                      onClick={() => handleDeleteExpense(expId)} 
                      className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--surface-border-accent)] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeAddExpenseModal} 
              className="absolute top-5 right-5 theme-text-muted hover:theme-text-main text-lg font-bold p-1 transition-all duration-200 hover:scale-110 active:scale-90"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold theme-text-accent uppercase tracking-widest">New Ledger Entry</span>
              <h3 className="text-xl font-bold theme-text-main font-display mt-0.5">Log Shared Household Expense</h3>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-5 text-xs">
              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Expense Title</label>
                <input
                  type="text"
                  placeholder="WiFi Bill / Groceries / Monthly Rent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block theme-text-sub mb-1.5 font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (Number(e.target.value) > 0) {
                        setAmountError('');
                      }
                    }}
                    required
                    min="0.01"
                    step="any"
                    className={`w-full theme-input p-3 text-xs outline-none font-mono-numbers focus:border-[var(--brand-accent)] transition-all duration-200 ${
                      amountError ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                  />
                  {amountError && (
                    <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {amountError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block theme-text-sub mb-1.5 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Subscriptions">Subscriptions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block theme-text-sub mb-1.5 font-semibold">Payer / Paid By</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full theme-input p-3 text-xs outline-none focus:border-[var(--brand-accent)] transition-all duration-200"
                />
              </div>

              {/* Split-Between Checkboxes */}
              <div className="bento-card-static p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="theme-text-main font-bold font-display">Split Expense Between</label>
                  <button
                    type="button"
                    onClick={handleSelectAllSplit}
                    className="theme-text-accent text-[11px] font-bold hover:underline transition-all duration-200 active:scale-95"
                  >
                    {selectedSplit.length === availableRoommates.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableRoommates.map((person, idx) => {
                    const isChecked = selectedSplit.includes(person);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border ${
                          isChecked 
                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-accent)] theme-text-main' 
                            : 'bento-card-static theme-text-sub hover:border-[var(--surface-border)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSplitUser(person)}
                          className="w-4 h-4 rounded text-[var(--brand-accent)] focus:ring-0 cursor-pointer"
                        />
                        <span className="font-semibold text-xs">{person}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddExpenseModal}
                  className="w-1/3 py-3 theme-btn-secondary font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-3 gradient-btn font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Save & Split Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
