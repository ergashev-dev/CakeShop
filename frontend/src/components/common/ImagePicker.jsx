import React, { useState, useRef } from 'react';
import { Upload, Image, Link, Check, Trash2, RefreshCw } from 'lucide-react';
import Button from './Button';

// Curated preset cake gallery photos
const PRESET_CAKE_IMAGES = [
  {
    id: 'hero_cake',
    name: 'Klassik Asalli Tort',
    url: '/hero-cake.jpg',
  },
  {
    id: 'chocolate_cake',
    name: 'Belgiya Shokoladli',
    url: '/cake_chocolate.jpg',
  },
  {
    id: 'strawberry_cake',
    name: 'Yovvoyi Qulupnayli',
    url: '/cake_strawberry.jpg',
  },
  {
    id: 'red_velvet',
    name: 'Qizil Baxmal (Red Velvet)',
    url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pistachio_tart',
    name: 'Pista & Mevali Tart',
    url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bento_cake',
    name: 'Bento Mini Tort',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'wedding_luxury',
    name: 'Hashamatli To‘y Torti',
    url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cheesecake',
    name: 'Nyu-York Chizkeyk',
    url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=80',
  },
];

export default function ImagePicker({
  value = '',
  onChange,
  label = 'Tort rasmi',
  error = '',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle local file upload
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Iltimos, faqat rasm faylini tanlang (JPG, PNG, WEBP).');
      return;
    }

    // Limit size to 5MB for base64 storage
    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5 MB dan kichik bo‘lishi kerak.');
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
      setIsReading(false);
    };
    reader.onerror = () => {
      alert('Rasmni o‘qishda xatolik yuz berdi.');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF]">
            {label}
          </label>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Rasmni olib tashlash
            </button>
          )}
        </div>
      )}

      {/* Selected Image Preview */}
      {value ? (
        <div className="relative p-3 rounded-2xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#F9FAFB] dark:bg-[#1A1C22] flex items-center gap-3.5">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#26282E] bg-white dark:bg-[#111827] flex-shrink-0">
            <img
              src={value}
              alt="Tanlangan tort rasmi"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/cake-logo.svg';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <Check className="w-3.5 h-3.5" />
              Rasm tanlandi
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
              {value.startsWith('data:')
                ? 'Qurilmadan yuklangan rasm'
                : value.length > 45
                ? `${value.substring(0, 45)}...`
                : value}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    setActiveTab('gallery');
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA]"
              >
                <RefreshCw className="w-3 h-3" />
                Almashtirish
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#FAFAFA] dark:bg-[#16181D] p-3">
          {/* Method Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1F2228] mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-white dark:bg-[#16181D] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              Galereyadan tanlash
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-[#16181D] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Qurilmadan yuklash
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-[#16181D] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              Havola (URL)
            </button>
          </div>

          {/* TAB 1: PRESET GALLERY */}
          {activeTab === 'gallery' && (
            <div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mb-2 font-medium">
                Katalogdan mos tort rasmini 1 marta bosib tanlang:
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_CAKE_IMAGES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => onChange(preset.url)}
                    className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#26282E] bg-white dark:bg-[#1E2026] cursor-pointer hover:border-[#2563EB] transition-all aspect-square"
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[9px] text-white font-medium leading-tight truncate">
                        {preset.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE UPLOAD */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/20'
                  : 'border-[#D1D5DB] dark:border-[#374151] hover:border-[#2563EB] bg-white dark:bg-[#1A1C22]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA] mx-auto mb-2 animate-bounce" />
              <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">
                {isReading ? 'Rasm yuklanmoqda...' : 'Rasmni tanlang yoki bu yerga tortib keling'}
              </div>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                PNG, JPG, WEBP (maksimal 5 MB)
              </p>
            </div>
          )}

          {/* TAB 3: EXTERNAL URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-white dark:bg-[#1F2228] text-xs outline-none focus:border-[#2563EB] text-[#111827] dark:text-[#F3F4F6]"
              />
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                Tashqi veb-sayt yoki bulutli saqlash xizmatidan to‘g‘ridan-to‘g‘ri rasm havolasi
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
