import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Notification from '../models/Notification.js';
import { socketService } from '../services/socketService.js';
import crypto from 'crypto';

const findOrderSafely = (id) => {
  if (!id) return Promise.resolve(null);
  const isHexObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  return Order.findOne(isHexObjectId ? { $or: [{ orderId: id }, { _id: id }] } : { orderId: id });
};

export const paymentController = {
  /**
   * Get public payment configuration and status
   */
  async getConfig(req, res) {
    const paymeMerchantId = process.env.PAYME_MERCHANT_ID || '64a1234567890abcdef12345';
    const clickServiceId = process.env.CLICK_SERVICE_ID || '12345';
    const clickMerchantId = process.env.CLICK_MERCHANT_ID || '54321';
    const testMode = process.env.PAYMENT_TEST_MODE !== 'false';

    return res.json({
      payme: {
        enabled: true,
        merchantId: paymeMerchantId,
        checkoutUrl: testMode ? 'https://test.paycom.uz' : 'https://checkout.paycom.uz',
      },
      click: {
        enabled: true,
        serviceId: clickServiceId,
        merchantId: clickMerchantId,
        checkoutUrl: 'https://my.click.uz/services/pay',
      },
      card: {
        enabled: true,
        supportedBrands: ['uzcard', 'humo', 'visa', 'mastercard'],
      },
      testMode,
    });
  },

  /**
   * Generate official checkout URL for Payme or Click
   */
  async createPaymentUrl(req, res) {
    try {
      const { provider, orderId, amount, returnUrl, isWalletTopUp } = req.body;

      if (!provider || !amount) {
        return res.status(400).json({ error: 'To‘lov provayderi va summasi talab qilinadi.' });
      }

      const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const redirectUrl = returnUrl || `${clientBaseUrl}/profile?tab=orders`;

      // 1. PAYME URL GENERATION
      if (provider === 'payme') {
        const merchantId = process.env.PAYME_MERCHANT_ID || '64a1234567890abcdef12345';
        const amountInTiyin = Math.round(Number(amount) * 100);
        const transactionParam = isWalletTopUp ? `wallet_${req.user?._id || 'guest'}_${Date.now()}` : orderId;

        // Base64 format: m={merchant_id};ac.{account_field}={order_id};a={amount_in_tiyin}
        const rawString = `m=${merchantId};ac.order_id=${transactionParam};a=${amountInTiyin};c=${encodeURIComponent(redirectUrl)}`;
        const base64Params = Buffer.from(rawString).toString('base64');
        const checkoutBase = process.env.PAYMENT_TEST_MODE === 'false' ? 'https://checkout.paycom.uz' : 'https://test.paycom.uz';
        const paymentUrl = `${checkoutBase}/${base64Params}`;

        return res.json({
          provider: 'payme',
          paymentUrl,
          orderId,
          amount,
        });
      }

      // 2. CLICK URL GENERATION
      if (provider === 'click') {
        const serviceId = process.env.CLICK_SERVICE_ID || '12345';
        const merchantId = process.env.CLICK_MERCHANT_ID || '54321';
        const transactionParam = isWalletTopUp ? `wallet_${req.user?._id || 'guest'}_${Date.now()}` : orderId;

        // Standard Click redirect URL
        const params = new URLSearchParams({
          service_id: serviceId,
          merchant_id: merchantId,
          amount: Number(amount),
          transaction_param: transactionParam,
          return_url: redirectUrl,
        });
        const paymentUrl = `https://my.click.uz/services/pay?${params.toString()}`;

        return res.json({
          provider: 'click',
          paymentUrl,
          orderId,
          amount,
        });
      }

      return res.status(400).json({ error: 'Noma‘lum to‘lov provayderi.' });
    } catch (error) {
      console.error('Create payment URL error:', error);
      return res.status(500).json({ error: 'To‘lov havolasini yaratishda xatolik yuz berdi.' });
    }
  },

  /**
   * Process Direct Card Payment (Uzcard, Humo, Visa, Mastercard)
   */
  async processCardPayment(req, res) {
    try {
      const { orderId, cardNumber, expireDate, cardHolder, amount, isWalletTopUp } = req.body;

      if (!cardNumber || !expireDate || !amount) {
        return res.status(400).json({ error: 'Karta raqami, amal qilish muddati va summa kiritilishi shart.' });
      }

      // Clean card number
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 16 || !/^\d{16}$/.test(cleanCard)) {
        return res.status(400).json({ error: 'Karta raqami 16 ta raqamdan iborat bo‘lishi lozim.' });
      }

      // Validate expiry MM/YY
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expireDate)) {
        return res.status(400).json({ error: 'Amal qilish muddati OO/YY formatida bo‘lishi lozim (masalan, 12/28).' });
      }

      // Detect Card Brand
      let cardBrand = 'Karta';
      if (cleanCard.startsWith('8600')) cardBrand = 'Uzcard';
      else if (cleanCard.startsWith('9860')) cardBrand = 'Humo';
      else if (cleanCard.startsWith('4')) cardBrand = 'Visa';
      else if (/^(5[1-5]|2[2-7])/.test(cleanCard)) cardBrand = 'Mastercard';

      const cardMask = `${cleanCard.slice(0, 4)} **** **** ${cleanCard.slice(-4)}`;
      const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Case A: Wallet Top-Up
      if (isWalletTopUp) {
        if (!req.user) {
          return res.status(401).json({ error: 'Hamyonni to‘ldirish uchun tizimga kiring.' });
        }

        const topUpAmount = Number(amount);
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

        user.walletBalance = (user.walletBalance || 0) + topUpAmount;
        await user.save();

        await WalletTransaction.create({
          user: user._id,
          amount: topUpAmount,
          type: 'topup',
          reason: `${cardBrand} (${cardMask}) orqali hamyon to‘ldirildi`,
          balanceAfter: user.walletBalance,
          createdBy: user._id,
        });

        await Notification.create({
          recipient: user._id,
          recipientRole: 'customer',
          type: 'wallet',
          title: 'Hamyon to‘ldirildi!',
          message: `${cardBrand} (${cardMask}) orqali hisobingizga ${topUpAmount.toLocaleString()} so‘m muvaffaqiyatli o‘tkazildi.`,
          link: '/profile',
        });

        return res.json({
          success: true,
          message: `${topUpAmount.toLocaleString()} so‘m muvaffaqiyatli qabul qilindi va hamyoningizga qo‘shildi!`,
          transactionId,
          cardMask,
          cardBrand,
          newBalance: user.walletBalance,
        });
      }

      // Case B: Order Payment
      if (!orderId) {
        return res.status(400).json({ error: 'Buyurtma raqami topilmadi.' });
      }

      const order = await findOrderSafely(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Buyurtma topilmadi.' });
      }

      // Update Order Status to Paid
      order.payment_status = 'paid';
      order.payment_method = 'card';
      order.payment_details = {
        provider: cardBrand.toLowerCase(),
        cardBrand,
        cardMask,
        transactionId,
        amount: Number(amount),
        cardHolder: cardHolder || 'Mijoz',
        paidAt: new Date(),
      };

      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      const history = order.status_history || [];
      history.push({
        previous_status: order.status,
        new_status: order.status,
        changed_by: `Karta To‘lovi (${cardBrand})`,
        changed_at: new Date(),
      });
      order.status_history = history;

      await order.save();

      // In-app Notification for customer
      if (order.customer) {
        const notif = await Notification.create({
          recipient: order.customer,
          recipientRole: 'customer',
          type: 'order',
          title: '💳 To‘lov muvaffaqiyatli qabul qilindi!',
          message: `#${order.orderId} raqamli buyurtmangiz uchun ${Number(amount).toLocaleString()} so‘m ${cardBrand} (${cardMask}) orqali to‘landi.`,
          link: '/profile?tab=orders',
        });
        socketService.emitNotification(order.customer.toString(), notif);
      }

      // Notify realtime updates
      socketService.emitOrderStatus(order);

      return res.json({
        success: true,
        message: 'To‘lov muvaffaqiyatli amalga oshirildi! Buyurtmangiz tasdiqlandi.',
        transactionId,
        cardMask,
        cardBrand,
        order,
      });
    } catch (error) {
      console.error('Process card payment error:', error);
      return res.status(500).json({ error: 'Karta orqali to‘lovni amalga oshirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Payme Merchant Webhook (JSON-RPC 2.0 endpoint)
   */
  async handlePaymeWebhook(req, res) {
    const { method, params, id } = req.body || {};

    // Standard Payme response handlers
    switch (method) {
      case 'CheckPerformTransaction': {
        const orderId = params?.account?.order_id;
        const order = await findOrderSafely(orderId);
        if (!order) {
          return res.json({
            error: { code: -31050, message: { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' } },
            id,
          });
        }
        return res.json({
          result: {
            allow: true,
            detail: {
              receipt_type: 0,
              items: (order.items || []).map((it) => ({
                title: it.name,
                price: Math.round(it.price * 100),
                count: it.quantity,
                code: '10702001001000000',
                vat_percent: 0,
                package_code: '123456',
              })),
            },
          },
          id,
        });
      }

      case 'CreateTransaction': {
        return res.json({
          result: {
            create_time: Date.now(),
            transaction: `PAYME_${Date.now()}`,
            state: 1,
          },
          id,
        });
      }

      case 'PerformTransaction': {
        const orderId = params?.account?.order_id;
        if (orderId) {
          const order = await findOrderSafely(orderId);
          if (order) {
            order.payment_status = 'paid';
            order.payment_method = 'payme';
            if (order.status === 'pending') order.status = 'confirmed';
            await order.save();
            socketService.emitOrderStatus(order);
          }
        }
        return res.json({
          result: {
            transaction: params?.id || `PAYME_${Date.now()}`,
            perform_time: Date.now(),
            state: 2,
          },
          id,
        });
      }

      case 'CheckTransaction': {
        return res.json({
          result: {
            create_time: Date.now() - 5000,
            perform_time: Date.now(),
            cancel_time: 0,
            transaction: params?.id,
            state: 2,
            reason: null,
          },
          id,
        });
      }

      case 'CancelTransaction': {
        return res.json({
          result: {
            transaction: params?.id,
            cancel_time: Date.now(),
            state: -1,
          },
          id,
        });
      }

      default:
        return res.json({
          error: { code: -32601, message: { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' } },
          id,
        });
    }
  },

  /**
   * Click Merchant Webhook (Prepare & Complete)
   */
  async handleClickWebhook(req, res) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string,
    } = req.body || {};

    // action === 0 => Prepare
    if (Number(action) === 0) {
      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: Date.now(),
        error: 0,
        error_note: 'Success',
      });
    }

    // action === 1 => Complete
    if (Number(action) === 1) {
      if (merchant_trans_id) {
        const order = await findOrderSafely(merchant_trans_id);
        if (order) {
          order.payment_status = 'paid';
          order.payment_method = 'click';
          if (order.status === 'pending') order.status = 'confirmed';
          await order.save();
          socketService.emitOrderStatus(order);
        }
      }

      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: Date.now(),
        error: 0,
        error_note: 'Success',
      });
    }

    return res.json({ error: -1, error_note: 'Invalid action' });
  },
};
