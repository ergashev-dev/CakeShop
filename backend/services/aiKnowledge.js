/**
 * Central structured knowledge repository for Bol Tortlari
 */
export const siteKnowledge = {
  brand: {
    name: 'Bol Tortlari',
    tagline: 'Har bir bayramga o‘ziga xos ta’m',
    experience: '10+ yillik professional qandolatchilik tajribasi',
    happyCustomers: '15 000+ mamnun mijozlar',
    rating: '4.95 yulduzli xizmat ko‘rsatish reytingi',
    description:
      '100% tabiiy va sifatli ingredientlar, fransuz va italyan qandolatchilik san‘ati va individual eksklyuziv dizayn asosida tayyorlanadigan shohona bayram tortlari.',
    founder: 'Qandolatchi ustalar jamoasi va bosh oshpaz',
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
      'Toshkent shahri (barcha tumanlar: Chilonzor, Yunusobod, Mirzo Ulug‘bek, Yakkasaroy, Shayxontohur, Olmazor, Mirobod, Sergeli, Uchtepa, Yashnobod, Bektemir)',
      'Toshkent viloyati (shahar atrofidagi hududlar - 35 000 so‘m yetkazib berish)',
      'Farg‘ona shahri (markaziy filial va shahar bo‘ylab tezkor yetkazib berish)',
    ],
    rules:
      '300 000 so‘mdan yuqori buyurtmalar Toshkent va Farg‘ona shahar ichida mutlaqo bepul yetkazib beriladi.',
  },
  payments: {
    methods: ['Naqd pul', 'Karta orqali onlayn (Humo, Uzcard)', 'Payme', 'Click', 'Uzum Bank'],
    cashbackPercent: 3,
    cashbackDescription: 'Har bir yetkazib berilgan buyurtma summasidan 3% avtomatik tarzda hamyoningizga keshbek sifatida qaytariladi.',
  },
  specialFeatures: {
    customCakes: '3D maxsus tort konstruktori orqali qavatlar, kremlar, to‘ldirgichlar va yozuvlarni mustaqil tanlash imkoniyati.',
    expressDelivery: 'Katalogdagi tayyor mashhur tortlar 1-2 soat ichida yetkazib beriladi.',
    bentoCakes: '1-2 kishilik mini bento tortlar va individual tabrik yozuvlari.',
    packaging: 'Har bir tort maxsus termoboks va bayramona tasma bilan qadoqlanadi.',
  },
  languages: ['uz', 'ru', 'en'],
};

export default siteKnowledge;
