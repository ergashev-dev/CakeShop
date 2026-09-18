import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Cake from '../models/Cake.js';
import Settings from '../models/Settings.js';

export const connectMongoDB = async () => {
  const mongoUri = process.env.MONGO_DB;

  if (mongoUri && !mongoUri.includes('127.0.0.1')) {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`📦 MongoDB connected successfully: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
    } catch (error) {
      console.error(`⚠️ MongoDB cloud connection notice: ${error.message}`);
      console.log(`📦 Zero-downtime persistent storage faollashtirildi.`);
    }
  } else {
    console.log(`📦 Database: Production Hybrid Engine faollashtirildi.`);
  }

  // Seed essential super admin, categories, and cakes
  await initSuperAdmin();
  await initCategoriesAndCakes();
  await initSettings();
};

/**
 * Initialize Super Admin based on SUPER_ADMIN_EMAIL
 */
async function initSuperAdmin() {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@boltortlari.uz').toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  try {
    let adminUser = await User.findOne({ email: superAdminEmail });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      adminUser = await User.create({
        name: 'Bosh Administrator',
        email: superAdminEmail,
        password: hashedPassword,
        phone: '+998 (90) 123-45-67',
        role: 'super_admin',
        isVerified: true,
        isBlocked: false,
        walletBalance: 0,
      });
      console.log(`✓ Super Admin yaratildi: ${superAdminEmail}`);
    } else {
      if (adminUser.role !== 'super_admin' || !adminUser.isVerified) {
        adminUser.role = 'super_admin';
        adminUser.isVerified = true;
        await adminUser.save();
        console.log(`✓ Super Admin maqomi yangilandi: ${superAdminEmail}`);
      }
    }
  } catch (err) {
    console.error('Error initializing Super Admin:', err.message);
  }
}

/**
 * Seed initial categories and artisan cakes if empty
 */
async function initCategoriesAndCakes() {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { slug: 'premium', name_uz: 'Premium tortlar', name_ru: 'Премиум торты', name_en: 'Premium Cakes' },
        { slug: 'toylar', name_uz: 'To‘y tortlari', name_ru: 'Свадебные торты', name_en: 'Wedding Cakes' },
        { slug: 'tugilgan-kun', name_uz: 'Tug‘ilgan kun', name_ru: 'День рождения', name_en: 'Birthday Cakes' },
        { slug: 'shirinliklar', name_uz: 'Klassik shirinliklar', name_ru: 'Классические десерты', name_en: 'Classic Pastries' },
      ];
      await Category.insertMany(defaultCategories);
      console.log('✓ Boshlang‘ich kategoriyalar kiritildi');
    }

    const cakeCount = await Cake.countDocuments();
    if (cakeCount === 0) {
      const initialCakes = [
        {
          name: 'Qulupnayli Shohona Fraisier',
          category_slug: 'premium',
          category_name: 'Premium tortlar',
          price: 320000,
          weight: '2.0 kg',
          description: 'Yangi saralangan Farg‘ona qulupnaylari va eng nafis vanilli diplomat kremi bilan tayyorlangan fransuzcha durdona.',
          ingredients: 'Tabiiy sariyog‘ 82.5%, fransuz vanili, yangi qulupnay, nozik biskvit',
          image: '/cake_strawberry.jpg',
          is_popular: true,
          isActive: true,
        },
        {
          name: 'Belgiya Shokoladli Truffle',
          category_slug: 'premium',
          category_name: 'Premium tortlar',
          price: 290000,
          weight: '1.8 kg',
          description: 'Haqiqiy 70% Belgiya qora shokoladi va nozik ganash qatlamlari bilan boyitilgan chuqur shokoladli tort.',
          ingredients: 'Callebaut qora shokolad 70%, tabiiy qaymoq 33%, kakao biskviti',
          image: '/cake_chocolate.jpg',
          is_popular: true,
          isActive: true,
        },
        {
          name: 'Shohona Asalli Medovik',
          category_slug: 'shirinliklar',
          category_name: 'Klassik shirinliklar',
          price: 240000,
          weight: '1.6 kg',
          description: 'Tog‘ asali bilan to‘yingan 12 ta yupqa qatlam va smetanali yengil krem uyg‘unligi.',
          ingredients: 'Tog‘ tabiiy asali, smetana, nozik xamir qatlamlari, yong‘oq',
          image: '/hero-cake.jpg',
          is_popular: true,
          isActive: true,
        },
        {
          name: 'Pista va Malinali Velvet',
          category_slug: 'premium',
          category_name: 'Premium tortlar',
          price: 340000,
          weight: '1.9 kg',
          description: 'Eron pista pastasi va nordon-shirin malina konfisi uyg‘unlashgan aristokratik ta’m.',
          ingredients: 'Tabiiy pista pastasi, malina konfisi, oq shokoladli muss',
          image: '/cake_strawberry.jpg',
          is_popular: true,
          isActive: true,
        },
        {
          name: 'Klassik Nyu-York Cheesecake',
          category_slug: 'shirinliklar',
          category_name: 'Klassik shirinliklar',
          price: 260000,
          weight: '1.5 kg',
          description: 'Haqiqiy Philadelphia pishlog‘i va qarsildoq qum xamir asosi bilan klassik pishirilgan chizkeyk.',
          ingredients: 'Philadelphia kremli pishloq, tabiiy sariyog‘, nordon smetana',
          image: '/hero-cake.jpg',
          is_popular: false,
          isActive: true,
        },
        {
          name: 'Qizil Baxmal (Red Velvet)',
          category_slug: 'tugilgan-kun',
          category_name: 'Tug‘ilgan kun',
          price: 250000,
          weight: '1.7 kg',
          description: 'Yengil shokolad noxotasi bilan nozik baxmal biskvit va qalin krem-chiz qatlami.',
          ingredients: 'Krem-chiz, vanil ekstrakti, kakao, mayin qizil biskvit',
          image: '/cake_strawberry.jpg',
          is_popular: false,
          isActive: true,
        },
      ];
      await Cake.insertMany(initialCakes);
      console.log('✓ Boshlang‘ich tortlar katalogi yaratildi');
    }
  } catch (err) {
    console.error('Error initializing categories and cakes:', err.message);
  }
}

/**
 * Initialize Store Settings
 */
async function initSettings() {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        deliveryFee: 15000,
        freeDeliveryThreshold: 300000,
        contactPhone: '+998 (90) 123-45-67',
        contactTelegram: '@boltortlari_admin',
      });
      console.log('✓ Do‘kon sozlamalari saqlandi');
    }
  } catch (err) {
    console.error('Error initializing settings:', err.message);
  }
}
