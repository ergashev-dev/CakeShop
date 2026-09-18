import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Cake, Mic, MicOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cakeApi } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';
import { SearchSkeleton } from '../states/LoadingState';
import EmptyState from '../states/EmptyState';
import { usePermission } from '../../hooks/usePermission';
import telegramWebApp from '../../services/telegramWebApp';

const SearchModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [cakes, setCakes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);
  const [isTg, setIsTg] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const { requestMicrophone } = usePermission();

  useEffect(() => {
    setIsTg(telegramWebApp.isInsideTelegram());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setIsLoading(true);

      cakeApi
        .getAll()
        .then((res) => {
          setCakes(res.data?.cakes || []);
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('ux.permissions.microphone_desc', 'Ovozli qidiruv qurilmangizda qo‘llab-quvvatlanmaydi.'));
      return;
    }
    setIsMicDenied(false);
    setIsMicModalOpen(true);
  };

  const handleStartListening = async () => {
    try {
      await requestMicrophone();
      setIsMicModalOpen(false);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'uz-UZ';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsMicDenied(true);
          setIsMicModalOpen(true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      if (err.message === 'denied') {
        setIsMicDenied(true);
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

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
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 md:p-16 flex justify-center items-start"
      style={{
        paddingTop: isTg
          ? 'max(var(--tg-content-safe-area-top, 56px), env(safe-area-inset-top, 0px), 56px)'
          : undefined,
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#26282E] flex items-center gap-2.5 bg-[#FBFBFC] dark:bg-[#1F2228]">
          <Search className="w-5 h-5 text-[#2563EB] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? t('ux.permissions.listening', 'Eshitilmoqda, gapiring...')
                : t('search.placeholder', 'Tort nomi yoki tarkibi bo‘yicha qidirish...')
            }
            className="w-full bg-transparent text-sm sm:text-base text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] outline-none font-medium"
          />

          {/* Voice Search (Microphone) Button */}
          <button
            type="button"
            onClick={isListening ? handleStopListening : handleMicClick}
            title={t('ux.permissions.microphone', 'Ovozli qidiruv')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-gray-100 dark:hover:bg-[#26282E]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] px-2 py-1 rounded-lg bg-[#E5E7EB]/50 dark:bg-[#26282E] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <SearchSkeleton count={4} />
          ) : query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <Cake className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-40" />
              <span>Ommabop qidiruvlar: «San Sebastyan», «Shokoladli», «Red Velvet», «Medovik»</span>
            </div>
          ) : filteredCakes.length === 0 ? (
            <EmptyState
              type="search"
              onAction={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            />
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

      {/* Microphone Permission Modal */}
      <PermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onAction={handleStartListening}
        type="microphone"
        isDenied={isMicDenied}
      />
    </div>
  );
};

export default SearchModal;
