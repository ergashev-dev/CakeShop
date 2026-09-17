import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';

const savedLang = localStorage.getItem('bol_tortlari_lang') || 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en }
    },
    lng: savedLang,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false // React allaqachon XSS dan himoyalaydi
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('bol_tortlari_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
