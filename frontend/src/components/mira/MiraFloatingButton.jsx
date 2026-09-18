import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

export const MiraFloatingButton = ({ isOpen, onClick, isEnabled = true }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDocked, setIsDocked] = useState('right'); // default docked to right on mobile/desktop for zero obstruction
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0, hasMoved: false });
  const buttonRef = useRef(null);

  // Initialize position and saved docked preference
  useEffect(() => {
    const saved = localStorage.getItem('bol_tortlari_mira_btn_dock');
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Default safe placement: ~120px from bottom (above any footer buttons), aligned to edge
    const defaultY = Math.max(80, screenH - 160);
    const defaultX = screenW - 130;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPos({
          x: Math.min(Math.max(10, parsed.x || defaultX), screenW - 80),
          y: Math.min(Math.max(70, parsed.y || defaultY), screenH - 80),
        });
        setIsDocked(parsed.isDocked || false);
        return;
      } catch (e) {
        // ignore
      }
    }

    setPos({ x: defaultX, y: defaultY });
    // On mobile (< 640px), default to docked 'right' so it NEVER blocks any buttons!
    if (screenW < 640) {
      setIsDocked('right');
    } else {
      setIsDocked(false);
    }
  }, []);

  // Save dock state & position
  const saveState = (newPos, newDocked) => {
    try {
      localStorage.setItem(
        'bol_tortlari_mira_btn_dock',
        JSON.stringify({ x: newPos.x, y: newPos.y, isDocked: newDocked })
      );
    } catch (e) {
      // ignore
    }
  };

  // Drag start (mouse / touch)
  const handleDragStart = (clientX, clientY) => {
    if (isOpen) return;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  // Drag move
  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      dragStartRef.current.hasMoved = true;
    }

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const newX = Math.min(Math.max(0, dragStartRef.current.startPosX + deltaX), screenW - 110);
    const newY = Math.min(Math.max(65, dragStartRef.current.startPosY + deltaY), screenH - 65);

    setPos({ x: newX, y: newY });
  };

  // Drag end
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const screenW = window.innerWidth;

    // Check if swiped/dragged near left or right edge to dock
    let nextDocked = false;
    if (pos.x < 45) {
      nextDocked = 'left';
    } else if (pos.x > screenW - 140) {
      nextDocked = 'right';
    }

    setIsDocked(nextDocked);
    saveState(pos, nextDocked);
  };

  // Touch event listeners
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    if (!dragStartRef.current.hasMoved) {
      // It was a tap!
      onClick();
    }
    handleDragEnd();
  };

  // Mouse event listeners
  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    handleDragStart(e.clientX, e.clientY);

    const onMouseMove = (ev) => handleDragMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (!dragStartRef.current.hasMoved) {
        onClick();
      }
      handleDragEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isEnabled) {
    return null;
  }

  // ----------------------------------------------------
  // DOCKED TO RIGHT EDGE PILL
  // ----------------------------------------------------
  if (isDocked === 'right' && !isOpen) {
    return (
      <div
        style={{ top: `${pos.y}px` }}
        className="fixed right-0 z-40 select-none group cursor-pointer animate-in slide-in-from-right-2 duration-200"
        onClick={() => {
          setIsDocked(false);
          onClick();
          saveState(pos, false);
        }}
        title="Mira AI — Oynani ochish uchun bosing"
      >
        <div className="bg-[#111827]/95 dark:bg-[#1E222A]/95 backdrop-blur-md text-white border-y border-l border-stone-700/80 rounded-l-2xl py-2 px-2.5 flex items-center gap-1.5 shadow-xl transition-all group-hover:-translate-x-1.5 active:scale-95">
          <ChevronLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </div>
          <span className="text-[11px] font-bold tracking-tight pr-0.5">Mira</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // DOCKED TO LEFT EDGE PILL
  // ----------------------------------------------------
  if (isDocked === 'left' && !isOpen) {
    return (
      <div
        style={{ top: `${pos.y}px` }}
        className="fixed left-0 z-40 select-none group cursor-pointer animate-in slide-in-from-left-2 duration-200"
        onClick={() => {
          setIsDocked(false);
          onClick();
          saveState(pos, false);
        }}
        title="Mira AI — Oynani ochish uchun bosing"
      >
        <div className="bg-[#111827]/95 dark:bg-[#1E222A]/95 backdrop-blur-md text-white border-y border-r border-stone-700/80 rounded-r-2xl py-2 px-2.5 flex items-center gap-1.5 shadow-xl transition-all group-hover:translate-x-1.5 active:scale-95">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </div>
          <span className="text-[11px] font-bold tracking-tight pl-0.5">Mira</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL FLOATING BUTTON (DRAGGABLE & DOCKABLE)
  // ----------------------------------------------------
  return (
    <div
      ref={buttonRef}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-40 select-none flex items-center gap-1.5 transition-shadow ${
        isDragging ? 'cursor-grabbing scale-105 shadow-2xl opacity-90' : 'cursor-grab'
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {/* Tooltip on hover (desktop only) */}
      <div
        className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1A1D24]/95 border border-[#E5E7EB] dark:border-[#26282E] shadow-dropdown text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] transition-all duration-200 pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap ${
          isHovered && !isOpen && !isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Sparkles className="w-3 h-3 text-[#2563EB] animate-pulse" />
        <span>{t('mira.tooltip', 'Miradan so‘rang (surishingiz mumkin)')}</span>
      </div>

      {/* Main Pill Button */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#111827]/95 dark:bg-[#1E222A]/95 backdrop-blur-md text-white border border-stone-700/80 shadow-xl hover:shadow-2xl transition-transform duration-150 active:scale-95 ${
          isOpen ? 'ring-2 ring-[#2563EB] bg-[#1E293B]' : 'hover:border-[#2563EB]/80'
        }`}
      >
        {/* Soft pulse glow when closed */}
        {!isOpen && (
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xs -z-10 animate-pulse duration-1000" />
        )}

        {/* Drag handle icon */}
        <GripVertical className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 transition-colors shrink-0" />

        {/* Gradient Sparkle Avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300 text-amber-300" />
        </div>

        <span className="text-xs font-bold tracking-tight">
          {t('mira.title', 'Mira')}
        </span>

        {/* Online Status Dot */}
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />

        {/* Quick Tuck / Dock Button to edge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const dockSide = pos.x > window.innerWidth / 2 ? 'right' : 'left';
            setIsDocked(dockSide);
            saveState(pos, dockSide);
          }}
          className="p-1 -mr-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          title="Chetga yashirish (Dock to edge)"
        >
          {pos.x > window.innerWidth / 2 ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MiraFloatingButton;
