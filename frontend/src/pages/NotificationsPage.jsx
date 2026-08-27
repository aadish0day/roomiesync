import React, { useState, useEffect } from 'react';
import { 
  Bell, Sparkles, Home, Utensils, FileText, CreditCard, CheckCircle2, Clock, Check, Filter
} from 'lucide-react';
import { apiService } from '../services/api';

export default function NotificationsPage({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getNotifications(userId);
        if (isMounted) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchNotifications();

    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?._id]);

  const categories = [
    { id: 'All', label: 'All Activity' },
    { id: 'match', label: 'Match' },
    { id: 'booking', label: 'Booking' },
    { id: 'meal', label: 'Meal' },
    { id: 'expense', label: 'Expense' },
    { id: 'agreement', label: 'Agreement' },
  ];

  const safeNotifications = Array.isArray(notifications) ? notifications.filter(Boolean) : [];
  const filteredNotifs = safeNotifications.filter(n => filterType === 'All' || n?.type === filterType);
  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(safeNotifications.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications(safeNotifications.map(n => (n?.id === id || n?._id === id) ? { ...n, isRead: !n.isRead } : n));
  };

  const getCategoryBadgeStyle = (type) => {
    switch (type) {
      case 'match': return 'theme-badge-amber';
      case 'booking': return 'theme-badge-primary';
      case 'meal': return 'theme-badge-emerald';
      case 'expense': return 'theme-badge-amber';
      case 'agreement': return 'theme-badge-primary';
      default: return 'theme-badge-primary';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match': return <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />;
      case 'booking': return <Home className="w-5 h-5 text-[var(--brand-accent)]" />;
      case 'meal': return <Utensils className="w-5 h-5 text-[var(--accent-emerald)]" />;
      case 'agreement': return <FileText className="w-5 h-5 text-[var(--brand-accent)]" />;
      case 'expense': return <CreditCard className="w-5 h-5 text-[var(--accent-gold)]" />;
      default: return <Bell className="w-5 h-5 text-[var(--brand-accent)]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      
      {/* Page Header */}
      <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-200 border border-[var(--surface-border-accent)] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest theme-text-accent">
              Real-time Alerts
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full theme-badge-emerald text-[10px] font-bold font-mono-numbers">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-3 font-display">
            <span>Notification Center</span>
            <Bell className="w-6 h-6 text-[var(--brand-accent)]" />
          </h1>
          <p className="theme-text-sub text-xs max-w-xl">
            Stay updated with roommate requests, PG visit bookings, meal plans, and expense settlements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="theme-btn-secondary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:border-[var(--accent-emerald)] hover:text-[var(--accent-emerald)]"
          >
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1 text-xs theme-text-muted mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {categories.map((cat) => {
          const isSelected = filterType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 whitespace-nowrap ${
                isSelected 
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                  : 'theme-btn-secondary theme-text-sub hover:theme-text-main'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bento-card-static p-12 text-center text-xs theme-text-muted">
            Loading notifications...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="bento-card-static p-12 text-center space-y-3 animate-in fade-in-50 duration-200">
            <Bell className="w-8 h-8 theme-text-muted mx-auto" />
            <h3 className="text-sm font-bold theme-text-main font-display">No Notifications Found</h3>
            <p className="text-xs theme-text-muted">There are no updates under the "{filterType}" category right now.</p>
          </div>
        ) : (
          filteredNotifs.map((notif, idx) => {
            const dateObj = notif?.createdAt ? new Date(notif.createdAt) : null;
            const isValidDate = dateObj && !isNaN(dateObj.getTime());
            const timeStr = isValidDate ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const dateStr = isValidDate ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent';
            const notifId = notif?.id || notif?._id || `notif_${idx}`;

            return (
              <div
                key={notifId}
                className={`p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  notif?.isRead
                    ? 'bento-card-static opacity-75 hover:opacity-100'
                    : 'bento-card border-[var(--surface-border-accent)] shadow-md relative'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className="p-3 rounded-xl bento-card-static shrink-0 mt-0.5 transition-transform duration-200 hover:scale-105">
                    {getNotificationIcon(notif?.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-sm font-bold theme-text-main font-display">
                        {notif?.title || 'Notification'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeStyle(notif?.type)}`}>
                        {notif?.type || 'General'}
                      </span>
                      {!notif?.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-accent)] ring-2 ring-[var(--surface-card)] animate-pulse" title="Unread"></span>
                      )}
                    </div>
                    <p className="text-xs theme-text-sub leading-relaxed">
                      {notif?.message || ''}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] theme-text-muted font-mono-numbers">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}{timeStr ? ` at ${timeStr}` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <button
                  onClick={() => handleToggleRead(notifId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    notif?.isRead 
                      ? 'theme-btn-secondary text-[11px] theme-text-muted hover:theme-text-main' 
                      : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white shadow-sm'
                  }`}
                  title={notif?.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {notif?.isRead ? 'Read' : 'Mark Read'}
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
