import mongoose from 'mongoose';
import { sqlite, wrapDoc } from './dbAdapter.js';
import crypto from 'crypto';

const settingsSchema = new mongoose.Schema(
  {
    isStoreOpen: { type: Boolean, default: true },
    cashbackPercent: { type: Number, default: 3 },
    deliveryFee: { type: Number, default: 15000 },
    deliveryFeeOutside: { type: Number, default: 35000 },
    freeDeliveryThreshold: { type: Number, default: 300000 },
    workingHours: { type: String, default: '09:00 - 21:00' },
    contactPhone: { type: String, default: '+998 (90) 123-45-67' },
    contactTelegram: { type: String, default: '@boltortlari_admin' },
    contactInstagram: { type: String, default: 'boltortlari_uz' },
    contactAddress: { type: String, default: 'Toshkent sh., Navoiy ko‘chasi 14' },
    mandatoryChannel: { type: String, default: '' },
    isMandatorySubEnabled: { type: Boolean, default: false },
    aiSettings: {
      isEnabled: { type: Boolean, default: true },
      websiteQuestions: { type: Boolean, default: true },
      productRecommendations: { type: Boolean, default: true },
      orderAssistance: { type: Boolean, default: true },
      voiceAssistant: { type: Boolean, default: true },
      generalAiQuestions: { type: Boolean, default: true },
      imageUnderstanding: { type: Boolean, default: true },
      geminiApiKey: { type: String, default: '' },
      customMemories: {
        type: Array,
        default: [
          {
            id: 'mem-creator',
            key: 'creator',
            fact: 'Sayt va Mira AI yaratuvchisi hamda dasturchisi — Abdurashid Ergashev.',
            category: 'creator',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
    paymentSettings: {
      click: {
        isEnabled: { type: Boolean, default: false },
        merchantId: { type: String, default: '' },
        serviceId: { type: String, default: '' },
        secretKey: { type: String, default: '' },
        isTestMode: { type: Boolean, default: true },
      },
      payme: {
        isEnabled: { type: Boolean, default: false },
        merchantId: { type: String, default: '' },
        secretKey: { type: String, default: '' },
        isTestMode: { type: Boolean, default: true },
      },
      bankCard: {
        isEnabled: { type: Boolean, default: true },
        cardNumber: { type: String, default: '8600 1234 5678 9012' },
        cardHolder: { type: String, default: 'Abdurashid Ergashev' },
        bankName: { type: String, default: 'TBC Bank' },
        instructions: {
          type: String,
          default: "To'lov qilgach, chekni Telegram orqali yuboring yoki buyurtma izohida qoldiring.",
        },
      },
      telegramStars: {
        isEnabled: { type: Boolean, default: true },
        rateUzsPerStar: { type: Number, default: 250 },
      },
      cash: {
        isEnabled: { type: Boolean, default: true },
      },
    },
    maintenanceMode: {
      isEnabled: { type: Boolean, default: false },
      title: { type: String, default: 'Texnik sozlash ishlari olib borilmoqda' },
      message: {
        type: String,
        default: 'Saytimizni yanada yaxshilash va tezlashtirish maqsadida qisqa muddatli texnik sozlash olib borilmoqda. Tez orada qaytamiz!',
      },
      estimatedEndTime: { type: String, default: 'Tez orada' },
      contactPhone: { type: String, default: '+998 (90) 123-45-67' },
      contactTelegram: { type: String, default: '@boltortlari_admin' },
    },
  },
  { timestamps: true }
);

const MongooseSettings = mongoose.model('Settings', settingsSchema);

class SettingsProxy {
  static async findOne() {
    if (mongoose.connection.readyState === 1) {
      return MongooseSettings.findOne();
    }
    let row = sqlite.prepare('SELECT * FROM settings LIMIT 1').get();
    if (!row) {
      // Create initial settings
      return this.create({});
    }
    return wrapDoc('settings', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseSettings.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const defaultAiSettings = {
      isEnabled: true,
      websiteQuestions: true,
      productRecommendations: true,
      orderAssistance: true,
      voiceAssistant: true,
      generalAiQuestions: true,
      imageUnderstanding: true,
      geminiApiKey: '',
      customMemories: [
        {
          id: 'mem-creator',
          key: 'creator',
          fact: 'Sayt va Mira AI yaratuvchisi hamda dasturchisi — Abdurashid Ergashev.',
          category: 'creator',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const defaultPaymentSettings = {
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
    };

    const defaultMaintenanceMode = {
      isEnabled: false,
      title: 'Texnik sozlash ishlari olib borilmoqda',
      message: 'Saytimizni yanada yaxshilash va tezlashtirish maqsadida qisqa muddatli texnik sozlash olib borilmoqda. Tez orada qaytamiz!',
      estimatedEndTime: 'Tez orada',
      contactPhone: '+998 (90) 123-45-67',
      contactTelegram: '@boltortlari_admin',
    };

    const doc = {
      _id: id,
      isStoreOpen: data.isStoreOpen !== false ? 1 : 0,
      cashbackPercent: data.cashbackPercent !== undefined ? Number(data.cashbackPercent) : 3,
      deliveryFee: data.deliveryFee !== undefined ? Number(data.deliveryFee) : 15000,
      deliveryFeeOutside: data.deliveryFeeOutside !== undefined ? Number(data.deliveryFeeOutside) : 35000,
      freeDeliveryThreshold: data.freeDeliveryThreshold !== undefined ? Number(data.freeDeliveryThreshold) : 300000,
      workingHours: data.workingHours || '09:00 - 21:00',
      contactPhone: data.contactPhone || '+998 (90) 123-45-67',
      contactTelegram: data.contactTelegram || '@boltortlari_admin',
      contactInstagram: data.contactInstagram || 'boltortlari_uz',
      contactAddress: data.contactAddress || 'Toshkent sh., Navoiy ko‘chasi 14',
      aiSettings_json: JSON.stringify(data.aiSettings || defaultAiSettings),
      paymentSettings_json: JSON.stringify(data.paymentSettings || defaultPaymentSettings),
      maintenanceMode_json: JSON.stringify(data.maintenanceMode || defaultMaintenanceMode),
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO settings (_id, isStoreOpen, cashbackPercent, deliveryFee, deliveryFeeOutside, freeDeliveryThreshold, workingHours, contactPhone, contactTelegram, contactInstagram, contactAddress, aiSettings_json, paymentSettings_json, maintenanceMode_json, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.isStoreOpen,
      doc.cashbackPercent,
      doc.deliveryFee,
      doc.deliveryFeeOutside,
      doc.freeDeliveryThreshold,
      doc.workingHours,
      doc.contactPhone,
      doc.contactTelegram,
      doc.contactInstagram,
      doc.contactAddress,
      doc.aiSettings_json,
      doc.paymentSettings_json,
      doc.maintenanceMode_json,
      doc.createdAt
    );

    return wrapDoc('settings', doc);
  }
}

export default SettingsProxy;
