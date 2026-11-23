import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  Search,
  Layers,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { ProjectPhotoFrame, CATEGORY_COLORS } from '../components/Projects';
import Footer from '../components/Footer';
import RevealWords from '../components/RevealWords';

const BASE_CATEGORIES = ['All', 'Development', 'Visual Design', 'Other'];

export default function ProjectsArchivePage() {
  const { projects, siteContent, language, setLanguage, theme, toggleTheme, t } =
    usePortfolioData();
  const navConfig = siteContent?.navbar || {};

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = BASE_CATEGORIES;

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchesCategory =
        selectedCategory === 'All' || proj.category === selectedCategory;

      if (!searchQuery.trim()) return matchesCategory;

      const q = searchQuery.toLowerCase();
      const inTitle = (proj.title || '').toLowerCase().includes(q);
      const inDesc = (proj.description || '').toLowerCase().includes(q);
      const techStr = Array.isArray(proj.tech_stack)
        ? proj.tech_stack.join(' ').toLowerCase()
        : String(proj.tech_stack || '').toLowerCase();

      return matchesCategory && (inTitle || inDesc || techStr.includes(q));
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="theme-portfolio min-h-screen flex flex-col bg-[#f7f5f0] text-[#181818] selection:bg-[#181818] selection:text-[#fcfbf9] transition-colors duration-200">
      {/* Fixed Swiss Archive Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#f7f5f0]/95 backdrop-blur-md border-b border-[#d8d2c7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#fcfbf9] text-[#181818] border border-[#d8d2c7] hover:border-[#181818] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#8c7355]" />
              <span>{t.projects.backToHome}</span>
            </Link>

            <span className="hidden md:inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold text-[#181818] bg-[#fcfbf9] border border-[#d8d2c7]">
              {navConfig.brandName || 'IRFAN HARIYANTO'} //{' '}
              {t.projects.archiveBadge}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bilingual Language Switcher (ID | EN) */}
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex items-stretch h-9 border border-[#d8d2c7] bg-[#fcfbf9]"
            >
              <button
                type="button"
                onClick={() => setLanguage('id')}
                aria-pressed={language === 'id'}
                className={`inline-flex items-center justify-center h-full px-2.5 font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#5c5852] hover:text-[#181818]'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`inline-flex items-center justify-center h-full px-2.5 font-mono font-bold text-xs uppercase border-l border-[#d8d2c7] transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#181818] text-[#fcfbf9]'
                    : 'text-[#5c5852] hover:text-[#181818]'
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
              className="inline-flex items-center justify-center w-9 h-9 border border-[#d8d2c7] bg-[#fcfbf9] text-[#181818] hover:border-[#181818] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>
      <div className="h-20 shrink-0" aria-hidden="true" />

      {/* Main Catalog Content */}
      <main className="flex-1 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Archive Editorial Heading */}
          <div className="pb-8 sm:pb-12 border-b border-[#d8d2c7]">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-[#8c7355]">
                {t.projects.archiveBadge}
              </span>
              <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-end">
              <div className="lg:col-span-8">
                <h1 className="font-display font-bold text-2xl sm:text-4xl md:text-6xl text-[#181818] tracking-tight leading-tight md:leading-[1.08]">
                  <RevealWords text={t.projects.archiveHeadingMain} immediate />{' '}
                  <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-5xl md:text-7xl block sm:inline">
                    <RevealWords
                      text={t.projects.archiveHeadingAccent}
                      immediate
                      delay={0.16}
                    />
                  </span>
                </h1>
              </div>
              <div className="lg:col-span-4">
                <p className="font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed">
                  {t.projects.archiveSubtitle}
                </p>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="mt-8 pt-8 border-t border-[#d8d2c7] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category Buttons */}
              <div
                role="group"
                aria-label="Filter projects by category"
                className="flex flex-wrap gap-2"
              >
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  const displayCat =
                    t.projects.categoryLabels?.[category] || category;
                  const catTheme = CATEGORY_COLORS[category] || CATEGORY_COLORS.All;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={isActive}
                      className={`px-4 py-2.5 font-mono font-bold text-xs uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? catTheme.activeBtn
                          : 'bg-[#fcfbf9] text-[#181818] border-[#d8d2c7] hover:border-[#181818]'
                      }`}
                    >
                      {displayCat}
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative w-full lg:w-80">
                <Search
                  className="w-4 h-4 text-[#5c5852] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.projects.searchPlaceholder}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#fcfbf9] border border-[#d8d2c7] focus:border-[#181818] font-sans font-semibold text-base sm:text-sm text-[#181818] placeholder:text-[#5c5852]/70 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5c5852] hover:text-[#181818] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Counter Strip */}
          <div className="mt-6 flex items-center justify-between font-mono font-bold text-xs text-[#5c5852] uppercase">
            <span>
              {t.projects.showingCount} {filteredProjects.length}{' '}
              {t.projects.ofTotal} {projects.length} {t.projects.projectsUnit}
            </span>
            <span>INDEX // 01 — {String(projects.length).padStart(2, '0')}</span>
          </div>

          {/* Full Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="mt-8 border border-[#d8d2c7] bg-[#fcfbf9] p-12 text-center">
              <Layers className="w-8 h-8 text-[#8c7355] mx-auto mb-3" />
              <p className="font-sans font-semibold text-base text-[#181818]">
                {t.projects.noMatchingProjects}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-5 py-2.5 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] transition-colors cursor-pointer"
              >
                {t.projects.resetFilter}
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, idx) => {
                  const indexLabel = String(idx + 1).padStart(2, '0');
                  const techList = Array.isArray(project.tech_stack)
                    ? project.tech_stack
                    : String(project.tech_stack || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);

                  const catTheme = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.Other;

                  return (
                    <motion.article
                      layout
                      key={project.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.45,
                        delay: (idx % 2) * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
                      className={`border border-[#d8d2c7] ${catTheme.borderTop} bg-[#fcfbf9] hover:border-[#181818] hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-w-0`}
                    >
                      <div>
                        <div className="px-4 sm:px-8 py-4 bg-[#f7f5f0] border-b border-[#d8d2c7] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs shrink-0">
                              {indexLabel}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 border font-mono font-bold text-xs uppercase tracking-wider truncate ${catTheme.badgeBg}`}>
                              {t.projects.categoryLabels?.[project.category] ||
                                project.category}
                            </span>
                          </div>

                      <span className="font-mono font-bold text-xs text-[#5c5852] shrink-0">
                        {project.year}
                      </span>
                    </div>

                    <div className="p-4 sm:p-8">
                      {/* Project Photo / Visual Design Carousel Preview */}
                      <div className="mb-6">
                        <ProjectPhotoFrame
                          imageUrl={project.image_url}
                          title={project.title}
                          category={project.category}
                          galleryItems={project.gallery_items}
                          t={t}
                        />
                      </div>

                      <h2 className="font-display font-bold text-lg sm:text-2xl md:text-3xl text-[#181818] tracking-tight leading-snug">
                        {project.title}
                      </h2>

                      <p className="mt-2.5 sm:mt-3 font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tech Stack Badges */}
                      <div className="mt-6 pt-5 border-t border-[#d8d2c7]">
                        <div className="font-mono font-bold text-[11px] text-[#5c5852] uppercase tracking-wider mb-3">
                          {t.projects.techArchitecture}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {techList.map((tech) => (
                            <span
                              key={tech}
                              className={`px-2.5 py-1 bg-[#f7f5f0] border border-[#d8d2c7] font-mono font-bold text-xs text-[#181818] transition-colors ${catTheme.tagBg}`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Links Footer */}
                  {(project.live_url?.trim() || project.repo_url?.trim()) && (
                    <div className={`px-4 sm:px-8 py-4 bg-[#f7f5f0] border-t border-[#d8d2c7] grid grid-cols-1 gap-3 ${project.live_url?.trim() && project.repo_url?.trim() ? 'sm:grid-cols-2' : ''}`}>
                      {project.live_url?.trim() && (
<a
                      href={project.live_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] transition-colors cursor-pointer"
                    >
                      <span>{t.projects.livePreview}</span>
                      <ArrowUpRight
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                      )}
                      {project.repo_url?.trim() && (
<a
                      href={
                        project.repo_url ||
                        'https://github.com/irfanhariyanto'
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 bg-[#fcfbf9] text-[#181818] border border-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#181818] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{t.projects.sourceCode}</span>
                    </a>
                      )}
                    </div>
                  )}
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
