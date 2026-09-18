import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, Trash2, Check, Star, X } from 'lucide-react';
import { notificationApi } from '../../services/api';
import socketClient from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

/**
 * iPhone-Style Swipeable Notification Item
 */
const SwipeableNotificationItem = ({
  notif,
  onItemClick,
  onMarkAsRead,
  onDelete,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Check if horizontal intent
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
      setIsSwiping(true);
      // Only allow swiping left (negative offsetX)
      if (deltaX < 0) {
        setOffsetX(Math.max(-140, deltaX));
      } else {
        setOffsetX(Math.min(0, deltaX / 4));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    // If swiped far left (> 110px), snap open action buttons
    if (offsetX < -65) {
      setOffsetX(-110);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden group select-none">
      {/* Background Action Buttons (Revealed ONLY on Swipe Left) */}
      <div
        style={{
          opacity: offsetX < 0 ? 1 : 0,
          pointerEvents: offsetX < -30 ? 'auto' : 'none',
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-end z-0 w-28 transition-opacity duration-150"
      >
        {/* Mark as read button */}
        {!notif.isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notif._id);
              setOffsetX(0);
            }}
            className="w-14 h-full bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center transition-colors cursor-pointer"
            title="O‘qildi deb belgilash"
          >
            <Check className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">O‘qildi</span>
          </button>
        )}

        {/* Delete notification button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif._id);
          }}
          className={`${
            notif.isRead ? 'w-28' : 'w-14'
          } h-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-colors cursor-pointer`}
          title="O‘chirish"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">O‘chirish</span>
        </button>
      </div>

      {/* Front Notification Card (Solid opaque background) */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (offsetX !== 0) {
            setOffsetX(0);
          } else {
            onItemClick(notif);
          }
        }}
        className={`relative z-10 p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
          !notif.isRead
            ? 'bg-[#EEF4FF] dark:bg-[#1A2233] hover:bg-[#E2ECFF] dark:hover:bg-[#202B40]'
            : 'bg-white dark:bg-[#16181D] hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026]'
        }`}
      >
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 mb-1">
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 animate-pulse" />
            )}
            <h5 className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6] leading-snug">
              {notif.title}
            </h5>
          </div>
          <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed line-clamp-2">
            {notif.message}
          </p>

          {notif.type === 'review_prompt' && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#D97706] dark:text-[#F59E0B] text-[10px] font-bold border border-amber-200 dark:border-amber-800">
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

        {/* Desktop Direct Delete / Mark Action Icons on hover */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notif.isRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notif._id);
              }}
              className="p-1 text-stone-400 hover:text-emerald-600 rounded-md transition-colors"
              title="O‘qildi"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif._id);
            }}
            className="p-1 text-stone-400 hover:text-red-600 rounded-md transition-colors"
            title="O‘chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio context might require user gesture
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
      socketClient.on('order_delivered', () => {
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

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
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
        className="relative p-2 text-[#6B7280] hover:text-[#17181A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] rounded-xl transition-colors cursor-pointer active:scale-95"
        aria-label="Bildirishnomalar"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white dark:ring-[#16181D]" />
        )}
      </button>

      {/* Dropdown Menu - Mobile Safe Width & Placement */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] max-h-[75vh] flex flex-col bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>O‘qilgan qilish</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 text-stone-400 hover:text-stone-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills & Swipe hint */}
          <div className="px-3.5 pt-2 pb-1.5 flex items-center justify-between bg-[#F7F8FA] dark:bg-[#1A1D23] border-b border-[#E7E9ED] dark:border-[#272A30]">
            <div className="flex items-center gap-1.5">
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
            <span className="text-[10px] text-[#9CA3AF] hidden sm:inline">
              Surish: chapga suring
            </span>
          </div>

          {/* List with iPhone-Style Swipe Action */}
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
                <SwipeableNotificationItem
                  key={notif._id}
                  notif={notif}
                  onItemClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
