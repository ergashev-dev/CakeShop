import mongoose from 'mongoose';
import { sqlite, wrapDoc } from './dbAdapter.js';
import crypto from 'crypto';

const verificationCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const MongooseVC = mongoose.model('VerificationCode', verificationCodeSchema);

class VerificationCodeProxy {
  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseVC.findOne(filter);
    }
    const row = sqlite.prepare('SELECT * FROM verification_codes WHERE email = ? ORDER BY createdAt DESC LIMIT 1').get(filter.email.toLowerCase().trim());
    return wrapDoc('verification_codes', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseVC.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      email: data.email.toLowerCase().trim(),
      codeHash: data.codeHash,
      attempts: data.attempts || 0,
      expiresAt: data.expiresAt instanceof Date ? data.expiresAt.toISOString() : data.expiresAt,
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO verification_codes (_id, email, codeHash, attempts, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.email, doc.codeHash, doc.attempts, doc.expiresAt, doc.createdAt);

    return wrapDoc('verification_codes', doc);
  }

  static async deleteMany(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseVC.deleteMany(filter);
    }
    if (filter.email) {
      sqlite.prepare('DELETE FROM verification_codes WHERE email = ?').run(filter.email.toLowerCase().trim());
    }
    return { acknowledged: true };
  }

  static async deleteOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseVC.deleteOne(filter);
    }
    if (filter._id) {
      sqlite.prepare('DELETE FROM verification_codes WHERE _id = ?').run(filter._id.toString());
    }
    return { acknowledged: true };
  }
}

export default VerificationCodeProxy;
