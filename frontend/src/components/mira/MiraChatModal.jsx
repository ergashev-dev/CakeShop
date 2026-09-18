import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Image, Loader2, Sparkles } from 'lucide-react';
import miraApi from '../../services/mira/miraApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import MiraHeader from './MiraHeader';
import MiraMessage from './MiraMessage';
import MiraTyping from './MiraTyping';
import MiraVoiceButton from './MiraVoiceButton';

export const MiraChatModal = ({ isOpen, onClose, aiSettings = {} }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addToCart, clearCart, setIsCartOpen } = useCart();

  // Load history if exists, or start clean with empty Gemini-style state
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('bol_tortlari_mira_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove legacy dummy welcome bubble if user previously had it
          return parsed.filter(m => m.id !== 'welcome-1' && m.id !== 'welcome-reset' && m.id !== 'welcome');
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bol_tortlari_mira_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save Mira history:', e);
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputVal).trim();
    if (!text && !selectedImage) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      image: selectedImage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setSelectedImage(null);
    setIsTyping(true);
    setTypingText(
      text.toLowerCase().includes('tort') || text.toLowerCase().includes('qidir')
        ? t('mira.searching_cakes', 'Tortlarni qidiryapman...')
        : t('mira.typing', 'Mira yozmoqda...')
    );

    // Call API
    try {
      const historyContext = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await miraApi.sendMessage({
        message: text,
        history: historyContext,
        image: userMsg.image,
      });

      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        products: res.products || [],
        order: res.order || null,
        requiresConfirmation: res.requiresConfirmation || false,
        confirmationType: res.confirmationType || null,
        confirmationTitle: res.requiresConfirmation
          ? 'Tasdiqlash'
          : null,
        confirmationDesc: res.reply,
        confirmLabel: 'Ha, tasdiqlayman',
        cancelLabel: 'Bekor qilish',
        quickActions: res.quickActions || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute client-side side-effects if needed
      if (res.action === 'open_cart') {
        setIsCartOpen(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (cake) => {
    addToCart(cake);
    const confirmMsg = {
      id: `cart-add-${Date.now()}`,
      role: 'assistant',
      text: `✅ «${cake.name}» savatga qo‘shildi! Buyurtmani rasmiylashtirasizmi yoki yana tort ko‘rasizmi?`,
      quickActions: ['🛒 Savatni ochish', '🍰 Boshqa tortlar', '🚚 Yetkazib berish'],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleConfirmAction = (type) => {
    if (type === 'clear_cart') {
      clearCart();
      setMessages((prev) => [
        ...prev,
        {
          id: `cart-cleared-${Date.now()}`,
          role: 'assistant',
          text: 'Savatchangiz muvaffaqiyatli tozalandi! Boshqa tort tanlashni xohlaysizmi?',
          quickActions: ['🍰 Tort tanlash', '💰 300 000 gacha'],
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleCancelAction = (type) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-resp-${Date.now()}`,
        role: 'assistant',
        text: 'Amal bekor qilindi. Boshqa savolingiz bormi?',
        quickActions: ['🍰 Tort tanlash', '🚚 Yetkazib berish'],
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleClearHistory = () => {
    if (window.confirm(t('mira.clear_chat_confirm', 'Chat tarixini tozalashni tasdiqlaysizmi?'))) {
      localStorage.removeItem('bol_tortlari_mira_history');
      setMessages([]);
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Fayl hajmi 5MB dan oshmasligi lozim.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      handleSendMessage('Shu rasmga o‘xshash tort bormi?');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed bottom-24 right-4 sm:right-6 left-4 sm:left-auto w-auto sm:w-[420px] h-[580px] max-h-[82vh] bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
      role="dialog"
      aria-label="Mira AI Chat"
    >
      {/* Header */}
      <MiraHeader
        onMinimize={onClose}
        onClose={onClose}
        onClearHistory={handleClearHistory}
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          /* Google Gemini-Style Empty State */
          <div className="h-full flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200 select-none">
            {/* Glowing Sparkle Logo */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] via-indigo-500 to-amber-400 p-0.5 shadow-xl mb-3 animate-pulse duration-1000">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#16181D] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
              {user?.name ? `Salom, ${user.name}!` : 'Salom! Men Mira'}
            </h3>

            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 max-w-xs leading-relaxed">
              Bugun sizga qanday shirinlik yoki ma'lumot kerak?
            </p>

            {/* Gemini Prompt Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 w-full max-w-sm">
              {[
                { icon: '🎂', title: '300 000 so‘mgacha tortlar', prompt: '300 000 so‘mgacha qanday tortlar bor?' },
                { icon: '🚚', title: 'Yetkazib berish shartlari', prompt: 'Yetkazib berish narxi va vaqti qancha?' },
                { icon: '📦', title: 'Buyurtma holatini tekshirish', prompt: 'Buyurtmam qayerda?' },
                { icon: '👨‍💻', title: 'Saytni kim yaratgan?', prompt: 'Sayt va Mirani kim yaratgan?' },
              ].map((card, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(card.prompt)}
                  className="p-3 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2026] hover:border-[#2563EB] dark:hover:border-[#2563EB] hover:shadow-xs transition-all text-left group cursor-pointer active:scale-95"
                >
                  <span className="text-base block mb-0.5">{card.icon}</span>
                  <span className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MiraMessage
              key={msg.id}
              message={msg}
              onAddToCart={handleAddToCart}
              onQuickAction={(text) => handleSendMessage(text)}
              onConfirmAction={handleConfirmAction}
              onCancelAction={handleCancelAction}
            />
          ))
        )}

        {isTyping && <MiraTyping text={typingText} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1A1D24] space-y-2">
        {/* Image Preview if pending */}
        {selectedImage && (
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#202328] border border-[#E5E7EB] dark:border-[#26282E]">
            <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-[10px] text-[#6B7280] truncate flex-1">Rasm yuklandi</span>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-xs text-rose-500 hover:text-rose-600 px-1 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl px-2 py-1.5 shadow-xs focus-within:border-[#2563EB] transition-colors"
        >
          {/* Image Upload Trigger */}
          {aiSettings.imageUnderstanding !== false && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-[#6B7280] hover:text-[#2563EB] dark:text-[#9CA3AF] rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#202328] transition-colors cursor-pointer"
                title={t('mira.image_upload_btn', 'Rasm yuklash')}
              >
                <Image className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('mira.input_placeholder', 'Miradan biror narsa so‘rang...')}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] outline-none px-1"
          />

          {/* Voice Input Button */}
          {aiSettings.voiceAssistant !== false && (
            <MiraVoiceButton
              onTranscript={(transcript) => {
                setInputVal(transcript);
                handleSendMessage(transcript);
              }}
              disabled={isTyping}
            />
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputVal.trim() && !selectedImage) || isTyping}
            className={`p-2 rounded-xl text-white transition-all cursor-pointer ${
              inputVal.trim() || selectedImage
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xs active:scale-95'
                : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
            title={t('mira.btn_send', 'Yuborish')}
          >
            {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MiraChatModal;
