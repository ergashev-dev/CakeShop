import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer_name: { type: String, required: true, trim: true },
    customer_phone: { type: String, required: true, trim: true },
    customer_email: { type: String, trim: true, default: '' },
    customer_address: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    items: [],
    subtotal: { type: Number, required: true, min: 0 },
    delivery_fee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: '' },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payment_method: { type: String, default: 'cash' },
    payment_status: { type: String, default: 'pending' },
    payment_details: { type: Object, default: null },
    assignedCourier: { type: String, default: '' },
    kitchenNotes: { type: String, default: '' },
    customCakeConfig: { type: Object, default: null },
    status_history: [],
  },
  { timestamps: true }
);

const MongooseOrder = mongoose.model('Order', orderSchema);

class OrderProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseOrder.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM orders WHERE 1=1';
      const params = [];

      if (filter.status && filter.status !== 'all') {
        if (Array.isArray(filter.status)) {
          sql += ` AND status IN (${filter.status.map(() => '?').join(',')})`;
          params.push(...filter.status);
        } else {
          sql += ' AND status = ?';
          params.push(filter.status);
        }
      }
      if (filter.assignedCourier) {
        sql += ' AND assignedCourier = ?';
        params.push(filter.assignedCourier);
      }
      if (filter.customer) {
        sql += ' AND customer = ?';
        params.push(filter.customer.toString());
      }
      if (filter.createdAt && filter.createdAt.$gte) {
        sql += ' AND createdAt >= ?';
        params.push(filter.createdAt.$gte.toISOString());
      }
      if (filter.createdAt && filter.createdAt.$lte) {
        sql += ' AND createdAt <= ?';
        params.push(filter.createdAt.$lte.toISOString());
      }

      sql += ' ORDER BY createdAt DESC';

      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
        if (qb._skip > 0) sql += ` OFFSET ${qb._skip}`;
      }

      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('orders', r));
    });
  }

  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseOrder.findOne(filter);
    }
    if (filter.orderId) {
      const row = sqlite.prepare('SELECT * FROM orders WHERE orderId = ?').get(filter.orderId);
      return wrapDoc('orders', row);
    }
    if (filter.$or) {
      for (const cond of filter.$or) {
        if (cond.orderId) {
          const row = sqlite.prepare('SELECT * FROM orders WHERE orderId = ?').get(cond.orderId);
          if (row) return wrapDoc('orders', row);
        }
        if (cond._id) {
          const row = sqlite.prepare('SELECT * FROM orders WHERE _id = ?').get(cond._id);
          if (row) return wrapDoc('orders', row);
        }
      }
    }
    const row = sqlite.prepare('SELECT * FROM orders LIMIT 1').get();
    return wrapDoc('orders', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseOrder.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      orderId: data.orderId,
      customer: data.customer ? data.customer.toString() : null,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || '',
      customer_address: data.customer_address,
      notes: data.notes || '',
      items_json: JSON.stringify(data.items || []),
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee || 0),
      discount: Number(data.discount || 0),
      promoCode: data.promoCode || '',
      total: Number(data.total),
      status: data.status || 'pending',
      payment_method: data.payment_method || 'cash',
      payment_status: data.payment_status || 'pending',
      assignedCourier: data.assignedCourier || '',
      kitchenNotes: data.kitchenNotes || '',
      customCakeConfig_json: JSON.stringify(data.customCakeConfig || {}),
      status_history_json: JSON.stringify(data.status_history || []),
      createdAt: now,
    };

    sqlite.prepare(`
      INSERT INTO orders (_id, orderId, customer, customer_name, customer_phone, customer_email, customer_address, notes, items_json, subtotal, delivery_fee, discount, promoCode, total, status, payment_method, payment_status, assignedCourier, kitchenNotes, customCakeConfig_json, status_history_json, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.orderId,
      doc.customer,
      doc.customer_name,
      doc.customer_phone,
      doc.customer_email,
      doc.customer_address,
      doc.notes,
      doc.items_json,
      doc.subtotal,
      doc.delivery_fee,
      doc.discount,
      doc.promoCode,
      doc.total,
      doc.status,
      doc.payment_method,
      doc.payment_status,
      doc.assignedCourier,
      doc.kitchenNotes,
      doc.customCakeConfig_json,
      doc.status_history_json,
      doc.createdAt
    );

    return wrapDoc('orders', doc);
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseOrder.countDocuments(filter);
    }
    let sql = 'SELECT COUNT(*) as count FROM orders WHERE 1=1';
    const params = [];
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        sql += ` AND status IN (${filter.status.map(() => '?').join(',')})`;
        params.push(...filter.status);
      } else {
        sql += ' AND status = ?';
        params.push(filter.status);
      }
    }
    const row = sqlite.prepare(sql).get(...params);
    return row ? row.count : 0;
  }

  static async aggregate(pipeline) {
    if (mongoose.connection.readyState === 1) {
      return MongooseOrder.aggregate(pipeline);
    }
    const rows = sqlite.prepare('SELECT status as _id, COUNT(*) as count, SUM(total) as total FROM orders GROUP BY status').all();
    return rows;
  }
}

export default OrderProxy;
