import Order from '../models/Order.js';
import Cake from '../models/Cake.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Notification from '../models/Notification.js';
import AdminLog from '../models/AdminLog.js';
import Settings from '../models/Settings.js';
import PromoCode from '../models/PromoCode.js';
import { emailService } from '../services/emailService.js';
import { socketService } from '../services/socketService.js';
import { telegramBotService } from '../services/telegramBotService.js';

const findOrderSafely = (id) => {
  if (!id) return Promise.resolve(null);
  const isHexObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  return Order.findOne(isHexObjectId ? { $or: [{ orderId: id }, { _id: id }] } : { orderId: id });
};

/**
 * Handle all post-delivery actions: cashback, review invitation, in-app notification, email receipt & sockets
 */
async function handleOrderDeliveryCompletion(order, changedBy = 'Tizim') {
  try {
    let customer = null;
    let cashbackAmount = 0;

    if (order.customer) {
      customer = await User.findById(order.customer);
      const settings = (await Settings.findOne()) || { cashbackPercent: 3 };
      const cashbackPercent = settings.cashbackPercent || 3;
      cashbackAmount = Math.round((order.subtotal * cashbackPercent) / 100);

      if (customer && cashbackAmount > 0) {
        customer.walletBalance = (customer.walletBalance || 0) + cashbackAmount;
        await customer.save();

        await WalletTransaction.create({
          user: customer._id,
          amount: cashbackAmount,
          type: 'cashback',
          reason: `Buyurtma #${order.orderId} uchun ${cashbackPercent}% keshbek`,
          balanceAfter: customer.walletBalance,
          createdBy: customer._id,
        });

        await Notification.create({
          recipient: customer._id,
          recipientRole: 'customer',
          type: 'wallet',
          title: 'Hamyoningiz to‘ldirildi!',
          message: `#${order.orderId} buyurtmangiz uchun ${cashbackAmount.toLocaleString()} so‘m keshbek hisobingizga qo‘shildi.`,
          link: '/profile',
        });
      }

      // Always create review invitation in in-app notification
      const notif = await Notification.create({
        recipient: customer ? customer._id : order.customer,
        recipientRole: 'customer',
        type: 'review_prompt',
        title: '⭐️ Buyurtmangiz yetkazildi! Taassurotingizni baholang',
        message: `#${order.orderId} buyurtmangiz muvaffaqiyatli yetkazildi. Mahsulot va xizmatimizni baholab fikr qoldiring!`,
        link: `/profile?tab=reviews&orderId=${order.orderId}`,
      });
      socketService.emitNotification(order.customer.toString(), notif);
      socketService.emitOrderDelivered(order, notif);
    }

    // Send real email notification with direct review button
    const targetEmail = order.customer_email || (customer && customer.email);
    if (targetEmail) {
      const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const reviewUrl = `${clientBaseUrl}/profile?tab=reviews&orderId=${order.orderId}`;
      emailService
        .sendOrderDeliveredEmail(order, targetEmail, {
          cashbackAmount,
          reviewUrl,
        })
        .catch((err) => console.error('Delivery email failed:', err.message));
    }

    socketService.emitOrderStatus(order);
  } catch (err) {
    console.error('Error handling order delivery completion:', err);
  }
}

