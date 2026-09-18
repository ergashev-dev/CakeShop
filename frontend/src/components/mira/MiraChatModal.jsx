import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Image, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiraHeader from './MiraHeader';
import MiraMessage from './MiraMessage';
import MiraTyping from './MiraTyping';
import MiraQuickActions from './MiraQuickActions';
import MiraVoiceButton from './MiraVoiceButton';
import { miraApi } from '../../services/mira/miraApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const INITIAL_QUICK_ACTIONS = [
  '🍰 Tort tanlash',
  '💰 300 000 gacha',
  '🍫 Shokoladli tortlar',
  '🚚 Yetkazib berish',
  '🛒 Savatni ko‘rish',
  '❓ Bol Tortlari haqida',
];

export const MiraChatModal = ({ isOpen, onClose, aiSettings = {} }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addToCart, clearCart, setIsCartOpen, cart, cartSubtotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('bol_tortlari_mira_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        text:
          i18n.language === 'ru'
            ? 'Здравствуйте! Я Mira 👋\n\nЯ помогу вам выбрать торт, узнать цены, оформить заказ и ответить на любые вопросы о Bol Tortlari.\n\nЧем я могу помочь вам сегодня?'
            : i18n.language === 'en'
            ? 'Hello! I am Mira 👋\n\nI can help you select cakes, check prices, place orders, and answer questions about Bol Tortlari.\n\nHow can I help you today?'
            : 'Salom! Men Mira 👋\n\nMen sizga tort tanlash, narxlarni bilish, buyurtma berish va Bol Tortlari haqida savollarga javob berishda yordam beraman.\n\nBugun sizga qanday yordam beray?',
        quickActions: INITIAL_QUICK_ACTIONS,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
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
        cartContext: {
          itemsCount: cart.length,
          subtotal: cartSubtotal,
        },
      });

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.reply || 'Savolingiz qabul qilindi.',
        products: res.products || [],
        order: res.order || null,
        quickActions: res.quickActions || [],
        requiresConfirmation: Boolean(res.requiresConfirmation),
        confirmationType: res.confirmationType || null,
        confirmationTitle: res.confirmationTitle || 'Amalni tasdiqlash',
        confirmationDesc: res.confirmationDesc || res.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Client action execution
      if (res.action === 'open_cart') {
        setIsCartOpen(true);
      } else if (res.action === 'open_auth') {
        // Will notify user
      } else if (res.action === 'view_catalog') {
        navigate('/cakes');
      }
    } catch (err) {
      console.error('Mira send message error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: t(
            'mira.error_network',
            'Internet aloqasida muammo yuz berdi. Iltimos, qayta urinib ko‘ring.'
          ),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (cake) => {
    addToCart(cake, 1);
    toast.success(`${cake.name} savatga qo‘shildi!`);
  };

  const handleConfirmAction = (type) => {
    if (type === 'clear_cart') {
      clearCart();
      toast.success('Savatchangiz tozalandi.');
      setMessages((prev) => [
        ...prev,
        {
          id: `clear-resp-${Date.now()}`,
          role: 'assistant',
          text: 'Savatingiz muvaffaqiyatli tozalandi. Yangi tort tanlaymizmi?',
          quickActions: ['🍰 Tort tanlash', '💰 300 000 gacha'],
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleCancelAction = () => {
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
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          text: t(
            'mira.welcome_message',
            'Salom! Men Mira 👋\n\nMen sizga tort tanlash, narxlarni bilish, buyurtma berish va Bol Tortlari haqida savollarga javob berishda yordam beraman.\n\nBugun sizga qanday yordam beray?'
          ),
          quickActions: INITIAL_QUICK_ACTIONS,
          createdAt: new Date().toISOString(),
        },
      ]);
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
      // Auto prompt
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
        {messages.map((msg) => (
          <MiraMessage
            key={msg.id}
            message={msg}
            onAddToCart={handleAddToCart}
            onQuickAction={(text) => handleSendMessage(text)}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
          />
        ))}

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
