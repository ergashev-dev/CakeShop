import Cake from '../models/Cake.js';
import Category from '../models/Category.js';
import AdminLog from '../models/AdminLog.js';

export const cakeController = {
  /**
   * Get cakes with filters, search, and sorting
   */
  async getCakes(req, res) {
    try {
      const { category, search, sort, all } = req.query;

      const filter = {};
      if (all !== 'true') {
        filter.isActive = true;
      }

      if (category && category !== 'all') {
        filter.category_slug = category;
      }

      if (search && search.trim() !== '') {
        const query = search.trim();
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { ingredients: { $regex: query, $options: 'i' } },
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'price_asc') sortOption = { price: 1 };
      if (sort === 'price_desc') sortOption = { price: -1 };
      if (sort === 'popular') sortOption = { is_popular: -1, salesCount: -1 };

      const cakes = await Cake.find(filter).sort(sortOption);

      return res.json({ cakes });
    } catch (error) {
      console.error('Error fetching cakes:', error.message);
      return res.status(500).json({ error: 'Tortlarni yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Get single cake by ID
   */
  async getCakeById(req, res) {
    try {
      const { id } = req.params;
      const cake = await Cake.findById(id);

      if (!cake) {
        return res.status(404).json({ error: 'Mahsulot topilmadi.' });
      }

      return res.json({ cake });
    } catch (error) {
      return res.status(500).json({ error: 'Mahsulotni yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Create new cake (Admin only)
   */
  async createCake(req, res) {
    try {
      const {
        name,
        category,
        category_name,
        price,
        weight,
        description,
        ingredients,
        image,
        is_popular,
      } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: 'Tort nomi va narxi majburiy.' });
      }

      const cake = await Cake.create({
        name: name.trim(),
        category_slug: category || req.body.category_slug || 'premium',
        category_name: category_name || req.body.category_name || 'Premium tortlar',
        price: Number(price),
        weight: weight || '1.5 kg',
        description: description ? description.trim() : '',
        ingredients: ingredients ? ingredients.trim() : '',
        image: image || '',
        is_popular: Boolean(is_popular),
        isActive: true,
      });

      // Write to Admin Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'create_cake',
        target: cake._id.toString(),
        details: `Yangi tort qo‘shildi: "${cake.name}" (${cake.price.toLocaleString()} so‘m)`,
        ipAddress: req.ip || '',
      });

      return res.status(201).json({
        message: 'Tort muvaffaqiyatli qo‘shildi!',
        cake,
      });
    } catch (error) {
      console.error('Error creating cake:', error.message);
      return res.status(500).json({ error: 'Tort qo‘shishda xatolik yuz berdi.' });
    }
  },

  /**
   * Update cake (Admin only)
   */
  async updateCake(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.price) updates.price = Number(updates.price);

      const cake = await Cake.findByIdAndUpdate(id, updates, { new: true });
      if (!cake) {
        return res.status(404).json({ error: 'Tort topilmadi.' });
      }

      // Write to Admin Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'update_cake',
        target: cake._id.toString(),
        details: `Tort ma'lumotlari yangilandi: "${cake.name}"`,
        ipAddress: req.ip || '',
      });

      return res.json({
        message: 'Tort ma‘lumotlari muvaffaqiyatli yangilandi!',
        cake,
      });
    } catch (error) {
      console.error('Error updating cake:', error.message);
      return res.status(500).json({ error: 'Tortni yangilashda xatolik yuz berdi.' });
    }
  },

  /**
   * Delete cake (Admin only)
   */
  async deleteCake(req, res) {
    try {
      const { id } = req.params;
      const cake = await Cake.findByIdAndDelete(id);

      if (!cake) {
        return res.status(404).json({ error: 'Tort topilmadi.' });
      }

      // Write to Admin Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'delete_cake',
        target: id,
        details: `Tort o‘chirildi: "${cake.name}"`,
        ipAddress: req.ip || '',
      });

      return res.json({
        message: 'Tort muvaffaqiyatli o‘chirildi!',
      });
    } catch (error) {
      console.error('Error deleting cake:', error.message);
      return res.status(500).json({ error: 'Tortni o‘chirishda xatolik yuz berdi.' });
    }
  },
};
