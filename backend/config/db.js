import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'boltortlari.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Cakes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cakes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      weight TEXT NOT NULL,
      description TEXT,
      ingredients TEXT,
      image TEXT NOT NULL,
      is_popular INTEGER DEFAULT 0,
      in_stock INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      customer_address TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Kutilmoqda',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Admin if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@boltortlari.uz');
  if (!adminExists) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('user-admin-1', 'Bosh Qandolatchi Admin', 'admin@boltortlari.uz', '+998901234567', hash, 'admin');
    console.log('✓ Default Admin created: admin@boltortlari.uz (password: admin123)');
  }

  // Seed Cakes if empty
  const cakeCount = db.prepare('SELECT COUNT(*) as count FROM cakes').get().count;
  if (cakeCount === 0) {
    const initialCakes = [
      {
        id: 'cake-1',
        name: 'Qulupnayli Shohona Fraisier',
        category: 'wedding',
        category_name: "To'y va marosim",
        price: 320000,
        weight: '2.0 kg',
        description: "Yangi terilgan xushbo'y qulupnaylar, yengil fransuz muslini kremi va nam vanilli biskvit uyg'unligi.",
        ingredients: "Tabiiy qaymoq, yangi qulupnay, vanil, sifatli sariyog', mushe kremi",
        image: '/cake_strawberry.jpg',
        is_popular: 1,
      },
      {
        id: 'cake-2',
        name: 'Belgiya Shokoladli Truffle',
        category: 'birthday',
        category_name: "Tug'ilgan kun",
        price: 290000,
        weight: '1.8 kg',
        description: '70% Belgiya qora shokoladidan tayyorlangan ganash, boy biskvit va oltin zarra sepilgan truffle sharlari.',
        ingredients: 'Belgiya shokoladi, 33% li qaymoq, kakao, espresso, oltin zarlar',
        image: '/cake_chocolate.jpg',
        is_popular: 1,
      },
      {
        id: 'cake-3',
        name: 'Shohona Asalli Medovik',
        category: 'festive',
        category_name: 'Bayramona',
        price: 240000,
        weight: '1.6 kg',
        description: "Tog' asalidan tayyorlangan 8 qavatli nozik korjlar va karamelli smetana kremi.",
        ingredients: "Tabiiy tog' asali, qaymoqli smetana, tuzlangan karamel, yong'oq",
        image: '/hero-cake.jpg',
        is_popular: 1,
      },
      {
        id: 'cake-4',
        name: 'Qizil Baxmal (Red Velvet Royal)',
        category: 'romantic',
        category_name: 'Romantik / Love',
        price: 280000,
        weight: '1.7 kg',
        description: 'Krem-chizli yumshoq krem va nafis qizil baxmal biskviti. Sevishganlar va romantik oqshomlar uchun.',
        ingredients: "Philadelphia krem-pishlog'i, tabiiy qaymoq, kakao, malina konfisi",
        image: '/cake_strawberry.jpg',
        is_popular: 1,
      },
      {
        id: 'cake-5',
        name: 'Pista va Malinali Velvet',
        category: 'special',
        category_name: 'Eksklyuziv bento',
        price: 340000,
        weight: '1.9 kg',
        description: 'Saralangan pista pastasi, nordon-shirin malina ichligi va nafis pista parchalari.',
        ingredients: 'Tabiiy pista pastasi, malina, oq shokolad, qaymoq',
        image: '/cake_chocolate.jpg',
        is_popular: 1,
      },
      {
        id: 'cake-6',
        name: 'Bolalar Sevimli Kamalak Keki',
        category: 'kids',
        category_name: 'Bolalar uchun',
        price: 260000,
        weight: '1.5 kg',
        description: 'Rang-barang tabiiy sharbatlar bilan bo‘yalgan xushchaqchaq biskvit va yengil vanilli krem.',
        ingredients: 'Biskvit, tabiiy meva sharbatlari, vanil kremi, shokoladli drage',
        image: '/hero-cake.jpg',
        is_popular: 1,
      },
    ];

    const insertCake = db.prepare(`
      INSERT INTO cakes (id, name, category, category_name, price, weight, description, ingredients, image, is_popular, in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const c of initialCakes) {
      insertCake.run(c.id, c.name, c.category, c.category_name, c.price, c.weight, c.description, c.ingredients, c.image, c.is_popular);
    }
    console.log(`✓ Seeded ${initialCakes.length} initial cakes in database`);
  }

  // Seed sample initial orders if empty
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0) {
    const initialOrders = [
      {
        id: 'ORD-1048',
        customer_name: 'Dilnoza Karimova',
        customer_phone: '+998 (90) 456-78-90',
        customer_email: 'dilnoza@example.com',
        customer_address: 'Farg‘ona shahri, Al-Farg‘oniy ko‘chasi, 24-uy',
        items_json: JSON.stringify([{ id: 'cake-1', name: 'Qulupnayli Shohona Fraisier', weight: '2.0 kg', price: 320000, quantity: 1 }]),
        subtotal: 320000,
        delivery_fee: 0,
        total: 320000,
        status: 'Yetkazilmoqda',
      },
      {
        id: 'ORD-1047',
        customer_name: 'Bobur Mirzayev',
        customer_phone: '+998 (91) 123-45-67',
        customer_email: 'bobur@example.com',
        customer_address: 'Uchko‘prik markazi, Mustaqillik shoh ko‘chasi, 12-uy',
        items_json: JSON.stringify([{ id: 'cake-2', name: 'Belgiya Shokoladli Truffle', weight: '1.8 kg', price: 290000, quantity: 1 }]),
        subtotal: 290000,
        delivery_fee: 0,
        total: 290000,
        status: 'Tayyorlanmoqda',
      },
      {
        id: 'ORD-1046',
        customer_name: 'Malika Sobirova',
        customer_phone: '+998 (93) 890-12-34',
        customer_email: 'malika@example.com',
        customer_address: 'Marg‘ilon shahri, Ipakchilar ko‘chasi, 8-uy',
        items_json: JSON.stringify([{ id: 'cake-3', name: 'Shohona Asalli Medovik', weight: '1.6 kg', price: 240000, quantity: 1 }]),
        subtotal: 240000,
        delivery_fee: 20000,
        total: 260000,
        status: 'Bajarildi',
      },
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, customer_name, customer_phone, customer_email, customer_address, items_json, subtotal, delivery_fee, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of initialOrders) {
      insertOrder.run(o.id, o.customer_name, o.customer_phone, o.customer_email, o.customer_address, o.items_json, o.subtotal, o.delivery_fee, o.total, o.status);
    }
    console.log(`✓ Seeded ${initialOrders.length} initial orders in database`);
  }
}

export default db;
