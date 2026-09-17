import Category from '../models/Category.js';
import Cake from '../models/Cake.js';
import AdminLog from '../models/AdminLog.js';

export const categoryController = {
  async getCategories(req, res) {
    try {
      const categories = await Category.find().sort({ createdAt: 1 });
      return res.json({ categories });
    } catch (error) {
      return res.status(500).json({ error: 'Kategoriyalarni yuklashda xatolik yuz berdi.' });
    }
  },

  async createCategory(req, res) {
    try {
      const { name_uz, name_ru, name_en, slug } = req.body;

      if (!name_uz) {
        return res.status(400).json({ error: 'Kategoriya nomi (O‘zbekcha) kiritilishi shart.' });
      }

      const generatedSlug = (slug || name_uz).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      const existing = await Category.findOne({ slug: generatedSlug });
      if (existing) {
        return res.status(409).json({ error: 'Ushbu nomdagi kategoriya allaqachon mavjud.' });
      }

      const category = await Category.create({
        slug: generatedSlug,
        name_uz: name_uz.trim(),
        name_ru: name_ru ? name_ru.trim() : '',
        name_en: name_en ? name_en.trim() : '',
        isActive: true,
      });

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'create_category',
        target: category._id.toString(),
        details: `Yangi kategoriya yaratildi: "${category.name_uz}" (${category.slug})`,
        ipAddress: req.ip || '',
      });

      return res.status(201).json({ message: 'Kategoriya yaratildi!', category });
    } catch (error) {
      return res.status(500).json({ error: 'Kategoriya yaratishda xatolik yuz berdi.' });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name_uz, name_ru, name_en, isActive } = req.body;

      const category = await Category.findByIdAndUpdate(
        id,
        { name_uz, name_ru, name_en, isActive },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({ error: 'Kategoriya topilmadi.' });
      }

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'update_category',
        target: category._id.toString(),
        details: `Kategoriya yangilandi: "${category.name_uz}"`,
        ipAddress: req.ip || '',
      });

      return res.json({ message: 'Kategoriya yangilandi!', category });
    } catch (error) {
      return res.status(500).json({ error: 'Kategoriyani yangilashda xatolik yuz berdi.' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ error: 'Kategoriya topilmadi.' });
      }

      // Check if cakes are attached to this category
      const cakesCount = await Cake.countDocuments({
        $or: [{ category: category._id }, { category_slug: category.slug }],
      });

      if (cakesCount > 0) {
        return res.status(400).json({
          error: `Ushbu kategoriyada ${cakesCount} ta tort mavjud. Avval tortlar kategoriyasini o‘zgartiring yoki o‘chiring.`,
        });
      }

      await Category.findByIdAndDelete(id);

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'delete_category',
        target: id,
        details: `Kategoriya o‘chirildi: "${category.name_uz}"`,
        ipAddress: req.ip || '',
      });

      return res.json({ message: 'Kategoriya muvaffaqiyatli o‘chirildi.' });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({ error: error.message || 'Kategoriyani o‘chirishda xatolik yuz berdi.' });
    }
  },
};
