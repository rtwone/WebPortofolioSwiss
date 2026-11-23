import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Palette, Terminal, Sparkles } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import RevealWords from './RevealWords';

const CATEGORY_METADATA = {
  'Creative & Visual Arts': {
    index: '01',
    code: 'CAT // 01',
    description:
      'Perangkat lunak industri kreatif untuk identitas visual, grafis editorial, ilustrasi vektor, dan multimedia.',
    icon: Palette,
    accent: '#dc2626',
    borderTop: 'border-t-4 border-t-[#dc2626]',
    codeColor: 'text-[#dc2626]',
    iconBox: 'border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]',
    pillHover: 'hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626]',
  },
  'Engineering & Computing': {
    index: '02',
    code: 'CAT // 02',
    description:
      'Bahasa pemrograman, runtime server, dan pengelolaan basis data untuk fondasi logika komputasi.',
    icon: Terminal,
    accent: '#2563eb',
    borderTop: 'border-t-4 border-t-[#2563eb]',
    codeColor: 'text-[#2563eb]',
    iconBox: 'border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]',
    pillHover: 'hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb]',
  },
  'Ecosystem & Productivity': {
    index: '03',
    code: 'CAT // 03',
    description:
      'Alat kontrol versi, kolaborasi repositori, code editor, dan akselerasi kecerdasan buatan (AI).',
    icon: Sparkles,
    accent: '#059669',
    borderTop: 'border-t-4 border-t-[#059669]',
    codeColor: 'text-[#059669]',
    iconBox: 'border-[#059669] bg-[#059669]/10 text-[#059669]',
    pillHover: 'hover:bg-[#059669] hover:text-white hover:border-[#059669]',
  },
};

export default function Skills() {
  const { skills, dbMode, siteContent, t } = usePortfolioData();
  const skillsSection = siteContent?.skillsSection || {};

  const groupedCategories = useMemo(() => {
    const baseOrder = [
      'Creative & Visual Arts',
      'Engineering & Computing',
      'Ecosystem & Productivity',
    ];

    const customDescriptions = {
      'Creative & Visual Arts':
        skillsSection.cat1Desc ||
        CATEGORY_METADATA['Creative & Visual Arts'].description,
      'Engineering & Computing':
        skillsSection.cat2Desc ||
        CATEGORY_METADATA['Engineering & Computing'].description,
      'Ecosystem & Productivity':
        skillsSection.cat3Desc ||
        CATEGORY_METADATA['Ecosystem & Productivity'].description,
    };

    const map = new Map();
    baseOrder.forEach((cat) => map.set(cat, []));

    skills.forEach((item) => {
      const cat = item.category || 'Creative & Visual Arts';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat).push(item);
    });

    return Array.from(map.entries()).map(([title, items], idx) => {
      const meta = CATEGORY_METADATA[title] || {
        index: String(idx + 1).padStart(2, '0'),
        code: `CAT // ${String(idx + 1).padStart(2, '0')}`,
        description:
          'Kompetensi teknis dan peralatan pendukung pengembangan solusi digital.',
        icon: Palette,
      };
      return {
        ...meta,
        description: customDescriptions[title] || meta.description,
        title,
        displayTitle: t.skills.categoryTitles?.[title] || title,
        items,
      };
    });
  }, [skills, skillsSection, t]);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="py-20 sm:py-24 lg:py-28 border-b border-[#d8d2c7] bg-[#f7f5f0] swiss-grid-bg"
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
              {t.skills.sectionLabel}
            </span>
            <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2
              id="skills-heading"
              className="font-display font-bold text-2xl sm:text-3xl md:text-5xl text-[#181818] tracking-tight leading-tight md:leading-[1.12]"
            >
              <RevealWords text={skillsSection.headingMain || 'Technical Arsenal &'} />{' '}
              <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-4xl md:text-6xl">
                <RevealWords
                  text={skillsSection.headingAccent || 'Creative Tools'}
                  delay={0.16}
                />
              </span>
            </h2>

            <p className="font-mono font-bold text-xs sm:text-sm text-[#5c5852] uppercase tracking-wider">
              {skills.length} {t.skills.verifiedCountSuffix}
            </p>
          </div>
        </motion.div>

        {/* 3-Column Category Cards (1 col mobile, 2 cols tablet, 3 cols desktop) */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {groupedCategories.map((category, idx) => {
            const IconComponent = category.icon;
            return (
              <motion.article
                key={category.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
                className={`border border-[#d8d2c7] ${category.borderTop || 'border-t-4 border-t-[#181818]'} bg-[#fcfbf9] hover:border-[#181818] hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-w-0`}
              >
                {/* Top Card Header & Description */}
                <div className="p-4 sm:p-8">
                  <div className="flex items-center justify-between pb-4 mb-4 sm:mb-5 border-b border-[#d8d2c7]">
                    <span className={`font-mono font-bold text-xs sm:text-sm tracking-wider ${category.codeColor || 'text-[#8c7355]'}`}>
                      {category.code}
                    </span>
                    <div className={`w-9 h-9 border flex items-center justify-center ${category.iconBox || 'border-[#181818] bg-[#f7f5f0] text-[#181818]'}`}>
                      <IconComponent
                        className="w-4 h-4"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="font-mono font-bold text-xs text-[#5c5852] uppercase tracking-wider mb-1">
                    {t.skills.categoryPrefix} {category.index}
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[#181818] tracking-tight leading-snug">
                    {category.displayTitle}
                  </h3>

                  <p className="mt-2.5 sm:mt-3 font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed">
                    {category.description}
                  </p>

                  {/* Pill Badges */}
                  <div className="mt-6 pt-6 border-t border-[#d8d2c7]">
                    <div className="font-mono font-bold text-[11px] text-[#5c5852] uppercase tracking-wider mb-3">
                      {t.skills.stackSpec} ({category.items.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((skill) => (
                        <span
                          key={skill.id || skill.name}
                          title={`Proficiency: ${skill.proficiency_level || 'Advanced'}`}
                          className={`inline-flex items-center px-3 py-1.5 font-mono font-bold text-xs text-[#181818] bg-[#f7f5f0] border border-[#181818] ${category.pillHover || 'hover:bg-[#181818] hover:text-[#fcfbf9]'} transition-colors duration-150 cursor-default`}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Technical Bar */}
                <div className="px-6 sm:px-8 py-3 bg-[#f7f5f0] border-t border-[#d8d2c7] flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-[#5c5852]">
                    {t.skills.statusReady}
                  </span>
                  <span className="font-mono font-bold text-[11px] text-[#181818]">
                    {String(idx + 1).padStart(2, '0')} /{' '}
                    {String(groupedCategories.length).padStart(2, '0')}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
