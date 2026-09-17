import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, description = null, duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, message, description };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, desc, duration) => addToast('success', msg, desc, duration),
    error: (msg, desc, duration) => addToast('error', msg, desc, duration),
    info: (msg, desc, duration) => addToast('info', msg, desc, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast: toast.success }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              item.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-[#064E3B]/90 border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                : item.type === 'error'
                ? 'bg-rose-50/95 dark:bg-[#881337]/90 border-rose-200 dark:border-rose-700 text-rose-900 dark:text-rose-100'
                : 'bg-amber-50/95 dark:bg-[#78350F]/90 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{item.message}</p>
              {item.description && (
                <p className="text-xs opacity-90 mt-1 leading-normal">{item.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
