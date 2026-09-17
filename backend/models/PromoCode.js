import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MongoosePromoCode = mongoose.model('PromoCode', promoCodeSchema);

class PromoCodeProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePromoCode.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM promo_codes WHERE 1=1';
      const params = [];
      if (filter.isActive !== undefined) {
        sql += ' AND isActive = ?';
        params.push(filter.isActive ? 1 : 0);
      }
      sql += ' ORDER BY createdAt DESC';
      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('promo_codes', r));
    });
  }

  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePromoCode.findOne(filter);
    }
    if (filter.code) {
      const row = sqlite.prepare('SELECT * FROM promo_codes WHERE code = ?').get(filter.code.toUpperCase().trim());
      return wrapDoc('promo_codes', row);
    }
    const row = sqlite.prepare('SELECT * FROM promo_codes LIMIT 1').get();
    return wrapDoc('promo_codes', row);
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePromoCode.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM promo_codes WHERE _id = ?').get(id?.toString());
    return wrapDoc('promo_codes', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePromoCode.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      code: data.code.toUpperCase().trim(),
      discountPercent: Number(data.discountPercent) || 0,
      discountAmount: Number(data.discountAmount) || 0,
      minOrderAmount: Number(data.minOrderAmount) || 0,
      maxUses: Number(data.maxUses) || 0,
      usedCount: 0,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      isActive: data.isActive !== false ? 1 : 0,
      createdAt: now,
    };

    sqlite.prepare(`
      INSERT INTO promo_codes (_id, code, discountPercent, discountAmount, minOrderAmount, maxUses, usedCount, expiresAt, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.code,
      doc.discountPercent,
      doc.discountAmount,
      doc.minOrderAmount,
      doc.maxUses,
      doc.usedCount,
      doc.expiresAt,
      doc.isActive,
      doc.createdAt
    );

    return wrapDoc('promo_codes', doc);
  }

  static async deleteOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePromoCode.deleteOne(filter);
    }
    if (filter._id) {
      sqlite.prepare('DELETE FROM promo_codes WHERE _id = ?').run(filter._id);
    } else if (filter.code) {
      sqlite.prepare('DELETE FROM promo_codes WHERE code = ?').run(filter.code.toUpperCase().trim());
    }
    return { deletedCount: 1 };
  }
}

export default PromoCodeProxy;
