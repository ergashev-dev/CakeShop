import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  RotateCcw,
  Star,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  CreditCard,
  UserCheck,
  Check,
} from 'lucide-react';
import { orderApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import socketClient from '../../services/socket';
import { formatPrice } from '../../utils/formatters';
import { DEFAULT_CAKE_IMAGE, handleImageError } from '../../utils/imageFallback';

const PROGRESS_STAGE_KEYS = [
  { key: 'confirmed', icon: CheckCircle2 },
  { key: 'preparing', icon: ChefHat },
  { key: 'ready', icon: Check },
  { key: 'assigned', icon: UserCheck },
  { key: 'on_the_way', icon: Truck },
  { key: 'delivered', icon: Sparkles },
];

const getStageIndex = (status) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
      return 3;
    case 'assigned':
      return 4;
    case 'delivering':
    case 'on_the_way':
      return 5;
    case 'delivered':
      return 6;
    default:
      return 0;
  }
};

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: t('orders.stage_confirmed', 'Kutilmoqda'), color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' };
      case 'confirmed':
        return { label: t('orders.stage_confirmed', 'Qabul qilindi'), color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' };
      case 'preparing':
        return { label: t('orders.stage_preparing', 'Tayyorlanmoqda'), color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' };
      case 'ready':
        return { label: t('orders.stage_ready', 'Tayyor'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' };
      case 'assigned':
        return { label: t('orders.stage_assigned', 'Kuryerga berildi'), color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' };
      case 'delivering':
      case 'on_the_way':
        return { label: t('orders.stage_on_the_way', 'Yetkazilmoqda'), color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' };
      case 'delivered':
        return { label: t('orders.stage_delivered', 'Yetkazildi'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' };
      case 'cancelled':
        return { label: t('orders.stage_cancelled', 'Bekor qilindi'), color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await orderApi.getMyOrders();
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time Socket.IO updates for live status changes
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      const updatedOrder = data.order || data;
      const orderId = updatedOrder.orderId || data.orderId;

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.orderId === orderId || ord._id === orderId) {
            return {
              ...ord,
              ...updatedOrder,
              status: data.status || updatedOrder.status || ord.status,
            };
          }
          return ord;
        })
      );

      toast.info(
        `📦 #${orderId} buyurtmangiz holati yangilandi!`,
        `Yangi holat: ${STATUS_BADGES[data.status]?.label || data.status}`
      );
    };

    if (socketClient && typeof socketClient.on === 'function') {
      socketClient.on('order_status_updated', handleStatusUpdate);
    }

    return () => {
      if (socketClient && typeof socketClient.off === 'function') {
        socketClient.off('order_status_updated', handleStatusUpdate);
      }
    };
  }, [toast]);

  // Filter orders
  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way'].includes(o.status)
  );

  const pastOrders = orders.filter((o) =>
    ['delivered', 'cancelled'].includes(o.status)
  );

  const currentList = activeTab === 'active' ? activeOrders : pastOrders;

  // Reorder action: re-add all items to cart
  const handleReorder = (order) => {
    if (!order.items || !order.items.length) {
      toast.error('Buyurtmada mahsulotlar topilmadi.');
      return;
    }

    order.items.forEach((item) => {
      addToCart(
        {
          _id: item.id || item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          weight: item.weight,
        },
        item.quantity || 1
      );
    });

    toast.success('Mahsulotlar savatga qo‘shildi!', 'Marhamat, buyurtmani rasmiylashtiring.');
    setIsCartOpen(true);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-[#F3F4F6] mb-2">
          Buyurtmalaringizni ko‘rish uchun tizimga kiring
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-6 max-w-md mx-auto">
          Saytdagi profilingiz orqali barcha faol buyurtmalarni jonli 6 bosqichda kuzatishingiz va avvalgi xaridlar tarixini bilishingiz mumkin.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-subtle transition-all"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto bg-[#FBFBFC] dark:bg-[#0F1012] text-[#111827] dark:text-[#F3F4F6]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border border-[#BFDBFE]/60 dark:border-[#1E3A8A] text-[#2563EB] dark:text-[#93C5FD] text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              {t('orders.subtitle', 'Real-time holat kuzatuvi va buyurtmalar tarixi')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('orders.title', 'Mening Buyurtmalarim')}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              {t('orders.subtitle', 'Barcha faol yetkazib berishlar va qandolat buyurtmalaringiz tarixi')}
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex p-1 bg-[#F3F4F6] dark:bg-[#1E2024] rounded-xl border border-[#E5E7EB] dark:border-[#26282E] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-[#252830] text-[#111827] dark:text-white shadow-subtle'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              <span>{t('orders.active_tab', 'Faol buyurtmalar')}</span>
              {activeOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-[#252830] text-[#111827] dark:text-white shadow-subtle'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              <span>{t('orders.history_tab', 'Buyurtmalar tarixi')}</span>
              {pastOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#E5E7EB] dark:bg-[#374151] text-[#4B5563] dark:text-[#E5E7EB] text-[10px] font-bold">
                  {pastOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{t('common.loading', 'Yuklanmoqda...')}</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-2xl border border-[#E5E7EB] dark:border-[#26282E] p-12 text-center max-w-md mx-auto shadow-subtle">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#111827] dark:text-[#F3F4F6] mb-1">
            {activeTab === 'active'
              ? t('orders.empty_active', 'Hozirda faol buyurtmalaringiz yo‘q')
              : t('orders.empty_history', 'Hozircha buyurtmalar tarixi mavjud emas')}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-6 max-w-xs mx-auto">
            {activeTab === 'active'
              ? t('cart.empty_desc', 'Yangi shirinliklar yoki maxsus bayram tortlariga hoziroq buyurtma bering!')
              : t('orders.empty_history', 'Siz hali yetkazib berilgan buyurtmalarga ega emassiz.')}
          </p>
          <Link
            to="/cakes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-subtle transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('cart.browse_cakes', 'Katalogga o‘tish')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {currentList.map((order) => {
            const stageIdx = getStageIndex(order.status);
            const statusInfo = getStatusBadge(order.status);
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order._id || order.orderId}
                className="bg-white dark:bg-[#16181D] rounded-2xl border border-[#E5E7EB] dark:border-[#26282E] p-5 sm:p-6 shadow-subtle transition-all duration-200"
              >
                {/* Top Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#24272D]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-[#111827] dark:text-[#F3F4F6]">
                      #{order.orderId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F3F4F6]">
                      <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                      {formatPrice(order.total || 0)}
                    </span>
                  </div>
                </div>

                {/* 6-Stage Visual Stepper Pipeline for Active Orders */}
                {!isCancelled && (
                  <div className="py-6 px-1 sm:px-4">
                    <div className="relative">
                      {/* Background Bar */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E5E7EB] dark:bg-[#26282E] -translate-y-1/2 rounded-full" />

                      {/* Active Fill Bar */}
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-[#2563EB] -translate-y-1/2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, ((stageIdx) / 6) * 100))}%`,
                        }}
                      />

                      {/* 6 Steps */}
                      <div className="relative flex items-center justify-between">
                        {PROGRESS_STAGE_KEYS.map((st, idx) => {
                          const Icon = st.icon;
                          const isDone = stageIdx > idx + 1;
                          const isCurrent = stageIdx === idx + 1;

                          return (
                            <div key={st.key} className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-subtle'
                                    : isCurrent
                                    ? 'bg-[#2563EB] text-white ring-4 ring-[#EFF6FF] dark:ring-[#1E3A8A]/50 shadow-subtle'
                                    : 'bg-white dark:bg-[#1E2024] text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#26282E]'
                                }`}
                              >
                                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs font-semibold mt-1.5 text-center max-w-[65px] sm:max-w-none ${
                                  isDone || isCurrent
                                    ? 'text-[#111827] dark:text-[#F3F4F6]'
                                    : 'text-[#9CA3AF]'
                                }`}
                              >
                                {t(`orders.stage_${st.key}`, st.key)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="my-4 bg-[#FBFBFC] dark:bg-[#1C1F26] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#26282E]">
                  <h4 className="text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider mb-3">
                    {t('orders.order_details', 'Buyurtma tarkibi')} ({order.items?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-white dark:bg-[#16181D] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#26282E]"
                      >
                        <img
                          src={it.image || DEFAULT_CAKE_IMAGE}
                          alt={it.name}
                          onError={handleImageError}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E5E7EB] dark:border-[#26282E]"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] truncate">
                            {it.name}
                          </h5>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                            {it.quantity} dona × {formatPrice(it.price || 0)}
                            {it.weight ? ` • ${it.weight}` : ''}
                          </p>
                          {it.customInscription && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate italic">
                              ✍️ "{it.customInscription}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery & Address Details */}
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#26282E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('cart.address', 'Manzil')}: <strong className="text-[#111827] dark:text-[#F3F4F6]">{order.customer_address}</strong></span>
                    </div>
                    {order.notes && (
                      <div className="text-[11px] italic">
                        {t('cart.notes', 'Izoh')}: "{order.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleReorder(order)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E2024] hover:bg-[#F3F4F6] dark:hover:bg-[#252830] border border-[#E5E7EB] dark:border-[#26282E] text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{t('orders.reorder', 'Qayta buyurtma')}</span>
                  </button>

                  <Link
                    to={`/profile?tab=reviews&orderId=${order.orderId}`}
                    className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-all cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current text-white" />
                    <span>{t('cake_details.reviews', 'Fikr bildirish')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
