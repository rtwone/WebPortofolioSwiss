import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';

export default function Footer({ showBackToTop = true }) {
  const { siteContent, t } = usePortfolioData();
  const footer = siteContent?.footer || {};

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#fcfbf9] border-t border-[#d8d2c7] text-[#181818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          {/* Left */}
          <div className="font-mono font-bold text-[11px] sm:text-xs tracking-wider text-[#181818]">
            {footer.copyright || '© 2025 IRFAN HARIYANTO. ALL RIGHTS RESERVED.'}
          </div>

          {/* Right: Admin Console Link + Back to Top Button */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              to="/admin"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#181818] text-[#fcfbf9] border border-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:border-[#8c7355] transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.footer.adminPanel}</span>
            </Link>

            {showBackToTop && (
            <button
              type="button"
              onClick={handleBackToTop}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f7f5f0] border border-[#181818] font-mono font-bold text-xs text-[#181818] uppercase tracking-wider hover:bg-[#181818] hover:text-[#fcfbf9] transition-colors duration-200 cursor-pointer"
            >
              <span>{t.footer.backToTop}</span>
            </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
