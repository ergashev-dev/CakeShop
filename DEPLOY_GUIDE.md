# 🚀 Bol Tortlari — Serverga Joylash va Ishga Tushirish Qo‘llanmasi (Render.com + Vercel)

Ushbu qo‘llanma **Bol Tortlari** platformasini real serverlarga (Backend: **Render.com**, Frontend: **Vercel**) 100% to‘g‘ri va xatosiz joylash bo‘yicha to‘liq bosqichlarni o‘z ichiga oladi.

---

## 🏗️ 1. Arxitektura haqida muhim ma'lumot (Express vs NestJS, Vite vs Next.js)

Platformada:
- **Real-time Socket.IO**: Jonli buyurtma holatini tracking qilish va yangi buyurtmalarni admin ekraniga bir zumda uzatish.
- **Telegram Bot Polling**: Har bir yangi buyurtmani qandolatchi va admin guruhiga avtomatik yuborish va statuslarni boshqarish.
- **Hamyon va Keshbek tizimi**: Xavfsiz to‘lovlar va tranzaksiyalar.

> [!IMPORTANT]
> Vercel Serverless funksiyalarida doimiy Socket.IO (WebSocket) va Telegram Bot doimiy `polling` jarayonlari 10 soniyada to‘xtatiladi. Shuning uchun:
> 1. **Backend**: **Render.com Web Service** (doimiy ishlovchi Node.js server)ga joylanadi. Bu Socket.IO va Telegram botni 24/7 uzluksiz ishlashini ta'minlaydi.
> 2. **Frontend**: **Vercel** (yuqori tezlikdagi global CDN)ga joylanadi.
> 
> *Kelgusida Next.js va NestJS ga o'tkazmoqchi bo'lsangiz ham, WebSocket va Bot serveri alohida doimiy konteynerda (Render/Docker) turishi zarur bo'ladi.*

---

## 🛠️ 2. Backend-ni Render.com ga joylash

1. [https://render.com](https://render.com) ga kiring va ro‘yxatdan o‘ting (GitHub orqali kirish tavsiya etiladi).
2. **"New +"** tugmasini bosing va **"Web Service"** ni tanlang.
3. O‘zingizning GitHub repositoriyangizni (`bol-tortlari`) ulang.
4. Quyidagi parametrlarni kiriting:
   - **Name**: `bol-tortlari-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` (yoki Starter)
5. **Environment Variables (Muhit o‘zgaruvchilari)** bo‘limiga qo‘shing:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: *(Ixtiyoriy kuchli maxfiy kalit so'z, masalan: `bol_tortlari_secret_2026`)*
   - `FRONTEND_URL`: *(Vercel-dagi frontend manzilingiz, masalan: `https://bol-tortlari.vercel.app`)*
   - `SOCKET_CORS_ORIGIN`: *(Vercel-dagi frontend manzilingiz, masalan: `https://bol-tortlari.vercel.app`)*
   - `TELEGRAM_BOT_TOKEN`: *(Telegram botingiz tokeni)*
   - `TELEGRAM_ADMIN_CHAT_ID`: *(Admin chat ID si)*
6. **"Create Web Service"** tugmasini bosing.
7. Render bir necha daqiqada loyihani ishga tushiradi va sizga backend URL beradi:
   👉 Masalan: `https://bol-tortlari-backend.onrender.com`

---

## ⚡ 3. Frontend-ni Vercel ga joylash

1. [https://vercel.com](https://vercel.com) ga kiring va GitHub orqali kiring.
2. **"Add New Project"** tugmasini bosing va `bol-tortlari` repositoriyasini tanlang.
3. Loyiha sozlamalarini quyidagicha belgilang:
   - **Root Directory**: `frontend` (Edit tugmasini bosib `frontend` papkasini tanlang)
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** bo‘limini oching va 2 ta o‘zgaruvchini qo‘shing:
   - `VITE_API_URL` = `https://bol-tortlari-backend.onrender.com/api` *(Render-dagi backend manzilingiz)*
   - `VITE_SOCKET_URL` = `https://bol-tortlari-backend.onrender.com`
5. **"Deploy"** tugmasini bosing.
6. 1 daqiqa ichida saytingiz global Vercel tarmog‘ida tayyor bo‘ladi:
   👉 Masalan: `https://bol-tortlari.vercel.app`

---

## 🔄 4. Bir martalik sinov va tekshirish (Verification)

1. Saytingizga kiring (`https://bol-tortlari.vercel.app`).
2. Tilni o‘zgartiring (O‘zbekcha, Ruscha, Inglizcha) — barcha matnlar 100% to‘liq tarjima qilinganligini ko‘rasiz.
3. **"Maxsus tort"** bo‘limiga o‘tib konstruktor orqali tort yig‘ing va savatga qo‘shing.
4. Admin panelga kiring (`/admin`):
   - Yangi tort qo‘shish tugmasini bosing: Galereyadan yoki qurilmangizdan rasm tanlash imkoniyati to‘liq ishlaydi.
   - Checkbox-lar yangi zamonaviy SVG animatsiyali ko‘rinishda.
   - Buyurtmalar jadvalidagi holat dropdown menyusi (Kutilmoqda, Pishirilmoqda, Yetkazildi) hech qanday jadval qirqilishisiz, erkin va silliq ochiladi.
