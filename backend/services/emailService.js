import 'dotenv/config';
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // Check if custom SMTP or Gmail credentials are provided
    const rawUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const user = rawUser ? rawUser.replace(/^["']|["']$/g, '').trim() : '';
    const pass = rawPass ? rawPass.replace(/^["']|["']$/g, '').trim() : '';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
      console.log(`✉️  Nodemailer: Gmail rasmiy pochtasi ulandi (${user})`);
    } else {
      // Automatic development fallback using Ethereal test account
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`✓ Nodemailer sinov pochtasi faollashtirildi: ${testAccount.user}`);
      } catch (err) {
        console.warn('⚠️ Nodemailer test pochtasini yuklashda ogohlantirish:', err.message);
      }
    }
  }

  getFromHeader() {
    const rawUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const user = rawUser ? rawUser.replace(/^["']|["']$/g, '').trim() : '';
    if (user) {
      return `"Bol Tortlari" <${user}>`;
    }
    return process.env.EMAIL_FROM || '"Bol Tortlari" <no-reply@boltortlari.uz>';
  }

  getTransporter() {
    return this.transporter;
  }

  /**
   * Send 6-digit registration verification code
   */
  async sendVerificationCode(email, code) {
    if (!this.transporter) await this.initTransporter();
    if (!this.transporter) {
      throw new Error('Tasdiqlash kodi yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E9ED; border-radius: 12px; overflow: hidden; color: #17181A;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 700;">Bol Tortlari</h1>
          <p style="color: #DBEAFE; font-size: 13px; margin: 4px 0 0 0;">Har bir bayramga o‘ziga xos ta’m</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Hisobingizni tasdiqlang</h2>
          <p style="font-size: 14px; color: #6B7280; line-height: 1.5; margin: 0 0 24px 0;">
            Bol Tortlari do‘koniga xush kelibsiz! Ro‘yxatdan o‘tishni yakunlash uchun quyidagi 6 xonali tasdiqlash kodini kiriting:
          </p>
          <div style="background: #F7F8FA; border: 1px solid #E7E9ED; border-radius: 10px; padding: 18px; margin: 0 auto 24px auto; max-width: 240px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2563EB;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
            Ushbu kod <strong>5 daqiqa</strong> davomida amal qiladi. Agar siz ushbu hisobni yaratmagan bo‘lsangiz, ushbu xatni e'tiborsiz qoldiring.
          </p>
        </div>
        <div style="background: #F7F8FA; border-top: 1px solid #E7E9ED; padding: 16px; text-align: center; font-size: 11px; color: #9CA3AF;">
          © ${new Date().getFullYear()} Bol Tortlari. Barcha huquqlar himoyalangan.
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromHeader(),
        to: email,
        subject: `Bol Tortlari — Tasdiqlash kodi: ${code}`,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Tasdiqlash Kodi Linki: ${previewUrl}`);
      }
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error.message);
      throw new Error('Tasdiqlash kodi yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }
  }

  /**
   * Send 6-digit password reset code
   */
  async sendPasswordResetCode(email, code) {
    if (!this.transporter) await this.initTransporter();
    if (!this.transporter) {
      throw new Error('Parolni tiklash kodi yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EFE4D6; border-radius: 16px; overflow: hidden; color: #2C2420; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D97706;">
          <h1 style="color: #FDF8F3; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Bol Tortlari</h1>
          <p style="color: #FDE68A; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Premium shirinliklar va tortlar do‘koni</p>
        </div>
        <div style="padding: 36px 28px; text-align: center;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: #FEF3C7; color: #D97706; font-size: 22px; margin-bottom: 16px;">
            🔒
          </div>
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: #1C1917;">Parolni tiklash so‘rovi</h2>
          <p style="font-size: 14px; color: #78716C; line-height: 1.6; margin: 0 0 24px 0;">
            Hisobingiz xavfsizligini ta'minlash uchun quyidagi 6 xonali maxsus tasdiqlash kodidan foydalaning:
          </p>
          <div style="background: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; max-width: 260px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #B45309;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #A8A29E; line-height: 1.5; margin: 0;">
            Ushbu kod <strong>10 daqiqa</strong> davomida amal qiladi. Agar siz ushbu so‘rovni yubormagan bo‘lsangiz, xatni e'tiborsiz qoldirishingiz mumkin.
          </p>
        </div>
        <div style="background: #FAFAF9; border-top: 1px solid #E7E5E4; padding: 18px; text-align: center; font-size: 12px; color: #A8A29E;">
          © ${new Date().getFullYear()} Bol Tortlari. Barcha huquqlar himoyalangan.
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromHeader(),
        to: email,
        subject: `Bol Tortlari — Parolni tiklash kodi: ${code}`,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Parol Tiklash Linki: ${previewUrl}`);
      }
      return { success: true };
    } catch (error) {
      console.error('Password reset email error:', error.message);
      throw new Error('Parolni tiklash kodi yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }
  }

  /**
   * Send Order Confirmation Invoice
   */
  async sendOrderConfirmation(order) {
    if (!this.transporter) await this.initTransporter();
    if (!this.transporter || !order.customer_email) return;

    const itemsHtml = order.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #17181A;">
            ${it.name} <span style="font-size: 11px; color: #6B7280; font-weight: normal;">(${it.weight})</span>
          </td>
          <td style="padding: 10px 0; font-size: 13px; color: #6B7280; text-align: center;">
            ${it.quantity} ta
          </td>
          <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #17181A; text-align: right;">
            ${(it.price * it.quantity).toLocaleString()} so‘m
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E9ED; border-radius: 12px; overflow: hidden; color: #17181A;">
        <div style="background: #2563EB; padding: 24px; text-align: center; color: #FFFFFF;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Bol Tortlari</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #DBEAFE;">Buyurtmangiz qabul qilindi!</p>
        </div>
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E7E9ED; padding-bottom: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11px; color: #6B7280;">Buyurtma raqami</div>
              <div style="font-size: 16px; font-weight: 700; color: #2563EB;">#${order.orderId || order.id}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #6B7280;">Holati</div>
              <div style="font-size: 13px; font-weight: 600; color: #059669;">Qabul qilindi</div>
            </div>
          </div>

          <p style="font-size: 13px; color: #4B5563; margin-bottom: 16px;">
            Hurmatli <strong>${order.customer_name}</strong>, buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada qandolatchilarimiz tayyorlashga kirishadi.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="border-bottom: 1px solid #E7E9ED; text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Mahsulot</th>
                <th style="padding-bottom: 8px; text-align: center;">Soni</th>
                <th style="padding-bottom: 8px; text-align: right;">Narxi</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background: #F7F8FA; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #4B5563;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Yetkazib berish manzili:</span>
              <strong style="color: #17181A; max-width: 60%; text-align: right;">${order.customer_address}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Yetkazib berish xizmati:</span>
              <strong style="color: #17181A;">${order.delivery_fee === 0 ? 'Bepul' : order.delivery_fee.toLocaleString() + ' so‘m'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #17181A; border-top: 1px solid #E7E9ED; padding-top: 8px; margin-top: 8px;">
              <span>Jami to‘lov:</span>
              <span style="color: #2563EB;">${order.total.toLocaleString()} so‘m</span>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromHeader(),
        to: order.customer_email,
        subject: `Bol Tortlari — Buyurtma qabul qilindi (#${order.orderId || order.id})`,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Buyurtma Cheki Linki: ${previewUrl}`);
      }
    } catch (err) {
      console.error('Order confirmation email failed:', err.message);
    }
  }

  /**
   * Send Order Delivered Notification & Review Invitation Email
   */
  async sendOrderDeliveredEmail(order, recipientEmail, options = {}) {
    if (!this.transporter) await this.initTransporter();
    if (!this.transporter || !recipientEmail) return;

    const { cashbackAmount = 0, reviewUrl = 'http://localhost:5173/profile?tab=reviews' } = options;

    const itemsHtml = (order.items || [])
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 0; font-size: 13px; color: #17181A; font-weight: 500;">
            ${it.name} <span style="font-size: 11px; color: #6B7280;">(${it.weight || '1.5 kg'})</span>
          </td>
          <td style="padding: 10px 0; font-size: 13px; color: #6B7280; text-align: center;">
            ${it.quantity} ta
          </td>
          <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #17181A; text-align: right;">
            ${((it.price || 0) * (it.quantity || 1)).toLocaleString()} so‘m
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E9ED; border-radius: 16px; overflow: hidden; color: #17181A; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
          <div style="font-size: 38px; margin-bottom: 8px;">🎉🎂</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Buyurtmangiz yetkazildi!</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #DBEAFE;">Shirin onlaringiz unutilmas bo‘lsin!</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E7E9ED; padding-bottom: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600;">Buyurtma raqami</div>
              <div style="font-size: 18px; font-weight: 800; color: #2563EB;">#${order.orderId || order.id}</div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #DCFCE7; color: #15803D; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                ✓ Yetkazildi
              </span>
            </div>
          </div>

          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 18px;">
            Hurmatli <strong>${order.customer_name}</strong>! Siz tanlagan tortlar va shirinliklar muvaffaqiyatli yetkazildi. Bol Tortlari jamoasi sizning bayramingiz yoki shirin choyingizga quvonch ulashganidan mamnun!
          </p>

          <!-- Cashback Badge if awarded -->
          ${
            cashbackAmount > 0
              ? `
            <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🎁</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #92400E;">Sizga ${cashbackAmount.toLocaleString()} so‘m keshbek berildi!</div>
                <div style="font-size: 11px; color: #B45309;">Hamyoningizdagi keshbekni keyingi buyurtmalaringizda ishlatishingiz mumkin.</div>
              </div>
            </div>
          `
              : ''
          }

          <!-- Delivered Items -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 8px;">Yetkazilgan mahsulotlar:</div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
            </table>
          </div>

          <!-- Total -->
          <div style="background: #F7F8FA; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: #6B7280;">Jami to‘langan:</span>
            <span style="font-weight: 800; color: #17181A;">${(order.total || 0).toLocaleString()} so‘m</span>
          </div>

          <!-- Rating & Feedback CTA -->
          <div style="text-align: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0F172A;">
              Taassurotingiz qanday bo‘ldi?
            </h3>
            <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748B;">
              Sizning fikringiz biz uchun bebahodir. Qandolatchimiz va kuryerimiz mehnatini 1 daqiqada baholang:
            </p>
            <a href="${reviewUrl}" style="display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; box-shadow: 0 2px 8px rgba(37,99,235,0.3);">
              ⭐️ Buyurtmani baholash va fikr bildirish
            </a>
          </div>

          <!-- Support & Info -->
          <p style="font-size: 11px; color: #9CA3AF; text-align: center; margin: 0; line-height: 1.5;">
            Savollaringiz yoki takliflaringiz bo‘lsa, biz bilan bog‘laning: support@boltortlari.uz | +998 (90) 123-45-67
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.getFromHeader(),
        to: recipientEmail,
        subject: `🎉 Buyurtmangiz yetkazildi! (#${order.orderId || order.id}) — Bol Tortlari`,
        html: htmlContent,
      });
      console.log(`✉️ Yetkazib berish xabarnomasi emailga yuborildi: ${recipientEmail}`);
    } catch (err) {
      console.error('Order delivered email failed:', err.message);
    }
  }
}

export const emailService = new EmailService();
