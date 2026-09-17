import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['deposit', 'withdraw', 'order_payment', 'refund', 'admin_adjustment'], required: true },
    reason: { type: String, required: true, trim: true },
    balanceAfter: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const MongooseWT = mongoose.model('WalletTransaction', walletTransactionSchema);

class WalletTransactionProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseWT.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM wallet_transactions WHERE 1=1';
      const params = [];
      if (filter.user) {
        sql += ' AND user = ?';
        params.push(filter.user.toString());
      }
      sql += ' ORDER BY createdAt DESC';
      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
        if (qb._skip > 0) sql += ` OFFSET ${qb._skip}`;
      }
      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('wallet_transactions', r));
    });
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseWT.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      user: data.user.toString(),
      amount: Number(data.amount),
      type: data.type,
      reason: data.reason.trim(),
      balanceAfter: Number(data.balanceAfter),
      createdBy: data.createdBy ? data.createdBy.toString() : null,
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO wallet_transactions (_id, user, amount, type, reason, balanceAfter, createdBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.user, doc.amount, doc.type, doc.reason, doc.balanceAfter, doc.createdBy, doc.createdAt);

    return wrapDoc('wallet_transactions', doc);
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseWT.countDocuments(filter);
    }
    const row = sqlite.prepare('SELECT COUNT(*) as count FROM wallet_transactions').get();
    return row ? row.count : 0;
  }

  static async aggregate(pipeline) {
    if (mongoose.connection.readyState === 1) {
      return MongooseWT.aggregate(pipeline);
    }
    const rows = sqlite.prepare('SELECT type as _id, SUM(amount) as totalAmount, COUNT(*) as count FROM wallet_transactions GROUP BY type').all();
    return rows;
  }
}

export default WalletTransactionProxy;
