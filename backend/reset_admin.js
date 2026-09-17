import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function run() {
  await mongoose.connect(process.env.MONGO_DB);
  const hash = await bcrypt.hash('admin123', 10);

  // Update Abdurashid's account
  await mongoose.connection.collection('users').updateOne(
    { email: 'eabdurashid72@gmail.com' },
    {
      $set: {
        role: 'super_admin',
        isVerified: true,
        isBlocked: false,
        password: hash,
      },
    }
  );

  // Update default admin account
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@boltortlari.uz' },
    {
      $set: {
        role: 'super_admin',
        isVerified: true,
        isBlocked: false,
        password: hash,
        username: 'admin',
      },
    }
  );

  console.log('✅ Admin accounts updated successfully with password: admin123');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
