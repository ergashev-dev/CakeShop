import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import PermissionModal from '../states/PermissionModal';

export const MiraVoiceButton = ({ onTranscript, disabled = false }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);
  const recognitionRef = useRef(null);

  const startSpeechRecognition = (lang = 'uz-UZ') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('ux.permissions.microphone_desc', 'Ovozli kiritish qurilmangizda qo‘llab-quvvatlanmaydi. Matn orqali yozishingiz mumkin.'));
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsMicDenied(true);
          setIsMicModalOpen(true);
        } else if (event.error === 'language-not-supported' && lang === 'uz-UZ') {
          // Fallback to Russian or system language if uz-UZ is not supported on this device
          startSpeechRecognition(navigator.language || 'ru-RU');
          return;
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsListening(false);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleClick = () => {
    if (isListening) {
      handleStopRecording();
    } else {
      setIsMicDenied(false);
      startSpeechRecognition('uz-UZ');
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isListening
            ? 'bg-red-500 text-white shadow-md animate-pulse ring-4 ring-red-400/30'
            : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#2563EB] hover:bg-[#F3F4F6] dark:hover:bg-[#202328]'
        }`}
        title={isListening ? "Ovozni to'xtatish" : "Ovoz orqali gapirish"}
      >
        {isListening ? (
          <div className="flex items-center gap-1">
            <MicOff className="w-4 h-4" />
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      <PermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onAction={() => {
          setIsMicModalOpen(false);
          startSpeechRecognition('uz-UZ');
        }}
        type="microphone"
        isDenied={isMicDenied}
      />
    </>
  );
};

export default MiraVoiceButton;
