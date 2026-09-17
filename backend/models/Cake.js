import mongoose from 'mongoose';
import { sqlite, wrapDoc, QueryBuilder } from './dbAdapter.js';
import crypto from 'crypto';

const cakeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    category_slug: { type: String, default: 'premium', index: true },
    category_name: { type: String, default: 'Premium tortlar' },
    price: { type: Number, required: true, min: 0 },
    weight: { type: String, default: '1.5 kg' },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    image: { type: String, default: '' },
    is_popular: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    in_stock: { type: Boolean, default: true, index: true },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MongooseCake = mongoose.model('Cake', cakeSchema);

class CakeProxy {
  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.find(filter);
    }
    return new QueryBuilder((qb) => {
      let sql = 'SELECT * FROM cakes WHERE 1=1';
      const params = [];

      if (filter.isActive !== undefined) {
        sql += ' AND isActive = ?';
        params.push(filter.isActive ? 1 : 0);
      }
      if (filter.category_slug && filter.category_slug !== 'all') {
        sql += ' AND category_slug = ?';
        params.push(filter.category_slug);
      }
      if (filter.$or && filter.$or.length > 0) {
        const q = filter.$or[0]?.name?.$regex || '';
        if (q) {
          sql += ' AND (name LIKE ? OR description LIKE ? OR ingredients LIKE ?)';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
      }

      if (qb._sort) {
        if (qb._sort.price === 1) sql += ' ORDER BY price ASC';
        else if (qb._sort.price === -1) sql += ' ORDER BY price DESC';
        else if (qb._sort.salesCount) sql += ' ORDER BY salesCount DESC';
        else if (qb._sort.is_popular) sql += ' ORDER BY is_popular DESC, salesCount DESC';
        else sql += ' ORDER BY createdAt DESC';
      } else {
        sql += ' ORDER BY is_popular DESC, createdAt DESC';
      }

      if (qb._limit > 0) {
        sql += ` LIMIT ${qb._limit}`;
      }

      const rows = sqlite.prepare(sql).all(...params);
      return rows.map((r) => wrapDoc('cakes', r));
    });
  }

  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.findOne(filter);
    }
    if (filter.name) {
      const row = sqlite.prepare('SELECT * FROM cakes WHERE name = ? LIMIT 1').get(filter.name);
      return wrapDoc('cakes', row);
    }
    const row = sqlite.prepare('SELECT * FROM cakes LIMIT 1').get();
    return wrapDoc('cakes', row);
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.findById(id);
    }
    const row = sqlite.prepare('SELECT * FROM cakes WHERE _id = ?').get(id?.toString());
    return wrapDoc('cakes', row);
  }

  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.create(data);
    }
    const id = crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      name: data.name,
      category_slug: data.category_slug || 'premium',
      category_name: data.category_name || 'Premium tortlar',
      price: Number(data.price),
      weight: data.weight || '1.5 kg',
      description: data.description || '',
      ingredients: data.ingredients || '',
      image: data.image || '',
      is_popular: data.is_popular ? 1 : 0,
      isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      in_stock: data.in_stock !== undefined ? (data.in_stock ? 1 : 0) : 1,
      salesCount: 0,
      createdAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO cakes (_id, name, category_slug, category_name, price, weight, description, ingredients, image, is_popular, isActive, in_stock, salesCount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc._id,
      doc.name,
      doc.category_slug,
      doc.category_name,
      doc.price,
      doc.weight,
      doc.description,
      doc.ingredients,
      doc.image,
      doc.is_popular,
      doc.isActive,
      doc.in_stock,
      doc.salesCount,
      doc.createdAt
    );

    return wrapDoc('cakes', doc);
  }

  static async insertMany(items) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.insertMany(items);
    }
    for (const item of items) {
      await this.create(item);
    }
    return items;
  }

  static async findByIdAndUpdate(id, data) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.findByIdAndUpdate(id, data, { new: true });
    }
    const row = sqlite.prepare('SELECT * FROM cakes WHERE _id = ?').get(id?.toString());
    if (!row) return null;
    const doc = wrapDoc('cakes', row);
    for (const key of Object.keys(data)) {
      doc[key] = data[key];
    }
    await doc.save();
    return doc;
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.findByIdAndDelete(id);
    }
    const row = sqlite.prepare('SELECT * FROM cakes WHERE _id = ?').get(id?.toString());
    if (row) {
      sqlite.prepare('DELETE FROM cakes WHERE _id = ?').run(id?.toString());
    }
    return wrapDoc('cakes', row);
  }

  static async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseCake.countDocuments(filter);
    }
    let sql = 'SELECT COUNT(*) as count FROM cakes WHERE 1=1';
    const params = [];

    if (filter.isActive !== undefined) {
      sql += ' AND isActive = ?';
      params.push(filter.isActive ? 1 : 0);
    }
    if (filter.category_slug && filter.category_slug !== 'all') {
      sql += ' AND category_slug = ?';
      params.push(filter.category_slug);
    }
    if (filter.$or && filter.$or.length > 0) {
      const catOr = filter.$or.find((item) => item.category_slug || item.category);
      if (catOr) {
        const catVal = catOr.category_slug || catOr.category;
        sql += ' AND category_slug = ?';
        params.push(catVal);
      } else if (filter.$or[0]?.name?.$regex) {
        const q = filter.$or[0].name.$regex;
        sql += ' AND (name LIKE ? OR description LIKE ? OR ingredients LIKE ?)';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
    }

    const row = sqlite.prepare(sql).get(...params);
    return row ? row.count : 0;
  }
}

export default CakeProxy;
