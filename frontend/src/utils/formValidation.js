import i18n from '../locales/i18n';

/**
 * Form field validators providing clean user-facing error messages.
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return i18n.t('ux.validation.required', 'Bu maydonni to‘ldiring');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return i18n.t('ux.validation.invalid_email', 'Email noto‘g‘ri');
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return i18n.t('ux.validation.required', 'Bu maydonni to‘ldiring');
  }
  if (password.length < 8) {
    return i18n.t('ux.validation.password_min', 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak');
  }
  return null;
};

export const validateRequired = (value) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return i18n.t('ux.validation.required', 'Bu maydonni to‘ldiring');
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return i18n.t('ux.validation.required', 'Bu maydonni to‘ldiring');
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) {
    return i18n.t('ux.validation.phone_invalid', 'Telefon raqamini to‘liq kiriting');
  }
  return null;
};

/**
 * Parses any backend error or network failure into clean, human-friendly UX messages.
 * Never leaks raw JSON, stack traces, or internal database exceptions to the user.
 */
export const parseApiError = (error) => {
  // Check for client-side network offline or timeout
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 0,
      title: i18n.t('ux.offline.title', 'Internetga ulanmagan'),
      desc: i18n.t('ux.offline.desc', 'Internet aloqangizni tekshiring va qayta urinib ko‘ring.'),
    };
  }

  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      status: 408,
      title: i18n.t('ux.timeout.title', 'Ulanish uzoq davom etmoqda'),
      desc: i18n.t('ux.timeout.desc', 'Internet aloqangiz sekin bo‘lishi mumkin.'),
    };
  }

  const status = error?.response?.status;
  const backendMsg = error?.response?.data?.message || error?.response?.data?.error;

  // Use backend message if it's already a safe human sentence and not an object/JSON
  if (backendMsg && typeof backendMsg === 'string' && !backendMsg.includes('{') && !backendMsg.includes('Error:')) {
    return {
      status: status || 400,
      title: backendMsg,
      desc: '',
    };
  }

  switch (status) {
    case 401:
      return {
        status: 401,
        title: i18n.t('ux.errors.status_401_title', 'Login kerak'),
        desc: i18n.t('ux.errors.status_401_desc', 'Davom etish uchun tizimga kiring.'),
      };
    case 403:
      return {
        status: 403,
        title: i18n.t('ux.errors.status_403_title', 'Ruxsat yo‘q'),
        desc: i18n.t('ux.errors.status_403_desc', 'Ushbu amalni bajarish uchun sizda yetarli ruxsat yo‘q.'),
      };
    case 404:
      return {
        status: 404,
        title: i18n.t('ux.errors.status_404_title', 'Resurs topilmadi'),
        desc: i18n.t('ux.errors.status_404_desc', 'So‘ralgan ma\'lumot serverda topilmadi.'),
      };
    case 408:
      return {
        status: 408,
        title: i18n.t('ux.errors.status_408_title', 'Ulanish vaqti tugadi'),
        desc: i18n.t('ux.errors.status_408_desc', 'Server javob berishi uzoq davom etdi. Qayta urinib ko‘ring.'),
      };
    case 429:
      return {
        status: 429,
        title: i18n.t('ux.errors.status_429_title', 'Juda ko‘p so‘rov'),
        desc: i18n.t('ux.errors.status_429_desc', 'Iltimos, bir oz kuting va qayta urinib ko‘ring.'),
      };
    case 500:
      return {
        status: 500,
        title: i18n.t('ux.errors.status_500_title', 'Server xatosi'),
        desc: i18n.t('ux.errors.status_500_desc', 'Serverda kutilmagan nosozlik yuz berdi.'),
      };
    case 502:
    case 503:
      return {
        status: status,
        title: i18n.t('ux.errors.status_502_title', 'Server vaqtincha ishlamayapti'),
        desc: i18n.t('ux.errors.status_502_desc', 'Server yangilanmoqda yoki profilaktika ishlari olib borilmoqda.'),
      };
    default:
      return {
        status: status || 500,
        title: i18n.t('ux.errors.general_title', 'Ma\'lumotlarni yuklab bo‘lmadi'),
        desc: i18n.t('ux.errors.general_desc', 'Server bilan bog‘lanishda muammo yuz berdi.'),
      };
  }
};
