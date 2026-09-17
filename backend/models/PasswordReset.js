import mongoose from 'mongoose';
import { sqlite, wrapDoc } from './dbAdapter.js';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const MongoosePR = mongoose.model('PasswordReset', passwordResetSchema);

class PasswordResetProxy {
  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePR.findOne(filter);
    }
    const row = sqlite.prepare('SELECT * FROM password_resets WHERE email = ? ORDER BY createdAt DESC LIMIT 1').get(filter.email.toLowerCase().trim());
    return wrapDoc('password_resets', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePR.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      email: data.email.toLowerCase().trim(),
      codeHash: data.codeHash,
      attempts: data.attempts || 0,
      isVerified: 0,
      expiresAt: data.expiresAt instanceof Date ? data.expiresAt.toISOString() : data.expiresAt,
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO password_resets (_id, email, codeHash, attempts, isVerified, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.email, doc.codeHash, doc.attempts, doc.isVerified, doc.expiresAt, doc.createdAt);

    return wrapDoc('password_resets', doc);
  }

  static async deleteMany(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePR.deleteMany(filter);
    }
    if (filter.email) {
      sqlite.prepare('DELETE FROM password_resets WHERE email = ?').run(filter.email.toLowerCase().trim());
    }
    return { acknowledged: true };
  }

  static async deleteOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePR.deleteOne(filter);
    }
    if (filter._id) {
      sqlite.prepare('DELETE FROM password_resets WHERE _id = ?').run(filter._id.toString());
    }
    return { acknowledged: true };
  }
}

export default PasswordResetProxy;
