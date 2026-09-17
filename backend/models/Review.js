import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true, trim: true },
    userAvatar: { type: String, default: '' },
    orderId: { type: String, default: '', index: true },
    cakeId: { type: String, default: '', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    photo: { type: String, default: '' },
    adminReply: {
      text: { type: String, default: '' },
      repliedAt: { type: Date, default: null },
      adminName: { type: String, default: '' },
    },
    isVerifiedBuyer: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MongooseReview = mongoose.model('Review', reviewSchema);

class ReviewProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseReview.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM reviews WHERE 1=1';
      const params = [];
      if (filter.cakeId) {
        sql += ' AND cakeId = ?';
        params.push(filter.cakeId);
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
      return rows.map((r) => wrapDoc('reviews', r));
    });
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseReview.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM reviews WHERE _id = ?').get(id?.toString());
    return wrapDoc('reviews', row);
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseReview.countDocuments(filter);
    }
    const res = sqlite.prepare('SELECT COUNT(*) as count FROM reviews').get();
    return res ? res.count : 0;
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseReview.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      user: data.user ? data.user.toString() : null,
      userName: data.userName || 'Mijoz',
      userAvatar: data.userAvatar || '',
      orderId: data.orderId || '',
      cakeId: data.cakeId || '',
      rating: Number(data.rating) || 5,
      comment: data.comment || '',
      photo: data.photo || '',
      adminReply_json: JSON.stringify(data.adminReply || {}),
      isVerifiedBuyer: data.isVerifiedBuyer !== false ? 1 : 0,
      createdAt: now,
    };

    sqlite.prepare(`
      INSERT INTO reviews (_id, user, userName, userAvatar, orderId, cakeId, rating, comment, photo, adminReply_json, isVerifiedBuyer, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.user,
      doc.userName,
      doc.userAvatar,
      doc.orderId,
      doc.cakeId,
      doc.rating,
      doc.comment,
      doc.photo,
      doc.adminReply_json,
      doc.isVerifiedBuyer,
      doc.createdAt
    );

    return wrapDoc('reviews', doc);
  }
}

export default ReviewProxy;
