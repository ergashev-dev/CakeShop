import React, { useState } from 'react';
import { Sparkles, User, Volume2, VolumeX } from 'lucide-react';
import MiraProductCard from './MiraProductCard';
import MiraOrderStatus from './MiraOrderStatus';
import MiraConfirmationCard from './MiraConfirmationCard';
import MiraQuickActions from './MiraQuickActions';

export const MiraMessage = ({
  message,
  onAddToCart,
  onQuickAction,
  onConfirmAction,
  onCancelAction,
}) => {
  if (!message) return null;
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Play text to speech
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown ** symbols for smooth speech
    const cleanText = (message.text || '').replace(/\*\*/g, '').replace(/#\w+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Prefer Uzbek or Russian or system voice
    const voices = window.speechSynthesis.getVoices();
    const uzOrRuVoice = voices.find(v => v.lang.startsWith('uz') || v.lang.startsWith('ru'));
    if (uzOrRuVoice) {
      utterance.voice = uzOrRuVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Format simple markdown: **bold** and linebreaks
  const renderFormattedText = (text = '') => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lIdx} className="block min-h-[1.1rem]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div
      className={`flex items-start gap-2.5 my-3 animate-in fade-in duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white ${
          isUser
            ? 'bg-[#111827] dark:bg-stone-700'
            : 'bg-gradient-to-tr from-[#2563EB] to-indigo-500'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
      </div>

      {/* Bubble Content */}
      <div
        className={`space-y-2 max-w-[85%] ${
          isUser ? 'items-end text-right' : 'items-start text-left'
        }`}
      >
        {/* User Attached Image */}
        {message.image && (
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#26282E] max-w-xs shadow-xs">
            <img src={message.image} alt="User upload" className="w-full h-auto object-cover max-h-48" />
          </div>
        )}

        {/* Text Message Bubble */}
        {message.text && (
          <div className="relative group">
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                isUser
                  ? 'bg-[#2563EB] text-white rounded-tr-xs'
                  : 'bg-[#F3F4F6] dark:bg-[#1E2026] text-[#111827] dark:text-[#F3F4F6] rounded-tl-xs'
              }`}
            >
              {renderFormattedText(message.text)}
            </div>

            {/* TTS Speaker icon on assistant messages */}
            {!isUser && (
              <button
                type="button"
                onClick={handleSpeak}
                className="mt-1 ml-1 text-stone-400 hover:text-[#2563EB] dark:hover:text-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px]"
                title={isSpeaking ? "Ovozni to'xtatish" : "Ovoz chiqarib o'qish"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="text-red-500 font-semibold">To‘xtatish</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    <span>Eshitish</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Embedded Products */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-2 pt-1 w-full">
            {message.products.map((cake) => (
              <MiraProductCard
                key={cake._id || cake.id}
                cake={cake}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {/* Embedded Order Status */}
        {message.order && (
          <div className="pt-1 w-full">
            <MiraOrderStatus order={message.order} />
          </div>
        )}

        {/* Embedded Confirmation Card */}
        {message.requiresConfirmation && (
          <div className="pt-1 w-full">
            <MiraConfirmationCard
              title={message.confirmationTitle}
              description={message.confirmationDesc}
              confirmLabel={message.confirmLabel}
              cancelLabel={message.cancelLabel}
              onConfirm={() => onConfirmAction && onConfirmAction(message.confirmationType)}
              onCancel={() => onCancelAction && onCancelAction(message.confirmationType)}
              isDangerous={message.confirmationType === 'clear_cart'}
            />
          </div>
        )}

        {/* Embedded Quick Actions for this message */}
        {!isUser && message.quickActions && message.quickActions.length > 0 && (
          <MiraQuickActions
            actions={message.quickActions}
            onSelect={onQuickAction}
          />
        )}
      </div>
    </div>
  );
};

export default MiraMessage;
