import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [4, 'Username kamida 4 ta belgidan iborat bo‘lishi shart'],
      match: [/^[a-zA-Z0-9_]{4,32}$/, 'Username faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi lozim'],
      index: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, default: '' },
    googleId: { type: String, default: null, index: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    phone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin', 'customer', 'superadmin', 'super_admin', 'confectioner', 'courier'],
      default: 'user',
      index: true,
    },
    avatar: { type: String, default: '' },
    resetPasswordCode: { type: String, default: '' },
    resetPasswordExpire: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    walletBalance: { type: Number, default: 0, min: 0 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cake' }],
    telegramId: { type: String, default: null, index: true },
    telegramLinkToken: { type: String, default: null, index: true },
    telegramLinkExpires: { type: Date, default: null },
    addresses: [
      {
        id: String,
        title: String,
        address: String,
        phone: String,
        isDefault: Boolean,
      },
    ],
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordCode;
  delete user.telegramLinkToken;
  delete user.telegramLinkExpires;
  return user;
};

const MongooseUser = mongoose.model('User', userSchema);

// Ensure default username for superadmin in SQLite if present
try {
  sqlite.prepare("UPDATE users SET username = 'admin' WHERE email = 'admin@boltortlari.uz' AND (username IS NULL OR username = '')").run();
} catch (e) {
  // Ignore migration race conditions
}

class UserProxy {
  static findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.findOne(filter);
    }
    
    // Support $or query (e.g. [{ email }, { username }])
    if (filter.$or && Array.isArray(filter.$or)) {
      const conditions = [];
      const params = [];
      for (const cond of filter.$or) {
        if (cond.email) {
          conditions.push('email = ?');
          params.push(cond.email.toLowerCase().trim());
        }
        if (cond.username) {
          conditions.push('username = ?');
          params.push(cond.username.toLowerCase().trim());
        }
      }
      if (conditions.length > 0) {
        const row = sqlite.prepare(`SELECT * FROM users WHERE ${conditions.join(' OR ')} LIMIT 1`).get(...params);
        return wrapDoc('users', row);
      }
    }

    if (filter.email) {
      const row = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(filter.email.toLowerCase().trim());
      return wrapDoc('users', row);
    }
    if (filter.username) {
      const row = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(filter.username.toLowerCase().trim());
      return wrapDoc('users', row);
    }
    if (filter.telegramId) {
      const row = sqlite.prepare('SELECT * FROM users WHERE telegramId = ?').get(filter.telegramId.toString());
      return wrapDoc('users', row);
    }
    if (filter.googleId) {
      const row = sqlite.prepare('SELECT * FROM users WHERE googleId = ?').get(filter.googleId.toString());
      return wrapDoc('users', row);
    }
    if (filter.telegramLinkToken) {
      const row = sqlite.prepare('SELECT * FROM users WHERE telegramLinkToken = ?').get(filter.telegramLinkToken.toString());
      return wrapDoc('users', row);
    }
    if (filter.resetPasswordCode) {
      const row = sqlite.prepare('SELECT * FROM users WHERE resetPasswordCode = ?').get(filter.resetPasswordCode);
      return wrapDoc('users', row);
    }
    if (filter._id) {
      const row = sqlite.prepare('SELECT * FROM users WHERE _id = ?').get(filter._id);
      return wrapDoc('users', row);
    }
    return null;
  }

  static findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM users WHERE _id = ?').get(id?.toString());
    return wrapDoc('users', row);
  }

  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      if (filter.role && filter.role !== 'all') {
        if (Array.isArray(filter.role)) {
          sql += ` AND role IN (${filter.role.map(() => '?').join(',')})`;
          params.push(...filter.role);
        } else {
          sql += ' AND role = ?';
          params.push(filter.role);
        }
      }
      if (filter.isBlocked !== undefined) {
        sql += ' AND isBlocked = ?';
        params.push(filter.isBlocked ? 1 : 0);
      }
      if (filter.isVerified !== undefined) {
        sql += ' AND isVerified = ?';
        params.push(filter.isVerified ? 1 : 0);
      }
      sql += ' ORDER BY createdAt DESC';
      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
      }
      if (qb._skip > 0) {
        sql += ` OFFSET ${qb._skip}`;
      }
      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('users', r));
    });
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.countDocuments(filter);
    }
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];
    if (filter.role && filter.role !== 'all') {
      if (Array.isArray(filter.role)) {
        sql += ` AND role IN (${filter.role.map(() => '?').join(',')})`;
        params.push(...filter.role);
      } else {
        sql += ' AND role = ?';
        params.push(filter.role);
      }
    }
    if (filter.isBlocked !== undefined) {
      sql += ' AND isBlocked = ?';
      params.push(filter.isBlocked ? 1 : 0);
    }
    if (filter.isVerified !== undefined) {
      sql += ' AND isVerified = ?';
      params.push(filter.isVerified ? 1 : 0);
    }
    const res = sqlite.prepare(sql).get(...params);
    return res ? res.count : 0;
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      name: data.name,
      username: data.username ? data.username.toLowerCase().trim() : null,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      phone: data.phone || '',
      role: data.role || 'user',
      avatar: data.avatar || '',
      resetPasswordCode: data.resetPasswordCode || '',
      resetPasswordExpire: data.resetPasswordExpire ? new Date(data.resetPasswordExpire).toISOString() : null,
      isBlocked: data.isBlocked ? 1 : 0,
      isVerified: data.isVerified ? 1 : 0,
      walletBalance: data.walletBalance || 0,
      addresses_json: JSON.stringify(data.addresses || []),
      lastLogin: data.lastLogin ? new Date(data.lastLogin).toISOString() : null,
      createdAt: now,
      updatedAt: now,
    };

    sqlite.prepare(`
      INSERT INTO users (
        _id, name, username, email, password, phone, role, avatar, 
        resetPasswordCode, resetPasswordExpire, isBlocked, isVerified, 
        walletBalance, addresses_json, lastLogin, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.name,
      doc.username,
      doc.email,
      doc.password,
      doc.phone,
      doc.role,
      doc.avatar,
      doc.resetPasswordCode,
      doc.resetPasswordExpire,
      doc.isBlocked,
      doc.isVerified,
      doc.walletBalance,
      doc.addresses_json,
      doc.lastLogin,
      doc.createdAt,
      doc.updatedAt
    );

    return wrapDoc('users', doc);
  }

  static async deleteOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.deleteOne(filter);
    }
    if (filter._id) {
      sqlite.prepare('DELETE FROM users WHERE _id = ?').run(filter._id);
    } else if (filter.email) {
      sqlite.prepare('DELETE FROM users WHERE email = ?').run(filter.email.toLowerCase().trim());
    } else if (filter.username) {
      sqlite.prepare('DELETE FROM users WHERE username = ?').run(filter.username.toLowerCase().trim());
    }
    return { deletedCount: 1 };
  }
}

export default UserProxy;
