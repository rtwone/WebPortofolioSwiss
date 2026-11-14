import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Image as ImageIcon,
  ArrowUpRight,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';

const BASE_CATEGORIES = ['All', 'Development', 'Visual Design', 'Other'];

export const CATEGORY_COLORS = {
  Development: {
    accent: '#2563eb',
    badgeBg: 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/30',
    borderTop: 'border-t-4 border-t-[#2563eb]',
    tagBg: 'hover:border-[#2563eb] hover:text-[#2563eb]',
    activeBtn: 'bg-[#2563eb] text-white border-[#2563eb]',
  },
  'Visual Design': {
    accent: '#dc2626',
    badgeBg: 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/30',
    borderTop: 'border-t-4 border-t-[#dc2626]',
    tagBg: 'hover:border-[#dc2626] hover:text-[#dc2626]',
    activeBtn: 'bg-[#dc2626] text-white border-[#dc2626]',
  },
  Other: {
    accent: '#7c3aed',
    badgeBg: 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/30',
    borderTop: 'border-t-4 border-t-[#7c3aed]',
    tagBg: 'hover:border-[#7c3aed] hover:text-[#7c3aed]',
    activeBtn: 'bg-[#7c3aed] text-white border-[#7c3aed]',
  },
  All: {
    accent: '#181818',
    badgeBg: 'bg-[#181818] text-[#fcfbf9]',
    borderTop: 'border-t-4 border-t-[#181818]',
    tagBg: 'hover:border-[#181818]',
    activeBtn: 'bg-[#181818] text-[#fcfbf9] border-[#181818]',
  },
};

const FEATURED_LIMIT = 4;

