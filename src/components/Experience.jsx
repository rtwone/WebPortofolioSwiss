import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, GraduationCap, Layers, Cpu, Sparkles, ChevronDown } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';

const CORE_COMPETENCIES = [
  {
    code: 'FOCUS // 01',
    title: 'Full-Stack Web Architecture',
    detail:
      'Perancangan aplikasi web modern menggunakan React.js, Next.js 15, TypeScript, Laravel, dan RESTful API dengan fokus pada skalabilitas serta performa.',
    icon: Layers,
  },
  {
    code: 'FOCUS // 02',
    title: 'Automated Messaging Systems',
    detail:
      'Pengembangan ekosistem bot WhatsApp multi-device berbasis Node.js & Baileys MD dengan arsitektur plugin cepat dan manajemen sesi otomatis.',
    icon: Cpu,
  },
  {
    code: 'FOCUS // 03',
    title: 'UI/UX & Editorial Graphic Design',
    detail:
      'Penyusunan sistem identitas visual, tata letak tipografi Swiss Grid, serta desain komunikasi visual untuk organisasi dan produk digital.',
    icon: Sparkles,
  },
];

const PILLAR_ICONS = [Layers, Cpu, Sparkles];

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6,
  jul: 7, agu: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12,
};

function parseDateUnit(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (['present', 'sekarang', 'saat ini', 'current', 'aktif', 'now'].includes(s)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, isPresent: true };
  }
  const myMatch = s.match(/([a-z]+)[.\s]+(\d{4})/);
  if (myMatch) {
    const m = MONTH_MAP[myMatch[1].slice(0, 3)] || 1;
    return { year: parseInt(myMatch[2], 10), month: m, isPresent: false };
  }
  const yMatch = s.match(/(\d{4})/);
  if (yMatch) {
    return { year: parseInt(yMatch[1], 10), month: 1, isPresent: false };
  }
  return null;
}

function computeAutoPeriod(subExps, fallbackPeriod, lang = 'id') {
  if (!Array.isArray(subExps) || subExps.length === 0) return fallbackPeriod;
  let earliest = null;
  let latest = null;
  let hasPresent = false;
  let rawEarliestText = '';
  let rawLatestText = '';

  for (const sub of subExps) {
    const p = sub?.period;
    if (!p) continue;
    const parts = p.split(/\s*[-–—]\s*/);
    const start = parseDateUnit(parts[0]);
    const end = parts[1] ? parseDateUnit(parts[1]) : start;

    if (start) {
      const startVal = start.year * 12 + start.month;
      if (earliest === null || startVal < earliest.val) {
        earliest = { ...start, val: startVal };
        rawEarliestText = parts[0].trim();
      }
    }
    if (end) {
      if (end.isPresent) hasPresent = true;
      const endVal = end.year * 12 + end.month;
      if (latest === null || endVal > latest.val) {
        latest = { ...end, val: endVal };
        rawLatestText = parts[1] ? parts[1].trim() : parts[0].trim();
      }
    }
  }

  if (!earliest) return fallbackPeriod;
  const endDisplay = hasPresent
    ? (lang === 'en' ? 'Present' : 'Sekarang')
    : rawLatestText;
  return `${rawEarliestText} — ${endDisplay}`;
}

function getExperienceSortScore(exp) {
  if (!exp) return 0;
  // Jika punya sub_experiences, ambil tahun/titik tanggal paling akhir (terbaru)
  if (Array.isArray(exp.sub_experiences) && exp.sub_experiences.length > 0) {
    let maxScore = 0;
    for (const sub of exp.sub_experiences) {
      const score = getSubOrExpScore(sub);
      if (score > maxScore) maxScore = score;
    }
    if (maxScore > 0) return maxScore;
  }
  return getSubOrExpScore(exp);
}

function getSubOrExpScore(item) {
  if (!item) return 0;
  // 1. Cek properti eksplisit start_year / end_year / is_current jika tersedia
  if (item.is_current) {
    const now = new Date();
    return (now.getFullYear() + 10) * 12;
  }
  if (item.end_year) {
    const parsedEnd = parseDateUnit(item.end_year);
    if (parsedEnd) {
      if (parsedEnd.isPresent) return (new Date().getFullYear() + 10) * 12;
      return parsedEnd.year * 12 + parsedEnd.month;
    }
  }
  if (item.start_year) {
    const parsedStart = parseDateUnit(item.start_year);
    if (parsedStart) {
      return parsedStart.year * 12 + parsedStart.month;
    }
  }
  // 2. Fallback ke parsing string period
  return getPeriodSortScore(item.period || item.period_id || item.period_en);
}

