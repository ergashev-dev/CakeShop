import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  Cake,
  ShoppingBag,
  Users,
  BarChart3,
  Wallet,
  Bell,
  FileText,
  Send,
  FolderTree,
  Plus,
  Search,
  RefreshCw,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  Clock,
  X,
  Loader2,
  DollarSign,
  ChefHat,
  Truck,
  MapPin,
  Phone,
  Settings as SettingsIcon,
  Ticket,
  MessageSquare,
  Bug,
  Download,
  Receipt,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  Filter,
  ArrowUpDown,
  Star,
  Layers,
  Check,
  ShieldAlert,
  Pencil,
} from 'lucide-react';
import {
  adminApi,
  cakeApi,
  categoryApi,
  orderApi,
  walletApi,
  notificationApi,
  reviewApi,
  bugApi,
  promoApi,
  settingsApi,
} from '../../services/api';
import miraApi from '../../services/mira/miraApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import socketClient from '../../services/socket';
import { formatPrice } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CustomSelect from '../../components/common/CustomSelect';
import Checkbox from '../../components/common/Checkbox';
import ImagePicker from '../../components/common/ImagePicker';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const AdminPage = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Role detection
  const isConfectioner = user?.role === 'confectioner';
  const isCourier = user?.role === 'courier';
  const isAdminRole = ['superadmin', 'super_admin', 'admin'].includes(user?.role);

  // Default active tab based on role
  const defaultTab = isConfectioner ? 'kitchen' : isCourier ? 'courier' : 'dashboard';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [stats, setStats] = useState({
    totalRevenue: 0,
    rangeRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    rangeOrdersCount: 0,
    todayOrdersCount: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    activeCakes: 0,
    totalUsers: 0,
  });

  const [orders, setOrders] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [courierOrders, setCourierOrders] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [promos, setPromos] = useState([]);
  const [settings, setSettings] = useState({
    isStoreOpen: true,
    cashbackPercent: 3,
    deliveryFee: 15000,
    deliveryFeeOutside: 35000,
    freeDeliveryThreshold: 300000,
    workingHours: '09:00 - 21:00',
    contactPhone: '+998 (90) 123-45-67',
    contactTelegram: '@boltortlari_admin',
    contactAddress: 'Toshkent sh., Navoiy ko‘chasi 14',
    aiSettings: {
      isEnabled: true,
      websiteQuestions: true,
      productRecommendations: true,
      orderAssistance: true,
      voiceAssistant: true,
      generalAiQuestions: true,
      imageUnderstanding: true,
    },
    paymentSettings: {
      click: { isEnabled: false, merchantId: '', serviceId: '', secretKey: '', isTestMode: true },
      payme: { isEnabled: false, merchantId: '', secretKey: '', isTestMode: true },
      bankCard: {
        isEnabled: true,
        cardNumber: '8600 1234 5678 9012',
        cardHolder: 'Abdurashid Ergashev',
        bankName: 'TBC Bank',
        instructions: "To'lov qilgach, chekni Telegram orqali yuboring yoki buyurtma izohida qoldiring.",
      },
      telegramStars: { isEnabled: true, rateUzsPerStar: 250 },
      cash: { isEnabled: true },
    },
    maintenanceMode: {
      isEnabled: false,
      title: 'Texnik sozlash ishlari olib borilmoqda',
      message: 'Saytimizni yanada yaxshilash va tezlashtirish maqsadida qisqa muddatli texnik sozlash olib borilmoqda. Tez orada qaytamiz!',
      estimatedEndTime: 'Tez orada',
      contactPhone: '+998 (90) 123-45-67',
      contactTelegram: '@boltortlari_admin',
    },
  });

  const [aiStats, setAiStats] = useState(null);
  const [customMemories, setCustomMemories] = useState([]);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [newMemoryForm, setNewMemoryForm] = useState({ key: '', fact: '', category: 'custom' });
  const [adminCopilotInput, setAdminCopilotInput] = useState('');
  const [adminCopilotMessages, setAdminCopilotMessages] = useState([]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    timeline: [],
    categoryDistribution: [],
    statusDistribution: [],
  });

  // Modals & Forms
  const [toast, setToast] = useState(null);
  const [isAddCakeModalOpen, setIsAddCakeModalOpen] = useState(false);
  const [cakeForm, setCakeForm] = useState({
    name: '',
    category_slug: 'premium',
    category_name: 'Premium tortlar',
    price: '',
    weight: '1.5 kg',
    description: '',
    ingredients: '',
    image: '',
    is_popular: false,
  });

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name_uz: '', name_ru: '', name_en: '', slug: '' });

  // Edit Cake & Edit Category Modal States
  const [isEditCakeModalOpen, setIsEditCakeModalOpen] = useState(false);
  const [editingCakeId, setEditingCakeId] = useState(null);
  const [editCakeForm, setEditCakeForm] = useState({
    name: '',
    category_slug: 'premium',
    category_name: 'Premium tortlar',
    price: '',
    weight: '1.5 kg',
    description: '',
    ingredients: '',
    image: '',
    is_popular: false,
    in_stock: true,
  });

  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name_uz: '', name_ru: '', name_en: '', slug: '' });

  const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', phone: '', role: 'confectioner' });

  const [isCreatePromoModalOpen, setIsCreatePromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discountPercent: '', minOrderAmount: '' });

  const [reviewReplyText, setReviewReplyText] = useState({});
  const [selectedBugScreenshot, setSelectedBugScreenshot] = useState(null);

  // Tab Search, Filter & Modal States
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const [cakeSearchQuery, setCakeSearchQuery] = useState('');
  const [cakeCategoryFilter, setCakeCategoryFilter] = useState('all');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' });

  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Broadcast & Messaging Center State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetGroup: 'all', // 'all', 'customers', 'admins', 'user'
    targetUserId: '',
  });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);

  const broadcastTemplates = [
    {
      title: '🎉 Bayram Aksiyasi! Barcha tortlarga 15% chegirma',
      message: 'Hurmatli mijozlar! Yaqinlashib kelayotgan bayram munosabati bilan barcha qandolat mahsulotlarimizga 15% chegirma e’lon qilamiz. Promokod: BAYRAM15',
      targetGroup: 'customers',
    },
    {
      title: '🎂 Yangi eksklyuziv tortlar kolleksiyasi sotuvda!',
      message: 'Katalogimizga nozik krem va yangi mevalar bilan bezatilgan premium tortlar to‘plami qo‘shildi. Hoziroq ko‘ring va buyurtma bering!',
      targetGroup: 'all',
    },
    {
      title: '⏰ Do‘kon ish vaqti haqida muhim bildirishnoma',
      message: 'Hurmatli xaridorlar! Bugun qandolatchilik ustaxonamiz soat 23:00 gacha buyurtmalarni qabul qiladi. Yetkazib berish xizmati odatdagidek ishlaydi.',
      targetGroup: 'all',
    },
    {
      title: '🛡️ Diqqat: Tizim yangilanishi va yangi buyurtmalar',
      message: 'Hurmatli xodimlar! Saytda navbatdagi yangilanish amalga oshirildi. Kelib tushgan yangi buyurtmalarni o‘z vaqtida qabul qiling va pishirishga topshiring.',
      targetGroup: 'admins',
    },
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Primary Data
  const loadPrimaryData = async () => {
    try {
      setLoading(true);
      if (isAdminRole) {
        const statsRes = await adminApi.getStats(timeRange);
        if (statsRes.data?.stats) setStats(statsRes.data.stats);
        if (statsRes.data?.recentOrders) setOrders(statsRes.data.recentOrders);
      } else {
        // Staff: confectioner or courier can fetch all orders
        try {
          const ordRes = await orderApi.getAll();
          setOrders(ordRes.data?.orders || []);
        } catch (e) {
          console.warn('Failed to load orders for staff:', e);
        }
      }

      const [cakesRes, catRes] = await Promise.all([
        cakeApi.getAll(),
        categoryApi.getAll(),
      ]);
      setCakes(cakesRes.data?.cakes || []);
      setCategories(catRes.data?.categories || []);

      if (isConfectioner || isAdminRole) {
        const kRes = await orderApi.getKitchenOrders();
        setKitchenOrders(kRes.data?.orders || []);
      }
      if (isCourier || isAdminRole) {
        const cRes = await orderApi.getCourierOrders();
        setCourierOrders(cRes.data?.orders || []);
      }
    } catch (err) {
      console.error('Error loading primary data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrimaryData();
  }, [timeRange]);

  // Load specific tab data
  useEffect(() => {
    const loadTabData = async () => {
      try {
        if (activeTab === 'users' && isAdminRole) {
          const res = await adminApi.getUsers();
          setUsersList(res.data?.users || []);
        } else if (activeTab === 'staff' && isSuperAdmin) {
          const res = await adminApi.getStaff();
          setStaffList(res.data?.staff || []);
        } else if (activeTab === 'analytics' && isAdminRole) {
          const res = await adminApi.getAnalytics(timeRange);
          setAnalyticsData(res.data || {});
        } else if (activeTab === 'wallet' && isAdminRole) {
          const [wRes, uRes] = await Promise.all([
            walletApi.getTransactions(),
            usersList.length === 0 ? adminApi.getUsers() : Promise.resolve(null),
          ]);
          setTransactions(wRes.data?.transactions || []);
          if (uRes?.data?.users) setUsersList(uRes.data.users);
        } else if (activeTab === 'logs' && (isAdminRole || isSuperAdmin)) {
          const res = await adminApi.getLogs();
          setAuditLogs(res.data?.logs || []);
        } else if (activeTab === 'reviews') {
          const res = await reviewApi.getAll();
          setReviews(res.data?.reviews || []);
        } else if (activeTab === 'bugs') {
          const res = await bugApi.getAll();
          setBugs(res.data?.bugs || []);
        } else if (activeTab === 'promos') {
          const res = await promoApi.getAll();
          setPromos(res.data?.promos || []);
        } else if (activeTab === 'settings') {
          const res = await settingsApi.get();
          if (res.data?.settings) setSettings(res.data.settings);
        } else if (activeTab === 'ai-settings') {
          const [sRes, aRes, mRes] = await Promise.all([
            settingsApi.get(),
            miraApi.getStats(),
            miraApi.getMemories(),
          ]);
          if (sRes.data?.settings) {
            setSettings(sRes.data.settings);
            setGeminiApiKeyInput(sRes.data.settings.aiSettings?.geminiApiKey || '');
          }
          if (aRes) setAiStats(aRes);
          if (mRes) setCustomMemories(mRes);
        } else if (activeTab === 'orders') {
          const res = await orderApi.getAll();
          setOrders(res.data?.orders || []);
        } else if (activeTab === 'notifications' && isAdminRole) {
          const [notifRes, uRes] = await Promise.all([
            notificationApi.getAll(),
            usersList.length === 0 ? adminApi.getUsers() : Promise.resolve(null),
          ]);
          setNotificationsList(notifRes.data?.notifications || []);
          if (uRes?.data?.users) setUsersList(uRes.data.users);
        } else if (activeTab === 'cakes') {
          const res = await cakeApi.getAll();
          setCakes(res.data?.cakes || []);
        } else if (activeTab === 'categories') {
          const res = await categoryApi.getAll();
          setCategories(res.data?.categories || []);
        }
      } catch (err) {
        console.error('Error loading tab data:', err);
      }
    };
    loadTabData();
  }, [activeTab, timeRange]);

  // Socket.IO Listeners
  useEffect(() => {
    const handleNewOrder = (order) => {
      showToast(`Yangi buyurtma keldi! #${order.orderId} (${formatPrice(order.total)})`);
      setOrders((prev) => [order, ...prev]);
      if (['confirmed', 'preparing'].includes(order.status)) {
        setKitchenOrders((prev) => [order, ...prev]);
      }
    };

    socketClient.on('order:new', handleNewOrder);
    socketClient.on('order:status', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === updatedOrder.orderId ? updatedOrder : o))
      );
      if (['ready', 'assigned', 'delivering'].includes(updatedOrder.status)) {
        setCourierOrders((prev) => [updatedOrder, ...prev.filter((c) => c.orderId !== updatedOrder.orderId)]);
      }
    });

    return () => {
      socketClient.off('order:new', handleNewOrder);
      socketClient.off('order:status');
    };
  }, []);

  // Handlers
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await orderApi.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((ord) => (ord.orderId === orderId ? { ...ord, status: newStatus } : ord))
      );
      showToast(`Buyurtma #${orderId} holati «${newStatus}»ga o‘zgartirildi.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Confectioner: preparing -> ready
  const handleKitchenReady = async (orderId) => {
    try {
      setActionLoading(true);
      await orderApi.updateKitchenStatus(orderId, 'ready');
      setKitchenOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      showToast(`Buyurtma #${orderId} tayyor deb belgilandi!`);
    } catch (err) {
      showToast('Yangilashda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Courier: confirm delivery
  const handleCourierDeliver = async (orderId) => {
    if (!window.confirm(`Buyurtma #${orderId} mijozga yetkazilganini tasdiqlaysizmi?`)) return;
    try {
      setActionLoading(true);
      await orderApi.confirmDelivery(orderId);
      setCourierOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      showToast(`Buyurtma #${orderId} yetkazildi deb tasdiqlandi. Keshbek berildi!`);
    } catch (err) {
      showToast('Tasdiqlashda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff creation
  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await adminApi.createStaff(staffForm);
      setStaffList((prev) => [res.data.staff, ...prev]);
      setIsCreateStaffModalOpen(false);
      setStaffForm({ name: '', email: '', password: '', phone: '', role: 'confectioner' });
      showToast('Yangi xodim hisobi yaratildi!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Xodim yaratishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`«${name}» xodimini o‘chirmoqchimisiz?`)) return;
    try {
      setActionLoading(true);
      await adminApi.deleteStaff(id);
      setStaffList((prev) => prev.filter((s) => s._id !== id));
      showToast('Xodim hisobi o‘chirildi.');
    } catch (err) {
      showToast('O‘chirishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Settings update
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await settingsApi.update(settings);
      showToast(res.data.message);
    } catch (err) {
      showToast('Sozlamalarni saqlashda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Mira AI Settings toggle helper
  const handleToggleAiSetting = async (key) => {
    const current = settings.aiSettings || {
      isEnabled: true,
      websiteQuestions: true,
      productRecommendations: true,
      orderAssistance: true,
      voiceAssistant: true,
      generalAiQuestions: true,
      imageUnderstanding: true,
    };
    const updated = {
      ...current,
      [key]: !current[key],
    };
    const newSettings = {
      ...settings,
      aiSettings: updated,
    };
    setSettings(newSettings);
    try {
      await settingsApi.update(newSettings);
      showToast('Mira AI sozlamalari yangilandi!');
    } catch (err) {
      showToast('Sozlamalarni saqlashda xatolik yuz berdi.', 'error');
    }
  };

  // Save Google Gemini API Key
  const handleSaveGeminiKey = async (e) => {
    e?.preventDefault();
    try {
      setActionLoading(true);
      const updatedAiSettings = {
        ...(settings.aiSettings || {}),
        geminiApiKey: geminiApiKeyInput.trim(),
      };
      const newSettings = {
        ...settings,
        aiSettings: updatedAiSettings,
      };
      setSettings(newSettings);
      await settingsApi.update(newSettings);
      showToast('Google Gemini API kaliti muvaffaqiyatli saqlandi!');
    } catch (err) {
      showToast('API kalitni saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Custom AI Memory Fact
  const handleAddMemorySubmit = async (e) => {
    e.preventDefault();
    if (!newMemoryForm.fact.trim()) {
      showToast('Fakt matnini kiriting.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await miraApi.addMemory(newMemoryForm);
      if (res.memory) {
        setCustomMemories((prev) => [res.memory, ...prev]);
        setNewMemoryForm({ key: '', fact: '', category: 'custom' });
        showToast('Yangi bilim AI xotirasiga saqlandi!');
      }
    } catch (err) {
      showToast('Xotirani saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Custom AI Memory Fact
  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Haqiqatan ham ushbu bilimni AI xotirasidan o‘chirmoqchimisiz?')) return;
    try {
      await miraApi.deleteMemory(id);
      setCustomMemories((prev) => prev.filter((m) => m.id !== id));
      showToast('Bilim xotiradan o‘chirildi.');
    } catch (err) {
      showToast('O‘chirishda xatolik yuz berdi.', 'error');
    }
  };

  // Admin Copilot send message
  const handleAdminCopilotSubmit = async (e) => {
    e.preventDefault();
    const q = adminCopilotInput.trim();
    if (!q) return;

    const userMsg = { role: 'user', text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAdminCopilotMessages((prev) => [...prev, userMsg]);
    setAdminCopilotInput('');
    setIsCopilotTyping(true);

    try {
      const res = await miraApi.adminChat(q);
      const copilotMsg = { role: 'copilot', text: res.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAdminCopilotMessages((prev) => [...prev, copilotMsg]);

      if (res.action === 'memory_saved' && res.memory) {
        setCustomMemories((prev) => [res.memory, ...prev]);
        showToast('Yangi bilim xotirada saqlandi!');
      }
    } catch (err) {
      setAdminCopilotMessages((prev) => [
        ...prev,
        { role: 'copilot', text: 'Kechirasiz, xatolik yuz berdi.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  // Review reply
  const handleReviewReply = async (reviewId) => {
    const text = reviewReplyText[reviewId];
    if (!text || !text.trim()) return;

    try {
      setActionLoading(true);
      const res = await reviewApi.reply(reviewId, text);
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? res.data.review : r))
      );
      setReviewReplyText((p) => ({ ...p, [reviewId]: '' }));
      showToast('Rasmiy javob saqlandi!');
    } catch (err) {
      showToast('Javob yozishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Haqiqatan ham ushbu sharhni o‘chirmoqchimisiz?')) return;
    try {
      setActionLoading(true);
      await reviewApi.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      showToast('Sharh muvaffaqiyatli o‘chirildi!');
    } catch (err) {
      showToast('Sharhni o‘chirishda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cake stock toggle (Tugadi / Sotuvda)
  const handleToggleCakeStock = async (cake) => {
    try {
      const newStock = cake.in_stock === false ? true : false;
      await cakeApi.update(cake._id, { in_stock: newStock });
      setCakes((prev) =>
        prev.map((c) => (c._id === cake._id ? { ...c, in_stock: newStock } : c))
      );
      showToast(
        newStock
          ? `«${cake.name}» qayta sotuvga chiqarildi (Mavjud)`
          : `«${cake.name}» sotuvda tugadi deb belgilandi (Mavjud emas)`
      );
    } catch (err) {
      showToast('Tort holatini o‘zgartirishda xatolik yuz berdi.', 'error');
    }
  };

  // RBAC status options helper: Confectioner can only see/set up to 'ready'
  const getStatusOptionsForUser = () => {
    if (user?.role === 'confectioner') {
      return [
        { value: 'pending', label: 'Kutilmoqda' },
        { value: 'confirmed', label: 'Tasdiqlandi' },
        { value: 'preparing', label: 'Pishirilmoqda' },
        { value: 'ready', label: 'Tayyor' },
      ];
    }
    if (user?.role === 'courier') {
      return [
        { value: 'ready', label: 'Tayyor' },
        { value: 'delivering', label: 'Yetkazilmoqda' },
        { value: 'delivered', label: 'Yetkazildi' },
      ];
    }
    return [
      { value: 'pending', label: 'Kutilmoqda' },
      { value: 'confirmed', label: 'Tasdiqlandi' },
      { value: 'preparing', label: 'Pishirilmoqda' },
      { value: 'ready', label: 'Tayyor' },
      { value: 'delivering', label: 'Yetkazilmoqda' },
      { value: 'delivered', label: 'Yetkazildi' },
      { value: 'cancelled', label: 'Bekor qilindi' },
    ];
  };

  // Edit Cake Handlers
  const handleOpenEditCake = (cake) => {
    setEditingCakeId(cake._id);
    setEditCakeForm({
      name: cake.name || '',
      category_slug: cake.category_slug || 'premium',
      category_name: cake.category_name || 'Premium tortlar',
      price: cake.price || '',
      weight: cake.weight || '1.5 kg',
      description: cake.description || '',
      ingredients: cake.ingredients || '',
      image: cake.image || '',
      is_popular: Boolean(cake.is_popular),
      in_stock: cake.in_stock !== false,
    });
    setIsEditCakeModalOpen(true);
  };

  const handleEditCakeSubmit = async (e) => {
    e.preventDefault();
    if (!editCakeForm.name.trim() || !editCakeForm.price) {
      showToast('Tort nomi va narxini kiriting.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await cakeApi.update(editingCakeId, {
        ...editCakeForm,
        price: Number(editCakeForm.price),
      });
      setCakes((prev) =>
        prev.map((c) => (c._id === editingCakeId ? (res.data?.cake || { ...c, ...editCakeForm }) : c))
      );
      setIsEditCakeModalOpen(false);
      showToast('Tort ma‘lumotlari muvaffaqiyatli yangilandi!');
    } catch (err) {
      showToast('Tortni tahrirlashda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Category Handlers
  const handleOpenEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setEditCategoryForm({
      name_uz: cat.name_uz || cat.name || '',
      slug: cat.slug || '',
      name_ru: cat.name_ru || '',
      name_en: cat.name_en || '',
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    if (!editCategoryForm.name_uz.trim() || !editCategoryForm.slug.trim()) {
      showToast('Kategoriya nomi va slug majburiy.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await categoryApi.update(editingCategoryId, editCategoryForm);
      setCategories((prev) =>
        prev.map((c) => (c._id === editingCategoryId ? (res.data?.category || { ...c, ...editCategoryForm }) : c))
      );
      setIsEditCategoryModalOpen(false);
      showToast('Kategoriya muvaffaqiyatli yangilandi!');
    } catch (err) {
      showToast('Kategoriyani yangilashda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Bug status update
  const handleUpdateBugStatus = async (bugId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await bugApi.updateStatus(bugId, newStatus);
      setBugs((prev) => prev.map((b) => (b._id === bugId ? res.data.bug : b)));
      showToast('Xatolik holati yangilandi.');
    } catch (err) {
      showToast('Yangilashda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Promo code
  const handleCreatePromoSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await promoApi.create(promoForm);
      setPromos((prev) => [res.data.promo, ...prev]);
      setIsCreatePromoModalOpen(false);
      setPromoForm({ code: '', discountPercent: '', minOrderAmount: '' });
      showToast('Promokod faollashtirildi!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Promokod yaratishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePromo = async (id) => {
    try {
      await promoApi.delete(id);
      setPromos((prev) => prev.filter((p) => p._id !== id));
      showToast('Promokod o‘chirildi.');
    } catch (err) {
      showToast('O‘chirishda xatolik.', 'error');
    }
  };

  // Cake Handlers
  const handleCreateCakeSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const selectedCat = categories.find((c) => c.slug === cakeForm.category_slug);
      const payload = {
        ...cakeForm,
        category_name: selectedCat?.name_uz || cakeForm.category_name || 'Premium tortlar',
        price: Number(cakeForm.price),
      };
      const res = await cakeApi.create(payload);
      setCakes((prev) => [res.data.cake, ...prev]);
      setIsAddCakeModalOpen(false);
      setCakeForm({
        name: '',
        category_slug: categories[0]?.slug || 'premium',
        category_name: categories[0]?.name_uz || 'Premium tortlar',
        price: '',
        weight: '1.5 kg',
        description: '',
        ingredients: '',
        image: '',
        is_popular: false,
      });
      showToast('Yangi tort muvaffaqiyatli qo‘shildi!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Tort qo‘shishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCake = async (id, name) => {
    if (!window.confirm(`«${name}» tortini katalogdan butunlay o‘chirmoqchimisiz?`)) return;
    try {
      setActionLoading(true);
      await cakeApi.delete(id);
      setCakes((prev) => prev.filter((c) => c._id !== id));
      showToast(`«${name}» muvaffaqiyatli o‘chirildi.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Tortni o‘chirishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Category Handlers
  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await categoryApi.create(categoryForm);
      setCategories((prev) => [...prev, res.data.category]);
      setIsAddCategoryModalOpen(false);
      setCategoryForm({ name_uz: '', name_ru: '', name_en: '', slug: '' });
      showToast('Yangi kategoriya yaratildi!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Kategoriya yaratishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`«${name}» kategoriyasini o‘chirmoqchimisiz?`)) return;
    try {
      setActionLoading(true);
      await categoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showToast(`«${name}» kategoriyasi o‘chirildi.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Kategoriyani o‘chirishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // User Management Handlers
  const handleToggleBlockUser = async (userId, currentBlocked) => {
    const actionName = currentBlocked ? 'blokdan chiqarishni' : 'bloklashni';
    if (!window.confirm(`Ushbu foydalanuvchini ${actionName} tasdiqlaysizmi?`)) return;
    try {
      setActionLoading(true);
      const res = await adminApi.toggleBlockUser(userId);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: !currentBlocked } : u))
      );
      showToast(res.data?.message || 'Foydalanuvchi holati yangilandi.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      const res = await adminApi.changeUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showToast(res.data?.message || 'Foydalanuvchi roli yangilandi.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Rolni o‘zgartirishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    try {
      setActionLoading(true);
      await walletApi.adjustBalance(adjustTargetUser._id, adjustForm.amount, adjustForm.reason);
      const numAmount = Number(adjustForm.amount);
      setUsersList((prev) =>
        prev.map((u) =>
          u._id === adjustTargetUser._id
            ? { ...u, walletBalance: (u.walletBalance || 0) + numAmount }
            : u
        )
      );
      if (activeTab === 'wallet') {
        const res = await walletApi.getTransactions();
        setTransactions(res.data?.transactions || []);
      }
      setIsAdjustBalanceModalOpen(false);
      setAdjustTargetUser(null);
      setAdjustForm({ amount: '', reason: '' });
      showToast('Hamyon balansi muvaffaqiyatli tuzatildi!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Balansni o‘zgartirishda xatolik.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Broadcast Notification Handler
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast('Sarlavha va xabar matnini kiriting.', 'error');
      return;
    }
    if (broadcastForm.targetGroup === 'user' && !broadcastForm.targetUserId) {
      showToast('Xabar yuborish uchun aniq foydalanuvchini tanlang.', 'error');
      return;
    }

    try {
      setBroadcastLoading(true);
      await notificationApi.broadcast({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        targetGroup: broadcastForm.targetGroup,
        targetUserId: broadcastForm.targetGroup === 'user' ? broadcastForm.targetUserId : undefined,
      });
      showToast('Xabarnoma muvaffaqiyatli tarqatildi!');
      setBroadcastForm({
        title: '',
        message: '',
        targetGroup: 'all',
        targetUserId: '',
      });
      const notifRes = await notificationApi.getAll();
      setNotificationsList(notifRes.data?.notifications || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Xabarnomani tarqatishda xatolik yuz berdi.', 'error');
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Filtered computed collections
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const q = orderSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.includes(q)) ||
        (o.customer_address && o.customer_address.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const filteredCakes = useMemo(() => {
    return cakes.filter((c) => {
      const matchesCat =
        cakeCategoryFilter === 'all' ||
        c.category_slug === cakeCategoryFilter ||
        c.category === cakeCategoryFilter;
      const q = cakeSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [cakes, cakeCategoryFilter, cakeSearchQuery]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearchQuery.toLowerCase();
      return (
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [usersList, userSearchQuery]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const q = logSearchQuery.toLowerCase();
      return (
        !q ||
        (l.actorName && l.actorName.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.target && l.target.toLowerCase().includes(q))
      );
    });
  }, [auditLogs, logSearchQuery]);

  // Status Badge UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success" dot>Yetkazildi</Badge>;
      case 'delivering':
        return <Badge variant="primary" dot>Yetkazilmoqda</Badge>;
      case 'preparing':
        return <Badge variant="warning" dot>Pishirilmoqda</Badge>;
      case 'ready':
        return <Badge variant="secondary" dot>Tayyor</Badge>;
      case 'confirmed':
        return <Badge variant="primary" dot>Tasdiqlandi</Badge>;
      case 'cancelled':
        return <Badge variant="danger" dot>Bekor qilindi</Badge>;
      default:
        return <Badge variant="neutral" dot>Kutilmoqda</Badge>;
    }
  };

  // Sidebar navigation items based on role
  const navItems = useMemo(() => {
    const items = [];

    if (isAdminRole) {
      items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
      items.push({ id: 'orders', label: 'Buyurtmalar', icon: ShoppingBag, count: orders.length });
    }

    if (isConfectioner || isAdminRole) {
      items.push({ id: 'kitchen', label: 'Oshxona Navbati', icon: ChefHat, count: kitchenOrders.length });
    }

    if (isCourier || isAdminRole) {
      items.push({ id: 'courier', label: 'Kuryer Portali', icon: Truck, count: courierOrders.length });
    }

    if (isConfectioner || isCourier) {
      items.push({ id: 'orders', label: 'Barcha Buyurtmalar', icon: ShoppingBag, count: orders.length });
    }

    if (isConfectioner || isAdminRole) {
      items.push({ id: 'cakes', label: 'Tortlar Katalogi', icon: Cake, count: cakes.length });
    }

    if (isAdminRole) {
      items.push({ id: 'categories', label: 'Kategoriyalar', icon: FolderTree, count: categories.length });
      items.push({ id: 'reviews', label: 'Mijozlar Sharhlari', icon: MessageSquare });
      items.push({ id: 'promos', label: 'Promokodlar', icon: Ticket });
      items.push({ id: 'analytics', label: 'Grafik Analitika', icon: BarChart3 });
      items.push({ id: 'reports', label: 'Savdo Hisobotlari', icon: Download });
      items.push({ id: 'users', label: 'Foydalanuvchilar', icon: Users, count: stats.totalUsers });
      items.push({ id: 'wallet', label: 'Hamyon Operatsiyalari', icon: Wallet });
      items.push({ id: 'bugs', label: 'Xatoliklar (Bugs)', icon: Bug, count: bugs.filter((b) => b.status === 'Yangi').length });
      items.push({ id: 'notifications', label: 'Xabarnomalar Markazi', icon: Bell });
    }

    if (isSuperAdmin) {
      items.push({ id: 'staff', label: 'Xodimlar Boshqaruvi', icon: ShieldCheck, count: staffList.length });
      items.push({ id: 'settings', label: 'Do‘kon Sozlamalari', icon: SettingsIcon });
      items.push({ id: 'ai-settings', label: 'Mira AI Sozlamalari', icon: Sparkles });
      items.push({ id: 'logs', label: 'Audit Loglari', icon: FileText });
    }

    return items;
  }, [isAdminRole, isConfectioner, isCourier, isSuperAdmin, stats, orders, kitchenOrders, courierOrders, cakes, categories, bugs, staffList]);

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] dark:bg-[#0F1012] text-[#17181A] dark:text-[#F3F4F6] font-sans antialiased">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MOBILE SIDEBAR DRAWER & BACKDROP */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-[#16181D] border-r border-[#E7E9ED] dark:border-[#272A30] flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              {/* Brand & Close Button */}
              <div className="h-16 px-5 flex items-center justify-between border-b border-[#E7E9ED] dark:border-[#272A30]">
                <Link to="/" onClick={() => setIsMobileSidebarOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm leading-none block">Bol Tortlari</span>
                    <span className="text-[10px] text-[#6B7280]">
                      {isSuperAdmin ? 'Super Admin' : isConfectioner ? 'Qandolatchi' : isCourier ? 'Kuryer' : 'Admin Panel'}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] cursor-pointer"
                  aria-label="Yopish"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-3 space-y-1 max-h-[calc(100vh-8.5rem)] overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A] hover:bg-[#F7F8FA] dark:hover:bg-[#202328]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#E7E9ED] dark:bg-[#282B33] text-[#6B7280]'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="truncate max-w-[120px]">
                  <span className="text-xs font-semibold block truncate">{user?.name}</span>
                  <span className="text-[10px] text-[#6B7280] block truncate">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] cursor-pointer"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#16181D] border-r border-[#E7E9ED] dark:border-[#272A30] flex flex-col justify-between shrink-0 hidden lg:flex">
        <div>
          {/* Brand */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#E7E9ED] dark:border-[#272A30]">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <Cake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm leading-none block">Bol Tortlari</span>
                <span className="text-[10px] text-[#6B7280]">
                  {isSuperAdmin ? 'Super Admin' : isConfectioner ? 'Qandolatchi' : isCourier ? 'Kuryer' : 'Admin Panel'}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A] hover:bg-[#F7F8FA] dark:hover:bg-[#202328]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E7E9ED] dark:bg-[#282B33] text-[#6B7280]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate max-w-[110px]">
              <span className="text-xs font-semibold block truncate">{user?.name}</span>
              <span className="text-[10px] text-[#6B7280] block truncate">{user?.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-[#16181D] border-b border-[#E7E9ED] dark:border-[#272A30] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Sidebar Trigger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] text-[#17181A] dark:text-[#F3F4F6] cursor-pointer transition-colors"
              aria-label="Admin menyusi"
              title="Bo‘limlar menyusi"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h2 className="text-sm sm:text-base font-bold capitalize truncate max-w-[140px] sm:max-w-none">
              {navItems.find((n) => n.id === activeTab)?.label || 'Boshqaruv'}
            </h2>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold">
              Real-time ulandi
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdminRole && (
              <div className="w-28 sm:w-36">
                <CustomSelect
                  value={timeRange}
                  onChange={(val) => setTimeRange(val)}
                  size="sm"
                  options={[
                    { value: 'today', label: 'Bugun' },
                    { value: 'yesterday', label: 'Kecha' },
                    { value: '7days', label: '7 kun' },
                    { value: '30days', label: '30 kun' },
                    { value: '3months', label: '3 oy' },
                    { value: 'year', label: 'Yil' },
                  ]}
                />
              </div>
            )}

            <button
              onClick={loadPrimaryData}
              className="p-2 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] text-[#6B7280] cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Section Tabs Bar */}
        <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#16181D] border-b border-[#E7E9ED] dark:border-[#272A30] overflow-x-auto no-scrollbar shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F7F8FA] dark:bg-[#202328] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1 rounded-full text-[9px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E7E9ED] dark:bg-[#282B33] text-[#6B7280]'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="p-3 sm:p-6 lg:p-8 space-y-6">

          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 Big KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Jami Tushum</span>
                  <div className="text-2xl font-black text-[#2563EB] mt-1">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">
                    Bugun: {formatPrice(stats.todayRevenue)}
                  </span>
                </div>

                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Buyurtmalar</span>
                  <div className="text-2xl font-black mt-1">
                    {stats.totalOrders} <span className="text-sm font-normal text-[#6B7280]">ta</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-2 block">
                    {stats.completedOrders} tasi muvaffaqiyatli yetkazildi
                  </span>
                </div>

                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">O‘rtacha Chek</span>
                  <div className="text-2xl font-black text-[#17181A] dark:text-[#F3F4F6] mt-1">
                    {formatPrice(stats.averageOrderValue)}
                  </div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">
                    1 ta buyurtmaga to‘g‘ri keluvchi summa
                  </span>
                </div>

                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Ro‘yxatdan O‘tganlar</span>
                  <div className="text-2xl font-black text-[#17181A] dark:text-[#F3F4F6] mt-1">
                    {stats.totalUsers} <span className="text-sm font-normal text-[#6B7280]">mijoz</span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">
                    Faol xaridorlar bazasi
                  </span>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Jonli Buyurtmalar Oqimi</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Barchasini ko‘rish ({orders.length})
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#6B7280]">
                    Hozircha buyurtmalar mavjud emas.
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW: Responsive Cards (No horizontal scroll) */}
                    <div className="sm:hidden space-y-3">
                  {orders.slice(0, 8).map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-[#F9FAFB] dark:bg-[#1E2026] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl p-3.5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#2563EB] text-xs">#{ord.orderId}</span>
                        <div>{getStatusBadge(ord.status)}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="font-semibold text-[#111827] dark:text-[#F3F4F6] truncate max-w-[180px]" title={ord.customer_name}>
                          {ord.customer_name}
                        </div>
                        <div className="font-black text-[#111827] dark:text-[#F3F4F6]">
                          {formatPrice(ord.total)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span>{ord.customer_phone}</span>
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30]">
                          {ord.payment_method}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#E7E9ED]/60 dark:border-[#272A30]/60">
                        <CustomSelect
                          value={ord.status}
                          onChange={(val) => handleStatusChange(ord.orderId, val)}
                          size="sm"
                          options={[
                            { value: 'pending', label: 'Kutilmoqda' },
                            { value: 'confirmed', label: 'Tasdiqlandi' },
                            { value: 'preparing', label: 'Pishirilmoqda' },
                            { value: 'ready', label: 'Tayyor' },
                            { value: 'delivering', label: 'Yetkazilmoqda' },
                            { value: 'delivered', label: 'Yetkazildi' },
                            { value: 'cancelled', label: 'Bekor qilindi' },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW: Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">ID</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Mijoz</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Telefon</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Summa</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">To‘lov</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Holat</th>
                        <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                      {orders.slice(0, 8).map((ord) => (
                        <tr key={ord._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">#{ord.orderId}</td>
                          <td className="px-4 py-3.5 font-semibold max-w-[140px] truncate" title={ord.customer_name}>{ord.customer_name}</td>
                          <td className="px-4 py-3.5 text-[#6B7280] whitespace-nowrap">{ord.customer_phone}</td>
                          <td className="px-4 py-3.5 font-black text-[#17181A] dark:text-[#F3F4F6] whitespace-nowrap">{formatPrice(ord.total)}</td>
                          <td className="px-4 py-3.5 uppercase font-bold text-[10px] whitespace-nowrap">{ord.payment_method}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(ord.status)}</td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="w-32 inline-block text-left">
                              <CustomSelect
                                value={ord.status}
                                onChange={(val) => handleStatusChange(ord.orderId, val)}
                                size="sm"
                                options={[
                                  { value: 'pending', label: 'Kutilmoqda' },
                                  { value: 'confirmed', label: 'Tasdiqlandi' },
                                  { value: 'preparing', label: 'Pishirilmoqda' },
                                  { value: 'ready', label: 'Tayyor' },
                                  { value: 'delivering', label: 'Yetkazilmoqda' },
                                  { value: 'delivered', label: 'Yetkazildi' },
                                  { value: 'cancelled', label: 'Bekor qilindi' },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
              </div>
            </div>
          )}

          {/* ORDERS TAB (Barcha Buyurtmalar Boshqaruvi) */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold">Barcha Buyurtmalar</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] text-xs font-bold">
                      {filteredOrders.length} ta
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Mijozlar buyurtmalari, yetkazish manzillari va to‘lov holatlari.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={async () => {
                    const res = await orderApi.getAll();
                    setOrders(res.data?.orders || []);
                    showToast('Buyurtmalar ro‘yxati yangilandi');
                  }}
                >
                  Yangilash
                </Button>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { key: 'all', label: 'Barchasi', count: orders.length },
                  { key: 'pending', label: 'Kutilmoqda', count: orders.filter((o) => o.status === 'pending').length },
                  { key: 'confirmed', label: 'Tasdiqlangan', count: orders.filter((o) => o.status === 'confirmed').length },
                  { key: 'preparing', label: 'Pishirilmoqda', count: orders.filter((o) => o.status === 'preparing').length },
                  { key: 'ready', label: 'Tayyor', count: orders.filter((o) => o.status === 'ready').length },
                  { key: 'delivering', label: 'Yetkazilmoqda', count: orders.filter((o) => o.status === 'delivering').length },
                  { key: 'delivered', label: 'Yetkazildi', count: orders.filter((o) => o.status === 'delivered').length },
                  { key: 'cancelled', label: 'Bekor qilingan', count: orders.filter((o) => o.status === 'cancelled').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setOrderStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      orderStatusFilter === tab.key
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      orderStatusFilter === tab.key ? 'bg-white/25 text-white' : 'bg-[#E7E9ED] dark:bg-[#282B33] text-[#6B7280]'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buyurtma ID (#1002), mijoz ismi, telefon raqami yoki manzil bo‘yicha qidiruv..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                  />
                </div>
              </div>

              {/* Orders List / Cards */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-16 text-center text-xs text-[#6B7280] shadow-card">
                  <ShoppingBag className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
                  <h4 className="text-base font-bold">Mos buyurtmalar topilmadi</h4>
                  <p className="text-xs text-[#6B7280] mt-1">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring.</p>
                </div>
              ) : (
                <>
                  {/* MOBILE VIEW: Cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord._id}
                        className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card space-y-3 card-hover-lift"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#2563EB] text-xs">#{ord.orderId}</span>
                          <div>{getStatusBadge(ord.status)}</div>
                        </div>

                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {ord.customer_name}
                          </div>
                          <div className="text-xs text-[#6B7280] flex items-center gap-2">
                            <a href={`tel:${ord.customer_phone}`} className="hover:underline text-[#2563EB] flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ord.customer_phone}
                            </a>
                          </div>
                          {ord.customer_address && (
                            <div className="text-[11px] text-[#6B7280] flex items-start gap-1 pt-0.5">
                              <MapPin className="w-3 h-3 text-[#2563EB] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{ord.customer_address}</span>
                            </div>
                          )}
                        </div>

                        {/* Items summary */}
                        <div className="p-2.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1E2026] text-xs space-y-1">
                          {ord.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="truncate max-w-[180px]">{item.name} x{item.quantity || 1}</span>
                              <span className="font-semibold">{formatPrice(item.price * (item.quantity || 1))}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E7E9ED]/60 dark:border-[#272A30]/60">
                          <div>
                            <span className="text-[10px] text-[#6B7280] block">To‘lov</span>
                            <span className="uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">
                              {ord.payment_method}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#6B7280] block">Jami Summa</span>
                            <span className="font-black text-sm text-[#17181A] dark:text-[#F3F4F6]">
                              {formatPrice(ord.total)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#E7E9ED]/60 dark:border-[#272A30]/60">
                          <div className="flex-1">
                            <CustomSelect
                              value={ord.status}
                              onChange={(val) => handleStatusChange(ord.orderId, val)}
                              size="sm"
                              options={getStatusOptionsForUser()}
                            />
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedOrderDetails(ord)}
                          >
                            Batafsil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP VIEW: Full Table */}
                  <div className="hidden sm:block bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[750px]">
                        <thead>
                          <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">ID</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Mijoz & Telefon</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Manzil</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Mahsulotlar</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Summa & To‘lov</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Holat</th>
                            <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                          {filteredOrders.map((ord) => (
                            <tr key={ord._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                              <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                                #{ord.orderId}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-[#111827] dark:text-[#F3F4F6] max-w-[140px] truncate" title={ord.customer_name}>
                                  {ord.customer_name}
                                </div>
                                <a href={`tel:${ord.customer_phone}`} className="text-[#6B7280] hover:underline text-[11px]">
                                  {ord.customer_phone}
                                </a>
                              </td>
                              <td className="px-4 py-3.5 max-w-[160px] truncate text-[#6B7280]" title={ord.customer_address}>
                                {ord.customer_address || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-[#4B5563] dark:text-[#9CA3AF] max-w-[180px] truncate">
                                {ord.items?.map((i) => `${i.name} (${i.quantity || 1})`).join(', ') || '-'}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-black text-[#17181A] dark:text-[#F3F4F6]">
                                  {formatPrice(ord.total)}
                                </div>
                                <span className="uppercase font-bold text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                  {ord.payment_method}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {getStatusBadge(ord.status)}
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-32 text-left">
                                    <CustomSelect
                                      value={ord.status}
                                      onChange={(val) => handleStatusChange(ord.orderId, val)}
                                      size="sm"
                                      options={getStatusOptionsForUser()}
                                    />
                                  </div>
                                  <button
                                    onClick={() => setSelectedOrderDetails(ord)}
                                    className="p-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] text-[#4B5563] dark:text-[#9CA3AF] cursor-pointer"
                                    title="Tafsilotlar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. KITCHEN QUEUE (Qandolatchi oshxonasi) */}
          {activeTab === 'kitchen' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Oshxona Tayyorlash Navbati</h3>
                  <p className="text-xs text-[#6B7280]">
                    Pishirilishi va bezatilishi kerak bo‘lgan navbatdagi buyurtmalar chiptalari.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                  {kitchenOrders.length} ta pishirishda
                </span>
              </div>

              {kitchenOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-16 text-center shadow-card">
                  <ChefHat className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
                  <h4 className="text-base font-bold">Oshxona navbatida buyurtmalar yo‘q</h4>
                  <p className="text-xs text-[#6B7280] mt-1">Barcha tortlar o‘z vaqtida tayyorlangan!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kitchenOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                          <div className="max-w-[200px]">
                            <span className="font-mono text-xs font-extrabold text-[#2563EB]">#{ord.orderId}</span>
                            <h4 className="text-sm font-bold mt-0.5 truncate" title={ord.customer_name}>{ord.customer_name}</h4>
                          </div>
                          {getStatusBadge(ord.status)}
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Retsept va tarkib:</span>
                          {ord.items && ord.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] text-xs">
                              <div className="flex justify-between font-bold">
                                <span>{item.name}</span>
                                <span>{item.weight} × {item.quantity}</span>
                              </div>
                              {item.customSpecs && (
                                <div className="mt-2 text-[11px] space-y-1 text-[#4B5563] dark:text-[#9CA3AF] border-t border-[#E7E9ED] dark:border-[#2E3138] pt-2">
                                  <div><span className="font-semibold">Biskvit:</span> {item.customSpecs.biscuit}</div>
                                  <div><span className="font-semibold">Krem:</span> {item.customSpecs.cream}</div>
                                  <div><span className="font-semibold">Bezak:</span> {item.customSpecs.decor}</div>
                                  {item.customSpecs.greetingText && (
                                    <div className="text-[#2563EB] font-serif italic">
                                      Tabrik xati: «{item.customSpecs.greetingText}»
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {ord.notes && (
                          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-300">
                            <span className="font-bold">Mijoz izohi:</span> {ord.notes}
                          </div>
                        )}
                      </div>

                      {/* Ready button */}
                      <div className="pt-4 mt-4 border-t border-[#E7E9ED] dark:border-[#272A30]">
                        <button
                          onClick={() => handleKitchenReady(ord.orderId)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pishirildi & Tayyorlandi</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. COURIER QUEUE (Kuryer portali) */}
          {activeTab === 'courier' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Kuryer Yetkazib Berish Portali</h3>
                  <p className="text-xs text-[#6B7280]">
                    Yetkazilishi kerak bo‘lgan buyurtmalar, mijoz bilan tezkor aloqa va xarita.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                  {courierOrders.length} ta yetkazishda
                </span>
              </div>

              {courierOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-16 text-center shadow-card">
                  <Truck className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
                  <h4 className="text-base font-bold">Hozircha yetkaziladigan buyurtmalar yo‘q</h4>
                  <p className="text-xs text-[#6B7280] mt-1">Yangi buyurtmalar tayyor bo‘lishi bilan bu yerda paydo bo‘ladi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courierOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                          <div className="max-w-[200px]">
                            <span className="font-mono text-xs font-extrabold text-[#2563EB]">#{ord.orderId}</span>
                            <h4 className="text-base font-bold mt-0.5 truncate" title={ord.customer_name}>{ord.customer_name}</h4>
                          </div>
                          <span className="text-sm font-extrabold text-[#2563EB]">{formatPrice(ord.total)}</span>
                        </div>

                        {/* Customer Address with Maps Link */}
                        <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] space-y-2">
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                            <span className="font-semibold text-[#17181A] dark:text-[#F3F4F6]">
                              {ord.customer_address}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-[#E7E9ED] dark:border-[#2E3138]">
                            <a
                              href={`https://yandex.uz/maps/?text=${encodeURIComponent(ord.customer_address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Yandex Xarita
                            </a>
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(ord.customer_address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Google Maps
                            </a>
                          </div>
                        </div>

                        {/* Quick Call Button */}
                        <a
                          href={`tel:${ord.customer_phone}`}
                          className="w-full py-2 px-3 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Qo‘ng‘iroq qilish: {ord.customer_phone}</span>
                        </a>
                      </div>

                      {/* Confirm Delivery button */}
                      <div className="pt-4 mt-4 border-t border-[#E7E9ED] dark:border-[#272A30]">
                        <button
                          onClick={() => handleCourierDeliver(ord.orderId)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Yetkazildi deb tasdiqlash</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ANALYTICS & CHARTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Area Chart: Revenue Timeline (8 cols) */}
                <div className="lg:col-span-8 bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card">
                  <h3 className="text-base font-bold mb-1">Kunlik Savdo Egri Chizig‘i (Revenue Curve)</h3>
                  <p className="text-xs text-[#6B7280] mb-6">Tanlangan vaqt oralig‘idagi tushum oqimi</p>

                  {analyticsData.timeline && analyticsData.timeline.length > 0 ? (
                    <div className="h-64 flex flex-col justify-between">
                      {/* SVG Bezier Area Chart */}
                      <svg className="w-full h-48 overflow-visible" viewBox="0 0 500 150">
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const points = analyticsData.timeline;
                          const maxRev = Math.max(...points.map((p) => p.revenue), 100000);
                          const stepX = 500 / Math.max(points.length - 1, 1);
                          const coords = points.map((p, i) => [
                            i * stepX,
                            140 - (p.revenue / maxRev) * 120,
                          ]);
                          const pathD = coords.reduce((acc, [x, y], i) => `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`, '');
                          const areaD = `${pathD} L 500 150 L 0 150 Z`;

                          return (
                            <>
                              <path d={areaD} fill="url(#revenueGrad)" />
                              <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                              {coords.map(([x, y], i) => (
                                <circle key={i} cx={x} cy={y} r="3" fill="#2563EB" className="hover:r-5 transition-all" />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                      {/* X Labels */}
                      <div className="flex justify-between text-[10px] text-[#6B7280] pt-3 border-t border-[#E7E9ED] dark:border-[#272A30]">
                        {analyticsData.timeline.filter((_, i) => i % Math.ceil(analyticsData.timeline.length / 6) === 0).map((p, i) => (
                          <span key={i}>{p.date}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-xs text-[#6B7280]">
                      Ma'lumotlar yetarli emas.
                    </div>
                  )}
                </div>

                {/* Donut Chart: Category Breakdown (4 cols) */}
                <div className="lg:col-span-4 bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold mb-1">Toifalar Bo‘yicha Taqsimot</h3>
                    <p className="text-xs text-[#6B7280] mb-4">Eng ko‘p sotilgan toifalar</p>

                    <div className="space-y-3 pt-2">
                      {analyticsData.categoryDistribution && analyticsData.categoryDistribution.map((cat, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-semibold truncate max-w-[140px]">{cat.name}</span>
                          <span className="font-bold text-[#2563EB]">{formatPrice(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 text-[11px] text-[#2563EB] font-semibold mt-4">
                    Kategoriya balansi to‘g‘ri taqsimlangan
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SALES REPORTS & EXPORT */}
          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold">Savdo Hisobotlari & Eksport</h3>
                  <p className="text-xs text-[#6B7280]">Buxgalteriya va tahlil uchun hisobotlarni yuklab oling.</p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={adminApi.exportReportUrl(timeRange)}
                    download
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel (.csv) yuklab olish</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] hover:bg-[#F7F8FA] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Chop etish (PDF)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#6B7280] block">Tanlangan davr:</span>
                  <span className="font-bold">{timeRange}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Buyurtmalar soni:</span>
                  <span className="font-bold">{orders.length} ta</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Hisobot summasi:</span>
                  <span className="font-bold text-[#2563EB]">
                    {formatPrice(orders.reduce((sum, o) => sum + (o.total || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. STORE SETTINGS (Super Admin) */}
          {activeTab === 'settings' && isSuperAdmin && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 sm:p-8 shadow-card max-w-2xl animate-in fade-in duration-200">
              <h3 className="text-base font-bold mb-1">Do‘kon va Tizim Sozlamalari</h3>
              <p className="text-xs text-[#6B7280] mb-6">Yetkazib berish shartlari va ish tartibini boshqaring.</p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Store Open / Closed Toggle */}
                <div className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs block">Do‘kon ish holati</span>
                    <span className="text-[11px] text-[#6B7280]">
                      {settings.isStoreOpen ? 'Do‘kon ochiq va buyurtmalar qabul qilinmoqda' : 'Do‘kon yopiq (Buyurtma to‘xtatilgan)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, isStoreOpen: !p.isStoreOpen }))}
                    className="cursor-pointer"
                  >
                    {settings.isStoreOpen ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Shahar ichi yetkazish (so‘m)</label>
                    <input
                      type="number"
                      value={settings.deliveryFee}
                      onChange={(e) => setSettings((p) => ({ ...p, deliveryFee: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Shahar tashqarisi (so‘m)</label>
                    <input
                      type="number"
                      value={settings.deliveryFeeOutside}
                      onChange={(e) => setSettings((p) => ({ ...p, deliveryFeeOutside: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Bepul yetkazish chegarasi (so‘m)</label>
                    <input
                      type="number"
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) => setSettings((p) => ({ ...p, freeDeliveryThreshold: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Keshbek foizi (%)</label>
                    <input
                      type="number"
                      value={settings.cashbackPercent}
                      onChange={(e) => setSettings((p) => ({ ...p, cashbackPercent: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Ish vaqti</label>
                    <input
                      type="text"
                      value={settings.workingHours}
                      onChange={(e) => setSettings((p) => ({ ...p, workingHours: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Aloqa telefoni</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings((p) => ({ ...p, contactPhone: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Instagram (@profil)</label>
                    <input
                      type="text"
                      placeholder="boltortlari_uz"
                      value={settings.contactInstagram || ''}
                      onChange={(e) => setSettings((p) => ({ ...p, contactInstagram: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6B7280] block mb-1">Telegram (@kanal yoki @admin)</label>
                    <input
                      type="text"
                      placeholder="boltortlari_admin"
                      value={settings.contactTelegram || ''}
                      onChange={(e) => setSettings((p) => ({ ...p, contactTelegram: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B7280] block mb-1">Do‘kon manzili</label>
                  <input
                    type="text"
                    placeholder="Toshkent sh., Navoiy ko‘chasi 14"
                    value={settings.contactAddress || ''}
                    onChange={(e) => setSettings((p) => ({ ...p, contactAddress: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                  />
                </div>

                {/* 🛠️ SAYT TEXNIK REJIMI (MAINTENANCE MODE) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <span>🛠️ Sayt Texnik Rejimi (Maintenance Mode)</span>
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                        Rejim yoqilganda oddiy tashrifchilarga xushmuomala texnik ishlar sahifasi chiqadi. Adminlar va boshqaruv bo‘limi bloklanmaydi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((p) => ({
                          ...p,
                          maintenanceMode: {
                            ...(p.maintenanceMode || {}),
                            isEnabled: !p.maintenanceMode?.isEnabled,
                          },
                        }))
                      }
                      className="cursor-pointer shrink-0"
                    >
                      {settings.maintenanceMode?.isEnabled ? (
                        <ToggleRight className="w-8 h-8 text-amber-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {settings.maintenanceMode?.isEnabled && (
                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-[#6B7280] block mb-1">Texnik xabar sarlavhasi</label>
                        <input
                          type="text"
                          value={settings.maintenanceMode?.title || ''}
                          onChange={(e) =>
                            setSettings((p) => ({
                              ...p,
                              maintenanceMode: { ...(p.maintenanceMode || {}), title: e.target.value },
                            }))
                          }
                          placeholder="Texnik sozlash ishlari olib borilmoqda"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#1E2024] text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B7280] block mb-1">Mijozlarga ko‘rinadigan tushuntirish xabari</label>
                        <textarea
                          rows={2}
                          value={settings.maintenanceMode?.message || ''}
                          onChange={(e) =>
                            setSettings((p) => ({
                              ...p,
                              maintenanceMode: { ...(p.maintenanceMode || {}), message: e.target.value },
                            }))
                          }
                          placeholder="Saytimizni yangilash va sifatini oshirish maqsadida qisqa muddatli texnik sozlash olib borilmoqda..."
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#1E2024] text-xs outline-none resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#6B7280] block mb-1">Taxminiy tayyor bo‘lish vaqti</label>
                          <input
                            type="text"
                            value={settings.maintenanceMode?.estimatedEndTime || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                maintenanceMode: { ...(p.maintenanceMode || {}), estimatedEndTime: e.target.value },
                              }))
                            }
                            placeholder="15-30 daqiqa yoki 16:00 gacha"
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#6B7280] block mb-1">Aloqa telefoni</label>
                          <input
                            type="text"
                            value={settings.maintenanceMode?.contactPhone || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                maintenanceMode: { ...(p.maintenanceMode || {}), contactPhone: e.target.value },
                              }))
                            }
                            placeholder="+998 (90) 123-45-67"
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 💳 KARTA VA TO‘LOV TIZIMLARI SOZLAMALARI */}
                <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/10 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <span>💳 Karta va To‘lov Tizimlari Sozlamalari</span>
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300/80 mt-0.5">
                      Hozirda Payme va Click rasmiy API tayyor bo‘lmaguncha ularni o‘chirib qo‘yishingiz mumkin. Karta raqamingizni kiritib qo‘ysangiz, mijozlar P2P o‘tkazma orqali to‘lov qiladilar.
                    </p>
                  </div>

                  {/* 1. Bank Kartasi (P2P o‘tkazma) */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#16181D] border border-blue-100 dark:border-[#26282E] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] block">
                          Bank Kartasi (P2P o‘tkazma orqali to‘lov)
                        </span>
                        <span className="text-[11px] text-[#6B7280]">
                          Mijoz savatda ushbu karta raqamini nusxa olib, to‘lov chekini jo‘natadi
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((p) => ({
                            ...p,
                            paymentSettings: {
                              ...(p.paymentSettings || {}),
                              bankCard: {
                                ...(p.paymentSettings?.bankCard || {}),
                                isEnabled: !p.paymentSettings?.bankCard?.isEnabled,
                              },
                            },
                          }))
                        }
                        className="cursor-pointer"
                      >
                        {settings.paymentSettings?.bankCard?.isEnabled !== false ? (
                          <ToggleRight className="w-8 h-8 text-blue-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {settings.paymentSettings?.bankCard?.isEnabled !== false && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Karta raqami</label>
                          <input
                            type="text"
                            value={settings.paymentSettings?.bankCard?.cardNumber || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  bankCard: { ...(p.paymentSettings?.bankCard || {}), cardNumber: e.target.value },
                                },
                              }))
                            }
                            placeholder="8600 1234 5678 9012"
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] font-mono text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Karta egasi ismi</label>
                          <input
                            type="text"
                            value={settings.paymentSettings?.bankCard?.cardHolder || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  bankCard: { ...(p.paymentSettings?.bankCard || {}), cardHolder: e.target.value },
                                },
                              }))
                            }
                            placeholder="Abdurashid Ergashev"
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Bank nomi</label>
                          <input
                            type="text"
                            value={settings.paymentSettings?.bankCard?.bankName || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  bankCard: { ...(p.paymentSettings?.bankCard || {}), bankName: e.target.value },
                                },
                              }))
                            }
                            placeholder="TBC Bank / Kapitalbank"
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Telegram Stars (XTR) */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#16181D] border border-blue-100 dark:border-[#26282E] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] block">
                        ⭐ Telegram Stars (XTR to‘lov)
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Telegram Web App ichida Stars orqali to‘g‘ridan-to‘g‘ri to‘lov
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">1 Star:</span>
                        <input
                          type="number"
                          value={settings.paymentSettings?.telegramStars?.rateUzsPerStar || 250}
                          onChange={(e) =>
                            setSettings((p) => ({
                              ...p,
                              paymentSettings: {
                                ...(p.paymentSettings || {}),
                                telegramStars: {
                                  ...(p.paymentSettings?.telegramStars || {}),
                                  rateUzsPerStar: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="w-16 px-2 py-1 text-center rounded border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs font-bold"
                        />
                        <span className="text-[10px] text-gray-500">so‘m</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((p) => ({
                            ...p,
                            paymentSettings: {
                              ...(p.paymentSettings || {}),
                              telegramStars: {
                                ...(p.paymentSettings?.telegramStars || {}),
                                isEnabled: !p.paymentSettings?.telegramStars?.isEnabled,
                              },
                            },
                          }))
                        }
                        className="cursor-pointer"
                      >
                        {settings.paymentSettings?.telegramStars?.isEnabled !== false ? (
                          <ToggleRight className="w-8 h-8 text-amber-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Click & Payme Gateway toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Click */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#16181D] border border-blue-100 dark:border-[#26282E] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] block">Click API</span>
                          <span className="text-[10px] text-gray-500">
                            {settings.paymentSettings?.click?.isEnabled ? '🟢 Yoqilgan' : '⚪ O‘chirilgan (Hozircha)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((p) => ({
                              ...p,
                              paymentSettings: {
                                ...(p.paymentSettings || {}),
                                click: {
                                  ...(p.paymentSettings?.click || {}),
                                  isEnabled: !p.paymentSettings?.click?.isEnabled,
                                },
                              },
                            }))
                          }
                          className="cursor-pointer"
                        >
                          {settings.paymentSettings?.click?.isEnabled ? (
                            <ToggleRight className="w-8 h-8 text-blue-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {settings.paymentSettings?.click?.isEnabled && (
                        <div className="space-y-1.5 pt-1 text-[11px]">
                          <input
                            type="text"
                            placeholder="Service ID"
                            value={settings.paymentSettings?.click?.serviceId || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  click: { ...(p.paymentSettings?.click || {}), serviceId: e.target.value },
                                },
                              }))
                            }
                            className="w-full px-2.5 py-1 rounded border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Merchant ID"
                            value={settings.paymentSettings?.click?.merchantId || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  click: { ...(p.paymentSettings?.click || {}), merchantId: e.target.value },
                                },
                              }))
                            }
                            className="w-full px-2.5 py-1 rounded border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Payme */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#16181D] border border-blue-100 dark:border-[#26282E] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] block">Payme API</span>
                          <span className="text-[10px] text-gray-500">
                            {settings.paymentSettings?.payme?.isEnabled ? '🟢 Yoqilgan' : '⚪ O‘chirilgan (Hozircha)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((p) => ({
                              ...p,
                              paymentSettings: {
                                ...(p.paymentSettings || {}),
                                payme: {
                                  ...(p.paymentSettings?.payme || {}),
                                  isEnabled: !p.paymentSettings?.payme?.isEnabled,
                                },
                              },
                            }))
                          }
                          className="cursor-pointer"
                        >
                          {settings.paymentSettings?.payme?.isEnabled ? (
                            <ToggleRight className="w-8 h-8 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {settings.paymentSettings?.payme?.isEnabled && (
                        <div className="space-y-1.5 pt-1 text-[11px]">
                          <input
                            type="text"
                            placeholder="Payme Merchant ID"
                            value={settings.paymentSettings?.payme?.merchantId || ''}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                paymentSettings: {
                                  ...(p.paymentSettings || {}),
                                  payme: { ...(p.paymentSettings?.payme || {}), merchantId: e.target.value },
                                },
                              }))
                            }
                            className="w-full px-2.5 py-1 rounded border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="primary" type="submit" loading={actionLoading} className="w-full mt-2">
                  Sozlamalarni Saqlash
                </Button>
              </form>
            </div>
          )}

          {/* MIRA AI SETTINGS TAB */}
          {activeTab === 'ai-settings' && (isSuperAdmin || isAdminRole) && (
            <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold">Mira AI Yordamchisi Sozlamalari</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Saytdagi aqlli AI agentining modullarini yoqing, o‘chiring va faollik statistikasini kuzating.
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 self-start sm:self-auto ${
                  settings.aiSettings?.isEnabled !== false
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${settings.aiSettings?.isEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                  {settings.aiSettings?.isEnabled !== false ? 'Mira AI Faol' : 'Mira AI O‘chirilgan'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Jami So‘rovlar</span>
                  <div className="text-2xl font-black mt-1 text-[#17181A] dark:text-[#F3F4F6]">
                    {aiStats?.totalRequests || 0}
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 block">Foydalanuvchilar savollari</span>
                </div>
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Muvaffaqiyatli</span>
                  <div className="text-2xl font-black mt-1 text-emerald-600">
                    {aiStats?.successfulRequests || 0}
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 block">Aniq javob berilgan</span>
                </div>
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">O‘rtacha Tezlik</span>
                  <div className="text-2xl font-black mt-1 text-[#2563EB]">
                    {aiStats?.avgResponseTimeMs || 180} <span className="text-xs font-normal text-[#6B7280]">ms</span>
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 block">Javob qaytarish vaqti</span>
                </div>
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Faol Modullar</span>
                  <div className="text-2xl font-black mt-1 text-amber-600">
                    {Object.values(settings.aiSettings || {}).filter(Boolean).length} / 7
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 block">Ishlayotgan funksiyalar</span>
                </div>
              </div>

              {/* 7 AI Features Toggle Panel */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-4">
                <div className="pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                  <h4 className="font-bold text-sm">Modullar va Imkoniyatlar Boshqaruvi</h4>
                  <p className="text-xs text-[#6B7280]">Har bir modulni alohida yoqish yoki o‘chirish mumkin.</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'isEnabled',
                      title: 'Mira AI Yordamchisi (Asosiy kalit)',
                      desc: 'Saytda pastki o‘ng burchakdagi tugma va suhbat oynasini to‘liq yoqish yoki o‘chirish.',
                    },
                    {
                      key: 'websiteQuestions',
                      title: 'Bol Tortlari haqidagi savol-javoblar',
                      desc: 'Do‘kon manzili, ish vaqti, yetkazib berish narxlari, aloqa va to‘lov turlari bo‘yicha konsultatsiya.',
                    },
                    {
                      key: 'productRecommendations',
                      title: 'Mahsulotlarni qidirish va tavsiya qilish',
                      desc: 'Tort narxlari bo‘yicha ("300 minggacha"), biskvit/krem turi, mehmonsoni bo‘yicha real DB qidiruvi.',
                    },
                    {
                      key: 'orderAssistance',
                      title: 'Buyurtma va Savat bilan ishlash',
                      desc: 'Mijoz talabi bilan mahsulotni to‘g‘ridan-to‘g‘ri savatga qo‘shish va buyurtma holatini 5 bosqichda tekshirish.',
                    },
                    {
                      key: 'voiceAssistant',
                      title: 'Ovoz orqali muloqot (Voice)',
                      desc: 'Mikrofon orqali savol berish va ovozni matnga o‘girish (Web Speech API).',
                    },
                    {
                      key: 'imageUnderstanding',
                      title: 'Rasm orqali tort qidirish (Vision)',
                      desc: 'Foydalanuvchi yuklagan rasm bo‘yicha katalogdan mos keluvchi tortlarni tahlil qilish.',
                    },
                    {
                      key: 'generalAiQuestions',
                      title: 'Umumiy aqlli suhbat (General AI)',
                      desc: 'Tort tayyorlash sirlari, bayram tabriklari va qandolatchilik bo‘yicha umumiy savollarga javob berish.',
                    },
                  ].map((mod) => {
                    const isChecked = settings.aiSettings?.[mod.key] !== false;
                    return (
                      <div
                        key={mod.key}
                        className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2026] flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-0.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#17181A] dark:text-[#F3F4F6]">
                              {mod.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isChecked
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}>
                              {isChecked ? 'Faol' : 'O‘chiq'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                            {mod.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAiSetting(mod.key)}
                          className="shrink-0 p-1 cursor-pointer transition-transform active:scale-95"
                          aria-label={`${mod.title} holatini o‘zgartirish`}
                        >
                          {isChecked ? (
                            <ToggleRight className="w-8 h-8 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GOOGLE GEMINI API CONFIGURATION */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="font-bold text-sm">Google Gemini AI Integratsiyasi</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    geminiApiKeyInput.trim() ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {geminiApiKeyInput.trim() ? 'Gemini API Faol' : 'Mahalliy NLP Faol'}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Google AI Studio orqali olingan Gemini API kalitini kiriting. Kalit kiritilganda Mira eng so‘nggi Gemini 1.5 Flash modeli bilan javob beradi. Kalit kiritilmaganda esa saytning o‘rnatilgan aqlli NLP motori ishlaydi.
                </p>
                <form onSubmit={handleSaveGeminiKey} className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="password"
                    placeholder="AIzaSy... (Gemini API Kaliti)"
                    value={geminiApiKeyInput}
                    onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                    className="w-full flex-1 px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-mono outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <Button variant="primary" type="submit" loading={actionLoading} className="w-full sm:w-auto px-6 cursor-pointer">
                    Kalitni saqlash
                  </Button>
                </form>
              </div>

              {/* AI XOTIRASI & MAXSUS BILIMLAR (MEMORY MANAGER) */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                  <div>
                    <h4 className="font-bold text-sm">Mira AI Xotirasi & Maxsus Bilimlar</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Miraga yangi faktlar o‘rgating (masalan: Sayt yaratuvchisi, yangi qoidalar, bayram aksiyalari). Mira bu faktlarni doim eslab qoladi va mijozlar so‘raganda aytib beradi.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6B7280]">
                    {customMemories.length} ta bilim
                  </span>
                </div>

                {/* Add New Memory Form */}
                <form onSubmit={handleAddMemorySubmit} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] space-y-3">
                  <span className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6] block">Yangi bilim qo‘shish:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Kalit so‘z (Teg)</label>
                      <input
                        type="text"
                        placeholder="Masalan: creator, chegirma"
                        value={newMemoryForm.key}
                        onChange={(e) => setNewMemoryForm({ ...newMemoryForm, key: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#16181D] text-xs outline-none"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Fakt / Bilim matni *</label>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Sayt va Mira AI yaratuvchisi — Abdurashid Ergashev."
                        value={newMemoryForm.fact}
                        onChange={(e) => setNewMemoryForm({ ...newMemoryForm, fact: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#16181D] text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button variant="secondary" size="sm" type="submit" loading={actionLoading} className="cursor-pointer">
                      Xotiraga saqlash
                    </Button>
                  </div>
                </form>

                {/* Memories List Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">
                    Xotiradagi mavjud bilimlar:
                  </span>
                  {customMemories.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#6B7280]">
                      Hozircha maxsus bilimlar kiritilmagan.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E7E9ED]/60 dark:divide-[#272A30]/60">
                      {customMemories.map((mem) => (
                        <div key={mem.id || mem.key} className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] px-2 rounded-xl transition-colors">
                          <div className="space-y-0.5 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] font-mono text-[10px] font-bold uppercase">
                                {mem.key || 'fakt'}
                              </span>
                              {mem.key === 'creator' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                  Loyiha Asoschisi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#17181A] dark:text-[#F3F4F6] font-medium leading-relaxed">
                              {mem.fact}
                            </p>
                          </div>
                          {mem.id !== 'mem-creator' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMemory(mem.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              title="O‘chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN COPILOT CONSOLE */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm">Admin Copilot — Boshqaruv Muloqoti</h4>
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    Administrator uchun maxsus AI intellekti
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Bu yerda Mira bilan bevosita muloqot qilishingiz, savdo hisobotlarini so‘rashingiz yoki unga yangi faktlarni suhbat davomida o‘rgatishingiz mumkin (Masalan: «Eslab qol: Sayt yaratuvchisi Abdurashid Ergashev»).
                </p>

                {/* Quick Query Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Bugungi savdo va tushum qancha?',
                    'Eng xaridorgir va ommabop tortlar qaysi?',
                    'Sayt yaratuvchisi Abdurashid Ergashev deb eslab qol',
                    'Kutilayotgan buyurtmalar nechta?',
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setAdminCopilotInput(prompt);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2026] hover:border-[#2563EB] text-[11px] font-semibold text-[#4B5563] dark:text-[#9CA3AF] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Copilot Messages Log */}
                <div className="max-h-64 overflow-y-auto p-3.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2026] space-y-3 text-xs">
                  {adminCopilotMessages.length === 0 ? (
                    <div className="text-center py-6 text-stone-400">
                      Mira Admin Copilot tayyor. Savol bering yoki yangi ma'lumot o‘rgating.
                    </div>
                  ) : (
                    adminCopilotMessages.map((m, idx) => (
                      <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-xl max-w-lg leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#2563EB] text-white rounded-tr-none'
                            : 'bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] text-[#17181A] dark:text-[#F3F4F6] rounded-tl-none shadow-xs'
                        }`}>
                          <div className="whitespace-pre-line">{m.text}</div>
                        </div>
                        <span className="text-[9px] text-[#9CA3AF] mt-0.5 px-1">{m.time}</span>
                      </div>
                    ))
                  )}
                  {isCopilotTyping && (
                    <div className="text-xs text-[#2563EB] font-semibold flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mira tahlil qilmoqda...</span>
                    </div>
                  )}
                </div>

                {/* Copilot Input */}
                <form onSubmit={handleAdminCopilotSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Savol bering yoki o‘rgating (Masalan: Bugungi tushum qancha?)..."
                    value={adminCopilotInput}
                    onChange={(e) => setAdminCopilotInput(e.target.value)}
                    className="w-full flex-1 px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#16181D] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <Button variant="primary" type="submit" icon={Send} loading={isCopilotTyping} className="px-5 cursor-pointer">
                    Yuborish
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* 7. STAFF MANAGEMENT (Super Admin Only) */}
          {activeTab === 'staff' && isSuperAdmin && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold">Xodimlar Boshqaruvi (RBAC)</h3>
                  <p className="text-xs text-[#6B7280]">Adminlar, qandolatchilar va kuryerlar ro‘yxati.</p>
                </div>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreateStaffModalOpen(true)}>
                  Yangi xodim qo‘shish
                </Button>
              </div>

              {/* MOBILE VIEW: Responsive Cards */}
              <div className="sm:hidden space-y-3">
                {staffList.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">{s.name}</div>
                        <div className="text-xs text-[#6B7280]">{s.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] text-[10px] font-bold uppercase">
                          {s.role}
                        </span>
                        {!['superadmin', 'super_admin'].includes(s.role) && (
                          <button
                            onClick={() => handleDeleteStaff(s._id, s.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {s.phone && (
                      <div className="text-xs text-[#6B7280] pt-1.5 border-t border-[#E7E9ED]/50 dark:border-[#272A30]/50">
                        📞 {s.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Ism</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Telefon</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Rol</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                    {staffList.map((s) => (
                      <tr key={s._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                        <td className="px-4 py-3.5 font-bold max-w-[160px] truncate" title={s.name}>{s.name}</td>
                        <td className="px-4 py-3.5 text-[#6B7280] max-w-[180px] truncate" title={s.email}>{s.email}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{s.phone || '-'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] text-[10px] font-bold uppercase">
                            {s.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {!['superadmin', 'super_admin'].includes(s.role) && (
                            <button
                              onClick={() => handleDeleteStaff(s._id, s.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors"
                              title="O‘chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. REVIEWS RESPONSE (Admin) */}
          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-6 animate-in fade-in duration-200">
              <h3 className="text-base font-bold">Mijozlar Sharhlari & Rasmiy Javoblar</h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-8">Hozircha sharhlar mavjud emas.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">{rev.userName} ({rev.rating} yulduz)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#6B7280]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          {isAdminRole && (
                            <button
                              onClick={() => handleDeleteReview(rev._id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer transition-colors"
                              title="Sharhni o‘chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#4B5563] dark:text-[#D1D5DB]">«{rev.comment}»</p>

                      {rev.adminReply?.text ? (
                        <div className="p-2.5 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 text-xs text-[#2563EB]">
                          <span className="font-bold">Sizning javobingiz:</span> {rev.adminReply.text}
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Rasmiy javob yozing..."
                            value={reviewReplyText[rev._id] || ''}
                            onChange={(e) => setReviewReplyText({ ...reviewReplyText, [rev._id]: e.target.value })}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleReviewReply(rev._id)}>
                            Javob berish
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. BUG REPORTS MANAGEMENT */}
          {activeTab === 'bugs' && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-6 animate-in fade-in duration-200">
              <h3 className="text-base font-bold">Foydalanuvchilardan Tushgan Xatoliklar (Bugs)</h3>

              {bugs.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-8">Tizimda xatoliklar qayd etilmagan.</p>
              ) : (
                <div className="space-y-4">
                  {bugs.map((b) => (
                    <div key={b._id} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] space-y-2">
                      <div className="flex justify-between items-center gap-2 text-xs">
                        <span className="font-bold truncate max-w-[200px] sm:max-w-md" title={b.title}>{b.title}</span>
                        <div className="w-28 shrink-0">
                          <CustomSelect
                            value={b.status}
                            onChange={(val) => handleUpdateBugStatus(b._id, val)}
                            size="sm"
                            options={[
                              { value: 'Yangi', label: 'Yangi' },
                              { value: 'Jarayonda', label: 'Jarayonda' },
                              { value: 'Hal etildi', label: 'Hal etildi' },
                            ]}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">{b.description}</p>
                      <div className="text-[10px] text-[#6B7280] truncate max-w-lg">
                        Yuboruvchi: <span className="font-semibold text-stone-700 dark:text-stone-300">{b.userName}</span> ({b.userEmail}) • {new Date(b.createdAt).toLocaleString()}
                      </div>
                      {b.screenshot && (
                        <button
                          onClick={() => setSelectedBugScreenshot(b.screenshot)}
                          className="text-xs font-semibold text-[#2563EB] hover:underline block pt-1 cursor-pointer"
                        >
                          Skrinshotni ko‘rish
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. PROMO CODES */}
          {activeTab === 'promos' && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold">Chegirma Promokodlari</h3>
                  <p className="text-xs text-[#6B7280]">Marketing aksiyalari uchun promokodlar yarating.</p>
                </div>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreatePromoModalOpen(true)}>
                  Yangi promokod
                </Button>
              </div>

              {/* MOBILE VIEW: Responsive Cards */}
              <div className="sm:hidden space-y-3">
                {promos.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 px-2.5 py-1 rounded-lg">
                        {p.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold">
                          Faol
                        </span>
                        <button onClick={() => handleDeletePromo(p._id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors" title="O‘chirish">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E7E9ED]/50 dark:border-[#272A30]/50">
                      <div>
                        <span className="text-[10px] text-[#6B7280] block">Chegirma</span>
                        <span className="font-bold text-[#111827] dark:text-[#F3F4F6]">
                          {p.discountPercent ? `${p.discountPercent}%` : formatPrice(p.discountAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6B7280] block">Min. Buyurtma</span>
                        <span className="font-medium text-[#4B5563] dark:text-[#9CA3AF]">
                          {formatPrice(p.minOrderAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Kod</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Chegirma</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Min. Buyurtma</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Holat</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                    {promos.map((p) => (
                      <tr key={p._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">{p.code}</td>
                        <td className="px-4 py-3.5 font-bold whitespace-nowrap">{p.discountPercent ? `${p.discountPercent}%` : formatPrice(p.discountAmount)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatPrice(p.minOrderAmount)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold">Faol</span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button onClick={() => handleDeletePromo(p._id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors" title="O‘chirish">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. USERS LIST */}
          {activeTab === 'users' && isAdminRole && (
            <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 sm:p-6 shadow-card space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Mijozlar Ro‘yxati</h3>
                  <p className="text-xs text-[#6B7280]">Ro‘yxatdan o‘tgan barcha mijozlar profillari, hamyon qoldiqlari va hisob holati.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ism, @username yoki email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#6B7280]">Foydalanuvchilar topilmadi.</div>
              ) : (
                <>
                  {/* MOBILE VIEW: Adaptive Cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredUsers.map((u) => (
                      <div key={u._id} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F9FAFB] dark:bg-[#1A1C22] space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">{u.name}</div>
                            {u.username && (
                              <span className="font-mono text-xs font-bold text-[#2563EB]">@{u.username}</span>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isBlocked ? 'bg-red-50 dark:bg-red-950/40 text-red-600' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          }`}>
                            {u.isBlocked ? 'Bloklangan' : 'Faol'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[#6B7280] block">Email</span>
                            <span className="text-[#4B5563] dark:text-[#9CA3AF] truncate block" title={u.email}>{u.email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block">Telefon</span>
                            <span className="text-[#4B5563] dark:text-[#9CA3AF]">{u.phone || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block">Hamyon Balansi</span>
                            <span className="font-bold text-[#2563EB]">{formatPrice(u.walletBalance)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block">Rol</span>
                            {isSuperAdmin && !['superadmin', 'super_admin'].includes(u.role) ? (
                              <div className="mt-0.5">
                                <CustomSelect
                                  value={u.role}
                                  onChange={(val) => handleChangeUserRole(u._id, val)}
                                  size="sm"
                                  options={[
                                    { value: 'customer', label: 'Mijoz' },
                                    { value: 'confectioner', label: 'Qandolatchi' },
                                    { value: 'courier', label: 'Kuryer' },
                                    { value: 'admin', label: 'Admin' },
                                  ]}
                                />
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] text-[10px] font-bold uppercase inline-block">
                                {u.role}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amallar */}
                        <div className="pt-2.5 border-t border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between">
                          <span className="text-[11px] text-[#6B7280] font-medium">Amallar:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setBroadcastForm({
                                  title: '',
                                  message: '',
                                  targetGroup: 'user',
                                  targetUserId: u._id,
                                });
                                setActiveTab('notifications');
                              }}
                              className="p-2 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 cursor-pointer transition-colors"
                              title="Xabar yuborish"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustTargetUser(u);
                                setIsAdjustBalanceModalOpen(true);
                              }}
                              className="p-2 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#2563EB] cursor-pointer transition-colors"
                              title="Balansni tuzatish"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                            {!['superadmin', 'super_admin'].includes(u.role) && (
                              <button
                                onClick={() => handleToggleBlockUser(u._id, u.isBlocked)}
                                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                                  u.isBlocked
                                    ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                    : 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                                }`}
                                title={u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
                              >
                                {u.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP VIEW: Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                      <thead>
                        <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Foydalanuvchi</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Username</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Telefon</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Rol</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Hamyon</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Holat</th>
                          <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                        {filteredUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                            <td className="px-4 py-3.5 font-bold max-w-[150px] truncate" title={u.name}>{u.name}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                              {u.username ? `@${u.username}` : <span className="text-[#9CA3AF] font-normal">-</span>}
                            </td>
                            <td className="px-4 py-3.5 text-[#6B7280] max-w-[160px] truncate" title={u.email}>{u.email}</td>
                            <td className="px-4 py-3.5 text-[#6B7280] whitespace-nowrap">{u.phone || '-'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isSuperAdmin && !['superadmin', 'super_admin'].includes(u.role) ? (
                                <div className="w-32 inline-block text-left">
                                  <CustomSelect
                                    value={u.role}
                                    onChange={(val) => handleChangeUserRole(u._id, val)}
                                    size="sm"
                                    options={[
                                      { value: 'customer', label: 'Mijoz' },
                                      { value: 'confectioner', label: 'Qandolatchi' },
                                      { value: 'courier', label: 'Kuryer' },
                                      { value: 'admin', label: 'Admin' },
                                    ]}
                                  />
                                </div>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] text-[10px] font-bold uppercase">
                                  {u.role}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-[#2563EB] whitespace-nowrap">{formatPrice(u.walletBalance)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {u.isBlocked ? 'Bloklangan' : 'Faol'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setBroadcastForm({
                                      title: '',
                                      message: '',
                                      targetGroup: 'user',
                                      targetUserId: u._id,
                                    });
                                    setActiveTab('notifications');
                                  }}
                                  className="p-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-amber-50 text-amber-600 cursor-pointer"
                                  title="Foydalanuvchiga to‘g‘ridan-to‘g‘ri xabar yuborish"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAdjustTargetUser(u);
                                    setIsAdjustBalanceModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-blue-50 text-[#2563EB] cursor-pointer"
                                  title="Balansni tuzatish"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                </button>
                                {!['superadmin', 'super_admin'].includes(u.role) && (
                                  <button
                                    onClick={() => handleToggleBlockUser(u._id, u.isBlocked)}
                                    className={`p-1.5 rounded-lg border cursor-pointer ${
                                      u.isBlocked
                                        ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                                        : 'border-red-300 text-red-600 hover:bg-red-50'
                                    }`}
                                    title={u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
                                  >
                                    {u.isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}


          {/* 13. CAKES CATALOG MANAGEMENT */}
          {activeTab === 'cakes' && isAdminRole && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Tortlar Katalogi Boshqaruvi</h3>
                  <p className="text-xs text-[#6B7280]">
                    Katalogdagi barcha tortlar ro‘yxati, narxlari va yangi mahsulot qo‘shish.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsAddCakeModalOpen(true)}
                >
                  Yangi tort qo‘shish
                </Button>
              </div>

              {/* Search & Category Filter */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tort nomi yoki tavsifi bo‘yicha qidiruv..."
                    value={cakeSearchQuery}
                    onChange={(e) => setCakeSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                  />
                </div>
                  <div className="w-56 shrink-0">
                    <CustomSelect
                      value={cakeCategoryFilter}
                      onChange={(val) => setCakeCategoryFilter(val)}
                      size="md"
                      options={[
                        { value: 'all', label: 'Barcha toifalar' },
                        ...categories.map((c) => ({ value: c.slug, label: c.name_uz || c.name })),
                      ]}
                    />
                  </div>
                </div>

              {/* Cakes Grid */}
              {filteredCakes.length === 0 ? (
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-12 text-center text-xs text-[#6B7280]">
                  Tortlar topilmadi.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredCakes.map((cake) => (
                    <div
                      key={cake._id}
                      className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors"
                    >
                      <div>
                        <div className="w-full h-44 rounded-xl overflow-hidden bg-[#F7F8FA] dark:bg-[#1F2227] relative mb-3">
                          <img
                            src={cake.image || DEFAULT_CAKE_IMAGE}
                            alt={cake.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                          {cake.is_popular && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 fill-white" /> Xit
                            </span>
                          )}
                          {cake.in_stock === false && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-sm">
                              Tugagan
                            </span>
                          )}
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                            {cake.weight || '1.5 kg'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#2563EB] tracking-wider block">
                            {cake.category_name || cake.category_slug || 'Tort'}
                          </span>
                          <h4 className="text-sm font-bold truncate" title={cake.name}>{cake.name}</h4>
                          <p className="text-[11px] text-[#6B7280] line-clamp-2 h-8">
                            {cake.description || 'Mazali shirinlik'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E7E9ED] dark:border-[#272A30] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#6B7280] block">Narxi</span>
                          <span className="text-sm font-black text-[#17181A] dark:text-[#F3F4F6]">
                            {formatPrice(cake.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCakeStock(cake)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              cake.in_stock === false
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            }`}
                            title={cake.in_stock === false ? 'Sotuvga qaytarish' : 'Tugadi deb belgilash'}
                          >
                            {cake.in_stock === false ? 'Tugagan' : 'Mavjud'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCake(cake)}
                            className="p-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#2563EB] cursor-pointer transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCake(cake._id, cake.name)}
                            className="p-1.5 rounded-lg border border-[#E7E9ED] dark:border-[#272A30] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 14. CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && isAdminRole && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">Kategoriyalar Boshqaruvi</h3>
                  <p className="text-xs text-[#6B7280]">
                    Tortlar toifalari, bo‘limlar va ularning xalqaro nomlari.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Yangi kategoriya
                </Button>
              </div>

              {/* MOBILE VIEW: Responsive Cards (No horizontal scrolling) */}
              <div className="sm:hidden space-y-3">
                {categories.map((cat) => {
                  const cakeCount = cakes.filter((c) => c.category_slug === cat.slug || c.category === cat._id).length;
                  return (
                    <div
                      key={cat._id}
                      className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 shadow-card space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {cat.name_uz || cat.name}
                          </h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-mono text-xs font-semibold">
                            /{cat.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-[11px] font-bold">
                            {cakeCount} ta tort
                          </span>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id, cat.name_uz || cat.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {(cat.name_ru || cat.name_en) && (
                        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#E7E9ED]/60 dark:border-[#272A30]/60 text-xs">
                          <div>
                            <span className="text-[10px] text-[#6B7280] block font-medium">Nomi (RU)</span>
                            <span className="text-[#374151] dark:text-[#D1D5DB] truncate block">{cat.name_ru || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block font-medium">Nomi (EN)</span>
                            <span className="text-[#374151] dark:text-[#D1D5DB] truncate block">{cat.name_en || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW: Full Wide Table */}
              <div className="hidden sm:block bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Nomi (UZ)</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Slug (URL)</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Nomi (RU)</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Nomi (EN)</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Biriktirilgan tortlar</th>
                        <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                      {categories.map((cat) => {
                        const cakeCount = cakes.filter((c) => c.category_slug === cat.slug || c.category === cat._id).length;
                        return (
                          <tr key={cat._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                            <td className="px-4 py-3.5 font-bold text-sm text-[#111827] dark:text-[#F3F4F6] whitespace-nowrap">{cat.name_uz || cat.name}</td>
                            <td className="px-4 py-3.5 font-mono text-[#2563EB] font-semibold whitespace-nowrap">{cat.slug}</td>
                            <td className="px-4 py-3.5 text-[#6B7280] whitespace-nowrap">{cat.name_ru || '-'}</td>
                            <td className="px-4 py-3.5 text-[#6B7280] whitespace-nowrap">{cat.name_en || '-'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-[11px] font-bold">
                                {cakeCount} ta tort
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="p-1.5 text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors"
                                  title="Tahrirlash"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat._id, cat.name_uz || cat.name)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors"
                                  title="O‘chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 15. WALLET & CASHBACK AUDIT TRAIL */}
          {activeTab === 'wallet' && isAdminRole && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Hamyon Operatsiyalari & Keshbek Tarixi</h3>
                  <p className="text-xs text-[#6B7280]">
                    Mijozlarning hamyon balansi harakatlari, keshbek tushumlari va administrator tuzatishlari.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Wallet}
                  onClick={() => {
                    if (usersList.length > 0) {
                      setAdjustTargetUser(usersList[0]);
                    }
                    setIsAdjustBalanceModalOpen(true);
                  }}
                >
                  Balansni qo‘lda tuzatish
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Jami Operatsiyalar</span>
                  <div className="text-2xl font-black mt-1">{transactions.length} <span className="text-sm font-normal text-[#6B7280]">ta</span></div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">Keshbek va yechishlar</span>
                </div>
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Foydalanuvchilar Balansi</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {formatPrice(usersList.reduce((sum, u) => sum + (u.walletBalance || 0), 0))}
                  </div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">Mijozlar hisoblaridagi jami qoldiq</span>
                </div>
                <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 shadow-card">
                  <span className="text-[11px] font-bold uppercase text-[#6B7280]">Keshbek Miqdori</span>
                  <div className="text-2xl font-black text-[#2563EB] mt-1">{settings.cashbackPercent}%</div>
                  <span className="text-[11px] text-[#6B7280] mt-2 block">Har bir yetkazilgan buyurtma uchun</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 sm:p-6 shadow-card">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#6B7280]">
                    Hozircha hamyon operatsiyalari qayd etilmagan.
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW: Adaptive Cards */}
                    <div className="sm:hidden space-y-3">
                      {transactions.map((t) => {
                        const isPositive = (t.amount || 0) > 0;
                        return (
                          <div key={t._id} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F9FAFB] dark:bg-[#1A1C22] space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">{t.user?.name || 'Mijoz'}</div>
                                <div className="text-[11px] text-[#6B7280]">{t.user?.email || t.user?.phone}</div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.type === 'cashback' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                                t.type === 'order_payment' ? 'bg-blue-50 dark:bg-blue-900/30 text-[#2563EB]' :
                                'bg-purple-50 dark:bg-purple-900/30 text-purple-600'
                              }`}>
                                {t.type === 'cashback' ? 'Keshbek' : t.type === 'order_payment' ? 'Buyurtmaga to‘lov' : t.type || 'Tuzatish'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs py-1.5 border-t border-b border-[#E7E9ED]/50 dark:border-[#272A30]/50">
                              <div>
                                <span className="text-[10px] text-[#6B7280] block">Summa</span>
                                <span className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {isPositive ? `+${formatPrice(t.amount)}` : formatPrice(t.amount)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-[#6B7280] block">Yangi Balans</span>
                                <span className="font-bold text-[#17181A] dark:text-[#F3F4F6]">
                                  {formatPrice(t.balanceAfter)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                              <span>{new Date(t.createdAt).toLocaleString()}</span>
                              {(t.reason || t.description) && (
                                <span className="font-medium truncate max-w-[180px]" title={t.reason || t.description}>
                                  {t.reason || t.description}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP VIEW: Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead>
                          <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Sana & Vaqt</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Foydalanuvchi</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Turi</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Summa</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Yangi Balans</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Sabab / Izoh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                          {transactions.map((t) => {
                            const isPositive = (t.amount || 0) > 0;
                            return (
                              <tr key={t._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                                <td className="px-4 py-3.5 text-[11px] text-[#6B7280] whitespace-nowrap">
                                  {new Date(t.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                                  <div>{t.user?.name || 'Mijoz'}</div>
                                  <span className="text-[10px] text-[#6B7280]">{t.user?.email || t.user?.phone}</span>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    t.type === 'cashback' ? 'bg-emerald-50 text-emerald-600' :
                                    t.type === 'order_payment' ? 'bg-blue-50 text-[#2563EB]' :
                                    'bg-purple-50 text-purple-600'
                                  }`}>
                                    {t.type === 'cashback' ? 'Keshbek' : t.type === 'order_payment' ? 'Buyurtmaga to‘lov' : t.type || 'Tuzatish'}
                                  </span>
                                </td>
                                <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {isPositive ? `+${formatPrice(t.amount)}` : formatPrice(t.amount)}
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-[#17181A] dark:text-[#F3F4F6] whitespace-nowrap">
                                  {formatPrice(t.balanceAfter)}
                                </td>
                                <td className="px-4 py-3.5 text-[#6B7280] text-[11px] max-w-xs truncate" title={t.reason || t.description}>
                                  {t.reason || t.description || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 16. SYSTEM AUDIT LOGS */}
          {activeTab === 'logs' && (isAdminRole || isSuperAdmin) && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Tizim Audit Loglari</h3>
                  <p className="text-xs text-[#6B7280]">
                    Administrator va xodimlarning har bir harakati xavfsizlik maqsadida avtomatik qayd etiladi.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Loglar bo‘yicha qidiruv..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#16181D] text-xs outline-none"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 sm:p-6 shadow-card">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#6B7280]">
                    Audit loglari mavjud emas.
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW: Adaptive Cards */}
                    <div className="sm:hidden space-y-3">
                      {filteredLogs.map((log) => (
                        <div key={log._id} className="p-4 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F9FAFB] dark:bg-[#1A1C22] space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-[#111827] dark:text-[#F3F4F6]">{log.actorName || 'Admin'}</div>
                              <div className="text-[10px] text-[#6B7280]">{new Date(log.createdAt).toLocaleString()}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] font-mono text-[10px] font-bold">
                              {log.action}
                            </span>
                          </div>

                          {log.target && (
                            <div className="text-[11px]">
                              <span className="text-[10px] text-[#6B7280]">Obyekt: </span>
                              <span className="font-mono font-medium text-[#4B5563] dark:text-[#9CA3AF]">{log.target}</span>
                            </div>
                          )}

                          {log.details && (
                            <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF] bg-white dark:bg-[#16181D] p-2.5 rounded-lg border border-[#E7E9ED]/70 dark:border-[#272A30]/70">
                              {log.details}
                            </div>
                          )}

                          <div className="text-[10px] text-[#9CA3AF] font-mono text-right">
                            IP: {log.ipAddress || '127.0.0.1'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP VIEW: Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[800px]">
                        <thead>
                          <tr className="border-b border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] bg-[#F9FAFB] dark:bg-[#1A1C22]">
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Vaqt</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Bajaruvchi</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Amal</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Obyekt</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Tafsilotlar</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">IP Manzil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E9ED]/50 dark:divide-[#272A30]/50">
                          {filteredLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] transition-colors">
                              <td className="px-4 py-3.5 text-[11px] text-[#6B7280] whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 font-bold whitespace-nowrap">{log.actorName || 'Admin'}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] font-mono text-[10px] font-bold">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[11px] text-[#6B7280] truncate max-w-[120px]" title={log.target}>
                                {log.target || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-[11px] text-[#4B5563] dark:text-[#9CA3AF] max-w-md">
                                {log.details || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[10px] text-[#6B7280] whitespace-nowrap">
                                {log.ipAddress || '127.0.0.1'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 17. BROADCAST & NOTIFICATIONS MESSAGING CENTER */}
          {activeTab === 'notifications' && isAdminRole && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Xabarnomalar va Bildirishnomalar Markazi</h3>
                  <p className="text-xs text-[#6B7280]">
                    Platformadagi mijozlar va xodimlarga real-time push bildirishnomalar va e’lonlar yuboring.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> Socket.IO + In-App Live
                  </span>
                </div>
              </div>

              {/* Quick Template Cards */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">
                  Tezkor tayyor andozalar (Shablonlar):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {broadcastTemplates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setBroadcastForm({
                          title: tpl.title,
                          message: tpl.message,
                          targetGroup: tpl.targetGroup,
                          targetUserId: '',
                        })
                      }
                      className="p-3.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-white dark:bg-[#16181D] hover:border-amber-500/60 dark:hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
                    >
                      <div className="font-bold text-xs text-[#17181A] dark:text-[#F3F4F6] group-hover:text-amber-600 truncate mb-1">
                        {tpl.title}
                      </div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        {tpl.message}
                      </div>
                      <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-600 dark:text-stone-400 uppercase">
                        {tpl.targetGroup === 'all' ? 'Barchaga' : tpl.targetGroup === 'customers' ? 'Mijozlarga' : 'Xodimlarga'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compose Message Form */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
                  <Send className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-sm">Yangi Xabarnoma Yaratish va Yuborish</h4>
                </div>

                <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Audience Selector */}
                    <div className="md:col-span-5">
                      <label className="text-xs font-bold text-[#6B7280] block mb-1.5">
                        Qabul qiluvchi auditoriya *
                      </label>
                      <CustomSelect
                        value={broadcastForm.targetGroup}
                        onChange={(val) => setBroadcastForm({ ...broadcastForm, targetGroup: val })}
                        size="md"
                        options={[
                          { value: 'all', label: '📢 Barcha foydalanuvchilar (Ommaviy)' },
                          { value: 'customers', label: '🛍️ Faqat mijozlar (Xaridorlar)' },
                          { value: 'admins', label: '🛡️ Administratorlar va xodimlar' },
                          { value: 'user', label: '👤 Aniq bitta foydalanuvchiga (Direct)' },
                        ]}
                      />
                    </div>

                    {/* Direct User Picker if targetGroup === 'user' */}
                    {broadcastForm.targetGroup === 'user' && (
                      <div className="md:col-span-7">
                        <label className="text-xs font-bold text-[#6B7280] block mb-1.5">
                          Foydalanuvchini tanlang *
                        </label>
                        <CustomSelect
                          value={broadcastForm.targetUserId}
                          onChange={(val) => setBroadcastForm({ ...broadcastForm, targetUserId: val })}
                          placeholder="Foydalanuvchi qidirish / tanlash..."
                          size="md"
                          options={usersList.map((u) => ({
                            value: u._id,
                            label: `${u.name} ${u.username ? `(@${u.username})` : ''} - ${u.email}`,
                          }))}
                        />
                      </div>
                    )}

                    {/* Title */}
                    <div className={broadcastForm.targetGroup === 'user' ? 'md:col-span-12' : 'md:col-span-7'}>
                      <label className="text-xs font-bold text-[#6B7280] block mb-1.5">
                        Xabar sarlavhasi *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Yangi yil tortlari buyurtmasi ochildi!"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#6B7280]">
                        Xabarnoma to‘liq matni *
                      </label>
                      <span className="text-[11px] text-[#A8A29E]">
                        {broadcastForm.message.length} belgi
                      </span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      placeholder="Mijozlar yoki xodimlarga yetkazilishi kerak bo‘lgan batafsil ma'lumot, aksiya shartlari yoki e'lon..."
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setBroadcastForm({
                          title: '',
                          message: '',
                          targetGroup: 'all',
                          targetUserId: '',
                        })
                      }
                    >
                      Tozalash
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      icon={Send}
                      loading={broadcastLoading}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md px-6 cursor-pointer"
                    >
                      Xabarnomani tarqatish
                    </Button>
                  </div>
                </form>
              </div>

              {/* Broadcasts History Log */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Yuborilgan So‘nggi Xabarnomalar</h4>
                  <span className="text-xs text-[#6B7280]">
                    Jami: {notificationsList.length} ta
                  </span>
                </div>

                {notificationsList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#6B7280]">
                    Hozircha yuborilgan xabarnomalar mavjud emas.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7E9ED]/60 dark:divide-[#272A30]/60">
                    {notificationsList.slice(0, 15).map((n) => (
                      <div key={n._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F8FA] dark:hover:bg-[#1E2026] px-3 rounded-xl transition-colors">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#17181A] dark:text-[#F3F4F6] truncate max-w-xs sm:max-w-md" title={n.title}>
                              {n.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 uppercase">
                              {n.recipientRole || 'All'}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] shrink-0 whitespace-nowrap text-left sm:text-right">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CREATE STAFF MODAL */}
      {isCreateStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCreateStaffModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#6B7280] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-4">Yangi Xodim Yaratish</h3>
            <form onSubmit={handleCreateStaffSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Ism Familiya *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Parol *</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Xodim Roli *</label>
                <CustomSelect
                  value={staffForm.role}
                  onChange={(val) => setStaffForm({ ...staffForm, role: val })}
                  size="md"
                  options={[
                    { value: 'confectioner', label: 'Qandolatchi (Confectioner)' },
                    { value: 'courier', label: 'Kuryer (Courier)' },
                    { value: 'admin', label: 'Administrator (Admin)' },
                  ]}
                />
              </div>
              <Button variant="primary" type="submit" loading={actionLoading} className="w-full mt-2">
                Xodimni saqlash
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROMO MODAL */}
      {isCreatePromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCreatePromoModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#6B7280] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-4">Yangi Promokod</h3>
            <form onSubmit={handleCreatePromoSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Kod (Katta harflarda) *</label>
                <input
                  type="text"
                  required
                  placeholder="BOLTORT20"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs uppercase font-mono font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Chegirma foizi (%) *</label>
                <input
                  type="number"
                  required
                  placeholder="15"
                  value={promoForm.discountPercent}
                  onChange={(e) => setPromoForm({ ...promoForm, discountPercent: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Minimal buyurtma (so‘m)</label>
                <input
                  type="number"
                  placeholder="200000"
                  value={promoForm.minOrderAmount}
                  onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs outline-none"
                />
              </div>
              <Button variant="primary" type="submit" loading={actionLoading} className="w-full mt-2">
                Promokodni saqlash
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* BUG SCREENSHOT MODAL */}
      {selectedBugScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedBugScreenshot(null)}>
          <div className="bg-white dark:bg-[#16181D] p-3 rounded-2xl max-w-2xl w-full">
            <img src={selectedBugScreenshot} alt="Bug screenshot" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* ADD CAKE MODAL */}
      {isAddCakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button onClick={() => setIsAddCakeModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-1">Yangi Tort Qo‘shish</h3>
            <p className="text-xs text-[#6B7280] mb-4">Katalogga yangi qandolat mahsulotini kiriting.</p>

            <form onSubmit={handleCreateCakeSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tort nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Qizil Baxmal (Red Velvet)"
                  value={cakeForm.name}
                  onChange={(e) => setCakeForm({ ...cakeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6B7280] block mb-1">Kategoriya *</label>
                  <CustomSelect
                    value={cakeForm.category_slug}
                    onChange={(val) => {
                      const selected = categories.find((c) => c.slug === val);
                      setCakeForm({
                        ...cakeForm,
                        category_slug: val,
                        category_name: selected?.name_uz || cakeForm.category_name,
                      });
                    }}
                    size="md"
                    options={categories.map((c) => ({ value: c.slug, label: c.name_uz || c.name }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B7280] block mb-1">Narxi (so‘m) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250000"
                    value={cakeForm.price}
                    onChange={(e) => setCakeForm({ ...cakeForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Vazni (masalan: 1.5 kg)</label>
                <input
                  type="text"
                  placeholder="1.5 kg"
                  value={cakeForm.weight}
                  onChange={(e) => setCakeForm({ ...cakeForm, weight: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              {/* Rasm Tanlash (Galereyadan tanlash yoki qurilmadan yuklash) */}
              <ImagePicker
                value={cakeForm.image}
                onChange={(val) => setCakeForm({ ...cakeForm, image: val })}
                label="Tort rasmi (Galereyadan tanlang yoki qurilmadan yuklang)"
              />

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tavsif</label>
                <textarea
                  rows={2}
                  placeholder="Tort haqida qisqacha ma‘lumot..."
                  value={cakeForm.description}
                  onChange={(e) => setCakeForm({ ...cakeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tarkibi (Ingredientlar)</label>
                <input
                  type="text"
                  placeholder="Belgiya shokoladi, tabiiy qaymoq, vanil..."
                  value={cakeForm.ingredients}
                  onChange={(e) => setCakeForm({ ...cakeForm, ingredients: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="pt-1">
                <Checkbox
                  id="cake_is_popular"
                  checked={cakeForm.is_popular}
                  onChange={(e) => setCakeForm({ ...cakeForm, is_popular: e.target.checked })}
                  label="Xit mahsulot sifatida belgilash"
                  description="Bosh sahifadagi 'Eng mashhur tortlar' bo‘limida aks ettiriladi"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddCakeModalOpen(false)}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={actionLoading}
                  className="flex-1"
                >
                  Tortni saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddCategoryModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#6B7280] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-1">Yangi Kategoriya</h3>
            <p className="text-xs text-[#6B7280] mb-4">Tortlar uchun yangi toifa oching.</p>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (O‘zbekcha) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bento tortlar"
                  value={categoryForm.name_uz}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_uz: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Slug (URL manzili)</label>
                <input
                  type="text"
                  placeholder="bento-tortlar"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (Ruscha)</label>
                <input
                  type="text"
                  placeholder="Бенто торты"
                  value={categoryForm.name_ru}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_ru: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (Inglizcha)</label>
                <input
                  type="text"
                  placeholder="Bento Cakes"
                  value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={actionLoading}
                  className="flex-1"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST WALLET BALANCE MODAL */}
      {isAdjustBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAdjustBalanceModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#6B7280] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-1">Hamyon Balansini Boshqarish</h3>
            <p className="text-xs text-[#6B7280] mb-4">
              Mijoz balansiga mablag‘ qo‘shish yoki yechish (Audit logiga yoziladi).
            </p>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Foydalanuvchi *</label>
                {adjustTargetUser ? (
                  <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] text-xs">
                    <div className="font-bold">{adjustTargetUser.name}</div>
                    <div className="text-[#6B7280] text-[11px]">{adjustTargetUser.email}</div>
                    <div className="text-[#2563EB] font-bold mt-1">
                      Hozirgi balans: {formatPrice(adjustTargetUser.walletBalance)}
                    </div>
                  </div>
                ) : (
                  <CustomSelect
                    value={adjustTargetUser?._id || ''}
                    onChange={(val) => {
                      const u = usersList.find((usr) => usr._id === val);
                      if (u) setAdjustTargetUser(u);
                    }}
                    placeholder="Foydalanuvchini tanlang..."
                    size="md"
                    options={usersList.map((u) => ({
                      value: u._id,
                      label: `${u.name} (${u.email})`,
                    }))}
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">
                  Summa (+ qo‘shish, - yechish) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="+50000 yoki -20000"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-bold outline-none"
                />
                <span className="text-[10px] text-[#6B7280] mt-1 block">
                  Musbat son balansni to‘ldiradi, manfiy son yechib oladi.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">
                  O‘zgartirish sababi (Audit talabi) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bayram aksiyasi bonusi, xatolik kompensatsiyasi"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAdjustBalanceModalOpen(false)}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={actionLoading}
                  className="flex-1"
                >
                  Tasdiqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-[#E7E9ED] dark:border-[#272A30] pr-8">
              <div>
                <span className="font-mono text-xs font-extrabold text-[#2563EB]">
                  #{selectedOrderDetails.orderId}
                </span>
                <h3 className="text-base font-bold">Buyurtma Tafsilotlari</h3>
              </div>
              <div>{getStatusBadge(selectedOrderDetails.status)}</div>
            </div>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Customer Info */}
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] space-y-1.5 text-xs">
                <div className="font-bold text-sm">{selectedOrderDetails.customer_name}</div>
                <div className="text-[#6B7280] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${selectedOrderDetails.customer_phone}`} className="hover:underline text-[#2563EB]">
                    {selectedOrderDetails.customer_phone}
                  </a>
                </div>
                <div className="text-[#6B7280] flex items-start gap-1.5 pt-1 border-t border-[#E7E9ED] dark:border-[#2B2E35]">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{selectedOrderDetails.customer_address}</span>
                </div>
                {selectedOrderDetails.notes && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-[11px]">
                    <span className="font-bold">Mijoz izohi:</span> {selectedOrderDetails.notes}
                  </div>
                )}
              </div>

              {/* Items list */}
              <div>
                <span className="text-[11px] font-bold uppercase text-[#6B7280] block mb-2">Buyurtma qilingan mahsulotlar:</span>
                <div className="space-y-2">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span>{item.name}</span>
                        <span className="text-[#2563EB]">{formatPrice(item.price * (item.quantity || 1))}</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">
                        {item.weight || '1.5 kg'} • {item.quantity || 1} dona
                      </div>
                      {item.customSpecs && (
                        <div className="mt-2 text-[11px] bg-[#F7F8FA] dark:bg-[#1F2227] p-2.5 rounded-lg space-y-0.5 text-[#4B5563] dark:text-[#9CA3AF]">
                          <div><span className="font-semibold">Biskvit:</span> {item.customSpecs.biscuit}</div>
                          <div><span className="font-semibold">Krem:</span> {item.customSpecs.cream}</div>
                          <div><span className="font-semibold">Bezak:</span> {item.customSpecs.decor}</div>
                          {item.customSpecs.greetingText && (
                            <div className="text-[#2563EB] font-serif italic pt-1 border-t border-[#E7E9ED] dark:border-[#2E3138]">
                              Tabrik yozuvi: «{item.customSpecs.greetingText}»
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Mahsulotlar:</span>
                  <span>{formatPrice(selectedOrderDetails.subtotal || selectedOrderDetails.total)}</span>
                </div>
                {selectedOrderDetails.deliveryFee > 0 && (
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Yetkazib berish:</span>
                    <span>{formatPrice(selectedOrderDetails.deliveryFee)}</span>
                  </div>
                )}
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Chegirma:</span>
                    <span>-{formatPrice(selectedOrderDetails.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#E7E9ED] dark:border-[#2B2E35] font-black text-sm">
                  <span>Jami to‘lov:</span>
                  <span className="text-base text-[#2563EB]">{formatPrice(selectedOrderDetails.total)}</span>
                </div>
                <div className="text-[10px] text-[#6B7280] pt-1">
                  To‘lov turi: <strong className="uppercase">{selectedOrderDetails.payment_method}</strong>
                </div>
              </div>

              {/* Status Changer in modal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7280] block">Buyurtma holatini yangilash:</label>
                <CustomSelect
                  value={selectedOrderDetails.status}
                  onChange={(val) => {
                    handleStatusChange(selectedOrderDetails.orderId, val);
                    setSelectedOrderDetails({ ...selectedOrderDetails, status: val });
                  }}
                  size="md"
                  options={getStatusOptionsForUser()}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E9ED] dark:border-[#272A30] flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Receipt}
                onClick={() => window.print()}
                className="flex-1"
              >
                Chop etish
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedOrderDetails(null)}
                className="flex-1"
              >
                Yopish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAKE MODAL */}
      {isEditCakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsEditCakeModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-1">Tortni Tahrirlash</h3>
            <p className="text-xs text-[#6B7280] mb-4">Tort narxi, tarkibi va ma‘lumotlarini yangilang.</p>

            <form onSubmit={handleEditCakeSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tort nomi *</label>
                <input
                  type="text"
                  required
                  value={editCakeForm.name}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6B7280] block mb-1">Kategoriya *</label>
                  <CustomSelect
                    value={editCakeForm.category_slug}
                    onChange={(val) => {
                      const selected = categories.find((c) => c.slug === val);
                      setEditCakeForm({
                        ...editCakeForm,
                        category_slug: val,
                        category_name: selected?.name_uz || editCakeForm.category_name,
                      });
                    }}
                    size="md"
                    options={categories.map((c) => ({ value: c.slug, label: c.name_uz || c.name }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B7280] block mb-1">Narxi (so‘m) *</label>
                  <input
                    type="number"
                    required
                    value={editCakeForm.price}
                    onChange={(e) => setEditCakeForm({ ...editCakeForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Vazni</label>
                <input
                  type="text"
                  value={editCakeForm.weight}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, weight: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <ImagePicker
                value={editCakeForm.image}
                onChange={(val) => setEditCakeForm({ ...editCakeForm, image: val })}
                label="Tort rasmi (Galereyadan tanlang yoki qurilmadan yuklang)"
              />

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tavsif</label>
                <textarea
                  rows={2}
                  value={editCakeForm.description}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Tarkibi (Ingredientlar)</label>
                <input
                  type="text"
                  value={editCakeForm.ingredients}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, ingredients: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Checkbox
                  id="edit_cake_is_popular"
                  checked={editCakeForm.is_popular}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, is_popular: e.target.checked })}
                  label="Xit mahsulot"
                  description="Bosh sahifada aks ettirish"
                />
                <Checkbox
                  id="edit_cake_in_stock"
                  checked={editCakeForm.in_stock}
                  onChange={(e) => setEditCakeForm({ ...editCakeForm, in_stock: e.target.checked })}
                  label="Mavjud (Sotuvda)"
                  description="Belgilanmasa 'Tugagan' ko‘rinadi"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditCakeModalOpen(false)}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={actionLoading}
                  className="flex-1"
                >
                  Yangilash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#6B7280] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold mb-1">Kategoriyani Tahrirlash</h3>
            <p className="text-xs text-[#6B7280] mb-4">Kategoriya nomlarini yangilang.</p>

            <form onSubmit={handleEditCategorySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (O‘zbekcha) *</label>
                <input
                  type="text"
                  required
                  value={editCategoryForm.name_uz}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name_uz: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Slug (URL manzili)</label>
                <input
                  type="text"
                  value={editCategoryForm.slug}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (Ruscha)</label>
                <input
                  type="text"
                  value={editCategoryForm.name_ru}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name_ru: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Nomi (Inglizcha)</label>
                <input
                  type="text"
                  value={editCategoryForm.name_en}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={actionLoading}
                  className="flex-1"
                >
                  Yangilash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