/* Editorial Project Photo Frame & Multi-Slide Visual Design Carousel (.webp) */
export function ProjectPhotoFrame({
  imageUrl,
  title,
  category,
  galleryItems = [],
  t,
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasGallery = Array.isArray(galleryItems) && galleryItems.length > 0;
  const isVisualDesign = category === 'Visual Design' || hasGallery;

  // Build slides list: if galleryItems exist, use them; otherwise use single cover
  const slides = useMemo(() => {
    if (hasGallery) {
      return galleryItems.filter((item) => item && item.image_url);
    }
    if (imageUrl) {
      return [{ id: 'cover', title, image_url: imageUrl, post_url: '' }];
    }
    return [];
  }, [hasGallery, galleryItems, imageUrl, title]);

  const safeIndex =
    slides.length > 0 ? Math.min(currentIndex, slides.length - 1) : 0;
  const activeSlide = slides[safeIndex] || null;
  const activeSlideUrl = activeSlide?.image_url || imageUrl || '';

  useEffect(() => {
    setImgLoaded(false);
  }, [activeSlideUrl]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // CASE 1: Visual Design / Multi-Design Carousel (Original Aspect Ratio + Slide Title + Direct Post Link)
  if (isVisualDesign && slides.length > 0) {
    return (
      <>
        <div className="w-full border border-[#d8d2c7] bg-[#f7f5f0] overflow-hidden">
          {/* Main Carousel Viewport — Preserves Original Uncropped Proportions */}
          <div className="relative w-full h-[260px] sm:h-[340px] md:h-[400px] bg-[#141414] swiss-grid-bg flex items-center justify-center overflow-hidden group">
            {!imgLoaded && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#1f1e1b] animate-pulse flex items-center justify-center"
              >
                <span className="font-mono font-bold text-[10px] tracking-widest uppercase text-[#8c7355]/70">
                  LOADING ASSET...
                </span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeSlide.id || activeSlide.image_url || safeIndex}
                src={activeSlide.image_url}
                alt={activeSlide.title || title}
                width={activeSlide.width || 1200}
                height={activeSlide.height || 900}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onClick={() => setLightboxOpen(true)}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: imgLoaded ? 1 : 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in select-none transition-opacity duration-500 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </AnimatePresence>

            {/* Top-Left Slide Counter Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-[#181818]/90 border border-[#3a3835] text-[#fcfbf9] font-mono font-bold text-[11px]">
              <span className="text-[#8c7355]">
                {String(safeIndex + 1).padStart(2, '0')}
              </span>
              <span className="opacity-50">/</span>
              <span>{String(slides.length).padStart(2, '0')}</span>
              <span className="hidden sm:inline text-[10px] text-[#d8d2c7] ml-1">
                {t.projects.designGalleryCount || 'DESIGN WORKS'}
              </span>
            </div>

            {/* Top-Right Full-Size Lightbox Trigger */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={t.projects.expandFullSize || 'Original Size'}
              title={t.projects.expandFullSize || 'Original Size'}
              className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181818]/90 hover:bg-[#8c7355] text-[#fcfbf9] border border-[#3a3835] font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">
                {t.projects.expandFullSize || 'Original Size'}
              </span>
            </button>

            {/* Prev / Next Navigation Buttons (if > 1 design) */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={t.projects.prevSlide || 'Previous design'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-[#181818]/90 hover:bg-[#8c7355] text-[#fcfbf9] border border-[#3a3835] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={t.projects.nextSlide || 'Next design'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-[#181818]/90 hover:bg-[#8c7355] text-[#fcfbf9] border border-[#3a3835] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {/* Active Design Title & Direct Social Media Post Link Bar */}
          <div className="px-4 py-3 bg-[#fcfbf9] border-t border-[#d8d2c7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono font-bold text-[10px] text-[#8c7355] uppercase tracking-wider block">
                DESIGN #{String(safeIndex + 1).padStart(2, '0')}
                {activeSlide.width && activeSlide.height
                  ? ` — ${activeSlide.width}×${activeSlide.height}PX (.WEBP)`
                  : ''}
              </span>
              <h4 className="font-sans font-bold text-sm text-[#181818] truncate">
                {activeSlide.title || title}
              </h4>
            </div>

            {activeSlide.post_url && (
              <a
                href={activeSlide.post_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#181818] text-[#fcfbf9] hover:bg-[#8c7355] font-mono font-bold text-[11px] uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
              >
                <span>{t.projects.openPostLink || 'Buka Postingan ↗'}</span>
              </a>
            )}
          </div>

          {/* Thumbnail Strip (if > 1 design) */}
          {slides.length > 1 && (
            <div className="px-3 py-2.5 bg-[#f7f5f0] border-t border-[#d8d2c7] flex items-center gap-2 overflow-x-auto">
              {slides.map((slide, idx) => {
                const isSelected = idx === safeIndex;
                return (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Select design ${idx + 1}: ${slide.title || ''}`}
                    className={`relative w-14 h-14 shrink-0 border overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#181818] ring-2 ring-[#8c7355]'
                        : 'border-[#d8d2c7] opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.title || `Slide ${idx + 1}`}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Full-Screen Original-Dimension Lightbox Modal */}
        <AnimatePresence>
          {lightboxOpen && activeSlide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-5xl flex flex-col items-center"
              >
                {/* Top Lightbox Bar */}
                <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#333333] text-[#fcfbf9]">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#8c7355] uppercase block">
                      {String(safeIndex + 1).padStart(2, '0')} /{' '}
                      {String(slides.length).padStart(2, '0')} —{' '}
                      {activeSlide.title || title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSlide.post_url && (
                      <a
                        href={activeSlide.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#8c7355] text-[#181818] font-mono font-bold text-xs uppercase hover:bg-[#fcfbf9] transition-colors cursor-pointer"
                      >
                        {t.projects.openPostLink || 'Buka Postingan ↗'}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(false)}
                      aria-label="Close full size preview"
                      className="p-2 bg-[#1f1f1f] border border-[#444444] text-[#fcfbf9] hover:bg-red-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Uncropped Original Size Image */}
                <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                  <img
                    src={activeSlide.image_url}
                    alt={activeSlide.title || title}
                    width={activeSlide.width || 1200}
                    height={activeSlide.height || 900}
                    loading="lazy"
                    decoding="async"
                    className="max-w-full max-h-[78vh] w-auto h-auto object-contain border border-[#333333]"
                  />

                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous slide"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#181818]/90 hover:bg-[#8c7355] text-[#fcfbf9] border border-[#444444] flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next slide"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#181818]/90 hover:bg-[#8c7355] text-[#fcfbf9] border border-[#444444] flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // CASE 2: Standard 16:9 Software / Web / Bot Project Frame
  return (
    <div className="w-full border border-[#d8d2c7] bg-[#f7f5f0] overflow-hidden">
      {/* 16:9 Aspect Ratio Image Container */}
      <div className="relative w-full aspect-video bg-[#f7f5f0] overflow-hidden group">
        {imageUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#ebe6dc] animate-pulse swiss-grid-bg flex items-center justify-center"
              >
                <span className="font-mono font-bold text-[10px] tracking-widest uppercase text-[#8c7355]">
                  LOADING PREVIEW...
                </span>
              </div>
            )}
            <img
              src={imageUrl}
              alt={`Preview of ${title}`}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover object-top group-hover:scale-[1.03] transition-all duration-500 ease-out ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#f7f5f0] swiss-grid-bg">
            <ImageIcon
              className="w-8 h-8 text-[#8c7355] mb-2"
              aria-hidden="true"
            />
            <span className="font-mono font-bold text-xs text-[#181818] uppercase">
              {t.projects.emptyPreviewTitle}
            </span>
            <span className="font-sans font-medium text-xs text-[#5c5852] mt-1">
              {t.projects.emptyPreviewSub}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects, siteContent, t } = usePortfolioData();
  const projectsSection = siteContent?.projectsSection || {};
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = BASE_CATEGORIES;

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') {
      return projects;
    }
    return projects.filter((project) => project.category === selectedCategory);
  }, [selectedCategory, projects]);

  const displayedProjects = useMemo(
    () => filteredProjects.slice(0, FEATURED_LIMIT),
    [filteredProjects]
  );

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="py-20 sm:py-24 lg:py-28 border-b border-[#d8d2c7] bg-[#f7f5f0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pb-8 sm:pb-12 border-b border-[#d8d2c7]"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-[#8c7355]">
              {t.projects.sectionLabel}
            </span>
            <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <h2
              id="projects-heading"
              className="font-display font-bold text-2xl sm:text-3xl md:text-5xl text-[#181818] tracking-tight leading-tight md:leading-[1.12]"
            >
              {projectsSection.headingMain || 'Selected Works &'}{' '}
              <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-4xl md:text-6xl">
                {projectsSection.headingAccent || 'Digital Products'}
              </span>
            </h2>

            {/* Interactive Category Filter Buttons */}
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
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
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
          </div>
        </motion.div>

        {/* Projects Grid with AnimatePresence & Layout Transition (Limited to 4 Featured Works) */}
        <motion.div
          layout
          className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {displayedProjects.map((project, idx) => {
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
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`border border-[#d8d2c7] ${catTheme.borderTop} bg-[#fcfbf9] hover:shadow-md hover:border-[#181818] transition-all duration-200 flex flex-col justify-between min-w-0`}
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

                      <h3 className="font-display font-bold text-lg sm:text-2xl md:text-3xl text-[#181818] tracking-tight leading-snug">
                        {project.title}
                      </h3>

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

                  {/* Action Links Footer (Stacked on narrow mobile, 2 cols on sm+) */}
                  {(project.live_url?.trim() || project.repo_url?.trim()) && (
                    <div className={`px-4 sm:px-8 py-4 bg-[#f7f5f0] border-t border-[#d8d2c7] grid grid-cols-1 gap-3 ${project.live_url?.trim() && project.repo_url?.trim() ? 'sm:grid-cols-2' : ''}`}>
                      {project.live_url?.trim() && (
<a
                      href={project.live_url || '#projects'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] transition-colors cursor-pointer"
                    >
                      <span>{t.projects.livePreview}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </a>
                      )}
                      {project.repo_url?.trim() && (
<a
                      href={
                        project.repo_url || 'https://github.com/irfanhariyanto'
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

        {/* Bottom Swiss Catalog Bar -> Navigates to Dedicated /projects Page */}
        <div className="mt-10 sm:mt-12 border border-[#d8d2c7] bg-[#fcfbf9] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#181818] text-[#fcfbf9] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
            </div>
            <div>
              <span className="font-mono font-bold text-[11px] text-[#8c7355] uppercase tracking-wider block">
                {t.projects.archiveBadge || 'FULL ARCHIVE // PROJECT CATALOG'}
              </span>
              <p className="font-sans font-semibold text-sm text-[#181818]">
                {t.projects.showingCount || 'Showing'}{' '}
                <span className="font-mono font-bold">
                  {displayedProjects.length}
                </span>{' '}
                {t.projects.ofTotal || 'of'}{' '}
                <span className="font-mono font-bold">
                  {filteredProjects.length}
                </span>{' '}
                {t.projects.projectsUnit || 'Projects'}
              </p>
            </div>
          </div>

          <Link
            to="/projects"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider border border-[#181818] hover:bg-[#8c7355] hover:border-[#8c7355] transition-colors duration-200 cursor-pointer"
          >
            <span>
              {t.projects.viewAllArchive || 'View Full Project Catalog'} (
              {projects.length})
            </span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
