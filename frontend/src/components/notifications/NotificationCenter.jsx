import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink, X, Star } from 'lucide-react';
import { notificationApi } from '../../services/api';
import socketClient from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Play subtle web audio notification chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio context might require interaction
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      // Ignore if not logged in
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Real-time socket listener
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      playChime();
    };

    if (socketClient && typeof socketClient.on === 'function') {
      socketClient.on('notification', handleNewNotification);
      socketClient.on('order_delivered', (data) => {
        loadNotifications();
        playChime();
      });
      socketClient.on('order_status_updated', () => {
        loadNotifications();
        playChime();
      });
      socketClient.on('order:new', () => {
        loadNotifications();
        playChime();
      });
    }

    return () => {
      if (socketClient && typeof socketClient.off === 'function') {
        socketClient.off('notification', handleNewNotification);
        socketClient.off('order_delivered');
        socketClient.off('order_status_updated');
        socketClient.off('order:new');
      }
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(unreadList.map((n) => notificationApi.markAsRead(n._id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#6B7280] hover:text-[#17181A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] rounded-lg transition-colors cursor-pointer"
        aria-label="Bildirishnomalar"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white dark:ring-[#16181D]" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Bildirishnomalar
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-[10px] font-bold">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>O‘qilgan qilish</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 bg-[#F7F8FA] dark:bg-[#1A1D23] border-b border-[#E7E9ED] dark:border-[#272A30]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-[#252830] text-[#17181A] dark:text-[#F3F4F6] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#17181A]'
              }`}
            >
              Barchasi ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white dark:bg-[#252830] text-[#17181A] dark:text-[#F3F4F6] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#17181A]'
              }`}
            >
              O‘qilmagan ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Hozircha bildirishnomalar mavjud emas.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    !notif.isRead ? 'bg-[#EFF6FF]/40 dark:bg-[#1E3A8A]/10' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                      )}
                      <h5 className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6] leading-snug">
                        {notif.title}
                      </h5>
                    </div>
                    <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.type === 'review_prompt' && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#D97706] dark:text-[#F59E0B] text-[11px] font-bold border border-amber-200 dark:border-amber-800 shadow-2xs">
                          <Star className="w-3 h-3 fill-amber-500" /> Hoziroq baholang
                        </span>
                      </div>
                    )}

                    {notif.createdAt && (
                      <span className="text-[10px] text-[#9CA3AF] mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
