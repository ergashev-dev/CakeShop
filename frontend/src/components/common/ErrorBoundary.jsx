import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled React Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 bg-white dark:bg-[#16181D] border border-stone-200 dark:border-[#26282E] rounded-3xl shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Apple-style minimalist alert icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 mx-auto flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                Nimadir xato ketdi
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                Sahifani qayta yuklab ko‘ring. Muammo takrorlansa, birozdan keyin kirishga urinib ko‘ring.
              </p>
            </div>

            {/* Development-only sanitized error detail (hidden in production) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left p-3 rounded-xl bg-stone-50 dark:bg-[#1C1F26] border border-stone-200/60 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                icon={RefreshCw}
                onClick={this.handleReload}
                className="w-full shadow-xs"
              >
                Qayta yuklash
              </Button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
