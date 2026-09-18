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
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO settings (_id, isStoreOpen, cashbackPercent, deliveryFee, deliveryFeeOutside, freeDeliveryThreshold, workingHours, contactPhone, contactTelegram, contactInstagram, contactAddress, aiSettings_json, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      doc.createdAt
    );

    return wrapDoc('settings', doc);
  }
}

export default SettingsProxy;
