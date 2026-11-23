import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  supabase,
  isSupabaseConfigured,
  INITIAL_SITE_CONTENT,
  INITIAL_PROJECTS,
  INITIAL_EXPERIENCES,
  INITIAL_SKILLS,
  INITIAL_MESSAGES,
} from '../lib/supabase';
import {
  UI_DICTIONARY,
  BILINGUAL_SITE_DEFAULTS,
  PROJECT_TRANSLATIONS_EN,
  EXPERIENCE_TRANSLATIONS_EN,
} from '../lib/i18n';
import {
  autoTranslateSiteObject,
  autoTranslateProjectPayload,
  autoTranslateExperiencePayload,
} from '../lib/translator';

const PortfolioDataContext = createContext(null);

const STORAGE_KEYS = {
  lang: 'ih_portfolio_lang_v2',
  theme: 'ih_portfolio_theme_v1',
  siteContent: 'ih_portfolio_site_content_v4',
  projects: 'ih_portfolio_projects_v5',
  experiences: 'ih_portfolio_experiences_v4',
  skills: 'ih_portfolio_skills_v4',
  messages: 'ih_portfolio_messages_v4',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadObjectFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const mergedContact = { ...fallback.contact, ...(parsed.contact || {}) };
      if (Array.isArray(mergedContact.socials)) {
        mergedContact.socials = mergedContact.socials.map((s) => {
          if (s.platform?.toLowerCase() === 'instagram' && s.handle === '@irfvnny') {
            return { ...s, handle: 'instagram.com/irfvnny' };
          }
          return s;
        });
      }

      return {
        ...fallback,
        ...parsed,
        navbar: { ...fallback.navbar, ...(parsed.navbar || {}) },
        hero: { ...fallback.hero, ...(parsed.hero || {}) },
        about: { ...fallback.about, ...(parsed.about || {}) },
        skillsSection: {
          ...fallback.skillsSection,
          ...(parsed.skillsSection || {}),
        },
        projectsSection: {
          ...fallback.projectsSection,
          ...(parsed.projectsSection || {}),
        },
        experienceSection: {
          ...fallback.experienceSection,
          ...(parsed.experienceSection || {}),
        },
        contact: mergedContact,
        footer: { ...fallback.footer, ...(parsed.footer || {}) },
        seo: { ...fallback.seo, ...(parsed.seo || {}) },
        shortlinks: Array.isArray(parsed.shortlinks)
          ? parsed.shortlinks
          : (fallback.shortlinks || []),
        id_locale: {
          ...BILINGUAL_SITE_DEFAULTS.id,
          ...(parsed.id_locale || {}),
        },
        en_locale: {
          ...BILINGUAL_SITE_DEFAULTS.en,
          ...(parsed.en_locale || {}),
        },
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

const DEFAULT_MERGED_SITE_CONTENT = {
  ...INITIAL_SITE_CONTENT,
  id_locale: BILINGUAL_SITE_DEFAULTS.id,
  en_locale: BILINGUAL_SITE_DEFAULTS.en,
};

export function PortfolioDataProvider({ children }) {
  // Default Language: English ('en')
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.lang);
      if (saved === 'id' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((nextLang) => {
    const normalized = nextLang === 'id' ? 'id' : 'en';
    setLanguageState(normalized);
    try {
      localStorage.setItem(STORAGE_KEYS.lang, normalized);
      document.documentElement.lang = normalized;
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'id' ? 'en' : 'id');
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Default Theme: Light Mode ('light')
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(normalized);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, normalized);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const [siteContent, setSiteContent] = useState(() =>
    loadObjectFromStorage(STORAGE_KEYS.siteContent, DEFAULT_MERGED_SITE_CONTENT)
  );
  const [projects, setProjects] = useState(() =>
    loadFromStorage(STORAGE_KEYS.projects, INITIAL_PROJECTS)
  );
  const [experiences, setExperiences] = useState(() =>
    loadFromStorage(STORAGE_KEYS.experiences, INITIAL_EXPERIENCES)
  );
  const [skills, setSkills] = useState(() =>
    loadFromStorage(STORAGE_KEYS.skills, INITIAL_SKILLS)
  );
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.messages);
      return raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [dbMode, setDbMode] = useState(
    isSupabaseConfigured ? 'supabase' : 'fallback'
  );
  const [syncError, setSyncError] = useState(null);
  const [githubRepoCount, setGithubRepoCount] = useState(null);

  // Fetch GitHub public repository count for rtwone (reusable for manual sync in /admin)
  const syncGithubRepoCount = useCallback(async (username = 'rtwone') => {
    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data?.public_repos === 'number') {
        setGithubRepoCount(data.public_repos);
        return data.public_repos;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fetch GitHub public repository count for rtwone automatically on mount
  useEffect(() => {
    syncGithubRepoCount('rtwone');
  }, [syncGithubRepoCount]);

  // Fetch all tables from Supabase on mount
  const fetchAllData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDbMode('fallback');
      setLoading(false);
      return;
    }

    setLoading(true);
    setSyncError(null);

    try {
      const [settingsRes, projRes, expRes, skRes, msgRes] = await Promise.all([
        supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'main')
          .maybeSingle(),
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('experiences')
          .select('*')
          .order('order_index', { ascending: true }),
        supabase
          .from('skills')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (projRes.error || expRes.error || skRes.error) {
        const firstErr =
          projRes.error?.message ||
          expRes.error?.message ||
          skRes.error?.message;
        setSyncError(firstErr);
        setDbMode('fallback');
      } else {
        setDbMode('supabase');
        if (settingsRes.data) {
          const row = settingsRes.data;
          const dbContent = row.content || {};
          setSiteContent((prev) => {
            const next = {
              ...prev,
              ...dbContent,
              seo: {
                ...(prev.seo || {}),
                ...(dbContent.seo || {}),
                ...(row.meta_keywords ? { metaKeywords: row.meta_keywords } : {}),
                ...(row.og_image_url !== undefined ? { ogImageUrl: row.og_image_url } : {}),
                ...(row.canonical_url !== undefined ? { canonicalUrl: row.canonical_url } : {}),
                ...(row.theme_color ? { themeColor: row.theme_color } : {}),
              },
              id_locale: {
                ...(prev.id_locale || {}),
                ...(dbContent.id_locale || {}),
                seo: {
                  ...(prev.id_locale?.seo || {}),
                  ...(dbContent.id_locale?.seo || {}),
                  ...(row.meta_title_id ? { metaTitle: row.meta_title_id } : {}),
                  ...(row.meta_description_id
                    ? { metaDescription: row.meta_description_id }
                    : {}),
                },
              },
              en_locale: {
                ...(prev.en_locale || {}),
                ...(dbContent.en_locale || {}),
                seo: {
                  ...(prev.en_locale?.seo || {}),
                  ...(dbContent.en_locale?.seo || {}),
                  ...(row.meta_title_en ? { metaTitle: row.meta_title_en } : {}),
                  ...(row.meta_description_en
                    ? { metaDescription: row.meta_description_en }
                    : {}),
                },
              },
            };
            saveToStorage(STORAGE_KEYS.siteContent, next);
            return next;
          });
        }
        if (Array.isArray(projRes.data)) {
          setProjects(projRes.data);
          saveToStorage(STORAGE_KEYS.projects, projRes.data);
        }
        if (Array.isArray(expRes.data)) {
          setExperiences(expRes.data);
          saveToStorage(STORAGE_KEYS.experiences, expRes.data);
        }
        if (Array.isArray(skRes.data)) {
          setSkills(skRes.data);
          saveToStorage(STORAGE_KEYS.skills, skRes.data);
        }
        if (Array.isArray(msgRes.data)) {
          setMessages(msgRes.data);
          saveToStorage(STORAGE_KEYS.messages, msgRes.data);
        }
      }
    } catch (err) {
      setSyncError(err?.message || 'Gagal terhubung ke Supabase');
      setDbMode('fallback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    if (!isSupabaseConfigured || !supabase) return undefined;

    const channel = supabase
      .channel('portfolio-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'experiences' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skills' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // Listen for cross-tab localStorage changes
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEYS.siteContent && e.newValue) {
        setSiteContent(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.projects && e.newValue) {
        setProjects(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.experiences && e.newValue) {
        setExperiences(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.skills && e.newValue) {
        setSkills(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.messages && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Helper to build a full localized siteContent object for a specific targetLang ('id' | 'en')
  const buildLocalizedSiteContent = useCallback(
    (targetLang, rawContent = siteContent) => {
      const baseLangDefaults =
        targetLang === 'en'
          ? BILINGUAL_SITE_DEFAULTS.en
          : BILINGUAL_SITE_DEFAULTS.id;
      const savedLangData =
        targetLang === 'en'
          ? rawContent?.en_locale || {}
          : rawContent?.id_locale || {};

      return {
        ...rawContent,
        navbar: {
          ...rawContent.navbar,
          ...baseLangDefaults.navbar,
          ...(savedLangData.navbar || {}),
        },
        hero: {
          ...rawContent.hero,
          ...baseLangDefaults.hero,
          ...(savedLangData.hero || {}),
          available: rawContent.hero?.available ?? true,
          githubLabel:
            rawContent.hero?.githubLabel || baseLangDefaults.hero.githubLabel,
          githubUrl:
            rawContent.hero?.githubUrl || baseLangDefaults.hero.githubUrl,
          affiliation:
            rawContent.hero?.affiliation || baseLangDefaults.hero.affiliation,
        },
        about: (() => {
          const mergedAbout = {
            ...rawContent.about,
            ...baseLangDefaults.about,
            ...(savedLangData.about || {}),
          };
          if (
            typeof githubRepoCount === 'number' &&
            Array.isArray(mergedAbout.metrics)
          ) {
            mergedAbout.metrics = mergedAbout.metrics.map((m, idx) => {
              const isProjectCard =
                m.syncGithub === true ||
                (m.syncGithub !== false &&
                  (idx === 0 ||
                    m.index === '01.A' ||
                    /proyek|project|repo/i.test(m.label || '')));
              return isProjectCard ? { ...m, value: `${githubRepoCount}` } : m;
            });
          }
          return mergedAbout;
        })(),
        skillsSection: {
          ...rawContent.skillsSection,
          ...baseLangDefaults.skillsSection,
          ...(savedLangData.skillsSection || {}),
        },
        projectsSection: {
          ...rawContent.projectsSection,
          ...baseLangDefaults.projectsSection,
          ...(savedLangData.projectsSection || {}),
        },
        experienceSection: {
          ...rawContent.experienceSection,
          ...baseLangDefaults.experienceSection,
          ...(savedLangData.experienceSection || {}),
        },
        contact: {
          ...rawContent.contact,
          ...baseLangDefaults.contact,
          ...(savedLangData.contact || {}),
          email: rawContent.contact?.email || baseLangDefaults.contact.email,
          socials:
            rawContent.contact?.socials ||
            INITIAL_SITE_CONTENT.contact.socials,
        },
        footer: {
          ...rawContent.footer,
          ...baseLangDefaults.footer,
          ...(savedLangData.footer || {}),
        },
        shortlinks: Array.isArray(rawContent.shortlinks)
          ? rawContent.shortlinks
          : [],
        seo: {
          ...baseLangDefaults.seo,
          ...(rawContent.seo || {}),
          ...(savedLangData.seo || {}),
          metaTitle:
            savedLangData.seo?.metaTitle ||
            rawContent.seo?.metaTitle ||
            baseLangDefaults.seo.metaTitle,
          metaDescription:
            savedLangData.seo?.metaDescription ||
            rawContent.seo?.metaDescription ||
            baseLangDefaults.seo.metaDescription,
          metaKeywords:
            rawContent.seo?.metaKeywords ??
            savedLangData.seo?.metaKeywords ??
            baseLangDefaults.seo.metaKeywords,
          ogImageUrl:
            rawContent.seo?.ogImageUrl ??
            savedLangData.seo?.ogImageUrl ??
            baseLangDefaults.seo.ogImageUrl,
          canonicalUrl:
            rawContent.seo?.canonicalUrl ??
            savedLangData.seo?.canonicalUrl ??
            baseLangDefaults.seo.canonicalUrl,
          themeColor:
            rawContent.seo?.themeColor ||
            savedLangData.seo?.themeColor ||
            baseLangDefaults.seo.themeColor,
        },
      };
    },
    [siteContent, githubRepoCount]
  );

  // Compute active localized siteContent based on current `language` ('id' or 'en')
  const activeSiteContent = useMemo(
    () => buildLocalizedSiteContent(language, siteContent),
    [buildLocalizedSiteContent, language, siteContent]
  );

  useEffect(() => {
    const seo = activeSiteContent?.seo || {};
    const title =
      seo.metaTitle || 'Irfan Hariyanto — Software Engineer & Visual Designer';
    const description =
      seo.metaDescription ||
      'Irfan Hariyanto — Software Engineer & Visual Designer.';
    const keywords = seo.metaKeywords || '';
    const ogImage = seo.ogImageUrl || '';
    const canonical = seo.canonicalUrl || '';
    const themeColor = seo.themeColor || '#f7f5f0';

    document.title = title;

    const setMeta = (selector, attr, val) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [k, v] = attr;
        el.setAttribute(k, v);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    setMeta('meta[name="description"]', ['name', 'description'], description);
    setMeta('meta[name="keywords"]', ['name', 'keywords'], keywords);
    setMeta('meta[name="theme-color"]', ['name', 'theme-color'], themeColor);
    setMeta('meta[property="og:title"]', ['property', 'og:title'], title);
    setMeta(
      'meta[property="og:description"]',
      ['property', 'og:description'],
      description
    );
    setMeta('meta[property="og:image"]', ['property', 'og:image'], ogImage);
    setMeta(
      'meta[name="twitter:card"]',
      ['name', 'twitter:card'],
      ogImage ? 'summary_large_image' : 'summary'
    );
    setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], title);
    setMeta(
      'meta[name="twitter:description"]',
      ['name', 'twitter:description'],
      description
    );
    setMeta('meta[name="twitter:image"]', ['name', 'twitter:image'], ogImage);

    let linkCanonical = document.head.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonical || window.location.origin);
  }, [activeSiteContent?.seo]);

  // Compute localized projects for current language (supports custom dynamic translations, gallery_items, and custom project_order)
  const localizedProjects = useMemo(() => {
    const customMap = siteContent?.project_translations || {};
    const customOrder = Array.isArray(siteContent?.project_order)
      ? siteContent.project_order
      : [];
    const orderIndexMap = new Map(customOrder.map((id, i) => [id, i]));

    const sortedRaw = [...projects].sort((a, b) => {
      const idxA = orderIndexMap.has(a.id)
        ? orderIndexMap.get(a.id)
        : Number.MAX_SAFE_INTEGER;
      const idxB = orderIndexMap.has(b.id)
        ? orderIndexMap.get(b.id)
        : Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return 0;
    });

    return sortedRaw.map((proj) => {
      const customEntry = customMap[proj.id];
      const fallbackHimatikaGallery =
        proj.category === 'Visual Design' &&
        (proj.title || '').toLowerCase().includes('himatika')
          ? INITIAL_PROJECTS.find((p) => p.id === 'proj-4')?.gallery_items || []
          : [];

      const rawGallery =
        (Array.isArray(customEntry?.gallery_items) &&
          customEntry.gallery_items.length > 0 &&
          customEntry.gallery_items) ||
        (Array.isArray(proj.gallery_items) &&
          proj.gallery_items.length > 0 &&
          proj.gallery_items) ||
        fallbackHimatikaGallery;

      const localizedGallery = rawGallery.map((item) => ({
        ...item,
        title:
          language === 'en'
            ? item.title_en || item.title || item.title_id
            : item.title_id || item.title || item.title_en,
      }));

      const normalizedCategory =
        proj.category === 'Visual Design'
          ? 'Visual Design'
          : proj.category === 'Other' || proj.category === 'Film & Video' || proj.category === 'Lainnya'
          ? 'Other'
          : 'Development';

      if (language === 'en') {
        const enFallback = PROJECT_TRANSLATIONS_EN[proj.id];
        return {
          ...proj,
          category: normalizedCategory,
          title:
            customEntry?.title_en ||
            proj.title_en ||
            enFallback?.title ||
            proj.title,
          description:
            customEntry?.description_en ||
            proj.description_en ||
            enFallback?.description ||
            proj.description,
          gallery_items: localizedGallery,
        };
      }
      return {
        ...proj,
        category: normalizedCategory,
        title: customEntry?.title_id || proj.title_id || proj.title,
        description:
          customEntry?.description_id ||
          proj.description_id ||
          proj.description,
        gallery_items: localizedGallery,
      };
    });
  }, [language, projects, siteContent?.project_translations, siteContent?.project_order]);

  // Helper to translate period text between ID and EN dynamically
  const localizePeriodString = (rawPeriod, lang) => {
    if (!rawPeriod) return '';
    const str = String(rawPeriod).trim();
    if (lang === 'en') {
      return str
        .replace(/sekarang/gi, 'Present')
        .replace(/saat ini/gi, 'Present')
        .replace(/aktif/gi, 'Present')
        .replace(/nov(\.|\b)/gi, 'Nov')
        .replace(/des(\.|\b)/gi, 'Dec')
        .replace(/mei(\.|\b)/gi, 'May')
        .replace(/agu(\.|\b)/gi, 'Aug')
        .replace(/okt(\.|\b)/gi, 'Oct')
        .replace(/\bjanuari\b/gi, 'January')
        .replace(/\bfebruari\b/gi, 'February')
        .replace(/\bmaret\b/gi, 'March')
        .replace(/\bjuni\b/gi, 'June')
        .replace(/\bjuli\b/gi, 'July')
        .replace(/\bagustus\b/gi, 'August')
        .replace(/\boktober\b/gi, 'October')
        .replace(/\bdesember\b/gi, 'December');
    }
    return str
      .replace(/present/gi, 'Sekarang')
      .replace(/current/gi, 'Sekarang')
      .replace(/now/gi, 'Sekarang')
      .replace(/dec(\.|\b)/gi, 'Des')
      .replace(/may(\.|\b)/gi, 'Mei')
      .replace(/aug(\.|\b)/gi, 'Agu')
      .replace(/oct(\.|\b)/gi, 'Okt')
      .replace(/\bjanuary\b/gi, 'Januari')
      .replace(/\bfebruary\b/gi, 'Februari')
      .replace(/\bmarch\b/gi, 'Maret')
      .replace(/\bjune\b/gi, 'Juni')
      .replace(/\bjuly\b/gi, 'Juli')
      .replace(/\baugust\b/gi, 'Agustus')
      .replace(/\boctober\b/gi, 'Oktober')
      .replace(/\bdecember\b/gi, 'Desember');
  };

  // Helper to resolve localized sub-experiences
  const resolveLocalizedSubExperiences = (subExps, lang, customSubMap) => {
    if (!Array.isArray(subExps)) return [];
    return subExps.map((sub, idx) => {
      const subId = sub.id || `sub-${idx}`;
      const customSub = customSubMap?.[subId] || {};
      const splitBullets = (val) =>
        Array.isArray(val)
          ? val
          : String(val || '')
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean);

      const rawPeriod =
        lang === 'en'
          ? customSub.period_en || sub.period_en || sub.period || sub.period_id || ''
          : customSub.period_id || sub.period_id || sub.period || sub.period_en || '';

      const localizedPeriod = localizePeriodString(rawPeriod, lang);

      if (lang === 'en') {
        const bulletsEn = splitBullets(
          customSub.description_bullets_en ||
            sub.description_bullets_en ||
            sub.description_bullets
        );
        return {
          ...sub,
          id: subId,
          role:
            customSub.role_en || sub.role_en || sub.role || sub.role_id || '',
          period: localizedPeriod,
          description_bullets: bulletsEn,
        };
      }
      const bulletsId = splitBullets(
        customSub.description_bullets_id ||
          sub.description_bullets_id ||
          sub.description_bullets
      );
      return {
        ...sub,
        id: subId,
        role:
          customSub.role_id || sub.role_id || sub.role || sub.role_en || '',
        period: localizedPeriod,
        description_bullets: bulletsId,
      };
    });
  };

  // Compute localized experiences for current language (supports custom dynamic translations in siteContent.experience_translations)
  const localizedExperiences = useMemo(() => {
    const customMap = siteContent?.experience_translations || {};
    return experiences.map((exp) => {
      const customEntry = customMap[exp.id];
      const rawSubExps = Array.isArray(customEntry?.sub_experiences)
        ? customEntry.sub_experiences
        : Array.isArray(exp.sub_experiences)
        ? exp.sub_experiences
        : [];
      const localizedSubExps = resolveLocalizedSubExperiences(
        rawSubExps,
        language,
        customEntry?.sub_experiences_translations
      );

      if (language === 'en') {
        const enFallback = EXPERIENCE_TRANSLATIONS_EN[exp.id];
        const rawPeriod = exp.period_en || exp.period || enFallback?.period || '';
        return {
          ...exp,
          period: localizePeriodString(rawPeriod, 'en'),
          role:
            customEntry?.role_en || exp.role_en || enFallback?.role || exp.role,
          company:
            customEntry?.company_en ||
            exp.company_en ||
            enFallback?.company ||
            exp.company,
          description_bullets:
            (Array.isArray(customEntry?.description_bullets_en) &&
              customEntry.description_bullets_en.length > 0 &&
              customEntry.description_bullets_en) ||
            (Array.isArray(exp.description_bullets_en) &&
              exp.description_bullets_en.length > 0 &&
              exp.description_bullets_en) ||
            enFallback?.description_bullets ||
            exp.description_bullets,
          sub_experiences: localizedSubExps,
        };
      }
      const rawPeriod = exp.period_id || exp.period || '';
      return {
        ...exp,
        period: localizePeriodString(rawPeriod, 'id'),
        role: customEntry?.role_id || exp.role_id || exp.role,
        company: customEntry?.company_id || exp.company_id || exp.company,
        description_bullets:
          (Array.isArray(customEntry?.description_bullets_id) &&
            customEntry.description_bullets_id.length > 0 &&
            customEntry.description_bullets_id) ||
          (Array.isArray(exp.description_bullets_id) &&
            exp.description_bullets_id.length > 0 &&
            exp.description_bullets_id) ||
          exp.description_bullets,
        sub_experiences: localizedSubExps,
      };
    });
  }, [language, experiences, siteContent?.experience_translations]);

  // ==========================================================================
  // 0. SITE CONTENT UPDATE (Supports Bilingual Drafts + Custom Per-Language Edits)
  // ==========================================================================
  const updateSiteContent = async (
    updatedPartial,
    sourceLang = 'id',
    options = { autoTranslate: false }
  ) => {
    const sourceKey = sourceLang === 'en' ? 'en_locale' : 'id_locale';
    const oppositeLang = sourceLang === 'en' ? 'id' : 'en';
    const oppositeKey = oppositeLang === 'en' ? 'en_locale' : 'id_locale';

    const extractSections = (obj, fallbackLocale) => ({
      navbar: obj?.navbar || fallbackLocale?.navbar,
      hero: obj?.hero || fallbackLocale?.hero,
      about: obj?.about || fallbackLocale?.about,
      skillsSection: obj?.skillsSection || fallbackLocale?.skillsSection,
      projectsSection: obj?.projectsSection || fallbackLocale?.projectsSection,
      experienceSection:
        obj?.experienceSection || fallbackLocale?.experienceSection,
      contact: obj?.contact || fallbackLocale?.contact,
      footer: obj?.footer || fallbackLocale?.footer,
      seo: obj?.seo || fallbackLocale?.seo,
    });

    const sourceSections = extractSections(
      updatedPartial,
      siteContent[sourceKey]
    );

    let oppositeSections = siteContent[oppositeKey] || {};
    if (options?.oppositeDraft) {
      oppositeSections = {
        ...oppositeSections,
        ...extractSections(options.oppositeDraft, siteContent[oppositeKey]),
      };
    } else if (options?.autoTranslate === true) {
      const translatedOpposite = await autoTranslateSiteObject(
        sourceSections,
        sourceLang,
        oppositeLang
      );
      oppositeSections = {
        ...oppositeSections,
        ...translatedOpposite,
      };
    }

    const nextContent = {
      ...siteContent,
      ...updatedPartial,
      site_clicks: siteContent.site_clicks || updatedPartial.site_clicks,
      [sourceKey]: {
        ...(siteContent[sourceKey] || {}),
        ...sourceSections,
      },
      [oppositeKey]: oppositeSections,
    };

    setSiteContent(nextContent);
    saveToStorage(STORAGE_KEYS.siteContent, nextContent);

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const seoPayload = {
        meta_title_id:
          nextContent.id_locale?.seo?.metaTitle ||
          BILINGUAL_SITE_DEFAULTS.id.seo.metaTitle,
        meta_title_en:
          nextContent.en_locale?.seo?.metaTitle ||
          BILINGUAL_SITE_DEFAULTS.en.seo.metaTitle,
        meta_description_id:
          nextContent.id_locale?.seo?.metaDescription ||
          BILINGUAL_SITE_DEFAULTS.id.seo.metaDescription,
        meta_description_en:
          nextContent.en_locale?.seo?.metaDescription ||
          BILINGUAL_SITE_DEFAULTS.en.seo.metaDescription,
        meta_keywords:
          nextContent.seo?.metaKeywords ??
          BILINGUAL_SITE_DEFAULTS.id.seo.metaKeywords,
        og_image_url: nextContent.seo?.ogImageUrl ?? '',
        canonical_url: nextContent.seo?.canonicalUrl ?? '',
        theme_color: nextContent.seo?.themeColor || '#f7f5f0',
      };

      const { error } = await supabase.from('site_settings').upsert(
        {
          id: 'main',
          content: nextContent,
          ...seoPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        // Fallback jika kolom SEO baru belum di-migrate di DB
        const { error: fallbackErr } = await supabase
          .from('site_settings')
          .upsert(
            {
              id: 'main',
              content: nextContent,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        if (fallbackErr) throw fallbackErr;
      }
    }

    return nextContent;
  };

  // Helper to persist project/experience translation map inside site_settings
  const saveEntityTranslationMap = async (mapKey, entityId, translatedRecord) => {
    const nextContent = {
      ...siteContent,
      [mapKey]: {
        ...(siteContent?.[mapKey] || {}),
        [entityId]: translatedRecord,
      },
    };
    setSiteContent(nextContent);
    saveToStorage(STORAGE_KEYS.siteContent, nextContent);

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      await supabase.from('site_settings').upsert(
        {
          id: 'main',
          content: nextContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
    return nextContent;
  };

  // ==========================================================================
  // 1. PROJECTS CRUD (Preserves Independent ID & EN Fields Unless Explicitly Translated)
  // ==========================================================================
  const resolveBilingualProject = async (payload, sourceLang = language) => {
    const normalizedGallery = (payload.gallery_items || []).map(
      (item, idx) => ({
        ...item,
        id: item.id || `gal-${Date.now()}-${idx}`,
        title:
          sourceLang === 'en'
            ? item.title_en || item.title || item.title_id || ''
            : item.title_id || item.title || item.title_en || '',
        title_id: item.title_id || item.title || item.title_en || '',
        title_en: item.title_en || item.title || item.title_id || '',
        image_url: (item.image_url || '').trim(),
        post_url: (item.post_url || '').trim(),
      })
    );
    return {
      title_id: (payload.title_id || payload.title || payload.title_en || '').trim(),
      description_id: (
        payload.description_id ||
        payload.description ||
        payload.description_en ||
        ''
      ).trim(),
      title_en: (payload.title_en || payload.title || payload.title_id || '').trim(),
      description_en: (
        payload.description_en ||
        payload.description ||
        payload.description_id ||
        ''
      ).trim(),
      gallery_items: normalizedGallery,
    };
  };

  const createProject = async (payload, sourceLang = language) => {
    const normalizedTech = Array.isArray(payload.tech_stack)
      ? payload.tech_stack
      : String(payload.tech_stack || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

    const bilingualProj = await resolveBilingualProject(payload, sourceLang);

    const newRecord = {
      title: bilingualProj.title_id || payload.title.trim(),
      category: payload.category,
      description: bilingualProj.description_id || payload.description.trim(),
      year: payload.year.trim() || '2025',
      tech_stack: normalizedTech,
      live_url: payload.live_url?.trim() || '',
      repo_url: payload.repo_url?.trim() || '',
      image_url: payload.image_url?.trim() || '',
      mockup_type: payload.mockup_type || 'terminal',
    };

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { data, error } = await supabase
        .from('projects')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      const enriched = { ...data, ...bilingualProj };
      setProjects((prev) => [...prev, enriched]);
      await saveEntityTranslationMap(
        'project_translations',
        data.id,
        bilingualProj
      );
      return enriched;
    }

    const fallbackItem = {
      ...newRecord,
      ...bilingualProj,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setProjects((prev) => {
      const next = [...prev, fallbackItem];
      saveToStorage(STORAGE_KEYS.projects, next);
      return next;
    });
    await saveEntityTranslationMap(
      'project_translations',
      fallbackItem.id,
      bilingualProj
    );
    return fallbackItem;
  };

  const updateProject = async (id, payload, sourceLang = language) => {
    const normalizedTech = Array.isArray(payload.tech_stack)
      ? payload.tech_stack
      : String(payload.tech_stack || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

    const bilingualProj = await resolveBilingualProject(payload, sourceLang);

    const updatedFields = {
      title: bilingualProj.title_id || payload.title.trim(),
      category: payload.category,
      description: bilingualProj.description_id || payload.description.trim(),
      year: payload.year.trim() || '2025',
      tech_stack: normalizedTech,
      live_url: payload.live_url?.trim() || '',
      repo_url: payload.repo_url?.trim() || '',
      image_url: payload.image_url?.trim() || '',
      mockup_type: payload.mockup_type || 'terminal',
    };

    await saveEntityTranslationMap('project_translations', id, bilingualProj);

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { data, error } = await supabase
        .from('projects')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const enriched = { ...data, ...bilingualProj };
      setProjects((prev) =>
        prev.map((item) => (item.id === id ? enriched : item))
      );
      return enriched;
    }

    setProjects((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, ...updatedFields, ...bilingualProj }
          : item
      );
      saveToStorage(STORAGE_KEYS.projects, next);
      return next;
    });
    return { id, ...updatedFields, ...bilingualProj };
  };

  const deleteProject = async (id) => {
    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    }
    setProjects((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEYS.projects, next);
      return next;
    });
  };

  // Reorder projects to a specific 1-based position and persist in site_settings.content.project_order
  const moveProjectToPosition = async (projectId, targetPosition1Based) => {
    const currentOrderedIds = localizedProjects.map((p) => p.id);
    const fromIndex = currentOrderedIds.indexOf(projectId);
    if (fromIndex === -1) return currentOrderedIds;

    const clampedToIndex = Math.max(
      0,
      Math.min(currentOrderedIds.length - 1, Number(targetPosition1Based) - 1)
    );
    if (fromIndex === clampedToIndex) return currentOrderedIds;

    const nextOrder = [...currentOrderedIds];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(clampedToIndex, 0, moved);

    const nextContent = {
      ...siteContent,
      project_order: nextOrder,
    };
    setSiteContent(nextContent);
    saveToStorage(STORAGE_KEYS.siteContent, nextContent);

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { error } = await supabase.from('site_settings').upsert(
        {
          id: 'main',
          content: nextContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
    }

    return nextOrder;
  };

  // ==========================================================================
  // 2. EXPERIENCES CRUD (Preserves Independent ID & EN Fields Unless Explicitly Translated)
  // ==========================================================================
  const resolveBilingualExperience = async (
    payload,
    bullets
  ) => {
    const splitBullets = (raw) =>
      Array.isArray(raw)
        ? raw
        : String(raw || '')
            .split('\n')
            .map((b) => b.trim())
            .filter(Boolean);

    const bulletsId = splitBullets(payload.description_bullets_id);
    const bulletsEn = splitBullets(payload.description_bullets_en);
    const subExperiences = Array.isArray(payload.sub_experiences)
      ? payload.sub_experiences
      : [];

    return {
      role_id: (payload.role_id || payload.role || payload.role_en || '').trim(),
      company_id: (
        payload.company_id ||
        payload.company ||
        payload.company_en ||
        ''
      ).trim(),
      description_bullets_id: bulletsId.length > 0 ? bulletsId : bullets,
      role_en: (payload.role_en || payload.role || payload.role_id || '').trim(),
      company_en: (
        payload.company_en ||
        payload.company ||
        payload.company_id ||
        ''
      ).trim(),
      description_bullets_en: bulletsEn.length > 0 ? bulletsEn : bullets,
      sub_experiences: subExperiences,
    };
  };

  const createExperience = async (payload, sourceLang = language) => {
    const bullets = Array.isArray(payload.description_bullets)
      ? payload.description_bullets
      : String(payload.description_bullets || '')
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean);

    const bilingualExp = await resolveBilingualExperience(
      payload,
      bullets,
      sourceLang
    );

    const newRecord = {
      role: bilingualExp.role_id || payload.role.trim(),
      company: bilingualExp.company_id || payload.company.trim(),
      period: payload.period.trim(),
      description_bullets: bilingualExp.description_bullets_id || bullets,
      type: payload.type === 'education' ? 'education' : 'work',
      order_index: Number(payload.order_index) || experiences.length + 1,
      sub_experiences: bilingualExp.sub_experiences || [],
    };

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      let insertResult;
      try {
        insertResult = await supabase
          .from('experiences')
          .insert([newRecord])
          .select()
          .single();
      } catch (err) {
        // Fallback without sub_experiences column if column not yet added in Supabase
        const { sub_experiences: _, ...fallbackRecord } = newRecord;
        insertResult = await supabase
          .from('experiences')
          .insert([fallbackRecord])
          .select()
          .single();
      }
      const { data, error } = insertResult;
      if (error) {
        // Retry without sub_experiences column in case PostgreSQL rejected unknown column
        if (error.code === '42703' || String(error.message).includes('sub_experiences')) {
          const { sub_experiences: _, ...cleanRecord } = newRecord;
          const retry = await supabase
            .from('experiences')
            .insert([cleanRecord])
            .select()
            .single();
          if (retry.error) throw retry.error;
          const enriched = { ...retry.data, ...bilingualExp };
          setExperiences((prev) => [...prev, enriched]);
          await saveEntityTranslationMap(
            'experience_translations',
            retry.data.id,
            bilingualExp
          );
          return enriched;
        }
        throw error;
      }
      const enriched = { ...data, ...bilingualExp };
      setExperiences((prev) => [...prev, enriched]);
      await saveEntityTranslationMap(
        'experience_translations',
        data.id,
        bilingualExp
      );
      return enriched;
    }

    const fallbackItem = {
      ...newRecord,
      ...bilingualExp,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExperiences((prev) => {
      const next = [...prev, fallbackItem];
      saveToStorage(STORAGE_KEYS.experiences, next);
      return next;
    });
    await saveEntityTranslationMap(
      'experience_translations',
      fallbackItem.id,
      bilingualExp
    );
    return fallbackItem;
  };

  const updateExperience = async (id, payload, sourceLang = language) => {
    const bullets = Array.isArray(payload.description_bullets)
      ? payload.description_bullets
      : String(payload.description_bullets || '')
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean);

    const bilingualExp = await resolveBilingualExperience(
      payload,
      bullets,
      sourceLang
    );

    const updatedFields = {
      role: bilingualExp.role_id || payload.role.trim(),
      company: bilingualExp.company_id || payload.company.trim(),
      period: payload.period.trim(),
      description_bullets: bilingualExp.description_bullets_id || bullets,
      type: payload.type === 'education' ? 'education' : 'work',
      order_index: Number(payload.order_index) || 1,
      sub_experiences: bilingualExp.sub_experiences || [],
    };

    await saveEntityTranslationMap('experience_translations', id, bilingualExp);

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      let updateResult = await supabase
        .from('experiences')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (updateResult.error && (updateResult.error.code === '42703' || String(updateResult.error.message).includes('sub_experiences'))) {
        // Fallback without sub_experiences column
        const { sub_experiences: _, ...cleanFields } = updatedFields;
        updateResult = await supabase
          .from('experiences')
          .update(cleanFields)
          .eq('id', id)
          .select()
          .single();
      }

      const { data, error } = updateResult;
      if (error) throw error;
      const enriched = { ...data, ...bilingualExp };
      setExperiences((prev) =>
        prev.map((item) => (item.id === id ? enriched : item))
      );
      return enriched;
    }

    setExperiences((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, ...updatedFields, ...bilingualExp }
          : item
      );
      saveToStorage(STORAGE_KEYS.experiences, next);
      return next;
    });
    return { id, ...updatedFields, ...bilingualExp };
  };

  const deleteExperience = async (id) => {
    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
    setExperiences((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEYS.experiences, next);
      return next;
    });
  };

  // ==========================================================================
  // 3. SKILLS CRUD
  // ==========================================================================
  const createSkill = async (payload) => {
    const newRecord = {
      category: payload.category,
      name: payload.name.trim(),
      proficiency_level: payload.proficiency_level || 'Advanced',
    };

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { data, error } = await supabase
        .from('skills')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      setSkills((prev) => [...prev, data]);
      return data;
    }

    const fallbackItem = {
      ...newRecord,
      id: `sk-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setSkills((prev) => {
      const next = [...prev, fallbackItem];
      saveToStorage(STORAGE_KEYS.skills, next);
      return next;
    });
    return fallbackItem;
  };

  const deleteSkill = async (id) => {
    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) throw error;
    }
    setSkills((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEYS.skills, next);
      return next;
    });
  };

  // ==========================================================================
  // 4. MESSAGES (CONTACT FORM INBOX) CRUD
  // ==========================================================================
  const submitMessage = async (payload) => {
    const newRecord = {
      name: payload.name.trim(),
      email: payload.email.trim(),
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      is_read: false,
    };

    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { data, error } = await supabase
        .from('messages')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      setMessages((prev) => [data, ...prev]);
      return data;
    }

    const fallbackMsg = {
      ...newRecord,
      id: `msg-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const next = [fallbackMsg, ...prev];
      saveToStorage(STORAGE_KEYS.messages, next);
      return next;
    });
    return fallbackMsg;
  };

  const toggleMessageRead = async (id, currentReadState) => {
    const nextReadState = !currentReadState;
    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: nextReadState })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? data : msg))
      );
      return data;
    }

    setMessages((prev) => {
      const next = prev.map((msg) =>
        msg.id === id ? { ...msg, is_read: nextReadState } : msg
      );
      saveToStorage(STORAGE_KEYS.messages, next);
      return next;
    });
    return null;
  };

  const deleteMessage = async (id) => {
    if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
    }
    setMessages((prev) => {
      const next = prev.filter((msg) => msg.id !== id);
      saveToStorage(STORAGE_KEYS.messages, next);
      return next;
    });
  };

  // Seed default data into Supabase or reset local storage
  const seedDefaultData = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('projects').delete().neq('title', '__never_match__');
      await supabase.from('experiences').delete().neq('role', '__never_match__');
      await supabase.from('skills').delete().neq('name', '__never_match__');

      const cleanProjects = INITIAL_PROJECTS.map(({ id, ...rest }) => rest);
      const cleanExperiences = INITIAL_EXPERIENCES.map(({ id, ...rest }) => rest);
      const cleanSkills = INITIAL_SKILLS.map(({ id, ...rest }) => rest);

      const { data: insertedProjects = [] } = await supabase
        .from('projects')
        .insert(cleanProjects)
        .select();
      const { data: insertedExperiences = [] } = await supabase
        .from('experiences')
        .insert(cleanExperiences)
        .select();
      await supabase.from('skills').insert(cleanSkills);

      const projectTranslationsMap = {};
      insertedProjects.forEach((dbProj, idx) => {
        const origProj = INITIAL_PROJECTS[idx];
        const enTrans = PROJECT_TRANSLATIONS_EN[origProj?.id] || {
          title: dbProj.title,
          description: dbProj.description,
        };
        projectTranslationsMap[dbProj.id] = {
          title_id: dbProj.title,
          description_id: dbProj.description,
          title_en: enTrans.title,
          description_en: enTrans.description,
        };
      });

      const experienceTranslationsMap = {};
      insertedExperiences.forEach((dbExp, idx) => {
        const origExp = INITIAL_EXPERIENCES[idx];
        const enTrans = EXPERIENCE_TRANSLATIONS_EN[origExp?.id] || {
          role: dbExp.role,
          company: dbExp.company,
          description_bullets: dbExp.description_bullets,
        };
        experienceTranslationsMap[dbExp.id] = {
          role_id: dbExp.role,
          company_id: dbExp.company,
          description_bullets_id: dbExp.description_bullets,
          role_en: enTrans.role,
          company_en: enTrans.company,
          description_bullets_en: enTrans.description_bullets,
        };
      });

      const fullContent = {
        ...DEFAULT_MERGED_SITE_CONTENT,
        project_translations: projectTranslationsMap,
        experience_translations: experienceTranslationsMap,
      };

      await supabase.from('site_settings').upsert({
        id: 'main',
        content: fullContent,
        updated_at: new Date().toISOString(),
      });

      await fetchAllData();
      return;
    }

    setSiteContent(DEFAULT_MERGED_SITE_CONTENT);
    setProjects(INITIAL_PROJECTS);
    setExperiences(INITIAL_EXPERIENCES);
    setSkills(INITIAL_SKILLS);
    setMessages(INITIAL_MESSAGES);
    saveToStorage(STORAGE_KEYS.siteContent, DEFAULT_MERGED_SITE_CONTENT);
    saveToStorage(STORAGE_KEYS.projects, INITIAL_PROJECTS);
    saveToStorage(STORAGE_KEYS.experiences, INITIAL_EXPERIENCES);
    saveToStorage(STORAGE_KEYS.skills, INITIAL_SKILLS);
    saveToStorage(STORAGE_KEYS.messages, INITIAL_MESSAGES);
  };

  const t = UI_DICTIONARY[language] || UI_DICTIONARY.id;

  // Helper to resolve visitor hostname into tracked domain bucket
  const resolveTrackedDomain = (hostname) => {
    const cleanHost = String(hostname || '')
      .toLowerCase()
      .trim()
      .replace(/^www\./, '');
    if (cleanHost === 'irfan.sang.ceo') {
      return 'irfan.sang.ceo';
    }
    return 'irfanhariyanto.my.id';
  };

  const SITE_CLICK_COOLDOWN_MS = 30 * 60 * 1000; // 30 menit per domain per browser
  const SHORTLINK_CLICK_COOLDOWN_MS = 10 * 60 * 1000; // 10 menit per shortlink per browser

  const isClickRateLimited = (storageKey, cooldownMs) => {
    try {
      const lastHit = Number(localStorage.getItem(storageKey) || 0);
      const now = Date.now();
      if (lastHit && now - lastHit < cooldownMs) {
        return true;
      }
      localStorage.setItem(storageKey, String(now));
      return false;
    } catch {
      return false;
    }
  };

  // Helper to record website clicks separated by domain (with anti-spam cooldown + atomic Supabase snapshot)
  const recordSiteClick = useCallback(async (hostnameOverride) => {
    const host =
      hostnameOverride ||
      (typeof window !== 'undefined' ? window.location.hostname : '');
    const domainKey = resolveTrackedDomain(host);

    // Anti-spam: cegah spam F5/refresh dalam 30 menit untuk domain yang sama
    if (isClickRateLimited(`ih_site_click_${domainKey}`, SITE_CLICK_COOLDOWN_MS)) {
      return;
    }

    // 1. Update local state & localStorage
    setSiteContent((prev) => {
      const prevClicks = prev?.site_clicks || {};
      const nextClicks = {
        'irfan.sang.ceo': Number(prevClicks['irfan.sang.ceo']) || 0,
        'irfanhariyanto.my.id': Number(prevClicks['irfanhariyanto.my.id']) || 0,
      };
      nextClicks[domainKey] = (nextClicks[domainKey] || 0) + 1;

      const nextContent = { ...prev, site_clicks: nextClicks };
      saveToStorage(STORAGE_KEYS.siteContent, nextContent);
      return nextContent;
    });

    // 2. Fetch fresh snapshot from Supabase and increment accurately
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('content')
          .eq('id', 'main')
          .maybeSingle();

        if (data?.content) {
          const dbClicks = data.content.site_clicks || {};
          const nextDbClicks = {
            'irfan.sang.ceo': Number(dbClicks['irfan.sang.ceo']) || 0,
            'irfanhariyanto.my.id': Number(dbClicks['irfanhariyanto.my.id']) || 0,
          };
          nextDbClicks[domainKey] = (nextDbClicks[domainKey] || 0) + 1;

          await supabase
            .from('site_settings')
            .update({
              content: { ...data.content, site_clicks: nextDbClicks },
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'main');
        }
      } catch {
        // ignore network errors silently
      }
    }
  }, []);

  // Helper to record shortlink hit clicks in siteContent (with anti-spam cooldown)
  const recordShortlinkClick = useCallback(
    async (shortlinkIdOrSlug) => {
      const normalizedKey = String(shortlinkIdOrSlug || '').toLowerCase().trim();
      if (
        normalizedKey &&
        isClickRateLimited(`ih_sl_click_${normalizedKey}`, SHORTLINK_CLICK_COOLDOWN_MS)
      ) {
        return;
      }

      // 1. Update State & LocalStorage
      let nextContentToSave = null;
      setSiteContent((prev) => {
        const list = Array.isArray(prev?.shortlinks) ? prev.shortlinks : [];
        let updated = false;
        const nextList = list.map((item) => {
          if (
            item.id === shortlinkIdOrSlug ||
            (item.slug || '').toLowerCase() === String(shortlinkIdOrSlug).toLowerCase()
          ) {
            updated = true;
            return { ...item, clicks: (item.clicks || 0) + 1 };
          }
          return item;
        });
        if (!updated) return prev;
        const nextContent = { ...prev, shortlinks: nextList };
        nextContentToSave = nextContent;
        saveToStorage(STORAGE_KEYS.siteContent, nextContent);
        return nextContent;
      });

      // 2. Fetch fresh snapshot from Supabase and increment accurately
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('site_settings')
            .select('content')
            .eq('id', 'main')
            .maybeSingle();

          if (data?.content) {
            const dbList = Array.isArray(data.content.shortlinks)
              ? data.content.shortlinks
              : [];
            const updatedDbList = dbList.map((item) => {
              if (
                item.id === shortlinkIdOrSlug ||
                (item.slug || '').toLowerCase() === String(shortlinkIdOrSlug).toLowerCase()
              ) {
                return { ...item, clicks: (item.clicks || 0) + 1 };
              }
              return item;
            });
            await supabase
              .from('site_settings')
              .update({
                content: { ...data.content, shortlinks: updatedDbList },
                updated_at: new Date().toISOString(),
              })
              .eq('id', 'main');
          }
        } catch {
          // ignore
        }
      }
    },
    []
  );

  return (
    <PortfolioDataContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
        githubRepoCount,
        syncGithubRepoCount,
        siteContent: activeSiteContent,
        rawSiteContent: siteContent,
        buildLocalizedSiteContent,
        recordShortlinkClick,
        recordSiteClick,
        projects: localizedProjects,
        rawProjects: projects,
        experiences: localizedExperiences,
        rawExperiences: experiences,
        skills,
        messages,
        loading,
        dbMode,
        syncError,
        isSupabaseConfigured,
        refreshData: fetchAllData,
        updateSiteContent,
        createProject,
        updateProject,
        deleteProject,
        moveProjectToPosition,
        createExperience,
        updateExperience,
        deleteExperience,
        createSkill,
        deleteSkill,
        submitMessage,
        toggleMessageRead,
        deleteMessage,
        seedDefaultData,
      }}
    >
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData() {
  const context = useContext(PortfolioDataContext);
  if (!context) {
    throw new Error(
      'usePortfolioData must be used within a PortfolioDataProvider'
    );
  }
  return context;
}
