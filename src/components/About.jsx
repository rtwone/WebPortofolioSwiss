import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Code2,
  Terminal,
  Sparkles,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';

const METRIC_ICONS = [Layers, Code2, Terminal, Sparkles];

const METRIC_THEMES = [
  { border: 'border-t-2 border-t-[#2563eb]', iconBg: 'bg-[#2563eb]/10 text-[#2563eb]', tag: 'text-[#2563eb]' },
  { border: 'border-t-2 border-t-[#dc2626]', iconBg: 'bg-[#dc2626]/10 text-[#dc2626]', tag: 'text-[#dc2626]' },
  { border: 'border-t-2 border-t-[#059669]', iconBg: 'bg-[#059669]/10 text-[#059669]', tag: 'text-[#059669]' },
  { border: 'border-t-2 border-t-[#d97706]', iconBg: 'bg-[#d97706]/10 text-[#d97706]', tag: 'text-[#d97706]' },
];

export default function About() {
  const { siteContent, t } = usePortfolioData();
  const about = siteContent?.about || {};
  const metrics = Array.isArray(about.metrics) ? about.metrics : [];

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="py-20 sm:py-24 lg:py-28 border-b border-[#d8d2c7] bg-[#f7f5f0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pb-8 sm:pb-12 border-b border-[#d8d2c7]"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-[#8c7355]">
              {t.about.sectionLabel}
            </span>
            <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
          </div>

          <h2
            id="about-heading"
            className="font-display font-bold text-2xl sm:text-3xl md:text-5xl text-[#181818] tracking-tight leading-tight md:leading-[1.12]"
          >
            {about.headingMain || 'Bridging Logical Architecture'}{' '}
            <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-4xl md:text-6xl">
              {about.headingAccent || 'with Visual Aesthetics'}
            </span>
          </h2>
        </motion.div>

        {/* Main Content: 12-Column Swiss Grid */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (7 Columns — Bio Narrative) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 min-w-0"
          >
            <div className="p-4 sm:p-8 border border-[#d8d2c7] bg-[#fcfbf9]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 sm:mb-6 border-b border-[#d8d2c7]">
                <span className="font-mono font-bold text-xs sm:text-sm text-[#5c5852] uppercase tracking-wider">
                  {about.dossierLabel || 'BIOGRAPHICAL DOSSIER // IRFAN HARIYANTO'}
                </span>
              </div>

              {/* Paragraph 1 */}
              <p className="font-sans font-medium text-sm sm:text-base md:text-lg text-[#3a3835] leading-relaxed">
                {about.paragraph1}
              </p>

              {/* Paragraph 2 */}
              <p className="mt-4 sm:mt-5 font-sans font-medium text-sm sm:text-base md:text-lg text-[#3a3835] leading-relaxed">
                {about.paragraph2}
              </p>

              {/* Editorial Callout Quote */}
              {about.quote && (
                <blockquote className="mt-6 sm:mt-8 pl-4 sm:pl-5 border-l-2 border-[#8c7355] py-1">
                  <p className="font-calligraphic font-bold italic text-xl sm:text-2xl md:text-3xl text-[#181818] leading-snug">
                    &ldquo;{about.quote}&rdquo;
                  </p>
                </blockquote>
              )}

              {/* Structured Profile Metadata Row */}
              <div className="mt-8 pt-6 border-t border-[#d8d2c7] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <GraduationCap
                    className="w-5 h-5 text-[#8c7355] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-mono font-bold text-[11px] text-[#5c5852] uppercase">
                      {t.about.institutionLabel}
                    </div>
                    <div className="font-sans font-bold text-sm text-[#181818]">
                      {about.institution ||
                        'S1 Teknik Informatika — Universitas Wiraraja'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    className="w-5 h-5 text-[#8c7355] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-mono font-bold text-[11px] text-[#5c5852] uppercase">
                      {t.about.locationLabel}
                    </div>
                    <div className="font-sans font-bold text-sm text-[#181818]">
                      {about.location || 'Sumenep, Jawa Timur — Indonesia'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column (5 Columns — Key Highlights & Metrics Grid) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4"
          >
            {metrics.map((metric, idx) => {
              const IconComponent = METRIC_ICONS[idx % METRIC_ICONS.length];
              const theme = METRIC_THEMES[idx % METRIC_THEMES.length];
              return (
                <div
                  key={metric.index || idx}
                  className={`border border-[#d8d2c7] ${theme.border} bg-[#fcfbf9] p-5 sm:p-6 hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono font-bold text-xs sm:text-sm tracking-wider ${theme.tag}`}>
                      {t.about.indexPrefix} {metric.index}
                    </span>
                    <div className={`p-1.5 rounded ${theme.iconBg}`}>
                      <IconComponent
                        className="w-4 h-4"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#181818] tracking-tight leading-tight">
                    {metric.value}
                  </div>

                  <div className="mt-1.5 font-sans font-bold text-sm sm:text-base text-[#181818]">
                    {metric.label}
                  </div>

                  <p className="mt-1.5 font-sans font-medium text-xs sm:text-sm text-[#3a3835] leading-relaxed">
                    {metric.detail}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
