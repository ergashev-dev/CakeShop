import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import 'dotenv/config';

// Clean quotes if present in environment variables
for (const key of ['MONGO_DB', 'EMAIL_USER', 'EMAIL_PASS', 'JWT_SECRET', 'EMAIL_FROM']) {
  if (process.env[key]) {
    process.env[key] = process.env[key].replace(/^["']|["']$/g, '').trim();
  }
}

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectMongoDB } from './config/mongodb.js';
import { socketService } from './services/socketService.js';
import { telegramBotService } from './services/telegramBotService.js';
import passport, { configurePassport } from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import cakeRoutes from './routes/cakeRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import bugRoutes from './routes/bugRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Connect to Database
connectMongoDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketService.init(server);

const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [
      'https://boltortlar.uz',
      'https://www.boltortlar.uz',
      'https://frontend-eta-nine-90.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bol Tortlari Production API',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Central error handler:', err.message);
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message =
    statusCode === 500 && isProd
      ? 'Serverda kutilmagan xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.'
      : err.message || 'Serverda kutilmagan xatolik yuz berdi.';

  res.status(statusCode).json({
    error: message,
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Bol Tortlari Production Backend running on http://localhost:${PORT}`);
  console.log(`📦 Database: MongoDB Mongoose connected`);
  console.log(`⚡ Real-time: Socket.IO initialized`);
  console.log(`✉️  Nodemailer: Email verification active`);
  console.log(`🛡️  Security: Helmet, Rate Limiter, RBAC enabled`);
  console.log(`=================================================`);
  telegramBotService.init();
});
