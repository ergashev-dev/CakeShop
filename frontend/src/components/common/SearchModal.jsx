import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Cake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cakeApi } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const SearchModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [cakes, setCakes] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';

      cakeApi.getAll().then((res) => {
        setCakes(res.data?.cakes || []);
      }).catch((err) => console.error(err));
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCakes =
    query.trim() === ''
      ? []
      : cakes.filter(
          (cake) =>
            cake.name.toLowerCase().includes(query.toLowerCase()) ||
            (cake.category_name && cake.category_name.toLowerCase().includes(query.toLowerCase())) ||
            (cake.description && cake.description.toLowerCase().includes(query.toLowerCase()))
        );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 md:p-16 flex justify-center items-start">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#26282E] flex items-center gap-3 bg-[#FBFBFC] dark:bg-[#1F2228]">
          <Search className="w-5 h-5 text-[#2563EB] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tort nomi yoki tarkibi bo‘yicha qidirish..."
            className="w-full bg-transparent text-sm sm:text-base text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] px-2 py-1 rounded-lg bg-[#E5E7EB]/50 dark:bg-[#26282E] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <Cake className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-40" />
              <span>Ommabop qidiruvlar: «San Sebastyan», «Shokoladli», «Red Velvet», «Medovik»</span>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
                Hech narsa topilmadi
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                «{query}» so‘rovi bo‘yicha hech qanday tort mavjud emas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]/60 dark:divide-[#26282E]/60">
              {filteredCakes.map((cake) => (
                <Link
                  key={cake._id || cake.id}
                  to={`/cakes/${cake._id || cake.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] transition-colors group"
                >
                  <img
                    src={cake.image || DEFAULT_CAKE_IMAGE}
                    alt={cake.name}
                    onError={handleImageError}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB] dark:border-[#26282E] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors truncate">
                      {cake.name}
                    </h4>
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      {cake.category_name || 'Tort'} • {cake.weight || '1.5 kg'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-[#111827] dark:text-[#F3F4F6]">
                      {formatPrice(cake.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
