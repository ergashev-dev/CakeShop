import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const adminLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true, trim: true, index: true },
    target: { type: String, default: '' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

const MongooseAL = mongoose.model('AdminLog', adminLogSchema);

class AdminLogProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseAL.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM admin_logs ORDER BY createdAt DESC';
      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
        if (qb._skip > 0) sql += ` OFFSET ${qb._skip}`;
      }
      const rows = sqlite.prepare(sql).all();
      return rows.map((r) => wrapDoc('admin_logs', r));
    });
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseAL.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      actor: data.actor.toString(),
      actorName: data.actorName,
      action: data.action,
      target: data.target || '',
      details: data.details || '',
      ipAddress: data.ipAddress || '',
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO admin_logs (_id, actor, actorName, action, target, details, ipAddress, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.actor, doc.actorName, doc.action, doc.target, doc.details, doc.ipAddress, doc.createdAt);

    return wrapDoc('admin_logs', doc);
  }

  static async countDocuments() {
    if (mongoose.connection.readyState === 1) {
      return MongooseAL.countDocuments();
    }
    const row = sqlite.prepare('SELECT COUNT(*) as count FROM admin_logs').get();
    return row ? row.count : 0;
  }
}

export default AdminLogProxy;
