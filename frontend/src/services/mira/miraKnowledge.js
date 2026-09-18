/**
 * Frontend central structured knowledge config for Bol Tortlari
 */
export const siteKnowledge = {
  brand: {
    name: 'Bol Tortlari',
    tagline: 'Har bir bayramga o‘ziga xos ta’m',
    experience: '10+ yillik professional qandolatchilik tajribasi',
    happyCustomers: '15 000+ mamnun mijozlar',
    rating: '4.95 reyting',
    description:
      '100% tabiiy va sifatli ingredientlar, fransuz va italyan qandolatchilik san‘ati va individual eksklyuziv dizayn bilan tayyorlanadigan shohona bayram tortlari.',
    headquarters: 'O‘zbekiston, Toshkent va Farg‘ona',
  },
  contacts: {
    phone: '+998 (90) 123-45-67',
    telegram: '@boltortlari_admin',
    telegramBot: '@boltortlar_bot',
    instagram: '@boltortlar',
    website: 'https://boltortlar.uz',
    address: 'Toshkent sh., Alisher Navoiy ko‘chasi, 14-uy',
    workingHours: '09:00 - 21:00 (dam olish kunlarisiz)',
  },
  delivery: {
    freeThreshold: 300000,
    standardFee: 15000,
    outsideFee: 35000,
    estimatedMinutes: '45 - 90 daqiqa',
    regions: [
      'Toshkent shahri (barcha tumanlar)',
      'Toshkent viloyati (shahar atrofi - 35 000 so‘m)',
      'Farg‘ona shahri (markaziy filial)',
    ],
  },
  payments: {
    methods: ['Naqd pul', 'Karta orqali onlayn (Humo, Uzcard)', 'Payme', 'Click', 'Uzum Bank'],
    cashbackPercent: 3,
  },
};

export default siteKnowledge;
