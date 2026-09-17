import mongoose from 'mongoose';
import { sqlite, wrapDoc } from './dbAdapter.js';
import crypto from 'crypto';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    recipientRole: { type: String, enum: ['all', 'admins', 'customers', 'user'], default: 'user', index: true },
    type: { type: String, default: 'system', index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MongooseNotif = mongoose.model('Notification', notificationSchema);

class NotificationProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseNotif.find(filter);
    }
    const rows = sqlite.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50').all();
    const docs = rows.map((r) => wrapDoc('notifications', r));
    docs.sort = () => docs;
    docs.limit = (n) => docs.slice(0, n);
    return docs;
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseNotif.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      recipient: data.recipient ? data.recipient.toString() : null,
      recipientRole: data.recipientRole || 'user',
      type: data.type || 'system',
      title: data.title.trim(),
      message: data.message.trim(),
      link: data.link || '',
      isRead: 0,
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO notifications (_id, recipient, recipientRole, type, title, message, link, isRead, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.recipient, doc.recipientRole, doc.type, doc.title, doc.message, doc.link, doc.isRead, doc.createdAt);

    return wrapDoc('notifications', doc);
  }

  static async findByIdAndUpdate(id, data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseNotif.findByIdAndUpdate(id, data, { new: true });
    }
    const row = sqlite.prepare('SELECT * FROM notifications WHERE _id = ?').get(id?.toString());
    if (!row) return null;
    const doc = wrapDoc('notifications', row);
    if (data.isRead !== undefined) doc.isRead = data.isRead ? 1 : 0;
    await doc.save();
    return doc;
  }
}

export default NotificationProxy;
