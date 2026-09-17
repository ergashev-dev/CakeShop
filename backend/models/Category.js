import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name_uz: { type: String, required: true, trim: true },
    name_ru: { type: String, default: '', trim: true },
    name_en: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MongooseCategory = mongoose.model('Category', categorySchema);

class CategoryProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.find(filter);
    }
    return new QueryBuilder(() => {
      const rows = sqlite.prepare('SELECT * FROM categories ORDER BY createdAt ASC').all();
      return rows.map((r) => wrapDoc('categories', r));
    });
  }

  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.findOne(filter);
    }
    if (filter.slug) {
      const row = sqlite.prepare('SELECT * FROM categories WHERE slug = ?').get(filter.slug);
      return wrapDoc('categories', row);
    }
    const row = sqlite.prepare('SELECT * FROM categories LIMIT 1').get();
    return wrapDoc('categories', row);
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM categories WHERE _id = ?').get(id?.toString());
    return wrapDoc('categories', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      slug: data.slug,
      name_uz: data.name_uz,
      name_ru: data.name_ru || '',
      name_en: data.name_en || '',
      isActive: 1,
      createdAt: new Date().toISOString(),
    };
    sqlite.prepare(`
      INSERT INTO categories (_id, slug, name_uz, name_ru, name_en, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(doc._id, doc.slug, doc.name_uz, doc.name_ru, doc.name_en, doc.isActive, doc.createdAt);
    return wrapDoc('categories', doc);
  }

  static async insertMany(items) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.insertMany(items);
    }
    for (const item of items) {
      await this.create(item);
    }
    return items;
  }

  static async findByIdAndUpdate(id, data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.findByIdAndUpdate(id, data, { new: true });
    }
    const row = sqlite.prepare('SELECT * FROM categories WHERE _id = ?').get(id?.toString());
    if (!row) return null;
    const doc = wrapDoc('categories', row);
    if (data.name_uz !== undefined) doc.name_uz = data.name_uz;
    if (data.name_ru !== undefined) doc.name_ru = data.name_ru;
    if (data.name_en !== undefined) doc.name_en = data.name_en;
    if (data.isActive !== undefined) doc.isActive = data.isActive;
    await doc.save();
    return doc;
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.findByIdAndDelete(id);
    }
    const row = sqlite.prepare('SELECT * FROM categories WHERE _id = ?').get(id?.toString());
    if (row) {
      sqlite.prepare('DELETE FROM categories WHERE _id = ?').run(id?.toString());
    }
    return wrapDoc('categories', row);
  }

  static async countDocuments() {
    if (mongoose.connection.readyState === 1) {
      return MongooseCategory.countDocuments();
    }
    const row = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get();
    return row ? row.count : 0;
  }
}

export default CategoryProxy;
