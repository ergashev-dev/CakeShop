import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret';
const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://cakeshop-backend-fs9q.onrender.com/api/auth/google/callback'
    : 'http://localhost:5000/api/auth/google/callback');

export function configurePassport() {
  // Only register GoogleStrategy if valid credentials or development dummy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
          if (!email) {
            return done(new Error('Google hisobingizda elektron pochta manzili topilmadi.'), null);
          }

          const googleId = profile.id;
          const name = profile.displayName || profile.name?.givenName || 'Hurmatli mijoz';
          const avatar = profile.photos?.[0]?.value || '';

          // 1. Check if user exists by googleId OR email
          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (user) {
            // Update Google link and details if not set
            user.googleId = googleId;
            user.authProvider = 'google';
            user.isVerified = true;
            if (!user.avatar && avatar) {
              user.avatar = avatar;
            }
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // 2. Create new user with Google OAuth
          const baseUsername = (name || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 12);
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const username = `${baseUsername || 'mijoz'}_${randomSuffix}`;

          const randomPassword = crypto.randomBytes(16).toString('hex');
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            googleId,
            authProvider: 'google',
            avatar,
            role: 'user',
            isVerified: true,
            isBlocked: false,
            walletBalance: 0,
            lastLogin: new Date(),
          });

          console.log(`✓ Yangi Google foydalanuvchisi ro‘yxatdan o‘tdi: ${email}`);
          return done(null, user);
        } catch (err) {
          console.error('GoogleStrategy auth error:', err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id || user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

export default passport;