export const orderController = {
  handleOrderDeliveryCompletion,
  /**
   * Create new order with strict server-side price validation
   */
  async createOrder(req, res) {
    try {
      const {
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        notes,
        items,
        payment_method,
        promoCode,
        customCakeConfig,
      } = req.body;

      if (!customer_name || !customer_phone || !customer_address || !items || !items.length) {
        return res.status(400).json({ error: 'Ism, telefon, manzil va kamida 1 ta mahsulot kiritilishi shart.' });
      }

      // Check store open status
      const settings = (await Settings.findOne()) || {
        isStoreOpen: true,
        deliveryFee: 15000,
        freeDeliveryThreshold: 300000,
        cashbackPercent: 3,
      };

      if (!settings.isStoreOpen) {
        return res.status(400).json({
          error: 'Do‘kon hozirda yopiq yoki texnik tanaffusda. Iltimos, keyinroq buyurtma bering.',
        });
      }

      // Validate products and compute real subtotal
      let subtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        let price = 0;
        let cake = null;

        if (item.isCustom) {
          // Custom cake price from builder configuration
          price = Number(item.price) || 250000;
        } else if (item.id && item.id.length === 24) {
          cake = await Cake.findById(item.id);
          price = cake ? cake.price : Number(item.price) || 250000;
        } else if (item.id) {
          cake = await Cake.findOne({ name: item.name });
          price = cake ? cake.price : Number(item.price) || 250000;
        } else {
          price = Number(item.price) || 250000;
        }

        const quantity = Math.max(1, Number(item.quantity) || 1);
        subtotal += price * quantity;

        verifiedItems.push({
          cake: cake ? cake._id : null,
          name: cake ? cake.name : item.name,
          weight: item.weight || (cake ? cake.weight : '1.5 kg'),
          price,
          quantity,
          isCustom: Boolean(item.isCustom),
          customSpecs: item.customSpecs || null,
        });

        if (cake) {
          cake.salesCount = (cake.salesCount || 0) + quantity;
          await cake.save();
        }
      }

      // Check promo code if supplied
      let discount = 0;
      let appliedPromo = '';
      if (promoCode) {
        const promo = await PromoCode.findOne({ code: promoCode.toUpperCase().trim() });
        if (promo && promo.isActive) {
          const isValidTime = !promo.expiresAt || new Date(promo.expiresAt) >= new Date();
          const isValidUses = promo.maxUses === 0 || promo.usedCount < promo.maxUses;
          const isValidMin = promo.minOrderAmount === 0 || subtotal >= promo.minOrderAmount;

          if (isValidTime && isValidUses && isValidMin) {
            if (promo.discountPercent > 0) {
              discount = Math.round((subtotal * promo.discountPercent) / 100);
            } else if (promo.discountAmount > 0) {
              discount = promo.discountAmount;
            }
            discount = Math.min(discount, subtotal);
            appliedPromo = promo.code;

            promo.usedCount = (promo.usedCount || 0) + 1;
            await promo.save();
          }
        }
      }

      const delivery_fee = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
      const total = Math.max(0, subtotal - discount) + delivery_fee;
      const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

      // Wallet payment check if requested
      const customerId = req.user ? req.user._id : null;
      let paymentStatus = 'pending';

      if (payment_method === 'wallet') {
        if (!req.user) {
          return res.status(400).json({ error: 'Hamyon orqali to‘lash uchun tizimga kirishingiz lozim.' });
        }
        if (req.user.walletBalance < total) {
          return res.status(400).json({
            error: `Hamyonda mablag‘ yetarli emas. Joriy balans: ${req.user.walletBalance.toLocaleString()} so‘m. Kerakli summa: ${total.toLocaleString()} so‘m.`,
          });
        }

        // Deduct from wallet
        req.user.walletBalance -= total;
        await req.user.save();

        await WalletTransaction.create({
          user: req.user._id,
          amount: -total,
          type: 'order_payment',
          reason: `Buyurtma #${orderId} uchun to‘lov`,
          balanceAfter: req.user.walletBalance,
        });

        paymentStatus = 'paid';
      }

      const order = await Order.create({
        orderId,
        customer: customerId,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email ? customer_email.trim() : '',
        customer_address: customer_address.trim(),
        notes: notes ? notes.trim() : '',
        items: verifiedItems,
        subtotal,
        delivery_fee,
        discount,
        promoCode: appliedPromo,
        total,
        status: 'pending',
        payment_method: payment_method || 'cash',
        payment_status: paymentStatus,
        customCakeConfig: customCakeConfig || null,
        status_history: [
          {
            previous_status: 'none',
            new_status: 'pending',
            changed_by: req.user ? req.user.name : 'Mijoz',
            changed_at: new Date(),
          },
        ],
      });

      // Socket.IO real-time broadcast to admins
      socketService.emitNewOrder(order);

      // Telegram Bot Admin notification
      telegramBotService.notifyNewOrder(order);

      // Telegram Bot Customer notification (if linked)
      telegramBotService.notifyCustomerNewOrder(order);

      // Create Admin Notification
      await Notification.create({
        recipientRole: 'admins',
        type: 'new_order',
        title: `Yangi buyurtma #${order.orderId}`,
        message: `${order.customer_name} tomonidan ${order.total.toLocaleString()} so‘mlik yangi buyurtma qabul qilindi.`,
        link: `/admin`,
      });

      // Send Nodemailer Email Confirmation
      if (customer_email) {
        emailService.sendOrderConfirmation(order).catch((err) => {
          console.error('Email error on order creation:', err.message);
        });
      }

      return res.status(201).json({
        message: 'Buyurtmangiz muvaffaqiyatli qabul qilindi!',
        order,
      });
    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ error: 'Buyurtmani rasmiylashtirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(req, res) {
    try {
      const { status, limit = 50, page = 1 } = req.query;
      const filter = {};
      if (status && status !== 'all') filter.status = status;

      const orders = await Order.find(filter);
      return res.json({ orders });
    } catch (error) {
      return res.status(500).json({ error: 'Buyurtmalarni yuklashda xatolik.' });
    }
  },

  /**
   * Get orders for authenticated customer
   */
  async getUserOrders(req, res) {
    try {
      const orders = await Order.find({ customer: req.user._id.toString() }).sort({ createdAt: -1 });
      return res.json({ orders: orders || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Foydalanuvchi buyurtmalarini yuklashda xatolik.' });
    }
  },

  /**
   * Get Kitchen Queue Orders (Confectioner portal: confirmed, preparing)
   */
  async getKitchenOrders(req, res) {
    try {
      const orders = await Order.find({ status: ['pending', 'confirmed', 'preparing'] }).sort({ createdAt: -1 });
      return res.json({ orders });
    } catch (error) {
      return res.status(500).json({ error: 'Oshxona buyurtmalarini yuklashda xatolik.' });
    }
  },

  /**
   * Confectioner updates status: preparing -> ready
   */
  async updateKitchenStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, kitchenNotes } = req.body;

      const order = await findOrderSafely(id);
      if (!order) {
        return res.status(404).json({ error: 'Buyurtma topilmadi.' });
      }

      const prevStatus = order.status;
      order.status = status || 'ready';
      if (kitchenNotes) order.kitchenNotes = kitchenNotes;

      const history = order.status_history || [];
      history.push({
        previous_status: prevStatus,
        new_status: order.status,
        changed_by: req.user.name,
        changed_at: new Date(),
      });
      order.status_history = history;

      await order.save();

      socketService.emitOrderStatus(order);

      return res.json({
        message: `Buyurtma holati «${order.status}»ga o‘zgartirildi.`,
        order,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Holatni yangilashda xatolik.' });
    }
  },

  /**
   * Get Courier Orders (ready, assigned, delivering)
   */
  async getCourierOrders(req, res) {
    try {
      const orders = await Order.find({ status: ['ready', 'assigned', 'delivering'] });
      return res.json({ orders });
    } catch (error) {
      return res.status(500).json({ error: 'Kuryer buyurtmalarini yuklashda xatolik.' });
    }
  },

  /**
   * Courier confirms delivery -> triggers cashback to customer!
   */
  async confirmDelivery(req, res) {
    try {
      const { id } = req.params;

      const order = await findOrderSafely(id);
      if (!order) {
        return res.status(404).json({ error: 'Buyurtma topilmadi.' });
      }

      const prevStatus = order.status;
      order.status = 'delivered';
      order.payment_status = 'paid';

      const history = order.status_history || [];
      history.push({
        previous_status: prevStatus,
        new_status: 'delivered',
        changed_by: req.user.name,
        changed_at: new Date(),
      });
      order.status_history = history;

      await order.save();

      // Trigger full delivery notification, cashback & review invitation
      await handleOrderDeliveryCompletion(order, req.user?.name || 'Kuryer');

      // Notify customer on Telegram if linked
      telegramBotService.notifyCustomerOrderStatus(order);

      return res.json({
        message: `Buyurtma #${order.orderId} muvaffaqiyatli yetkazildi deb tasdiqlandi.`,
        order,
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      return res.status(500).json({ error: 'Yetkazishni tasdiqlashda xatolik.' });
    }
  },

  /**
   * Update order status (Admin / Superadmin)
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Noto‘g‘ri buyurtma holati.' });
      }

      const order = await findOrderSafely(id);
      if (!order) {
        return res.status(404).json({ error: 'Buyurtma topilmadi.' });
      }

      const prevStatus = order.status;
      order.status = status;

      if (status === 'delivered') {
        order.payment_status = 'paid';
      }

      const history = order.status_history || [];
      history.push({
        previous_status: prevStatus,
        new_status: status,
        changed_by: req.user.name,
        changed_at: new Date(),
      });
      order.status_history = history;

      await order.save();

      // Trigger cashback, email, and review invitation if delivered
      if (status === 'delivered' && prevStatus !== 'delivered') {
        await handleOrderDeliveryCompletion(order, req.user?.name || 'Admin');
      } else {
        socketService.emitOrderStatus(order);
      }

      // Notify customer on Telegram if linked
      telegramBotService.notifyCustomerOrderStatus(order);

      // Log action
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'update_order_status',
        target: `Buyurtma #${order.orderId}`,
        details: `${prevStatus} -> ${status}`,
        ipAddress: req.ip || '',
      });

      socketService.emitOrderStatus(order);

      return res.json({
        message: `Buyurtma holati «${status}»ga o‘zgartirildi.`,
        order,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Holatni yangilashda xatolik.' });
    }
  },

  /**
   * Get single order details / printable receipt
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await findOrderSafely(id);
      if (!order) {
        return res.status(404).json({ error: 'Buyurtma topilmadi.' });
      }
      return res.json({ order });
    } catch (error) {
      return res.status(500).json({ error: 'Buyurtmani yuklashda xatolik.' });
    }
  },
};
