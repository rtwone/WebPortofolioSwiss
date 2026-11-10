import React from 'react';
import { RotateCcw, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      detailsOpen: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndReset = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('portfolio_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, detailsOpen } = this.state;

    return (
      <div className="theme-portfolio min-h-screen flex items-center justify-center bg-[#f7f5f0] text-[#181818] swiss-grid-bg p-4 sm:p-8">
        <div className="w-full max-w-2xl border-2 border-[#181818] bg-[#fcfbf9] shadow-2xl">
          {/* Top Warning Header */}
          <div className="px-5 sm:px-8 py-4 border-b border-[#d8d2c7] bg-[#f7f5f0] flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle
                className="w-3.5 h-3.5 text-amber-400 shrink-0"
                aria-hidden="true"
              />
              <span>CRITICAL_RUNTIME_EXCEPTION</span>
            </div>
            <span className="font-mono font-bold text-xs text-[#8c7355]">
              SAFE_MODE // FALLBACK_UI
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#181818] tracking-tight">
                Terjadi kendala saat memuat data tampilan.
              </h1>
              <p className="mt-2 font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed">
                Aplikasi menangkap pengecualian runtime tak terduga agar halaman tidak
                berhenti pada layar kosong. Silakan muat ulang halaman atau bersihkan
                cache penyimpanan lokal.
              </p>
            </div>

            {/* Collapsible Technical Details */}
            <div className="border border-[#d8d2c7] bg-[#f7f5f0]">
              <button
                type="button"
                onClick={() =>
                  this.setState((prev) => ({ detailsOpen: !prev.detailsOpen }))
                }
                aria-expanded={detailsOpen}
                className="w-full px-4 py-3 flex items-center justify-between font-mono font-bold text-xs text-[#181818] uppercase tracking-wider hover:bg-[#fcfbf9] transition-colors cursor-pointer"
              >
                <span>Technical Details (error.message)</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#8c7355] transition-transform duration-200 ${
                    detailsOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {detailsOpen && (
                <div className="p-4 border-t border-[#d8d2c7] bg-[#181818] text-[#fcfbf9] font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {error?.message || String(error || 'Unknown runtime error')}
                  </pre>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#181818] text-[#fcfbf9] hover:bg-[#8c7355] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#fcfbf9] text-[#181818] border-2 border-[#181818] hover:bg-[#181818] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Trash2
                  className="w-4 h-4 text-[#8c7355] shrink-0"
                  aria-hidden="true"
                />
                <span>Clear Cache &amp; Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
