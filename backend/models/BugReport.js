import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const bugReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    screenshot: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Yangi', 'Jarayonda', 'Hal etildi'],
      default: 'Yangi',
      index: true,
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

const MongooseBugReport = mongoose.model('BugReport', bugReportSchema);

class BugReportProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseBugReport.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM bug_reports WHERE 1=1';
      const params = [];
      if (filter.status && filter.status !== 'all') {
        sql += ' AND status = ?';
        params.push(filter.status);
      }
      if (filter.user) {
        sql += ' AND user = ?';
        params.push(filter.user.toString());
      }
      sql += ' ORDER BY createdAt DESC';
      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
      }
      if (qb._skip > 0) {
        sql += ` OFFSET ${qb._skip}`;
      }
      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('bug_reports', r));
    });
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseBugReport.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM bug_reports WHERE _id = ?').get(id?.toString());
    return wrapDoc('bug_reports', row);
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseBugReport.countDocuments(filter);
    }
    let sql = 'SELECT COUNT(*) as count FROM bug_reports WHERE 1=1';
    const params = [];
    if (filter.status && filter.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    const res = sqlite.prepare(sql).get(...params);
    return res ? res.count : 0;
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseBugReport.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      user: data.user ? data.user.toString() : null,
      userName: data.userName || '',
      userEmail: data.userEmail || '',
      title: data.title || '',
      description: data.description || '',
      screenshot: data.screenshot || '',
      deviceInfo: data.deviceInfo || '',
      status: data.status || 'Yangi',
      adminNotes: data.adminNotes || '',
      createdAt: now,
    };

    sqlite.prepare(`
      INSERT INTO bug_reports (_id, user, userName, userEmail, title, description, screenshot, deviceInfo, status, adminNotes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.user,
      doc.userName,
      doc.userEmail,
      doc.title,
      doc.description,
      doc.screenshot,
      doc.deviceInfo,
      doc.status,
      doc.adminNotes,
      doc.createdAt
    );

    return wrapDoc('bug_reports', doc);
  }
}

export default BugReportProxy;