function getPeriodSortScore(periodStr) {
  if (!periodStr) return 0;
  const parts = String(periodStr).split(/\s*[-–—]\s*/);
  const endUnit = parts[1] ? parseDateUnit(parts[1]) : parseDateUnit(parts[0]);
  const startUnit = parseDateUnit(parts[0]);

  if (endUnit) {
    if (endUnit.isPresent) {
      // Posisi aktif sekarang: berikan skor tertinggi dinamis ke waktu sekarang
      const now = new Date();
      return (now.getFullYear() + 10) * 12;
    }
    return endUnit.year * 12 + endUnit.month;
  }
  if (startUnit) {
    return startUnit.year * 12 + startUnit.month;
  }
  return 0;
}

export default function Experience() {
  const { experiences, siteContent, t, language } = usePortfolioData();
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expSection = siteContent?.experienceSection || {};
  const competencies = Array.isArray(expSection.competencies)
    ? expSection.competencies
    : CORE_COMPETENCIES;

  const workExperiences = useMemo(
    () =>
      experiences
        .filter((item) => item.type !== 'education')
        .sort((a, b) => {
          const scoreA = getExperienceSortScore(a);
          const scoreB = getExperienceSortScore(b);
          if (scoreA !== scoreB) {
            return scoreB - scoreA; // Terbaru ke terlama
          }
          return (a.order_index || 1) - (b.order_index || 1);
        }),
    [experiences]
  );

  const educationExperiences = useMemo(
    () =>
      experiences
        .filter((item) => item.type === 'education')
        .sort((a, b) => {
          const scoreA = getExperienceSortScore(a);
          const scoreB = getExperienceSortScore(b);
          if (scoreA !== scoreB) {
            return scoreB - scoreA; // Terbaru ke terlama
          }
          return (a.order_index || 1) - (b.order_index || 1);
        }),
    [experiences]
  );

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
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
              {t.experience.sectionLabel}
            </span>
            <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
          </div>

          <h2
            id="experience-heading"
            className="font-display font-bold text-2xl sm:text-3xl md:text-5xl text-[#181818] tracking-tight leading-tight md:leading-[1.12]"
          >
            {expSection.headingMain || 'Career Journey &'}{' '}
            <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-4xl md:text-6xl">
              {expSection.headingAccent || 'Academic Background'}
            </span>
          </h2>
        </motion.div>

        {/* 2-Column Side-by-Side Swiss Timeline Grid */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (6 Cols): Work & Organization Experience */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-6 min-w-0"
          >
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#181818] text-[#fcfbf9] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Briefcase
                  className="w-4 h-4 text-[#8c7355] shrink-0"
                  aria-hidden="true"
                />
                <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-wider truncate">
                  {t.experience.workHeader}
                </span>
              </div>
              <span className="font-mono font-bold text-xs text-[#d8d2c7] shrink-0">
                {String(workExperiences.length).padStart(2, '0')}{' '}
                {t.experience.recordsSuffix}
              </span>
            </div>

            <div className="border-x border-b border-[#d8d2c7] bg-[#fcfbf9] divide-y divide-[#d8d2c7]">
              {workExperiences.map((item, idx) => {
                const bullets = Array.isArray(item.description_bullets)
                  ? item.description_bullets
                  : [item.description_bullets].filter(Boolean);
                const hasSubExps =
                  Array.isArray(item.sub_experiences) &&
                  item.sub_experiences.length > 0;
                const displayPeriod = hasSubExps
                  ? computeAutoPeriod(item.sub_experiences, item.period, language)
                  : item.period;

                const itemId = item.id || `work-${idx}`;
                const isExpanded = expandedIds.has(itemId);

                return (
                  <article
                    key={itemId}
                    onClick={() => toggleExpand(itemId)}
                    className="p-4 sm:p-7 hover:bg-[#f7f5f0]/75 transition-colors cursor-pointer select-none group/card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs tracking-wider text-[#8c7355]">
                        EXP // {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#f7f5f0] border border-[#d8d2c7] font-mono font-bold text-xs tracking-wider text-[#181818]">
                          {displayPeriod}
                        </span>
                        <span
                          className={`p-1 rounded border border-[#d8d2c7] bg-[#fcfbf9] text-[#8c7355] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 bg-[#181818] text-[#fcfbf9] border-[#181818]' : 'group-hover/card:border-[#8c7355]'
                          }`}
                          aria-label={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {hasSubExps ? (
                      /* LinkedIn-Style Nested Experience */
                      <div className="mt-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-display font-bold text-xl sm:text-2xl text-[#181818] tracking-tight leading-snug">
                            {item.company}
                          </h3>
                        </div>

                        {/* Sub-experiences roles & periods (Always visible; descriptions expandable) */}
                        <div className="mt-4 relative pl-6 sm:pl-7 space-y-5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-3 before:w-[2px] before:bg-[#d8d2c7]">
                          {[...item.sub_experiences]
                            .sort((a, b) => getSubOrExpScore(b) - getSubOrExpScore(a))
                            .map((sub, sIdx) => {
                            const subBullets = Array.isArray(
                              sub.description_bullets
                            )
                              ? sub.description_bullets
                              : [sub.description_bullets].filter(Boolean);

                            return (
                              <div
                                key={sub.id || sIdx}
                                className="relative group/sub"
                              >
                                {/* Timeline Node Dot */}
                                <div
                                  className="absolute -left-[24px] sm:-left-[28px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-[#fcfbf9] bg-[#8c7355] group-hover/sub:bg-[#181818] transition-colors"
                                  aria-hidden="true"
                                />

                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <h4 className="font-calligraphic font-bold italic text-lg sm:text-xl text-[#8c7355] tracking-tight leading-snug">
                                    {sub.role}
                                  </h4>
                                  {sub.period && (
                                    <span className="font-mono text-[11px] sm:text-xs text-[#8c7355] font-semibold">
                                      {sub.period}
                                    </span>
                                  )}
                                </div>

                                {/* Deskripsi Sub-Experiences: Terbuka saat card diklik */}
                                <AnimatePresence initial={false}>
                                  {isExpanded && subBullets.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-2 space-y-1.5 pt-1">
                                        {subBullets.map((bullet, bIdx) => (
                                          <p
                                            key={bIdx}
                                            className="font-sans font-medium text-xs sm:text-sm text-[#3a3835] leading-relaxed"
                                          >
                                            {bullet}
                                          </p>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Standard Single-Role Layout */
                      <>
                        <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-[#181818] tracking-tight leading-snug">
                          {item.role}
                        </h3>

                        <div className="mt-1 font-calligraphic font-bold italic text-lg sm:text-xl text-[#8c7355]">
                          {item.company}
                        </div>

                        {/* Deskripsi Single Experience: Terbuka saat card diklik */}
                        <AnimatePresence initial={false}>
                          {isExpanded && bullets.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2.5 sm:mt-3 space-y-2 pt-1 border-t border-[#d8d2c7]/60">
                                {bullets.map((bullet, bIdx) => (
                                  <p
                                    key={bIdx}
                                    className="font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed"
                                  >
                                    {bullet}
                                  </p>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column (6 Cols): Education & Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-6 space-y-6 min-w-0"
          >
            <div>
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#181818] text-[#fcfbf9] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GraduationCap
                    className="w-4 h-4 text-[#8c7355] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-wider truncate">
                    {t.experience.eduHeader}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs text-[#d8d2c7] shrink-0">
                  {t.experience.higherEd}
                </span>
              </div>

              <div className="border-x border-b border-[#d8d2c7] bg-[#fcfbf9] divide-y divide-[#d8d2c7]">
                {educationExperiences.map((edu, idx) => {
                  const bullets = Array.isArray(edu.description_bullets)
                    ? edu.description_bullets
                    : [edu.description_bullets].filter(Boolean);
                  const hasSubExps =
                    Array.isArray(edu.sub_experiences) &&
                    edu.sub_experiences.length > 0;
                  const displayPeriod = hasSubExps
                    ? computeAutoPeriod(edu.sub_experiences, edu.period, language)
                    : edu.period;

                  const eduId = edu.id || `edu-${idx}`;
                  const isExpanded = expandedIds.has(eduId);

                  return (
                    <div
                      key={eduId}
                      onClick={() => toggleExpand(eduId)}
                      className="p-4 sm:p-7 hover:bg-[#f7f5f0]/75 transition-colors cursor-pointer select-none group/card"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs tracking-wider text-[#8c7355]">
                          EDU // {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-[#f7f5f0] border border-[#d8d2c7] font-mono font-bold text-xs tracking-wider text-[#181818]">
                            {displayPeriod}
                          </span>
                          <span
                            className={`p-1 rounded border border-[#d8d2c7] bg-[#fcfbf9] text-[#8c7355] transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 bg-[#181818] text-[#fcfbf9] border-[#181818]' : 'group-hover/card:border-[#8c7355]'
                            }`}
                            aria-label={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {hasSubExps ? (
                        /* LinkedIn-Style Nested Education */
                        <div className="mt-1">
                          <h3 className="font-display font-bold text-xl sm:text-2xl text-[#181818] tracking-tight leading-snug">
                            {edu.company}
                          </h3>

                          {/* Sub-experiences roles & periods (Always visible; descriptions expandable) */}
                          <div className="mt-4 relative pl-6 sm:pl-7 space-y-5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-3 before:w-[2px] before:bg-[#d8d2c7]">
                            {[...edu.sub_experiences]
                              .sort((a, b) => getSubOrExpScore(b) - getSubOrExpScore(a))
                              .map((sub, sIdx) => {
                              const subBullets = Array.isArray(
                                sub.description_bullets
                              )
                                ? sub.description_bullets
                                : [sub.description_bullets].filter(Boolean);

                              return (
                                <div
                                  key={sub.id || sIdx}
                                  className="relative group/sub"
                                >
                                  <div
                                    className="absolute -left-[24px] sm:-left-[28px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-[#fcfbf9] bg-[#8c7355] group-hover/sub:bg-[#181818] transition-colors"
                                    aria-hidden="true"
                                  />
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h4 className="font-calligraphic font-bold italic text-lg sm:text-xl text-[#8c7355] tracking-tight leading-snug">
                                      {sub.role}
                                    </h4>
                                    {sub.period && (
                                      <span className="font-mono text-[11px] sm:text-xs text-[#8c7355] font-semibold">
                                        {sub.period}
                                      </span>
                                    )}
                                  </div>

                                  {/* Deskripsi Sub-Experiences: Terbuka saat card diklik */}
                                  <AnimatePresence initial={false}>
                                    {isExpanded && subBullets.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 space-y-1.5 pt-1">
                                          {subBullets.map((bullet, bIdx) => (
                                            <p
                                              key={bIdx}
                                              className="font-sans font-medium text-xs sm:text-sm text-[#3a3835] leading-relaxed"
                                            >
                                              {bullet}
                                            </p>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Standard Single-Role Education */
                        <>
                          <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-[#181818] tracking-tight leading-snug">
                            {edu.role}
                          </h3>

                          <div className="mt-1 font-calligraphic font-bold italic text-lg sm:text-xl text-[#8c7355]">
                            {edu.company}
                          </div>

                          {/* Deskripsi Single Education: Terbuka saat card diklik */}
                          <AnimatePresence initial={false}>
                            {isExpanded && bullets.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2.5 sm:mt-3 space-y-2 pt-1 border-t border-[#d8d2c7]/60">
                                  {bullets.map((bullet, bIdx) => (
                                    <p
                                      key={bIdx}
                                      className="font-sans font-medium text-sm sm:text-base text-[#3a3835] leading-relaxed"
                                    >
                                      {bullet}
                                    </p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Core Competencies & Focus Areas */}
            <div className="border border-[#d8d2c7] bg-[#fcfbf9] p-4 sm:p-8">
              <div className="pb-4 mb-4 sm:mb-5 border-b border-[#d8d2c7] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider block">
                    {t.experience.coreCompLabel}
                  </span>
                  <h4 className="font-display font-bold text-lg sm:text-xl text-[#181818] mt-1 leading-snug">
                    {t.experience.coreCompTitle}
                  </h4>
                </div>
                <span className="font-mono font-bold text-xs text-[#5c5852]">
                  {t.experience.pillarsCount}
                </span>
              </div>

              <div className="space-y-4">
                {competencies.map((comp, idx) => {
                  const IconComponent =
                    comp.icon || PILLAR_ICONS[idx % PILLAR_ICONS.length];
                  return (
                    <div
                      key={comp.code || idx}
                      className="p-3.5 sm:p-4 bg-[#f7f5f0] border border-[#d8d2c7] hover:border-[#181818] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs tracking-wider text-[#8c7355]">
                          {comp.code}
                        </span>
                        <IconComponent
                          className="w-4 h-4 text-[#181818]"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="font-sans font-bold text-sm sm:text-base text-[#181818]">
                        {comp.title}
                      </div>
                      <p className="mt-1 font-sans font-medium text-xs sm:text-sm text-[#3a3835] leading-relaxed">
                        {comp.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
