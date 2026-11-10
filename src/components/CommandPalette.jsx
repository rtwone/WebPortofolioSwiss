import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CornerDownLeft,
  ArrowUpRight,
  Sun,
  Moon,
  Globe,
  Copy,
  Check,
  Compass,
  FileDown,
} from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';

export const OPEN_COMMAND_PALETTE_EVENT = 'portfolio:open-command-palette';

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}

export default function CommandPalette() {
  const { siteContent, language, setLanguage, theme, toggleTheme } =
    usePortfolioData();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const contact = siteContent?.contact || {};
  const hero = siteContent?.hero || {};
  const email = contact.email || 'halo@irfanhariyanto.my.id';
  const socials = Array.isArray(contact.socials) ? contact.socials : [];

  const findSocialUrl = (platformName, fallback) => {
    const found = socials.find((s) =>
      (s.platform || '').toLowerCase().includes(platformName.toLowerCase())
    );
    return found?.url || fallback;
  };

  const githubUrl =
    hero.githubUrl || findSocialUrl('github', 'https://github.com/rtwone');
  const linkedinUrl = findSocialUrl(
    'linkedin',
    'https://linkedin.com/in/irfanhariyanto'
  );
  const cvUrl = hero.cvUrl || contact.cvUrl || '';

  const jumpToSection = (sectionId) => {
    setOpen(false);
    const scrollTarget = () => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scrollTarget, 120);
    } else {
      scrollTarget();
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      showToast(
        language === 'id'
          ? `Email disalin: ${email}`
          : `Email copied: ${email}`
      );
    } catch {
      showToast(email);
    }
    setOpen(false);
  };

  const commands = useMemo(() => {
    const isId = language === 'id';
    const items = [
      // 1. Navigation
      {
        id: 'nav-hero',
        group: isId ? '01 / NAVIGASI' : '01 / NAVIGATION',
        label: isId ? 'Jump to: Hero / Atas' : 'Jump to: Hero / Top',
        keywords: 'home hero top atas beranda',
        shortcut: '00',
        icon: Compass,
        action: () => jumpToSection('home'),
      },
      {
        id: 'nav-about',
        group: isId ? '01 / NAVIGASI' : '01 / NAVIGATION',
        label: isId ? 'Jump to: Tentang Saya' : 'Jump to: About',
        keywords: 'about tentang profil bio',
        shortcut: '01',
        icon: Compass,
        action: () => jumpToSection('about'),
      },
      {
        id: 'nav-experience',
        group: isId ? '01 / NAVIGASI' : '01 / NAVIGATION',
        label: isId ? 'Jump to: Pengalaman & Pendidikan' : 'Jump to: Experience',
        keywords: 'experience career education pengalaman karir',
        shortcut: '04',
        icon: Compass,
        action: () => jumpToSection('experience'),
      },
      {
        id: 'nav-projects',
        group: isId ? '01 / NAVIGASI' : '01 / NAVIGATION',
        label: isId ? 'Jump to: Proyek Pilihan' : 'Jump to: Projects',
        keywords: 'projects works portfolio proyek karya',
        shortcut: '03',
        icon: Compass,
        action: () => jumpToSection('projects'),
      },
      {
        id: 'nav-contact',
        group: isId ? '01 / NAVIGASI' : '01 / NAVIGATION',
        label: isId ? 'Jump to: Kontak & Kolaborasi' : 'Jump to: Contact',
        keywords: 'contact message email kontak hubungi',
        shortcut: '05',
        icon: Compass,
        action: () => jumpToSection('contact'),
      },

      // 2. Preferences & Actions
      {
        id: 'pref-theme',
        group: isId ? '02 / PREFERENSI & AKSI' : '02 / PREFERENCES & ACTIONS',
        label:
          theme === 'dark'
            ? isId
              ? 'Toggle Theme: Beralih ke Light Mode'
              : 'Toggle Theme: Switch to Light Mode'
            : isId
            ? 'Toggle Theme: Beralih ke Dark Mode'
            : 'Toggle Theme: Switch to Dark Mode',
        keywords: 'theme dark light mode warna gelap terang',
        shortcut: 'THEME',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          toggleTheme();
          setOpen(false);
        },
      },
      {
        id: 'pref-lang',
        group: isId ? '02 / PREFERENSI & AKSI' : '02 / PREFERENCES & ACTIONS',
        label:
          language === 'id'
            ? 'Switch Language: Bahasa Indonesia → English (EN)'
            : 'Switch Language: English → Bahasa Indonesia (ID)',
        keywords: 'language bahasa indonesia english translate id en',
        shortcut: 'ID/EN',
        icon: Globe,
        action: () => {
          setLanguage(language === 'id' ? 'en' : 'id');
          setOpen(false);
        },
      },
      {
        id: 'pref-copy-email',
        group: isId ? '02 / PREFERENSI & AKSI' : '02 / PREFERENCES & ACTIONS',
        label: isId
          ? `Copy Email (${email}) ke Clipboard`
          : `Copy Email (${email}) to Clipboard`,
        keywords: `copy email clipboard salin ${email}`,
        shortcut: 'COPY',
        icon: Copy,
        action: handleCopyEmail,
      },

      // 3. Socials & External Links
      {
        id: 'ext-github',
        group: isId ? '03 / SOSIAL & TAUTAN LUAR' : '03 / SOCIALS & EXTERNAL LINKS',
        label: isId ? 'Open GitHub Profile' : 'Open GitHub Profile',
        keywords: 'github git repo source code rtwone',
        shortcut: '↗',
        icon: ArrowUpRight,
        action: () => {
          window.open(githubUrl, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'ext-linkedin',
        group: isId ? '03 / SOSIAL & TAUTAN LUAR' : '03 / SOCIALS & EXTERNAL LINKS',
        label: isId ? 'Open LinkedIn Profile' : 'Open LinkedIn Profile',
        keywords: 'linkedin social network connect karir',
        shortcut: '↗',
        icon: ArrowUpRight,
        action: () => {
          window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
    ];

    if (cvUrl) {
      items.push({
        id: 'ext-cv',
        group: isId ? '03 / SOSIAL & TAUTAN LUAR' : '03 / SOCIALS & EXTERNAL LINKS',
        label: isId ? 'Download CV / Resume' : 'Download CV / Resume',
        keywords: 'cv resume download pdf kurikulum vitae',
        shortcut: 'PDF',
        icon: FileDown,
        action: () => {
          window.open(cvUrl, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      });
    }

    return items;
  }, [language, theme, email, githubUrl, linkedinUrl, cvUrl, location.pathname]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.keywords} ${cmd.group}`.toLowerCase();
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const map = new Map();
    filteredCommands.forEach((cmd, flatIndex) => {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group).push({ ...cmd, flatIndex });
    });
    return Array.from(map.entries());
  }, [filteredCommands]);

  // Global keyboard listener: Cmd+K / Ctrl+K & custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
    };
  }, [open]);

  // Lock body scroll & autofocus when modal opens
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleModalKeyDown = (e) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = (prev + 1) % filteredCommands.length;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = (prev - 1 + filteredCommands.length) % filteredCommands.length;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetCmd = filteredCommands[activeIndex];
      if (targetCmd) targetCmd.action();
    }
  };

  const scrollActiveIntoView = (idx) => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${idx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <>
      {/* Copy Email Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-[120] flex items-center gap-2.5 px-4 py-3 bg-[#181818] text-[#fcfbf9] border border-[#8c7355] font-mono font-bold text-xs shadow-xl"
          >
            <Check className="w-4 h-4 text-[#16a34a] shrink-0" aria-hidden="true" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setOpen(false)}
            className="theme-portfolio fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Command Palette"
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleModalKeyDown}
              className="w-full max-w-xl bg-[#fcfbf9] text-[#181818] border-2 border-[#181818] shadow-2xl overflow-hidden"
            >
              {/* Top Search Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#d8d2c7] bg-[#f7f5f0]">
                <Search
                  className="w-4 h-4 text-[#8c7355] shrink-0"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    language === 'id'
                      ? 'Ketik perintah atau cari bagian...'
                      : 'Type a command or search...'
                  }
                  aria-label="Search commands"
                  className="w-full bg-transparent font-sans font-semibold text-base sm:text-sm text-[#181818] placeholder-[#5c5852] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close Command Palette"
                  className="px-2 py-1 bg-[#fcfbf9] border border-[#d8d2c7] hover:border-[#181818] font-mono font-bold text-[10px] text-[#5c5852] hover:text-[#181818] uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Command List */}
              <div
                ref={listRef}
                role="listbox"
                aria-label="Available commands"
                className="max-h-[60vh] overflow-y-auto divide-y divide-[#d8d2c7]"
              >
                {groupedCommands.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <p className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-widest">
                      00 // EMPTY_RESULT
                    </p>
                    <p className="mt-1 font-sans font-semibold text-sm text-[#5c5852]">
                      {language === 'id'
                        ? 'Tidak ada perintah yang cocok.'
                        : 'No matching commands found.'}
                    </p>
                  </div>
                ) : (
                  groupedCommands.map(([groupTitle, items]) => (
                    <div key={groupTitle} className="py-2">
                      <div className="px-4 py-1.5 font-mono font-bold text-[10px] text-[#8c7355] uppercase tracking-widest">
                        {groupTitle}
                      </div>
                      <div>
                        {items.map((cmd) => {
                          const Icon = cmd.icon;
                          const isSelected = cmd.flatIndex === activeIndex;
                          return (
                            <button
                              key={cmd.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              data-cmd-index={cmd.flatIndex}
                              onMouseEnter={() => setActiveIndex(cmd.flatIndex)}
                              onClick={cmd.action}
                              className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#181818] text-[#fcfbf9]'
                                  : 'bg-transparent text-[#181818] hover:bg-[#f7f5f0]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon
                                  className={`w-4 h-4 shrink-0 ${
                                    isSelected
                                      ? 'text-[#8c7355]'
                                      : 'text-[#5c5852]'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="font-sans font-semibold text-sm truncate">
                                  {cmd.label}
                                </span>
                              </div>
                              <span
                                className={`font-mono font-bold text-[10px] px-1.5 py-0.5 border shrink-0 ${
                                  isSelected
                                    ? 'border-[#8c7355] text-[#fcfbf9]'
                                    : 'border-[#d8d2c7] text-[#5c5852]'
                                }`}
                              >
                                {cmd.shortcut}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Hints */}
              <div className="px-4 py-2.5 bg-[#f7f5f0] border-t border-[#d8d2c7] flex items-center justify-between text-[11px] font-mono font-bold text-[#5c5852]">
                <div className="flex items-center gap-3">
                  <span>↑↓ NAVIGATE</span>
                  <span className="inline-flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" aria-hidden="true" />
                    SELECT
                  </span>
                </div>
                <span>SWISS COMMAND // ⌘K</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
