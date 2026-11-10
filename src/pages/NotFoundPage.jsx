import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Command } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { openCommandPalette } from '../components/CommandPalette';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  const { language } = usePortfolioData();
  const location = useLocation();
  const isId = language === 'id';

  return (
    <div className="theme-portfolio min-h-screen flex flex-col bg-[#f7f5f0] text-[#181818] selection:bg-[#181818] selection:text-[#fcfbf9] transition-colors duration-200">

      <main className="flex-1 flex items-center swiss-grid-bg border-b border-[#d8d2c7] py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 w-full">
          <div className="border-2 border-[#181818] bg-[#fcfbf9]">
            {/* Top Technical Metadata Strip */}
            <div className="px-4 sm:px-8 py-3.5 border-b border-[#d8d2c7] bg-[#f7f5f0] flex flex-wrap items-center justify-between gap-2 font-mono font-bold text-xs">
              <div className="flex items-center gap-2 text-[#8c7355]">
                <span className="inline-block w-2 h-2 bg-red-600" aria-hidden="true" />
                <span>STATUS: 404_NOT_FOUND</span>
              </div>
              <span className="text-[#5c5852] truncate max-w-full">
                PATH: {location.pathname}
              </span>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col items-start justify-center lg:border-r lg:border-[#d8d2c7] lg:pr-8">
                <div
                  aria-hidden="true"
                  className="font-display font-extrabold text-6xl sm:text-8xl lg:text-[9.5rem] leading-none tracking-tighter text-transparent select-none"
                  style={{
                    WebkitTextStroke: '2.5px var(--text-primary)',
                  }}
                >
                  404
                </div>
                <span className="mt-2 px-2.5 py-1 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-[11px] uppercase tracking-widest">
                  ROUTING EXCEPTION // NULL_POINTER
                </span>
              </div>

              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                <div>
                  <h1 className="font-display font-bold text-xl sm:text-3xl md:text-4xl text-[#181818] tracking-tight leading-tight">
                    {isId ? 'Halaman Tidak Ditemukan.' : 'Page Not Found.'}
                  </h1>
                  <p className="mt-2.5 sm:mt-3 font-sans font-medium text-sm sm:text-base md:text-lg text-[#3a3835] leading-relaxed">
                    {isId
                      ? 'Halaman tidak ditemukan. Sepertinya tautan yang Anda tuju telah dipindahkan atau tidak pernah ada.'
                      : 'Page not found. The link you followed may be broken, or the page may have been removed.'}
                  </p>
                </div>

                {/* Action CTAs */}
                <div className="pt-4 border-t border-[#d8d2c7] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#181818] text-[#fcfbf9] hover:bg-[#8c7355] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isId ? 'Kembali ke Beranda' : 'Back to Safety'}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={openCommandPalette}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#fcfbf9] text-[#181818] border-2 border-[#181818] hover:bg-[#181818] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Command className="w-4 h-4 text-[#8c7355] shrink-0" aria-hidden="true" />
                    <span>Open Command Palette (⌘K)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer showBackToTop={false} />
    </div>
  );
}
