import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, CheckCircle2, Clock, Truck, ChefHat, Sparkles } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const STAGES = [
  { key: 'confirmed', label: 'Qabul qilindi', icon: CheckCircle2 },
  { key: 'preparing', label: 'Tayyorlanmoqda', icon: ChefHat },
  { key: 'ready', label: 'Tayyor', icon: Package },
  { key: 'delivering', label: 'Kuryerda', icon: Truck },
  { key: 'delivered', label: 'Yetkazildi', icon: Sparkles },
];

const getStageIndex = (status = '') => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'confirmed':
      return 0;
    case 'preparing':
      return 1;
    case 'ready':
      return 2;
    case 'delivering':
    case 'on_the_way':
    case 'assigned':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
};

export const MiraOrderStatus = ({ order }) => {
  const { t } = useTranslation();
  if (!order) return null;

  const currentIdx = getStageIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#26282E] space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-bold text-xs text-[#111827] dark:text-[#F3F4F6]">
              Buyurtma #{order.orderId || order._id?.substring(0, 8)}
            </h5>
            <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
              {order.customer_address || 'Yetkazib berish manzili'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] block">
            {formatPrice(order.total || order.total_price || 0)}
          </span>
          <span className="text-[10px] text-[#2563EB] font-medium">
            {order.payment_method === 'cash' ? 'Naqd pul' : 'Karta orqali'}
          </span>
        </div>
      </div>

      {/* Progress Bar & Steps */}
      {isCancelled ? (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center text-xs text-rose-600 dark:text-rose-400 font-semibold">
          Buyurtma bekor qilingan
        </div>
      ) : (
        <div className="pt-2">
          <div className="relative flex items-center justify-between">
            {/* Progress line */}
            <div className="absolute left-2 right-2 top-3 h-0.5 bg-[#E5E7EB] dark:bg-[#26282E] -z-0" />
            <div
              className="absolute left-2 top-3 h-0.5 bg-[#2563EB] transition-all duration-500 -z-0"
              style={{ width: `${(currentIdx / (STAGES.length - 1)) * 96}%` }}
            />

            {STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                      isCompleted
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white dark:bg-[#1E2026] text-[#9CA3AF] border border-[#D1D5DB] dark:border-[#374151]'
                    } ${isCurrent ? 'ring-2 ring-[#2563EB]/40 ring-offset-1' : ''}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span
                    className={`text-[9px] font-medium mt-1 text-center max-w-[50px] leading-tight ${
                      isCurrent
                        ? 'text-[#2563EB] font-bold dark:text-[#60A5FA]'
                        : isCompleted
                        ? 'text-[#111827] dark:text-[#D1D5DB]'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiraOrderStatus;
