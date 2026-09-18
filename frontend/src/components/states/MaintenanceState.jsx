import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, Phone, Send, ShieldCheck } from 'lucide-react';

const MaintenanceState = ({ maintenanceMode }) => {
  const title = maintenanceMode?.title || 'Texnik sozlash ishlari olib borilmoqda';
  const message =
    maintenanceMode?.message ||
    'Saytimizni yanada yaxshilash va sifatini oshirish maqsadida qisqa muddatli texnik sozlash olib borilmoqda. Tez orada qaytamiz!';
  const estimatedEndTime = maintenanceMode?.estimatedEndTime || 'Tez orada';
  const contactPhone = maintenanceMode?.contactPhone || '+998 (90) 123-45-67';
  const contactTelegram = maintenanceMode?.contactTelegram || '@boltortlarbot';

  return (
    <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#0D0E12] text-[#111827] dark:text-[#F3F4F6] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2563EB]/10 dark:bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#EAB308]/10 dark:bg-[#EAB308]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <header className="z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] shadow-sm flex items-center justify-center">
          <img src="/favicon-48x48.png" alt="Bol Tortlari" className="w-6 h-6 rounded-lg" />
        </div>
        <span className="font-bold text-base tracking-tight text-[#111827] dark:text-[#F3F4F6]">
          Bol Tortlari
        </span>
      </header>

      {/* Main Content Card */}
      <main className="z-10 max-w-md w-full my-auto text-center px-2">
        {/* Animated Icon Container */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] shadow-xl flex items-center justify-center text-[#2563EB]">
            <Wrench className="w-9 h-9 animate-pulse text-[#2563EB]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-[#F9FAFB] mb-3">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed mb-6">
          {message}
        </p>

        {/* Estimated Time Badge */}
        {estimatedEndTime && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border border-[#BFDBFE]/60 dark:border-[#1E3A8A] text-[#2563EB] dark:text-[#93C5FD] text-xs font-semibold mb-8">
            <Clock className="w-3.5 h-3.5" />
            <span>Taxminiy tayyor bo‘lish vaqti: {estimatedEndTime}</span>
          </div>
        )}

        {/* Fast Contact Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] text-xs font-bold text-[#111827] dark:text-[#E5E7EB] hover:border-[#2563EB] shadow-subtle transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#2563EB]" />
            <span>Qo‘ng‘iroq qilish</span>
          </a>
          <a
            href={`https://t.me/${contactTelegram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-subtle transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Telegram orqali buyurtma</span>
          </a>
        </div>

        <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
          Keltirilgan noqulayliklar uchun uzr so‘raymiz. Biz bilan bog‘lanib buyurtma berishingiz mumkin.
        </p>
      </main>

      {/* Footer & Admin Bypass Link */}
      <footer className="z-10 text-center pt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#9CA3AF] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin sifatida kirish</span>
        </Link>
      </footer>
    </div>
  );
};

export default MaintenanceState;
