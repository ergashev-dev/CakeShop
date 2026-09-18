import React from 'react';

export const MiraQuickActions = ({ actions = [], onSelect }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none">
      {actions.map((act, index) => {
        const text = typeof act === 'string' ? act : act.label || act.text;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect && onSelect(text)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#26282E] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA] text-xs font-medium text-[#4B5563] dark:text-[#D1D5DB] whitespace-nowrap transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};

export default MiraQuickActions;
