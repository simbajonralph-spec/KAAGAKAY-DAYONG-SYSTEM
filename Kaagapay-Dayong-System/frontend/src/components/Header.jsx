import React, { useState, useRef, useEffect } from 'react';
import { initialsOf, timeAgo } from '../constants';

export default function Header({
  user,
  onLogout,
  onOpenAbout,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(
    (n) => !n.read_by || !n.read_by.includes(user.id)
  ).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleDisplay =
    user.role === 'admin'
      ? user.municipality === 'All'
        ? 'Super administrator'
        : `Administrator · ${user.municipality}`
      : `Member · ${user.municipality}`;

  return (
    <header className="bg-ink-900 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenAbout}
          className="flex items-center gap-3 text-left rounded-lg -ml-1 px-1 py-1"
          aria-label="About Kaagapay Dayong"
        >
          <span
            className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center text-lg text-white"
            aria-hidden="true"
          >
            <i className="fa-solid fa-hands-holding-child"></i>
          </span>
          <span className="hidden sm:block">
            <span className="block text-base font-bold leading-tight">Kaagapay Dayong</span>
            <span className="block text-xs text-brand-200">Mutual aid &amp; funeral assistance</span>
          </span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onOpenAbout}
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-slate-200 hover:bg-white/10"
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true"></i> About
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="notif-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-haspopup="true"
              aria-expanded={notifOpen}
              className="relative h-9 w-9 rounded-lg flex items-center justify-center text-slate-200 hover:bg-white/10"
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <i className="fa-solid fa-bell text-base" aria-hidden="true"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold leading-[1.1rem] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onMarkAllNotificationsRead()}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map((n) => {
                      const isUnread = !n.read_by || !n.read_by.includes(user.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (isUnread) onMarkNotificationRead(n.id);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex gap-3 ${
                            isUnread ? 'bg-brand-50/60' : ''
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                              isUnread ? 'bg-brand-600' : 'bg-transparent'
                            }`}
                            aria-hidden="true"
                          ></span>
                          <span className="min-w-0">
                            <span
                              className={`block text-sm ${
                                isUnread ? 'font-semibold' : 'font-medium'
                              } text-slate-900`}
                            >
                              {n.title}
                            </span>
                            <span className="block text-sm text-slate-600 mt-0.5">
                              {n.message}
                            </span>
                            <span className="block text-xs text-slate-400 mt-1">
                              {timeAgo(n.created_at || n.ts)}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-bell-slash text-2xl text-slate-300 mb-2 block"></i>
                      <span>You’re all caught up.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center gap-3 pl-3 ml-1 border-l border-white/15">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-brand-200">{roleDisplay}</p>
            </div>
            <div
              className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold text-white shrink-0"
              aria-hidden="true"
            >
              <span>{initialsOf(user.name)}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn-icon text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
