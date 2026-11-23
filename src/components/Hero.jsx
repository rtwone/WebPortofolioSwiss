import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ArrowUpRight,
  Terminal,
  Code2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import RevealWords from './RevealWords';

const PILL_ICONS = [Code2, Layers, Terminal, Sparkles];

export default function Hero() {
  const { siteContent, projects, t } = usePortfolioData();
  const hero = siteContent?.hero || {};
  const disciplines = Array.isArray(hero.disciplines) ? hero.disciplines : [];

  const disciplineThemes = [
    { border: 'border-l-4 border-l-[#2563eb]', iconBg: 'bg-[#2563eb]/10 text-[#2563eb]', badge: 'text-[#2563eb]' },
    { border: 'border-l-4 border-l-[#dc2626]', iconBg: 'bg-[#dc2626]/10 text-[#dc2626]', badge: 'text-[#dc2626]' },
    { border: 'border-l-4 border-l-[#059669]', iconBg: 'bg-[#059669]/10 text-[#059669]', badge: 'text-[#059669]' },
    { border: 'border-l-4 border-l-[#7c3aed]', iconBg: 'bg-[#7c3aed]/10 text-[#7c3aed]', badge: 'text-[#7c3aed]' },
  ];

  // Parse daftar roles/titles dari hero.subtitle (bisa dipisah tanda koma `,` atau garis tegak `|`)
  const rolesList = useMemo(() => {
    const raw = hero.subtitle || 'Software Engineer & Visual Designer';
    const split = raw
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return split.length > 0
      ? split
      : ['Software Engineer', 'Visual Designer', 'Full-Stack Developer'];
  }, [hero.subtitle]);

  const [roleIndex, setRoleIndex] = useState(0);

  // Ganti role secara otomatis dengan interval
  useEffect(() => {
    if (rolesList.length <= 1) return undefined;
    const timer = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % rolesList.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [rolesList]);

  // Jaga index tetap valid jika jumlah role berubah
  const currentRole = rolesList[roleIndex % rolesList.length] || rolesList[0];

  const scrollToSection = (e, selector) => {
    e.preventDefault();
    const element = document.querySelector(selector);
    if (element) {
      if (window.__lenis) {
        window.__lenis.scrollTo(element, { offset: -80 });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="home"
      aria-label="Introduction and Editorial Hero"
      className="relative border-b border-[#d8d2c7] swiss-grid-bg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="border-x border-[#d8d2c7] bg-[#f7f5f0]/95">
          {/* Top Metadata Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4 border-b border-[#d8d2c7] bg-[#fcfbf9] flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3"
          >
            {/* Left: Status Indicator */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {hero.available !== false && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    hero.available !== false ? 'bg-[#16a34a]' : 'bg-[#8c7355]'
                  }`}
                />
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-[#181818]">
                {hero.statusText || 'AVAILABLE FOR FREELANCE & COLLABORATION'}
              </span>
            </div>

            {/* Right: Location */}
            <div className="flex items-center gap-2 text-[#5c5852]">
              <MapPin
                className="w-3.5 h-3.5 text-[#8c7355] shrink-0"
                aria-hidden="true"
              />
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase">
                {hero.locationText || 'BASED IN SUMENEP, EAST JAVA — ID'}
              </span>
            </div>
          </motion.div>

          {/* Main Asymmetric Swiss Headline Area */}
          <div className="px-4 sm:px-8 lg:px-10 pt-8 sm:pt-14 lg:pt-20 pb-8 sm:pb-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end"
            >
              <div className="lg:col-span-9 min-w-0">
                <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 mb-4 sm:mb-5 bg-[#fcfbf9] border border-[#d8d2c7] border-l-4 border-l-[#dc2626] shadow-sm max-w-full">
                  <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-[#dc2626]">
                    {hero.editionBadge || 'EDITION // 2025'}
                  </span>
                  <span className="hidden xs:inline text-[#d8d2c7]" aria-hidden="true">
                    |
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-[#181818]">
                    {hero.archiveLabel || 'ENGINEERING & VISUAL ARCHIVE'}
                  </span>
                </div>

                {/* Line 1: Playfair Display ExtraBold (Mobile-First Responsive Scale) */}
                <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] tracking-tight text-[#181818] leading-tight lg:leading-[1.04]">
                  <RevealWords text={hero.name || 'Irfan Hariyanto'} immediate stagger={0.08} />
                </h1>

                {/* Line 2: Cormorant Garamond Bold Italic dengan Animasi Kedip Halus (Cross-fade) */}
                <div className="mt-2.5 sm:mt-4 font-calligraphic font-bold italic text-2xl sm:text-3xl md:text-4xl lg:text-[3.25rem] text-[#8c7355] leading-snug lg:leading-[1.12] min-h-[1.3em] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentRole}
                      initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
                      transition={{ duration: 0.55, ease: 'easeInOut' }}
                      className="inline-block"
                    >
                      {currentRole}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column Technical Stamp on Desktop */}
              <div className="lg:col-span-3 lg:border-l lg:border-[#d8d2c7] lg:pl-6 flex flex-col justify-end">
                <div className="p-4 bg-[#fcfbf9] border border-[#d8d2c7] border-t-2 border-t-[#2563eb] shadow-sm">
                  <div className="font-mono font-bold text-[11px] text-[#2563eb] uppercase tracking-wider flex items-center justify-between">
                    <span>{hero.stampLabel || 'DISCIPLINARY MATRIX'}</span>
                    <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                  </div>
                  <div className="mt-1 font-mono font-bold text-sm text-[#181818]">
                    {hero.stampTitle || 'LOGIC × TYPOGRAPHY'}
                  </div>
                  <p className="mt-1.5 font-sans font-medium text-xs text-[#3a3835] leading-relaxed">
                    {hero.stampDescription ||
                      'Arsitektur kode modular berpadu dengan sistem grid editorial Swiss yang presisi.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Grid: 2 Columns under Headline separated by 1px hairline border */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 border-t border-[#d8d2c7]"
          >
            {/* Left Column (7 Cols): Bold Description */}
            <div className="lg:col-span-7 p-4 sm:p-8 lg:p-10 lg:border-r border-[#d8d2c7] bg-[#fcfbf9]/60 flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-xs sm:text-sm text-[#8c7355] uppercase tracking-wider mb-3">
                  {t.hero.executiveSummary}
                </div>
                <p className="font-sans font-semibold text-sm sm:text-base md:text-lg lg:text-xl text-[#3a3835] leading-relaxed">
                  {hero.summary}
                </p>
              </div>

              {/* Technical Capabilities Strip */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#d8d2c7] grid grid-cols-1 sm:grid-cols-2 gap-3">
                {disciplines.map((item, idx) => {
                  const IconComponent = PILL_ICONS[idx % PILL_ICONS.length];
                  const theme = disciplineThemes[idx % disciplineThemes.length];
                  return (
                    <motion.div
                      key={item.code || idx}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.18 + idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 bg-[#fcfbf9] border border-[#d8d2c7] ${theme.border} hover:shadow-md transition-shadow min-w-0`}
                    >
                      <div className={`p-1 rounded ${theme.iconBg} shrink-0`}>
                        <IconComponent
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </div>
                      <span className={`font-mono font-bold text-[11px] sm:text-xs tracking-wider ${theme.badge} shrink-0`}>
                        {item.code}
                      </span>
                      <span className="font-sans font-semibold text-xs sm:text-[13px] text-[#181818] leading-tight break-words">
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (5 Cols): Action Buttons & Quick Links */}
            <div className="lg:col-span-5 p-4 sm:p-8 lg:p-10 border-t lg:border-t-0 border-[#d8d2c7] bg-[#fcfbf9] flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-xs sm:text-sm text-[#5c5852] uppercase tracking-wider mb-4">
                  {t.hero.directNavigation}
                </div>

                <div className="flex flex-col gap-3.5">
                  <a
                    href="#projects"
                    onClick={(e) => scrollToSection(e, '#projects')}
                    className="w-full inline-flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#8c7355] transition-colors duration-200 cursor-pointer"
                  >
                    <span>
                      {hero.primaryCtaText || 'Explore Selected Works ↓'}
                    </span>
                    <span className="font-mono text-xs opacity-80 shrink-0">
                      {String(projects.length).padStart(2, '0')} {t.hero.worksCount}
                    </span>
                  </a>

                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, '#contact')}
                    className="w-full inline-flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-2 border-[#181818] text-[#181818] bg-transparent font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#181818] hover:text-[#fcfbf9] transition-colors duration-200 cursor-pointer"
                  >
                    <span>
                      {hero.secondaryCtaText || 'Contact / Collaboration ↗'}
                    </span>
                    <ArrowUpRight
                      className="w-4 h-4 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>

              {/* Quick Metadata Footer inside Hero Right Col */}
              <div className="mt-8 pt-5 border-t border-[#d8d2c7] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block font-mono font-bold text-[11px] text-[#5c5852] uppercase">
                    {t.hero.primaryRepo}
                  </span>
                  <a
                    href={hero.githubUrl || 'https://github.com/rtwone'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[#181818] hover:text-[#8c7355] transition-colors"
                  >
                    {hero.githubLabel || 'github.com/rtwone'}
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
                <div className="text-left sm:text-right">
                  <span className="block font-mono font-bold text-[11px] text-[#5c5852] uppercase">
                    {t.hero.academicAffiliation}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#181818]">
                    {hero.affiliation || 'UNIVERSITAS WIRARAJA'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
