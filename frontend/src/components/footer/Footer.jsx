import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cake, Phone, MapPin, Clock, Send } from 'lucide-react';
import LanguageSelector from '../navbar/LanguageSelector';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="bg-white dark:bg-[#16181D] border-t border-[#E5E7EB] dark:border-[#26282E] pt-12 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-[#E5E7EB] dark:border-[#26282E]">
          
          {/* Col 1: Brand Info (4 cols) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
                <Cake className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="font-bold text-base text-[#111827] dark:text-[#F3F4F6]">
                Bol Tortlari
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-sm mb-4">
              {t('footer.desc', 'Farg‘ona va Uchko‘prikdagi tabiiy ingredientlardan tayyorlanuvchi qandolatchilik ustaxonasi. Har bir bayramingiz uchun maxsus va unutilmas shirinliklar.')}
            </p>

            <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>{t('footer.address', 'Uchko‘prik tumani, Markaziy ko‘cha, 14-uy')}</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (4 cols) */}
          <div className="lg:col-span-4 lg:col-start-6">
            <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] uppercase tracking-wider block mb-3">
              {t('footer.links_title', 'Katalog & Xizmatlar')}
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              <li>
                <Link to="/cakes" className="hover:text-[#2563EB] transition-colors">
                  {t('catalog.title', 'Barcha tortlar katalogi')}
                </Link>
              </li>
              <li>
                <Link to="/custom-cake" className="hover:text-[#2563EB] transition-colors">
                  {t('nav.custom_cake', 'Maxsus individual buyurtma (Konstruktor)')}
                </Link>
              </li>
              <li>
                <Link to="/cakes?sale=true" className="hover:text-[#2563EB] transition-colors">
                  {t('hero.badge', 'Chegirmalar va Aksiyalar')}
                </Link>
              </li>
              <li>
                <a href="/#story" className="hover:text-[#2563EB] transition-colors">
                  {t('nav.about', 'Biz haqimizda va afzalliklar')}
                </a>
              </li>
              <li>
                <a href="/#app" className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                  <span>📱 Ilovani o‘rnatish (Android, iOS, Desktop)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Hours (4 cols) */}
          <div className="lg:col-span-3">
            <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] uppercase tracking-wider block mb-3">
              {t('footer.contact_title', 'Aloqa & Ish vaqti')}
            </span>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                <a href="tel:+998901234567" className="font-semibold text-[#111827] dark:text-[#F3F4F6] hover:text-[#2563EB] transition-colors">
                  +998 (90) 123-45-67
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{t('footer.working_hours', 'Har kuni: 08:00 – 22:00')}</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://t.me/boltortlari_admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#0088cc] flex items-center justify-center hover:scale-105 transition-transform"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/30 text-pink-600 flex items-center justify-center hover:scale-105 transition-transform"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div>
            &copy; {new Date().getFullYear()} Bol Tortlari. {t('footer.rights', 'Barcha huquqlar himoyalangan.')}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector variant="buttons" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
