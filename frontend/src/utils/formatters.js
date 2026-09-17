/**
 * Narxni so'm formatida chiroyli ko'rsatish
 * Misol: 280000 -> "280 000 so'm"
 */
export const formatPrice = (amount, currency = "so'm") => {
  if (amount === undefined || amount === null) return `0 ${currency}`;
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${currency}`;
};

/**
 * Sanani formatlash
 */
export const formatDate = (dateString, locale = 'uz-UZ') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};
