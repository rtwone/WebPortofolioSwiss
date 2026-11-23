import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, Sun, Moon, Command } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { openCommandPalette } from './CommandPalette';

export default function Navbar() {
  const { siteContent, language, setLanguage, theme, toggleTheme, t } =
    usePortfolioData();
  const navConfig = siteContent?.navbar || {};
  const heroConfig = siteContent?.hero || {};

  const navItems = useMemo(
    () => [
      { id: 'home', index: '00', label: t.nav.home, href: '#home' },
      { id: 'about', index: '01', label: t.nav.about, href: '#about' },
      { id: 'skills', index: '02', label: t.nav.skills, href: '#skills' },
      { id: 'projects', index: '03', label: t.nav.projects, href: '#projects' },
      {
        id: 'experience',
        index: '04',
        label: t.nav.experience,
        href: '#experience',
      },
      { id: 'contact', index: '05', label: t.nav.contact, href: '#contact' },
    ],
    [t]
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (let i = navItems.length - 1; i >= 0; i -= 1) {
        const sectionEl = document.getElementById(navItems[i].id);
        if (sectionEl && sectionEl.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  const handleNavClick = (e, href, id) => {
    e.preventDefault();
    const wasMenuOpen = mobileMenuOpen;
    setMobileMenuOpen(false);
    setActiveSection(id);

    // Android Chrome membatalkan smooth scroll jika layout berubah saat animasi
    // (menu mobile menutup). Tunggu menu menutup, lalu scroll dengan window.scrollTo
    // (lebih andal daripada scrollIntoView) dengan offset tinggi header.
    const doScroll = () => {
      const target = document.querySelector(href);
      if (!target) return;
      const headerOffset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      const finalTop = Math.max(0, Math.round(top));
      if (window.__lenis) {
        window.__lenis.scrollTo(finalTop);
      } else {
        try {
          window.scrollTo({ top: finalTop, behavior: 'smooth' });
        } catch {
          window.scrollTo(0, finalTop);
        }
      }
      // Fallback: jika scroll belum bergerak (dibatalkan browser), lompat langsung.
      const startY = window.pageYOffset;
      window.setTimeout(() => {
        if (Math.abs(window.pageYOffset - startY) < 2 && Math.abs(window.pageYOffset - finalTop) > 4) {
          window.scrollTo(0, finalTop);
        }
      }, 700);
    };

    if (wasMenuOpen) {
      window.setTimeout(doScroll, 320);
    } else {
      doScroll();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#f7f5f0]/90 backdrop-blur-md border-b border-[#d8d2c7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home', 'home')}
              className="font-display font-bold text-sm sm:text-lg md:text-xl tracking-tight text-[#181818] hover:text-[#8c7355] transition-colors cursor-pointer truncate"
            >
              {navConfig.brandName || 'IRFAN HARIYANTO'}
            </a>
          </div>

          {/* Right (Desktop): Navigation Links + Language Switcher + Theme Switcher */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-5"
          >
            <ul className="flex items-center gap-5">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href, item.id)}
                      className={`group relative py-1.5 text-sm font-sans font-semibold tracking-tight transition-colors cursor-pointer ${
                        isActive
                          ? 'text-[#181818]'
                          : 'text-[#3a3835] hover:text-[#181818]'
                      }`}
                    >
                      <span className="font-mono font-bold text-[11px] text-[#8c7355] mr-1">
                        {item.index}
                      </span>
                      {item.label}
                      <span
                        className={`absolute left-0 bottom-0 h-[2px] w-full bg-[#181818] origin-left transition-transform duration-300 ease-out ${
                          isActive
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="h-5 w-[1px] bg-[#d8d2c7]" aria-hidden="true" />

            {/* Command Palette Trigger (⌘K / Ctrl+K) */}
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open Command Palette (Ctrl+K or Cmd+K)"
              title="Command Palette (Ctrl+K / ⌘K)"
              className="inline-flex items-center gap-1.5 px-2.5 h-9 border border-[#181818] bg-[#fcfbf9] text-[#181818] hover:bg-[#181818] hover:text-[#fcfbf9] font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              <Command className="w-3.5 h-3.5 text-[#8c7355]" aria-hidden="true" />
              <span>⌘K</span>
            </button>

            {/* Bilingual Toggle: ID | EN */}
            <div
              role="group"
              aria-label="Language Switcher"
              className="inline-flex items-center border border-[#181818] bg-[#fcfbf9]"
            >
              <button
                type="button"
                onClick={() => setLanguage('id')}
                aria-pressed={language === 'id'}
                className={`px-2.5 py-1.5 font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#181818] hover:bg-[#f7f5f0]'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`px-2.5 py-1.5 font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#181818] hover:bg-[#f7f5f0]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Light / Dark Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              title={
                theme === 'dark'
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              className="inline-flex items-center justify-center w-9 h-9 border border-[#181818] bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              )}
            </button>
          </nav>

          {/* Right (Mobile): Command Palette + Language Switcher + Theme Switcher + Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open Command Palette"
              title="Command Palette (⌘K)"
              className="inline-flex items-center justify-center px-2.5 min-h-[38px] border border-[#181818] bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs cursor-pointer"
            >
              ⌘K
            </button>
            <div
              role="group"
              aria-label="Language Switcher"
              className="inline-flex items-center border border-[#181818] bg-[#fcfbf9]"
            >
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2.5 min-h-[38px] font-mono font-bold text-xs uppercase cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#181818]'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 min-h-[38px] font-mono font-bold text-xs uppercase cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#181818]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Mobile Light / Dark Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              className="inline-flex items-center justify-center w-10 h-10 border border-[#181818] bg-[#fcfbf9] text-[#181818] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-swiss-drawer"
              aria-label={
                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 border border-[#181818] bg-[#fcfbf9] text-[#181818] hover:bg-[#181818] hover:text-[#fcfbf9] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-swiss-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="lg:hidden overflow-hidden bg-[#fcfbf9] border-b border-[#181818]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <div className="mb-4 pb-3 border-b border-[#d8d2c7] flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#5c5852] uppercase tracking-wider">
                  {t.nav.indexNavigation}
                </span>
                <span className="font-mono font-bold text-xs text-[#181818] px-2 py-0.5 bg-[#f7f5f0] border border-[#d8d2c7]">
                  {heroConfig.editionBadge || 'EDITION // 2025'}
                </span>
              </div>

              <ul className="divide-y divide-[#d8d2c7] border-b border-[#d8d2c7]">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href, item.id)}
                        className={`flex items-center justify-between py-3 sm:py-3.5 font-sans font-bold text-sm sm:text-base transition-colors cursor-pointer ${
                          isActive
                            ? 'text-[#8c7355]'
                            : 'text-[#181818] hover:text-[#8c7355]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-[#8c7355]">
                            {item.index} /
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <ArrowUpRight
                          className="w-4 h-4 text-[#5c5852]"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      heroConfig.available !== false
                        ? 'bg-[#16a34a] animate-pulse'
                        : 'bg-[#8c7355]'
                    }`}
                  />
                  <span className="font-mono font-bold text-xs text-[#3a3835]">
                    {heroConfig.statusText}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
      {/* Spacer matching fixed navbar height (h-20) so content starts cleanly below */}
      <div className="h-20 shrink-0" aria-hidden="true" />
    </>
  );
}
