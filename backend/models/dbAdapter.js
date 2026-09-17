import mongoose from 'mongoose';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'boltortlari_production.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Initialize SQLite fallback tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    avatar TEXT DEFAULT '',
    resetPasswordCode TEXT DEFAULT '',
    resetPasswordExpire TEXT DEFAULT '',
    isBlocked INTEGER DEFAULT 0,
    isVerified INTEGER DEFAULT 0,
    walletBalance REAL DEFAULT 0,
    addresses_json TEXT DEFAULT '[]',
    lastLogin TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS verification_codes (
    _id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    codeHash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expiresAt TEXT NOT NULL,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    _id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    codeHash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    isVerified INTEGER DEFAULT 0,
    expiresAt TEXT NOT NULL,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    _id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_uz TEXT NOT NULL,
    name_ru TEXT DEFAULT '',
    name_en TEXT DEFAULT '',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS cakes (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_slug TEXT DEFAULT 'premium',
    category_name TEXT DEFAULT 'Premium tortlar',
    price REAL NOT NULL,
    weight TEXT DEFAULT '1.5 kg',
    description TEXT DEFAULT '',
    ingredients TEXT DEFAULT '',
    image TEXT DEFAULT '',
    is_popular INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    salesCount INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    _id TEXT PRIMARY KEY,
    orderId TEXT UNIQUE NOT NULL,
    customer TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    customer_address TEXT NOT NULL,
    notes TEXT DEFAULT '',
    items_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    promoCode TEXT DEFAULT '',
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'pending',
    assignedCourier TEXT DEFAULT '',
    kitchenNotes TEXT DEFAULT '',
    customCakeConfig_json TEXT DEFAULT '{}',
    status_history_json TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    _id TEXT PRIMARY KEY,
    user TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    balanceAfter REAL NOT NULL,
    createdBy TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    _id TEXT PRIMARY KEY,
    recipient TEXT,
    recipientRole TEXT DEFAULT 'user',
    type TEXT DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    isRead INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_logs (
    _id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    actorName TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT DEFAULT '',
    details TEXT DEFAULT '',
    ipAddress TEXT DEFAULT '',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    _id TEXT PRIMARY KEY,
    isStoreOpen INTEGER DEFAULT 1,
    cashbackPercent REAL DEFAULT 3,
    deliveryFee REAL DEFAULT 15000,
    deliveryFeeOutside REAL DEFAULT 35000,
    freeDeliveryThreshold REAL DEFAULT 300000,
    workingHours TEXT DEFAULT '09:00 - 21:00',
    contactPhone TEXT DEFAULT '+998 (90) 123-45-67',
    contactTelegram TEXT DEFAULT '@boltortlari_admin',
    contactAddress TEXT DEFAULT 'Toshkent sh., Navoiy ko‘chasi 14',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    _id TEXT PRIMARY KEY,
    user TEXT,
    userName TEXT NOT NULL,
    userAvatar TEXT DEFAULT '',
    orderId TEXT DEFAULT '',
    cakeId TEXT DEFAULT '',
    rating REAL NOT NULL,
    comment TEXT NOT NULL,
    photo TEXT DEFAULT '',
    adminReply_json TEXT DEFAULT '{}',
    isVerifiedBuyer INTEGER DEFAULT 1,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS bug_reports (
    _id TEXT PRIMARY KEY,
    user TEXT,
    userName TEXT DEFAULT '',
    userEmail TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot TEXT DEFAULT '',
    deviceInfo TEXT DEFAULT '',
    status TEXT DEFAULT 'Yangi',
    adminNotes TEXT DEFAULT '',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    _id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discountPercent REAL DEFAULT 0,
    discountAmount REAL DEFAULT 0,
    minOrderAmount REAL DEFAULT 0,
    maxUses INTEGER DEFAULT 0,
    usedCount INTEGER DEFAULT 0,
    expiresAt TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT
  );
`);

// Safe column migrations for existing tables
const migrations = [
  "ALTER TABLE settings ADD COLUMN isStoreOpen INTEGER DEFAULT 1",
  "ALTER TABLE settings ADD COLUMN cashbackPercent REAL DEFAULT 3",
  "ALTER TABLE settings ADD COLUMN deliveryFeeOutside REAL DEFAULT 35000",
  "ALTER TABLE settings ADD COLUMN workingHours TEXT DEFAULT '09:00 - 21:00'",
  "ALTER TABLE settings ADD COLUMN contactAddress TEXT DEFAULT 'Toshkent sh., Navoiy ko‘chasi 14'",
  "ALTER TABLE users ADD COLUMN addresses_json TEXT DEFAULT '[]'",
  "ALTER TABLE users ADD COLUMN username TEXT",
  "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN resetPasswordCode TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN resetPasswordExpire TEXT DEFAULT ''",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL AND username != ''",
  "ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN promoCode TEXT DEFAULT ''",
  "ALTER TABLE orders ADD COLUMN assignedCourier TEXT DEFAULT ''",
  "ALTER TABLE orders ADD COLUMN kitchenNotes TEXT DEFAULT ''",
  "ALTER TABLE orders ADD COLUMN customCakeConfig_json TEXT DEFAULT '{}'",
];

for (const sql of migrations) {
  try {
    sqlite.exec(sql);
  } catch (e) {
    // Column already exists
  }
}


/**
 * Chainable QueryBuilder for Mongoose queries (.sort, .skip, .limit, .select)
 */
class QueryBuilder {
  constructor(executor) {
    this._executor = executor;
    this._sort = null;
    this._skip = 0;
    this._limit = 0;
    this._select = null;
  }
  sort(s) {
    this._sort = s;
    return this;
  }
  skip(n) {
    this._skip = Number(n);
    return this;
  }
  limit(n) {
    this._limit = Number(n);
    return this;
  }
  select(s) {
    this._select = s;
    return this;
  }
  populate() {
    return this;
  }
  then(resolve, reject) {
    try {
      const result = this._executor(this);
      Promise.resolve(result).then(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }
}

/**
 * Wrap SQLite row into Mongoose-like document with .save() and .toJSON()
 */
function wrapDoc(tableName, row) {
  if (!row) return null;
  const doc = { ...row };

  if (doc.isBlocked !== undefined) doc.isBlocked = Boolean(doc.isBlocked);
  if (doc.isVerified !== undefined) doc.isVerified = Boolean(doc.isVerified);
  if (doc.isActive !== undefined) doc.isActive = Boolean(doc.isActive);
  if (doc.is_popular !== undefined) doc.is_popular = Boolean(doc.is_popular);
  if (doc.isRead !== undefined) doc.isRead = Boolean(doc.isRead);
  if (doc.isStoreOpen !== undefined) doc.isStoreOpen = Boolean(doc.isStoreOpen);
  if (doc.isVerifiedBuyer !== undefined) doc.isVerifiedBuyer = Boolean(doc.isVerifiedBuyer);

  if (doc.items_json) {
    try {
      doc.items = JSON.parse(doc.items_json);
    } catch (e) {
      doc.items = [];
    }
  }
  if (doc.status_history_json) {
    try {
      doc.status_history = JSON.parse(doc.status_history_json);
    } catch (e) {
      doc.status_history = [];
    }
  }
  if (doc.addresses_json) {
    try {
      doc.addresses = JSON.parse(doc.addresses_json);
    } catch (e) {
      doc.addresses = [];
    }
  }
  if (doc.adminReply_json) {
    try {
      doc.adminReply = JSON.parse(doc.adminReply_json);
    } catch (e) {
      doc.adminReply = null;
    }
  }
  if (doc.customCakeConfig_json) {
    try {
      doc.customCakeConfig = JSON.parse(doc.customCakeConfig_json);
    } catch (e) {
      doc.customCakeConfig = null;
    }
  }

  if (doc.expiresAt) doc.expiresAt = new Date(doc.expiresAt);
  if (doc.resetPasswordExpire) doc.resetPasswordExpire = new Date(doc.resetPasswordExpire);
  if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
  if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
  if (doc.lastLogin) doc.lastLogin = new Date(doc.lastLogin);

  doc.save = async function () {
    const fields = [];
    const values = [];
    for (const key of Object.keys(this)) {
      if (['save', 'toJSON', 'items', 'status_history', 'addresses', 'adminReply', 'customCakeConfig'].includes(key)) continue;

      let val = this[key];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      if (val instanceof Date) val = val.toISOString();
      fields.push(`${key} = ?`);
      values.push(val);
    }

    if (this.items) {
      fields.push(`items_json = ?`);
      values.push(JSON.stringify(this.items));
    }
    if (this.status_history) {
      fields.push(`status_history_json = ?`);
      values.push(JSON.stringify(this.status_history));
    }
    if (this.addresses) {
      fields.push(`addresses_json = ?`);
      values.push(JSON.stringify(this.addresses));
    }
    if (this.adminReply) {
      fields.push(`adminReply_json = ?`);
      values.push(JSON.stringify(this.adminReply));
    }
    if (this.customCakeConfig) {
      fields.push(`customCakeConfig_json = ?`);
      values.push(JSON.stringify(this.customCakeConfig));
    }

    values.push(this._id);
    sqlite.prepare(`UPDATE ${tableName} SET ${fields.join(', ')} WHERE _id = ?`).run(...values);
    return this;
  };

  doc.toJSON = function () {
    const obj = { ...this };
    delete obj.save;
    delete obj.toJSON;
    delete obj.password;
    delete obj.resetPasswordCode;
    delete obj.resetPasswordExpire;
    delete obj.items_json;
    delete obj.status_history_json;
    delete obj.addresses_json;
    delete obj.adminReply_json;
    delete obj.customCakeConfig_json;
    return obj;
  };

  return doc;
}

export { sqlite, wrapDoc, QueryBuilder };
