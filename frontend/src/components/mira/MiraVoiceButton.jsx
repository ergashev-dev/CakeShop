import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff } from 'lucide-react';
import PermissionModal from '../states/PermissionModal';
import { usePermission } from '../../hooks/usePermission';

export const MiraVoiceButton = ({ onTranscript, disabled = false }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);
  const recognitionRef = useRef(null);
  const { requestMicrophone } = usePermission();

  const handleStartRecording = async () => {
    try {
      await requestMicrophone();
      setIsMicModalOpen(false);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert(t('ux.permissions.microphone_desc', 'Ovozli qidiruv qurilmangizda qo‘llab-quvvatlanmaydi.'));
        return;
      }

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
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Mira speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
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
      setIsMicModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse shadow-md'
            : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#2563EB] hover:bg-[#F3F4F6] dark:hover:bg-[#202328]'
        }`}
        title={t('mira.voice_btn', 'Ovozli kiritish')}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <PermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onAction={handleStartRecording}
        type="microphone"
        isDenied={isMicDenied}
      />
    </>
  );
};

export default MiraVoiceButton;
