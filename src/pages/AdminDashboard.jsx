import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Layers,
  Briefcase,
  Cpu,
  Mail,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Lock,
  LogOut,
  Database,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Home,
  User,
  Globe,
  Save,
  Upload,
  Image as ImageIcon,
  Sun,
  Moon,
  Languages,
  AlertTriangle,
  EyeOff,
  Crop,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  ADMIN_SECRET_KEY,
} from '../lib/supabase';
import { uploadProjectImageAsWebP } from '../lib/imageUpload';
import ImageCropModal from '../components/ImageCropModal';
import { translateText } from '../lib/translator';
import {
  PROJECT_TRANSLATIONS_EN,
  EXPERIENCE_TRANSLATIONS_EN,
} from '../lib/i18n';
import { usePortfolioData } from '../context/PortfolioDataContext';

// Deep path helpers for per-field bilingual editing & translation triggers
function getByPath(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  return pathStr
    .split('.')
    .reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

function setByPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let curr = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const isNextIndex = /^\d+$/.test(nextKey);
    const existing = curr[key];
    curr[key] = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === 'object'
      ? { ...existing }
      : isNextIndex
      ? []
      : {};
    curr = curr[key];
  }
  curr[parts[parts.length - 1]] = value;
  return clone;
}

const ADMIN_TABS = [
  { id: 'home', index: '01', label: 'Home & Hero', icon: Home },
  { id: 'about', index: '02', label: 'About & Metrics', icon: User },
  { id: 'projects', index: '03', label: 'Manage Projects', icon: Layers },
  {
    id: 'experiences',
    index: '04',
    label: 'Experience & Pillars',
    icon: Briefcase,
  },
  { id: 'skills', index: '05', label: 'Manage Skills', icon: Cpu },
  { id: 'contact', index: '06', label: 'Contact & Footer', icon: Globe },
  { id: 'seo', index: '07', label: 'SEO & Social Share', icon: Eye },
  { id: 'messages', index: '08', label: 'Inbox Messages', icon: Mail },
];

const PROJECT_CATEGORIES = ['Development', 'Visual Design', 'Other'];

const MOCKUP_TYPES = [
  { value: 'terminal', label: 'Terminal CLI (Chitanda Bot Style)' },
  { value: 'browser', label: 'Browser & Lighthouse Score Frame' },
  { value: 'dashboard', label: 'Telemetry Sync Dashboard (E-PKL Style)' },
  { value: 'editorial', label: 'Editorial Brand Grid Spec (HIMATIKA Style)' },
];

const SKILL_CATEGORIES = [
  'Creative & Visual Arts',
  'Engineering & Computing',
  'Ecosystem & Productivity',
];

export default function AdminDashboard() {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Admin (halaman privat): kunci skala viewport agar field boleh berfont kecil
  // di mobile tanpa memicu auto-zoom. Dipulihkan saat keluar dari admin.
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return undefined;
    const original = meta.getAttribute('content');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
    return () => meta.setAttribute('content', original);
  }, []);

  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    githubRepoCount,
    syncGithubRepoCount,
    siteContent,
    rawSiteContent,
    buildLocalizedSiteContent,
    projects,
    rawProjects,
    experiences,
    rawExperiences,
    skills,
    messages,
    dbMode,
    loading,
    refreshData,
    updateSiteContent,
    createProject,
    updateProject,
    deleteProject,
    createExperience,
    updateExperience,
    deleteExperience,
    createSkill,
    deleteSkill,
    toggleMessageRead,
    deleteMessage,
    seedDefaultData,
  } = usePortfolioData();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('ih_admin_auth') === 'true';
  });
  const [authMethod, setAuthMethod] = useState('key');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('home');

  // Toast Notification & Per-Field Translation State
  const [toast, setToast] = useState(null);
  const [translatingFieldKey, setTranslatingFieldKey] = useState(null);
  const [syncingGithubIdx, setSyncingGithubIdx] = useState(null);

  // Per-Field Change Tracking Across Languages (`changedMap[fieldPath]` = 'id' | 'en' | null)
  // Indicates that a field was modified in the opposite language and awaits manual/icon translation.
  const [changedFields, setChangedFields] = useState({});
  const [modalChangedFields, setModalChangedFields] = useState({});

  // Independent Bilingual Drafts (`bilingualDrafts.id` & `bilingualDrafts.en`)
  // Switching language NEVER overwrites or auto-translates any field unless the field's translate icon is clicked!
  const [bilingualDrafts, setBilingualDrafts] = useState(() => ({
    id: buildLocalizedSiteContent('id', rawSiteContent),
    en: buildLocalizedSiteContent('en', rawSiteContent),
  }));
  // Last saved snapshot — used to detect unsaved changes per section
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    id: buildLocalizedSiteContent('id', rawSiteContent),
    en: buildLocalizedSiteContent('en', rawSiteContent),
  }));

  useEffect(() => {
    const fresh = {
      id: buildLocalizedSiteContent('id', rawSiteContent),
      en: buildLocalizedSiteContent('en', rawSiteContent),
    };
    setBilingualDrafts(fresh);
    setSavedBaseline(fresh);
    setChangedFields({});
  }, [rawSiteContent, buildLocalizedSiteContent]);

  // Which siteContent keys belong to each admin tab (section)
  const TAB_SECTIONS = {
    home: ['navbar', 'hero'],
    about: ['about'],
    projects: ['projectsSection'],
    experiences: ['experienceSection'],
    skills: ['skillsSection'],
    contact: ['contact', 'footer'],
    seo: ['seo'],
  };

  const isSectionDirty = (tabId) => {
    const keys = TAB_SECTIONS[tabId];
    if (!keys) return false;
    return ['id', 'en'].some((lang) =>
      keys.some(
        (k) =>
          JSON.stringify(bilingualDrafts[lang]?.[k] ?? null) !==
          JSON.stringify(savedBaseline[lang]?.[k] ?? null)
      )
    );
  };

  const dirtyTabs = Object.keys(TAB_SECTIONS).filter(isSectionDirty);
  const hasUnsavedChanges = dirtyTabs.length > 0;

  const revertSection = (tabId) => {
    const keys = TAB_SECTIONS[tabId] || [];
    setBilingualDrafts((prev) => {
      const next = { ...prev };
      ['id', 'en'].forEach((lang) => {
        const copy = { ...(prev[lang] || {}) };
        keys.forEach((k) => {
          copy[k] = savedBaseline[lang]?.[k];
        });
        next[lang] = copy;
      });
      return next;
    });
    setChangedFields({});
  };

  // Custom confirmation dialog (replaces native window.confirm)
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState(null);

  const openConfirmDialog = (config) => setConfirmDialog(config);
  const closeConfirmDialog = () => setConfirmDialog(null);

  // Runs `action` immediately if the active section is clean; otherwise asks first.
  const requestLeave = (action) => {
    if (!isSectionDirty(activeTab)) {
      action();
      return;
    }
    const tabLabel =
      ADMIN_TABS.find((tb) => tb.id === activeTab)?.label || activeTab;
    openConfirmDialog({
      title: 'Perubahan belum disimpan',
      message: `Section "${tabLabel}" memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan tersebut akan dibuang.`,
      confirmLabel: 'Buang & Lanjutkan',
      cancelLabel: 'Kembali Mengedit',
      onConfirm: () => {
        revertSection(activeTab);
        action();
      },
    });
  };

  useEffect(() => {
    if (!confirmDialog) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDialog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDialog]);

  // Warn before refresh / closing tab when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const draftContent = bilingualDrafts[language] || siteContent;

  const setDraftContent = (updater) => {
    setBilingualDrafts((prev) => {
      const currentDraft = prev[language] || siteContent;
      const nextDraft =
        typeof updater === 'function' ? updater(currentDraft) : updater;
      return {
        ...prev,
        [language]: nextDraft,
      };
    });
  };

  // Helper to update a specific field path in the active language draft and mark it as changed
  const updateSiteField = (pathStr, newValue, sharedAcrossLanguages = false) => {
    setBilingualDrafts((prev) => {
      const nextCurrent = setByPath(prev[language] || siteContent, pathStr, newValue);
      if (sharedAcrossLanguages) {
        const oppositeLang = language === 'id' ? 'en' : 'id';
        const nextOpposite = setByPath(
          prev[oppositeLang] || siteContent,
          pathStr,
          newValue
        );
        return {
          ...prev,
          [language]: nextCurrent,
          [oppositeLang]: nextOpposite,
        };
      }
      return {
        ...prev,
        [language]: nextCurrent,
      };
    });

    if (!sharedAcrossLanguages) {
      setChangedFields((prev) => ({
        ...prev,
        [pathStr]: language,
      }));
    }
  };

  // Apply an array mutation to BOTH language drafts so indexes stay aligned (add/remove items)
  const updateArrayBoth = (pathStr, mapper) => {
    setBilingualDrafts((prev) => ({
      ...prev,
      id: setByPath(
        prev.id || siteContent,
        pathStr,
        mapper([...(getByPath(prev.id, pathStr) || [])], 'id')
      ),
      en: setByPath(
        prev.en || siteContent,
        pathStr,
        mapper([...(getByPath(prev.en, pathStr) || [])], 'en')
      ),
    }));
  };

  // Trigger translation for a single siteContent field from the opposite language into the current language
  const handleTranslateSiteField = async (pathStr) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const sourceVal = getByPath(bilingualDrafts[oppositeLang], pathStr);
    const sourceText =
      typeof sourceVal === 'string'
        ? sourceVal
        : sourceVal?.label || '';

    if (!sourceText || !String(sourceText).trim()) {
      showToast(
        `Teks di bahasa ${oppositeLang.toUpperCase()} masih kosong untuk field ini.`,
        'error'
      );
      return;
    }

    setTranslatingFieldKey(pathStr);
    try {
      const translated = await translateText(
        String(sourceText),
        oppositeLang,
        language
      );

      setBilingualDrafts((prev) => {
        const nextCurrent = setByPath(
          prev[language] || siteContent,
          pathStr,
          translated
        );
        return {
          ...prev,
          [language]: nextCurrent,
        };
      });

      // Clear the "changed in other language" badge for this field
      setChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[pathStr];
        return copy;
      });

      showToast(
        `Field diterjemahkan dari ${oppositeLang.toUpperCase()} → ${language.toUpperCase()}!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menerjemahkan field ini', 'error');
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  // Reusable Field Header with Badge ("Berubah di ID/EN") + Icon Trigger Translate
  const renderFieldLabel = (label, pathStr) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const oppositeUpper = oppositeLang.toUpperCase();
    const currentUpper = language.toUpperCase();
    const hasChangedInOpposite = changedFields[pathStr] === oppositeLang;
    const isTranslatingThis = translatingFieldKey === pathStr;
    const oppositeValue = getByPath(bilingualDrafts[oppositeLang], pathStr);

    return (
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase">
            {label}
          </label>
          {hasChangedInOpposite && (
            <span
              title={`Teks bahasa ${oppositeUpper} baru saja diubah: "${oppositeValue || ''}". Klik ikon translate di kanan jika ingin menerjemahkannya ke ${currentUpper}.`}
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold uppercase tracking-wider animate-pulse"
            >
              ● Berubah di {oppositeUpper}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isTranslatingThis}
          onClick={() => handleTranslateSiteField(pathStr)}
          title={`Terjemahkan teks dari bahasa ${oppositeUpper} ("${
            oppositeValue || ''
          }") ke ${currentUpper}`}
          className={`inline-flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1 border font-mono font-bold text-[10px] sm:text-xs uppercase transition-colors cursor-pointer ${
            hasChangedInOpposite
              ? 'bg-amber-500 text-[#181818] border-amber-400 hover:bg-[#fcfbf9]'
              : 'bg-[#141414] text-[#8c7355] border-[#3a3835] hover:border-[#8c7355] hover:text-[#fcfbf9]'
          }`}
        >
          <Languages
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTranslatingThis ? 'animate-spin' : ''}`}
          />
          <span>
            {isTranslatingThis
              ? '...'
              : `${oppositeUpper} → ${currentUpper}`}
          </span>
        </button>
      </div>
    );
  };

  // Project Modal State (Create / Update)
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Development',
    year: '2025',
    description: '',
    tech_stack: '',
    live_url: '',
    repo_url: '',
    image_url: '',
    mockup_type: 'browser',
    gallery_items: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState(null);

  // Crop Modal State for OpenGraph image (1200x630)
  const [ogCropModalOpen, setOgCropModalOpen] = useState(false);
  const [ogRawImageSrc, setOgRawImageSrc] = useState(null);
  const [ogRawFileName, setOgRawFileName] = useState('');

  // Experience Modal State (Create / Update)
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [expForm, setExpForm] = useState({
    role: '',
    company: '',
    period: '2024 — Present',
    start_year: '2024',
    end_year: 'Present',
    is_current: true,
    description_bullets: '',
    type: 'work',
    order_index: 1,
    sub_experiences: [],
  });
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState(null);

  // Skill Form State
  const [skillForm, setSkillForm] = useState({
    category: 'Creative & Visual Arts',
    name: '',
    proficiency_level: 'Advanced',
  });

  // Confirm delete message
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState(null);

  // Unsaved-change guard for Project / Experience modals
  // (display-only fields such as title/description/role are excluded; the bilingual *_id / *_en fields are compared)
  const projectSnapshot = (f) =>
    JSON.stringify({
      ...f,
      title: undefined,
      description: undefined,
      gallery_items: (f.gallery_items || []).map((g) => ({
        ...g,
        title: undefined,
      })),
    });
  const expSnapshot = (f) => {
    if (!f) return '';
    return JSON.stringify({
      ...f,
      role: undefined,
      company: undefined,
      description_bullets: undefined,
      sub_experiences: (f.sub_experiences || []).filter(Boolean).map((s) => ({
        ...s,
        role: undefined,
        period: undefined,
        description_bullets: undefined,
      })),
    });
  };
  const [, setSnapshotTick] = useState(0);
  const projectInitialRef = useRef('');
  const expInitialRef = useRef('');

  useEffect(() => {
    if (projectModalOpen) {
      projectInitialRef.current = projectSnapshot(projectForm);
      setSnapshotTick((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectModalOpen]);
  useEffect(() => {
    if (expModalOpen) {
      expInitialRef.current = expSnapshot(expForm);
      setSnapshotTick((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expModalOpen]);

  const projectModalDirty =
    projectModalOpen && projectSnapshot(projectForm) !== projectInitialRef.current;
  const expModalDirty =
    expModalOpen && expSnapshot(expForm) !== expInitialRef.current;

  useEffect(() => {
    if (!projectModalDirty && !expModalDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [projectModalDirty, expModalDirty]);

  const requestCloseProjectModal = () => {
    if (!projectModalDirty) {
      setProjectModalOpen(false);
      return;
    }
    openConfirmDialog({
      title: 'Proyek belum disimpan',
      message:
        'Perubahan pada proyek ini belum disimpan. Jika ditutup sekarang, perubahan akan hilang.',
      confirmLabel: 'Buang & Tutup',
      cancelLabel: 'Kembali Mengedit',
      onConfirm: () => setProjectModalOpen(false),
    });
  };
  const requestCloseExpModal = () => {
    if (!expModalDirty) {
      setExpModalOpen(false);
      return;
    }
    openConfirmDialog({
      title: 'Riwayat belum disimpan',
      message:
        'Perubahan pada riwayat ini belum disimpan. Jika ditutup sekarang, perubahan akan hilang.',
      confirmLabel: 'Buang & Tutup',
      cancelLabel: 'Kembali Mengedit',
      onConfirm: () => setExpModalOpen(false),
    });
  };

  // Intercept browser Back / Forward while there are unsaved changes.
  // BrowserRouter has no useBlocker, so we keep a sentinel history entry on top of the stack.
  const anyDirty = hasUnsavedChanges || projectModalDirty || expModalDirty;
  const skipPopGuardRef = useRef(false);
  const dirtyStateRef = useRef({ activeTab: 'home' });
  dirtyStateRef.current = { activeTab, hasUnsavedChanges };

  useEffect(() => {
    if (!anyDirty) return undefined;
    window.history.pushState({ adminUnsavedGuard: true }, '', window.location.href);

    const onPopState = () => {
      if (skipPopGuardRef.current) return;
      // Stay on the page: re-insert the sentinel entry, then ask the user.
      window.history.pushState(
        { adminUnsavedGuard: true },
        '',
        window.location.href
      );
      openConfirmDialog({
        title: 'Perubahan belum disimpan',
        message:
          'Anda menekan tombol Back/Forward browser, tetapi masih ada perubahan yang belum disimpan. Jika Anda keluar sekarang, perubahan tersebut akan dibuang.',
        confirmLabel: 'Buang & Keluar',
        cancelLabel: 'Kembali Mengedit',
        onConfirm: () => {
          if (dirtyStateRef.current.hasUnsavedChanges) {
            revertSection(dirtyStateRef.current.activeTab);
          }
          setProjectModalOpen(false);
          setExpModalOpen(false);
          skipPopGuardRef.current = true;
          // Skip both the sentinel entry and the admin entry to reach the real previous page.
          window.history.go(-2);
        },
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyDirty]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setIsAuthenticated(true);
          sessionStorage.setItem('ih_admin_auth', 'true');
        }
      });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMethod === 'key') {
        if (secretKeyInput.trim() === ADMIN_SECRET_KEY) {
          setIsAuthenticated(true);
          sessionStorage.setItem('ih_admin_auth', 'true');
          showToast('Authenticated via Admin Secret Key');
        } else {
          setAuthError(
            'Kunci akses admin tidak valid. Silakan periksa kembali.'
          );
        }
      } else {
        if (!isSupabaseConfigured || !supabase) {
          setAuthError(
            'Supabase belum dikonfigurasi di .env. Gunakan tab Secret Access Key untuk masuk.'
          );
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: emailInput.trim(),
            password: passwordInput,
          });
          if (error) {
            setAuthError(error.message);
          } else {
            setIsAuthenticated(true);
            sessionStorage.setItem('ih_admin_auth', 'true');
            showToast('Authenticated via Supabase Auth');
          }
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('ih_admin_auth');
    setIsAuthenticated(false);
    setSecretKeyInput('');
  };

  // ==========================================================================
  // SWITCH EDIT LANGUAGE (Pure Switch — Never Auto-Translates Until Icon Clicked)
  // ==========================================================================
  const handleSwitchEditLanguage = (targetLang) => {
    if (targetLang === language) return;

    // If Project Modal is open, swap active input display to targetLang's stored draft
    if (projectModalOpen) {
      setProjectForm((prev) => ({
        ...prev,
        title: targetLang === 'en' ? prev.title_en ?? '' : prev.title_id ?? '',
        description:
          targetLang === 'en'
            ? prev.description_en ?? ''
            : prev.description_id ?? '',
        gallery_items: (prev.gallery_items || []).map((item) => ({
          ...item,
          title:
            targetLang === 'en'
              ? item.title_en ?? item.title ?? ''
              : item.title_id ?? item.title ?? '',
        })),
      }));
    }

    // If Experience Modal is open, swap active input display to targetLang's stored draft
    if (expModalOpen) {
      setExpForm((prev) => ({
        ...prev,
        role: targetLang === 'en' ? prev.role_en ?? '' : prev.role_id ?? '',
        company:
          targetLang === 'en' ? prev.company_en ?? '' : prev.company_id ?? '',
        description_bullets:
          targetLang === 'en'
            ? prev.description_bullets_en ?? ''
            : prev.description_bullets_id ?? '',
      }));
    }

    setLanguage(targetLang);
  };

  // ==========================================================================
  // SAVE SITE CONTENT HELPER (Saves Independent ID & EN Drafts Without Overwriting)
  // ==========================================================================
  const handleSaveSiteSection = async (e, label) => {
    if (e) e.preventDefault();
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const oppositeDraft = bilingualDrafts[oppositeLang] || null;
    try {
      await updateSiteContent(draftContent, language, {
        autoTranslate: false,
        oppositeDraft,
      });
      setSavedBaseline(bilingualDrafts);
      setChangedFields({});
      showToast(
        `Konten "${label}" berhasil disimpan untuk ID & EN sesuai isi masing-masing field!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan perubahan konten', 'error');
    }
  };

  // ==========================================================================
  // PROJECT HANDLERS (With Per-Field Translate Icon & Change Indicator)
  // ==========================================================================
  const openCreateProjectModal = () => {
    setEditingProject(null);
    setUploadStats(null);
    setModalChangedFields({});
    setProjectForm({
      title: '',
      title_id: '',
      title_en: '',
      category: 'Development',
      year: '2025',
      description: '',
      description_id: '',
      description_en: '',
      tech_stack: 'Next.js 15, TypeScript, Tailwind CSS',
      live_url: 'https://github.com/rtwone',
      repo_url: 'https://github.com/rtwone',
      image_url: '',
      mockup_type: 'browser',
      gallery_items: [],
    });
    setProjectModalOpen(true);
  };

  const openEditProjectModal = (proj) => {
    setEditingProject(proj);
    setUploadStats(null);
    setModalChangedFields({});

    const rawProj =
      (rawProjects || []).find((p) => p.id === proj.id) || proj;
    const customTrans =
      rawSiteContent?.project_translations?.[proj.id] || {};
    const enFallback = PROJECT_TRANSLATIONS_EN?.[proj.id] || {};

    const titleId =
      customTrans.title_id || rawProj.title_id || rawProj.title || '';
    const titleEn =
      customTrans.title_en ||
      rawProj.title_en ||
      enFallback.title ||
      rawProj.title ||
      '';
    const descId =
      customTrans.description_id ||
      rawProj.description_id ||
      rawProj.description ||
      '';
    const descEn =
      customTrans.description_en ||
      rawProj.description_en ||
      enFallback.description ||
      rawProj.description ||
      '';

    const rawGallery = Array.isArray(customTrans.gallery_items)
      ? customTrans.gallery_items
      : Array.isArray(proj.gallery_items)
      ? proj.gallery_items
      : [];

    const normalizedGallery = rawGallery.map((item) => {
      const tId = item.title_id || item.title || item.title_en || '';
      const tEn = item.title_en || item.title || item.title_id || '';
      return {
        ...item,
        title_id: tId,
        title_en: tEn,
        title: language === 'en' ? tEn : tId,
      };
    });

    setProjectForm({
      title: language === 'en' ? titleEn : titleId,
      title_id: titleId,
      title_en: titleEn,
      category:
        proj.category === 'Visual Design'
          ? 'Visual Design'
          : proj.category === 'Other' || proj.category === 'Film & Video' || proj.category === 'Lainnya'
          ? 'Other'
          : 'Development',
      year: proj.year || '2025',
      description: language === 'en' ? descEn : descId,
      description_id: descId,
      description_en: descEn,
      tech_stack: Array.isArray(proj.tech_stack)
        ? proj.tech_stack.join(', ')
        : proj.tech_stack || '',
      live_url: proj.live_url || '',
      repo_url: proj.repo_url || '',
      image_url: proj.image_url || '',
      mockup_type: proj.mockup_type || 'browser',
      gallery_items: normalizedGallery,
    });
    setProjectModalOpen(true);
  };

  const updateProjectLangField = (fieldBase, val) => {
    setProjectForm((prev) => ({
      ...prev,
      [fieldBase]: val,
      [`${fieldBase}_${language}`]: val,
    }));
    setModalChangedFields((prev) => ({
      ...prev,
      [`proj.${fieldBase}`]: language,
    }));
  };

  const handleTranslateProjectField = async (fieldBase) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const sourceText = projectForm[`${fieldBase}_${oppositeLang}`] || '';
    if (!sourceText.trim()) {
      showToast(
        `Teks di bahasa ${oppositeLang.toUpperCase()} masih kosong untuk field ini.`,
        'error'
      );
      return;
    }
    const key = `proj.${fieldBase}`;
    setTranslatingFieldKey(key);
    try {
      const translated = await translateText(sourceText, oppositeLang, language);
      setProjectForm((prev) => ({
        ...prev,
        [fieldBase]: translated,
        [`${fieldBase}_${language}`]: translated,
      }));
      setModalChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      showToast(
        `Field diterjemahkan dari ${oppositeLang.toUpperCase()} → ${language.toUpperCase()}!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menerjemahkan field proyek', 'error');
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  const renderProjectFieldLabel = (label, fieldBase) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const oppositeUpper = oppositeLang.toUpperCase();
    const currentUpper = language.toUpperCase();
    const key = `proj.${fieldBase}`;
    const hasChangedInOpposite = modalChangedFields[key] === oppositeLang;
    const isTranslatingThis = translatingFieldKey === key;
    const oppositeValue = projectForm[`${fieldBase}_${oppositeLang}`] || '';

    return (
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase">
            {label}
          </label>
          {hasChangedInOpposite && (
            <span
              title={`Teks bahasa ${oppositeUpper} baru saja diubah: "${oppositeValue}". Klik ikon translate di kanan jika ingin menerjemahkannya ke ${currentUpper}.`}
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold uppercase tracking-wider animate-pulse"
            >
              ● Berubah di {oppositeUpper}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isTranslatingThis}
          onClick={() => handleTranslateProjectField(fieldBase)}
          title={`Terjemahkan dari ${oppositeUpper} ("${oppositeValue}") ke ${currentUpper}`}
          className={`inline-flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1 border font-mono font-bold text-[10px] sm:text-xs uppercase transition-colors cursor-pointer ${
            hasChangedInOpposite
              ? 'bg-amber-500 text-[#181818] border-amber-400 hover:bg-[#fcfbf9]'
              : 'bg-[#141414] text-[#8c7355] border-[#3a3835] hover:border-[#8c7355] hover:text-[#fcfbf9]'
          }`}
        >
          <Languages
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTranslatingThis ? 'animate-spin' : ''}`}
          />
          <span>
            {isTranslatingThis ? '...' : `${oppositeUpper} → ${currentUpper}`}
          </span>
        </button>
      </div>
    );
  };

  const handleGalleryImagesSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingGalleryImage(true);
    try {
      const uploadedItems = [];
      for (const file of files) {
        const result = await uploadProjectImageAsWebP(file, {
          preserveOriginalDimensions: true,
          folder: 'visual-designs',
        });
        const defaultTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ');
        uploadedItems.push({
          id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: defaultTitle,
          title_id: defaultTitle,
          title_en: defaultTitle,
          image_url: result.url,
          post_url: projectForm.live_url || 'https://instagram.com/irfanhariyanto',
          width: result.width,
          height: result.height,
          webpKB: Math.round(result.webpSize / 1024),
        });
      }

      setProjectForm((prev) => ({
        ...prev,
        image_url: prev.image_url || uploadedItems[0]?.image_url || '',
        gallery_items: [...(prev.gallery_items || []), ...uploadedItems],
      }));

      showToast(
        `${uploadedItems.length} desain berhasil dikonversi ke .webp (Ukuran Asli) & ditambahkan ke Carousel!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal mengunggah gambar desain', 'error');
    } finally {
      setUploadingGalleryImage(false);
      e.target.value = '';
    }
  };

  const handleAddEmptyGallerySlide = () => {
    setProjectForm((prev) => ({
      ...prev,
      gallery_items: [
        ...(prev.gallery_items || []),
        {
          id: `gal-${Date.now()}`,
          title: '',
          title_id: '',
          title_en: '',
          image_url: '',
          post_url: prev.live_url || 'https://instagram.com/irfanhariyanto',
        },
      ],
    }));
  };

  const handleUpdateGallerySlide = (idx, field, val) => {
    setProjectForm((prev) => {
      const list = [...(prev.gallery_items || [])];
      if (field === 'title') {
        list[idx] = {
          ...list[idx],
          title: val,
          [`title_${language}`]: val,
        };
      } else {
        list[idx] = { ...list[idx], [field]: val };
      }
      return { ...prev, gallery_items: list };
    });
    if (field === 'title') {
      setModalChangedFields((prev) => ({
        ...prev,
        [`proj.gallery.${idx}.title`]: language,
      }));
    }
  };

  const handleTranslateGallerySlideTitle = async (idx) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const slide = projectForm.gallery_items?.[idx];
    const sourceText = slide?.[`title_${oppositeLang}`] || '';
    if (!sourceText.trim()) {
      showToast(
        `Judul desain di bahasa ${oppositeLang.toUpperCase()} masih kosong.`,
        'error'
      );
      return;
    }
    const key = `proj.gallery.${idx}.title`;
    setTranslatingFieldKey(key);
    try {
      const translated = await translateText(sourceText, oppositeLang, language);
      setProjectForm((prev) => {
        const list = [...(prev.gallery_items || [])];
        list[idx] = {
          ...list[idx],
          title: translated,
          [`title_${language}`]: translated,
        };
        return { ...prev, gallery_items: list };
      });
      setModalChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      showToast(
        `Judul desain #${idx + 1} diterjemahkan dari ${oppositeLang.toUpperCase()} → ${language.toUpperCase()}!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menerjemahkan judul desain', 'error');
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  const handleRemoveGallerySlide = (idx) => {
    setProjectForm((prev) => ({
      ...prev,
      gallery_items: (prev.gallery_items || []).filter((_, i) => i !== idx),
    }));
  };

  const handleProjectImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadStats(null);

    try {
      const result = await uploadProjectImageAsWebP(file);
      setProjectForm((prev) => ({
        ...prev,
        image_url: result.url,
      }));
      setUploadStats({
        fileName: result.webpFileName,
        originalKB: Math.round(result.originalSize / 1024),
        webpKB: Math.round(result.webpSize / 1024),
        wasConverted: result.wasConverted,
        uploadedToSupabase: result.uploadedToSupabase,
        storageWarning: result.storageWarning,
      });
      showToast(
        result.wasConverted
          ? `Otomatis dikonversi ke .webp (${Math.round(result.webpSize / 1024)} KB) & siap disimpan!`
          : `File .webp (${Math.round(result.webpSize / 1024)} KB) siap disimpan!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal memproses gambar proyek', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      const payloadToSave = {
        ...projectForm,
        [`title_${language}`]: projectForm.title,
        [`description_${language}`]: projectForm.description,
        gallery_items: (projectForm.gallery_items || []).map((item) => ({
          ...item,
          [`title_${language}`]: item.title,
        })),
      };
      if (editingProject) {
        await updateProject(editingProject.id, payloadToSave, language);
        showToast(`Proyek "${projectForm.title}" berhasil diperbarui!`);
      } else {
        await createProject(payloadToSave, language);
        showToast(`Proyek "${projectForm.title}" berhasil ditambahkan!`);
      }
      setProjectModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan proyek', 'error');
    }
  };

  const handleConfirmDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      setConfirmDeleteProjectId(null);
      showToast('Proyek berhasil dihapus dari database.');
    } catch (err) {
      showToast(err?.message || 'Gagal menghapus proyek', 'error');
    }
  };

  // ==========================================================================
  // EXPERIENCE HANDLERS (With Per-Field Translate Icon & Change Indicator)
  // ==========================================================================
  const openCreateExpModal = () => {
    setEditingExp(null);
    setModalChangedFields({});
    const thisYear = String(new Date().getFullYear());
    setExpForm({
      role: '',
      role_id: '',
      role_en: '',
      company: '',
      company_id: '',
      company_en: '',
      period: `${thisYear} — Present`,
      start_year: thisYear,
      end_year: 'Present',
      is_current: true,
      description_bullets: '',
      description_bullets_id: '',
      description_bullets_en: '',
      type: 'work',
      order_index: experiences.length + 1,
      sub_experiences: [],
    });
    setExpModalOpen(true);
  };

  const openEditExpModal = (exp) => {
    try {
      setEditingExp(exp);
      setModalChangedFields({});

      const rawExp =
        (rawExperiences || []).find((item) => item?.id === exp?.id) || exp || {};
      const customTrans =
        rawSiteContent?.experience_translations?.[exp?.id] || {};
      const enFallback = (exp?.id && EXPERIENCE_TRANSLATIONS_EN?.[exp.id]) || {};

      const toBulletText = (val) =>
        Array.isArray(val) ? val.join('\n') : (typeof val === 'string' ? val : '');

      const roleId = customTrans.role_id || rawExp.role_id || rawExp.role || '';
      const roleEn =
        customTrans.role_en ||
        rawExp.role_en ||
        enFallback.role ||
        rawExp.role ||
        '';
      const companyId =
        customTrans.company_id || rawExp.company_id || rawExp.company || '';
      const companyEn =
        customTrans.company_en ||
        rawExp.company_en ||
        enFallback.company ||
        rawExp.company ||
        '';
      const bulletsId =
        toBulletText(customTrans.description_bullets_id) ||
        toBulletText(rawExp.description_bullets_id) ||
        toBulletText(rawExp.description_bullets);
      const bulletsEn =
        toBulletText(customTrans.description_bullets_en) ||
        toBulletText(rawExp.description_bullets_en) ||
        toBulletText(enFallback.description_bullets) ||
        toBulletText(rawExp.description_bullets);

      const parseYearParts = (periodText) => {
        if (!periodText) return { start: '', end: '', isCurrent: false };
        const parts = String(periodText).split(/\s*[-–—]\s*/);
        const start = parts[0]?.trim() || '';
        const end = parts[1]?.trim() || '';
        const isCurrent =
          ['present', 'sekarang', 'saat ini', 'current'].includes(end.toLowerCase()) ||
          ['present', 'sekarang', 'saat ini', 'current'].includes(start.toLowerCase());
        return { start, end: isCurrent ? 'Present' : end, isCurrent };
      };

      const expPeriodParsed = parseYearParts(exp?.period);

      let rawSubs = rawExp.sub_experiences || exp?.sub_experiences || [];
      if (typeof rawSubs === 'string') {
        try {
          rawSubs = JSON.parse(rawSubs);
        } catch {
          rawSubs = [];
        }
      }
      if (!Array.isArray(rawSubs)) rawSubs = [];

      const normalizedSubs = rawSubs
        .filter((s) => s && typeof s === 'object')
        .map((s, sIdx) => {
          const subId = s.id || `sub-${Date.now()}-${sIdx}`;
          const sRoleId = s.role_id || s.role || '';
          const sRoleEn = s.role_en || s.role || '';
          const sPeriodId = s.period_id || s.period || '';
          const sPeriodEn = s.period_en || s.period || '';
          const subParsed = parseYearParts(s.period || s.period_id || s.period_en);
          const startYear = s.start_year || subParsed.start;
          const isCurrent = s.is_current !== undefined ? !!s.is_current : subParsed.isCurrent;
          const endYear = isCurrent ? 'Present' : (s.end_year || subParsed.end);
          const sBulletsId = toBulletText(s.description_bullets_id || s.description_bullets);
          const sBulletsEn = toBulletText(s.description_bullets_en || s.description_bullets);

          return {
            id: subId,
            role: language === 'en' ? sRoleEn : sRoleId,
            role_id: sRoleId,
            role_en: sRoleEn,
            period: language === 'en' ? sPeriodEn : sPeriodId,
            period_id: sPeriodId,
            period_en: sPeriodEn,
            start_year: startYear,
            end_year: endYear,
            is_current: isCurrent,
            description_bullets: language === 'en' ? sBulletsEn : sBulletsId,
            description_bullets_id: sBulletsId,
            description_bullets_en: sBulletsEn,
          };
        });

      setExpForm({
        role: language === 'en' ? roleEn : roleId,
        role_id: roleId,
        role_en: roleEn,
        company: language === 'en' ? companyEn : companyId,
        company_id: companyId,
        company_en: companyEn,
        period: exp?.period || '',
        start_year: exp?.start_year || expPeriodParsed.start,
        end_year: exp?.is_current ? 'Present' : (exp?.end_year || expPeriodParsed.end),
        is_current: exp?.is_current !== undefined ? !!exp.is_current : expPeriodParsed.isCurrent,
        description_bullets: language === 'en' ? bulletsEn : bulletsId,
        description_bullets_id: bulletsId,
        description_bullets_en: bulletsEn,
        type: exp?.type || 'work',
        order_index: exp?.order_index || 1,
        sub_experiences: normalizedSubs,
      });
      setExpModalOpen(true);
    } catch (err) {
      console.error('Error opening edit exp modal:', err);
      showToast('Gagal membuka editor pengalaman: ' + (err?.message || err), 'error');
    }
  };

  const updateExpLangField = (fieldBase, val) => {
    setExpForm((prev) => ({
      ...prev,
      [fieldBase]: val,
      [`${fieldBase}_${language}`]: val,
    }));
    setModalChangedFields((prev) => ({
      ...prev,
      [`exp.${fieldBase}`]: language,
    }));
  };

  const handleTranslateExpField = async (fieldBase) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const sourceText = expForm[`${fieldBase}_${oppositeLang}`] || '';
    if (!sourceText.trim()) {
      showToast(
        `Teks di bahasa ${oppositeLang.toUpperCase()} masih kosong untuk field ini.`,
        'error'
      );
      return;
    }
    const key = `exp.${fieldBase}`;
    setTranslatingFieldKey(key);
    try {
      let translated = '';
      if (fieldBase === 'description_bullets') {
        const lines = sourceText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const transLines = await Promise.all(
          lines.map((line) => translateText(line, oppositeLang, language))
        );
        translated = transLines.join('\n');
      } else {
        translated = await translateText(sourceText, oppositeLang, language);
      }

      setExpForm((prev) => ({
        ...prev,
        [fieldBase]: translated,
        [`${fieldBase}_${language}`]: translated,
      }));
      setModalChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      showToast(
        `Field diterjemahkan dari ${oppositeLang.toUpperCase()} → ${language.toUpperCase()}!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menerjemahkan field riwayat', 'error');
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  const renderExpFieldLabel = (label, fieldBase) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const oppositeUpper = oppositeLang.toUpperCase();
    const currentUpper = language.toUpperCase();
    const key = `exp.${fieldBase}`;
    const hasChangedInOpposite = modalChangedFields[key] === oppositeLang;
    const isTranslatingThis = translatingFieldKey === key;
    const oppositeValue = expForm[`${fieldBase}_${oppositeLang}`] || '';

    return (
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase">
            {label}
          </label>
          {hasChangedInOpposite && (
            <span
              title={`Teks bahasa ${oppositeUpper} baru saja diubah: "${oppositeValue}". Klik ikon translate di kanan jika ingin menerjemahkannya ke ${currentUpper}.`}
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold uppercase tracking-wider animate-pulse"
            >
              ● Berubah di {oppositeUpper}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isTranslatingThis}
          onClick={() => handleTranslateExpField(fieldBase)}
          title={`Terjemahkan dari ${oppositeUpper} ("${oppositeValue}") ke ${currentUpper}`}
          className={`inline-flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1 border font-mono font-bold text-[10px] sm:text-xs uppercase transition-colors cursor-pointer ${
            hasChangedInOpposite
              ? 'bg-amber-500 text-[#181818] border-amber-400 hover:bg-[#fcfbf9]'
              : 'bg-[#141414] text-[#8c7355] border-[#3a3835] hover:border-[#8c7355] hover:text-[#fcfbf9]'
          }`}
        >
          <Languages
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTranslatingThis ? 'animate-spin' : ''}`}
          />
          <span>
            {isTranslatingThis ? '...' : `${oppositeUpper} → ${currentUpper}`}
          </span>
        </button>
      </div>
    );
  };

  const handleAddSubExp = () => {
    const thisYear = String(new Date().getFullYear());
    const newSub = {
      id: `sub-${Date.now()}`,
      role: '',
      role_id: '',
      role_en: '',
      period: `${thisYear} — Present`,
      period_id: `${thisYear} — Sekarang`,
      period_en: `${thisYear} — Present`,
      start_year: thisYear,
      end_year: 'Present',
      is_current: true,
      description_bullets: '',
      description_bullets_id: '',
      description_bullets_en: '',
    };
    setExpForm((prev) => ({
      ...prev,
      sub_experiences: [...(prev.sub_experiences || []), newSub],
    }));
  };

  const handleUpdateSubExpField = (subId, fieldBase, val) => {
    setExpForm((prev) => ({
      ...prev,
      sub_experiences: (prev.sub_experiences || []).map((s) => {
        if (s.id !== subId) return s;
        return {
          ...s,
          [fieldBase]: val,
          [`${fieldBase}_${language}`]: val,
        };
      }),
    }));
    setModalChangedFields((prev) => ({
      ...prev,
      [`subexp.${subId}.${fieldBase}`]: language,
    }));
  };

  const handleTranslateSubExpField = async (subId, fieldBase) => {
    const targetSub = (expForm.sub_experiences || []).find((s) => s.id === subId);
    if (!targetSub) return;
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const sourceText = targetSub[`${fieldBase}_${oppositeLang}`] || targetSub[fieldBase] || '';
    if (!sourceText.trim()) {
      showToast(
        `Teks sub-experience di bahasa ${oppositeLang.toUpperCase()} masih kosong untuk field ini.`,
        'error'
      );
      return;
    }
    const key = `subexp.${subId}.${fieldBase}`;
    setTranslatingFieldKey(key);
    try {
      let translated = '';
      if (fieldBase === 'description_bullets') {
        const lines = sourceText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const transLines = await Promise.all(
          lines.map((line) => translateText(line, oppositeLang, language))
        );
        translated = transLines.join('\n');
      } else {
        translated = await translateText(sourceText, oppositeLang, language);
      }

      setExpForm((prev) => ({
        ...prev,
        sub_experiences: (prev.sub_experiences || []).map((s) => {
          if (s.id !== subId) return s;
          return {
            ...s,
            [fieldBase]: translated,
            [`${fieldBase}_${language}`]: translated,
          };
        }),
      }));
      setModalChangedFields((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      showToast(
        `Sub-experience (${fieldBase}) diterjemahkan dari ${oppositeLang.toUpperCase()} → ${language.toUpperCase()}!`
      );
    } catch (err) {
      showToast(err?.message || 'Gagal menerjemahkan sub-experience', 'error');
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  const renderSubExpFieldLabel = (sub, label, fieldBase) => {
    const oppositeLang = language === 'id' ? 'en' : 'id';
    const oppositeUpper = oppositeLang.toUpperCase();
    const currentUpper = language.toUpperCase();
    const key = `subexp.${sub.id}.${fieldBase}`;
    const hasChangedInOpposite = modalChangedFields[key] === oppositeLang;
    const isTranslatingThis = translatingFieldKey === key;
    const oppositeValue = sub[`${fieldBase}_${oppositeLang}`] || '';

    return (
      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <label className="block font-mono text-[10px] sm:text-[11px] text-[#d8d2c7] uppercase">
            {label} ({currentUpper})
          </label>
          {hasChangedInOpposite && (
            <span
              title={`Teks sub-experience bahasa ${oppositeUpper} berubah: "${oppositeValue}". Klik tombol translate di samping untuk menyamakan.`}
              className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold uppercase animate-pulse"
            >
              ● {oppositeUpper}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isTranslatingThis}
          onClick={() => handleTranslateSubExpField(sub.id, fieldBase)}
          title={`Terjemahkan ${oppositeUpper} ke ${currentUpper}`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono font-bold text-[9px] sm:text-[10px] uppercase transition-colors cursor-pointer ${
            hasChangedInOpposite
              ? 'bg-amber-500 text-[#181818] border-amber-400 hover:bg-[#fcfbf9]'
              : 'bg-[#1a1a1a] text-[#8c7355] border-[#3a3835] hover:border-[#8c7355] hover:text-[#fcfbf9]'
          }`}
        >
          <Languages
            className={`w-3 h-3 ${isTranslatingThis ? 'animate-spin' : ''}`}
          />
          <span>{isTranslatingThis ? '...' : `${oppositeUpper} → ${currentUpper}`}</span>
        </button>
      </div>
    );
  };

  const handleRemoveSubExp = (subId) => {
    setExpForm((prev) => ({
      ...prev,
      sub_experiences: (prev.sub_experiences || []).filter((s) => s.id !== subId),
    }));
  };

  const handleSaveExp = async (e) => {
    e.preventDefault();
    try {
      // 1. Validasi Sub-Experiences jika ada: Semua field wajib diisi (baik ID maupun EN)
      if (Array.isArray(expForm.sub_experiences) && expForm.sub_experiences.length > 0) {
        for (let i = 0; i < expForm.sub_experiences.length; i++) {
          const sub = expForm.sub_experiences[i];
          const subIdx = i + 1;
          const roleId = (sub.role_id || sub.role || '').trim();
          const roleEn = (sub.role_en || sub.role || '').trim();
          const startYear = (sub.start_year || '').trim();
          const endYear = sub.is_current ? 'Present' : (sub.end_year || '').trim();
          const typeId = (sub.employment_type_id || sub.employment_type || '').trim();
          const typeEn = (sub.employment_type_en || sub.employment_type || '').trim();
          const bulletsId = (sub.description_bullets_id || sub.description_bullets || '').trim();
          const bulletsEn = (sub.description_bullets_en || sub.description_bullets || '').trim();

          if (!roleId || !roleEn) {
            showToast(`Sub-Role #${subIdx}: Role Title wajib diisi (ID & EN).`, 'error');
            return;
          }
          if (!startYear) {
            showToast(`Sub-Role #${subIdx}: Tahun Mulai wajib diisi.`, 'error');
            return;
          }
          if (!sub.is_current && !endYear) {
            showToast(`Sub-Role #${subIdx}: Tahun Selesai wajib diisi atau centang 'Aktif'.`, 'error');
            return;
          }
          if (!bulletsId || !bulletsEn) {
            showToast(`Sub-Role #${subIdx}: Description Bullets wajib diisi (ID & EN).`, 'error');
            return;
          }
        }
      }

      const serializedSubs = (expForm.sub_experiences || []).map((s) => {
        const splitBullets = (val) =>
          Array.isArray(val)
            ? val
            : String(val || '')
                .split('\n')
                .map((b) => b.trim())
                .filter(Boolean);

        const bulletsId = splitBullets(s.description_bullets_id || s.description_bullets);
        const bulletsEn = splitBullets(s.description_bullets_en || s.description_bullets);

        const startYear = (s.start_year || '').trim();
        const endYear = s.is_current ? 'Present' : (s.end_year || '').trim();

        const formatPeriodStr = (lang) => {
          if (!startYear) return s.period || '';
          if (s.is_current) {
            return `${startYear} — ${lang === 'en' ? 'Present' : 'Sekarang'}`;
          }
          if (endYear && endYear !== startYear) {
            return `${startYear} — ${endYear}`;
          }
          return startYear;
        };

        const sPeriodId = formatPeriodStr('id');
        const sPeriodEn = formatPeriodStr('en');

        return {
          id: s.id || `sub-${Date.now()}`,
          role: (s.role || s.role_id || s.role_en || '').trim(),
          role_id: (s.role_id || s.role || s.role_en || '').trim(),
          role_en: (s.role_en || s.role || s.role_id || '').trim(),
          start_year: startYear,
          end_year: endYear,
          is_current: !!s.is_current,
          period: language === 'en' ? sPeriodEn : sPeriodId,
          period_id: sPeriodId,
          period_en: sPeriodEn,
          description_bullets: language === 'en' ? bulletsEn : bulletsId,
          description_bullets_id: bulletsId,
          description_bullets_en: bulletsEn,
        };
      });

      const startYearExp = (expForm.start_year || '').trim();
      const endYearExp = expForm.is_current ? 'Present' : (expForm.end_year || '').trim();
      const formatExpPeriod = (lang) => {
        if (!startYearExp) return expForm.period || '';
        if (expForm.is_current) {
          return `${startYearExp} — ${lang === 'en' ? 'Present' : 'Sekarang'}`;
        }
        if (endYearExp && endYearExp !== startYearExp) {
          return `${startYearExp} — ${endYearExp}`;
        }
        return startYearExp;
      };

      const finalPeriod = (Array.isArray(serializedSubs) && serializedSubs.length > 0)
        ? (language === 'en' ? serializedSubs[0].period_en : serializedSubs[0].period_id)
        : formatExpPeriod(language);

      const payloadToSave = {
        ...expForm,
        period: finalPeriod,
        start_year: startYearExp,
        end_year: endYearExp,
        is_current: !!expForm.is_current,
        sub_experiences: serializedSubs,
        [`role_${language}`]: expForm.role,
        [`company_${language}`]: expForm.company,
        [`description_bullets_${language}`]: expForm.description_bullets,
      };
      if (editingExp) {
        await updateExperience(editingExp.id, payloadToSave, language);
        showToast(`Riwayat "${expForm.role || expForm.company}" berhasil diperbarui!`);
      } else {
        await createExperience(payloadToSave, language);
        showToast(`Riwayat "${expForm.role || expForm.company}" berhasil ditambahkan!`);
      }
      setExpModalOpen(false);
      setEditingExp(null);
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan riwayat', 'error');
    }
  };

  const handleConfirmDeleteExp = async (id) => {
    try {
      await deleteExperience(id);
      setConfirmDeleteExpId(null);
      showToast('Riwayat berhasil dihapus.');
    } catch (err) {
      showToast(err?.message || 'Gagal menghapus riwayat', 'error');
    }
  };

  // ==========================================================================
  // SKILL HANDLERS
  // ==========================================================================
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;
    try {
      await createSkill(skillForm);
      showToast(
        `Skill "${skillForm.name}" ditambahkan ke ${skillForm.category}.`
      );
      setSkillForm((prev) => ({ ...prev, name: '' }));
    } catch (err) {
      showToast(err?.message || 'Gagal menambahkan skill', 'error');
    }
  };

  const handleRemoveSkill = async (id, name) => {
    try {
      await deleteSkill(id);
      showToast(`Skill "${name}" berhasil dihapus.`);
    } catch (err) {
      showToast(err?.message || 'Gagal menghapus skill', 'error');
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  // ==========================================================================
  // RENDER 1: LOGIN SCREEN
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="theme-admin min-h-screen bg-[#181818] text-[#fcfbf9] flex flex-col justify-between p-4 sm:p-8 transition-colors duration-200">
        <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 border-b border-[#333333] pb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Terminal className="w-5 h-5 text-[#8c7355] shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase truncate">
              IRFAN HARIYANTO // ADMIN CONSOLE
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center justify-center w-9 h-9 border border-[#444444] bg-[#222222] text-[#fcfbf9] hover:border-[#8c7355] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#8c7355]" aria-hidden="true" />
              )}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#444444] bg-[#222222] text-[#fcfbf9] font-mono font-bold text-xs uppercase hover:border-[#8c7355] transition-colors"
            >
              <span>← Back</span>
              <span className="hidden sm:inline">to Public Portfolio</span>
            </Link>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto my-8 sm:my-12 border border-[#3a3835] bg-[#1f1f1f] p-5 sm:p-10">
          <div className="flex items-center justify-between pb-4 mb-5 sm:mb-6 border-b border-[#333333]">
            <span className="font-mono font-bold text-[10px] sm:text-xs text-[#8c7355] uppercase tracking-widest">
              AUTH // SECURITY GATEWAY
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[10px] sm:text-xs text-[#16a34a]">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              PROTECTED ROUTE
            </span>
          </div>

          <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-[#fcfbf9] tracking-tight">
            Admin Control Panel
          </h1>
          <p className="mt-1.5 font-sans font-medium text-xs sm:text-sm text-neutral-500 leading-snug">
            Masuk untuk mengubah seluruh konten halaman (Hero, About, Statistik, Proyek, Pengalaman, Keahlian, Kontak, hingga Footer) secara dinamis.
          </p>

          <div className="mt-5 sm:mt-6 grid grid-cols-2 border border-[#3a3835] bg-[#141414] p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('key');
                setAuthError('');
              }}
              className={`min-w-0 px-2 sm:px-3 py-2 text-center leading-tight font-mono font-bold text-[11px] sm:text-sm uppercase tracking-normal sm:tracking-wider break-words transition-colors cursor-pointer ${
                authMethod === 'key'
                  ? 'bg-[#8c7355] text-[#181818]'
                  : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
              }`}
            >
              01. Secret Access Key
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('supabase');
                setAuthError('');
              }}
              className={`min-w-0 px-2 sm:px-3 py-2 text-center leading-tight font-mono font-bold text-[11px] sm:text-sm uppercase tracking-normal sm:tracking-wider break-words transition-colors cursor-pointer ${
                authMethod === 'supabase'
                  ? 'bg-[#8c7355] text-[#181818]'
                  : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
              }`}
            >
              02. Supabase Email Auth
            </button>
          </div>

          <form onSubmit={handleLogin} className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
            {authMethod === 'key' ? (
              <div>
                <label
                  htmlFor="secretKey"
                  className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase mb-1.5"
                >
                  ADMIN ACCESS KEY *
                </label>
                <div className="relative">
                  <input
                    id="secretKey"
                    type={showSecretKey ? 'text' : 'password'}
                    required
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    placeholder="Masukkan kunci akses"
                    autoComplete="off"
                    className="w-full min-w-0 pl-3 pr-11 py-2 sm:pl-4 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-bold text-base sm:text-sm text-[#fcfbf9] outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey((v) => !v)}
                    aria-label={showSecretKey ? 'Sembunyikan kunci' : 'Tampilkan kunci'}
                    aria-pressed={showSecretKey}
                    className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#d8d2c7] hover:text-[#8c7355] cursor-pointer"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="adminEmail"
                    className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase mb-1.5"
                  >
                    SUPABASE ADMIN EMAIL *
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-base sm:text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adminPassword"
                    className="block font-mono text-xs sm:text-sm font-medium tracking-wide text-[#d8d2c7] uppercase mb-1.5"
                  >
                    PASSWORD *
                  </label>
                  <div className="relative">
                    <input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full min-w-0 pl-3 pr-11 py-2 sm:pl-4 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-base sm:text-sm text-[#fcfbf9] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#d8d2c7] hover:text-[#8c7355] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-500 font-sans font-semibold text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 sm:py-3.5 px-4 sm:px-6 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
            >
              {authLoading
                ? 'Authenticating...'
                : 'Authenticate & Enter Console ↗'}
            </button>
          </form>
        </div>

        <div className="max-w-6xl w-full mx-auto border-t border-[#333333] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono font-bold text-xs text-[#8c7355]">
          <span>SWISS INDUSTRIAL CMS &amp; ADMIN SYSTEM v2.5</span>
          <span>
            MODE:{' '}
            {dbMode === 'supabase'
              ? 'SUPABASE REAL-TIME'
              : 'LOCAL + FALLBACK STORE'}
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER 2: AUTHENTICATED FULL CMS DASHBOARD
  // ==========================================================================
  return (
    <div className="theme-admin min-h-screen bg-[#181818] text-[#fcfbf9] flex flex-col transition-colors duration-200">
      {/* Top Industrial Header */}
      <header className="sticky top-0 z-40 bg-[#181818]/95 backdrop-blur-md border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-20 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#8c7355] text-[#181818] flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0">
              IH
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-display font-bold text-sm sm:text-lg text-[#fcfbf9]">
                  ADMIN CONSOLE
                </span>
                <span
                  className={`text-[10px] sm:text-xs px-2 py-0.5 font-mono font-bold uppercase border ${
                    dbMode === 'supabase'
                      ? 'bg-[#16a34a]/20 text-[#16a34a] border-[#16a34a]'
                      : 'bg-[#8c7355]/20 text-[#d8d2c7] border-[#8c7355]'
                  }`}
                >
                  {dbMode === 'supabase' ? '● SUPABASE LIVE' : '● DYNAMIC STORE'}
                </span>
              </div>
              <div className="hidden sm:block font-mono font-semibold text-xs text-neutral-500 leading-snug">
                FULL PORTFOLIO CONTENT MANAGEMENT
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Bilingual Editor Switcher (ID | EN) — Pure Mode Switch */}
            <div
              className="inline-flex items-center border border-[#3a3835] bg-[#141414]"
              title="Ganti bahasa mode edit (teks tetap aman & tidak tertimpa otomatis kecuali ikon translate pada field diklik)"
            >
              <button
                type="button"
                onClick={() => handleSwitchEditLanguage('id')}
                className={`px-2.5 py-1.5 sm:py-2 font-mono font-bold text-xs uppercase transition-colors cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#8c7355] text-[#181818]'
                    : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => handleSwitchEditLanguage('en')}
                className={`px-2.5 py-1.5 sm:py-2 font-mono font-bold text-xs uppercase border-l border-[#3a3835] transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#8c7355] text-[#181818]'
                    : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
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
              className="inline-flex items-center justify-center p-1.5 sm:p-2 bg-[#222222] border border-[#3a3835] hover:border-[#8c7355] text-[#fcfbf9] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#8c7355]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8c7355]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                showToast('Data berhasil disinkronkan ulang.');
              }}
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 bg-[#222222] border border-[#3a3835] hover:border-[#fcfbf9] font-mono font-bold text-xs text-[#fcfbf9] cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-4 h-4 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <Link
              to="/"
              onClick={(e) => {
                if (isSectionDirty(activeTab)) {
                  e.preventDefault();
                  requestLeave(() => navigate('/'));
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[#222222] border border-[#3a3835] hover:border-[#8c7355] font-mono font-bold text-xs text-[#fcfbf9] uppercase cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#8c7355]" />
              <span className="hidden md:inline">View Live Site ↗</span>
              <span className="md:hidden">Live ↗</span>
            </Link>

            <button
              type="button"
              onClick={() => requestLeave(handleLogout)}
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-3.5 sm:py-2 bg-red-950/70 border border-red-700 hover:bg-red-800 font-mono font-bold text-xs text-red-100 uppercase cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        {/* Left Sidebar Navigation (3 Cols) */}
        <aside className="lg:col-span-3 space-y-4 sm:space-y-4 sm:space-y-6">
          <div className="border border-[#333333] bg-[#1f1f1f]">
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-[#333333] font-mono font-bold text-[10px] sm:text-xs text-[#8c7355] uppercase tracking-wider">
              SECTION EDITORS (08)
            </div>
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible divide-x lg:divide-x-0 lg:divide-y divide-[#2c2c2c] no-scrollbar">
              {ADMIN_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.id === activeTab) return;
                      requestLeave(() => setActiveTab(tab.id));
                    }}
                    className={`w-auto lg:w-full shrink-0 px-3 py-2 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#fcfbf9] text-[#181818]'
                        : 'text-[#d8d2c7] hover:bg-[#262626] hover:text-[#fcfbf9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#181818]' : 'text-[#8c7355]'
                        }`}
                      />
                      <div>
                        <span className="hidden lg:block font-mono font-bold text-[10px] opacity-75">
                          MODULE // {tab.index}
                        </span>
                        <span className="font-sans font-bold text-xs sm:text-sm whitespace-nowrap">
                          {tab.label}
                        </span>
                      </div>
                    </div>

                    {tab.id === 'messages' && unreadCount > 0 && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-[#16a34a] text-[#fcfbf9] font-mono font-bold">
                        {unreadCount}
                      </span>
                    )}
                    {dirtyTabs.includes(tab.id) && (
                      <span
                        title="Ada perubahan yang belum disimpan"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500 text-[#181818] font-mono font-bold uppercase animate-pulse"
                      >
                        ● Unsaved
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Telemetry Counters */}
          <div className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-5 space-y-3 sm:space-y-4">
            <div className="font-mono font-bold text-[10px] sm:text-xs text-[#8c7355] uppercase tracking-wider">
              DATABASE TELEMETRY
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-[#141414] border border-[#2c2c2c]">
                <div className="font-mono font-bold text-base sm:text-xl text-[#fcfbf9]">
                  {projects.length}
                </div>
                <div className="font-mono font-semibold text-[10px] sm:text-xs text-[#d8d2c7] truncate">
                  PROJECTS
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#141414] border border-[#2c2c2c]">
                <div className="font-mono font-bold text-base sm:text-xl text-[#fcfbf9]">
                  {experiences.length}
                </div>
                <div className="font-mono font-semibold text-[10px] sm:text-xs text-[#d8d2c7] truncate">
                  EXPERIENCES
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#141414] border border-[#2c2c2c]">
                <div className="font-mono font-bold text-base sm:text-xl text-[#fcfbf9]">
                  {skills.length}
                </div>
                <div className="font-mono font-semibold text-[10px] sm:text-xs text-[#d8d2c7] truncate">
                  SKILLS
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#141414] border border-[#2c2c2c]">
                <div className="font-mono font-bold text-base sm:text-xl text-[#16a34a]">
                  {messages.length}
                </div>
                <div className="font-mono font-semibold text-[10px] sm:text-xs text-[#d8d2c7] truncate">
                  MESSAGES
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await seedDefaultData();
                showToast('Seluruh konten & data default berhasil di-reset.');
              }}
              className="w-full py-2 px-3 sm:py-2.5 bg-[#141414] border border-[#3a3835] hover:border-[#8c7355] font-mono font-bold text-xs text-[#d8d2c7] hover:text-[#fcfbf9] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#8c7355]" />
              <span>Reset / Seed Default Data</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area (9 Cols) */}
        <section className="lg:col-span-9 space-y-5 sm:space-y-4 sm:space-y-6">
          {/* Per-Field Translation & Change Indicator Banner */}
          <div className="border border-[#8c7355]/70 bg-[#1a1815] px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <div className="text-[10px] sm:text-xs px-2 py-0.5 bg-[#8c7355] text-[#181818] font-mono font-bold uppercase tracking-wider shrink-0">
                {`MODE EDIT: ${language.toUpperCase()}`}
              </div>
              <p className="font-sans font-medium text-xs sm:text-sm text-neutral-500 leading-snug">
                {language === 'id'
                  ? 'Mode Bahasa Indonesia (ID). Mengganti bahasa tidak akan mengubah teks secara otomatis. Jika ada perubahan di bahasa EN, akan muncul tanda "● Berubah di EN" pada field terkait — klik ikon translate di sebelah kanan field jika ingin menerjemahkannya.'
                  : 'English (EN) Edit Mode. Switching languages keeps your text untouched. Fields modified in ID will display a "● Berubah di ID" badge — click the field’s translate icon only when you want to translate from ID.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchEditLanguage('id')}
                className={`px-3 py-1.5 font-mono font-bold text-xs uppercase border cursor-pointer ${
                  language === 'id'
                    ? 'bg-[#fcfbf9] text-[#181818] border-[#fcfbf9]'
                    : 'bg-[#141414] text-[#d8d2c7] border-[#3a3835] hover:border-[#8c7355]'
                }`}
              >
                Mode ID
              </button>
              <button
                type="button"
                onClick={() => handleSwitchEditLanguage('en')}
                className={`px-3 py-1.5 font-mono font-bold text-xs uppercase border cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#fcfbf9] text-[#181818] border-[#fcfbf9]'
                    : 'bg-[#141414] text-[#d8d2c7] border-[#3a3835] hover:border-[#8c7355]'
                }`}
              >
                Mode EN
              </button>
            </div>
          </div>

          {/* Unsaved Changes Indicator for the Active Section */}
          {isSectionDirty(activeTab) && (
            <div
              role="alert"
              className="border border-amber-400 bg-amber-500/10 px-4 py-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5"
            >
              <span className="font-mono font-bold text-xs text-amber-300 uppercase tracking-wider">
                ● Section ini ada perubahan yang belum disimpan — klik Save sebelum pindah section / refresh.
              </span>
              <button
                type="button"
                onClick={() => revertSection(activeTab)}
                className="px-3 py-1.5 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-[#181818] font-mono font-bold text-xs uppercase cursor-pointer"
              >
                Batalkan Perubahan
              </button>
            </div>
          )}

          {/* ================================================================
              TAB 1: HOME & HERO SECTION EDITOR
          ================================================================ */}
          {activeTab === 'home' && (
            <form
              onSubmit={(e) => handleSaveSiteSection(e, 'Home & Hero')}
              className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-8 space-y-5 sm:space-y-8"
            >
              <div className="pb-5 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    01 / SECTION: NAVBAR &amp; HERO
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                    Edit Home &amp; Hero Content
                  </h2>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Home &amp; Hero</span>
                </button>
              </div>

              {/* Navbar Fields */}
              <div className="space-y-4">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  A. TOPBAR / NAVBAR IDENTITY
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    {renderFieldLabel('Brand Name (Logo)', 'navbar.brandName')}
                    <input
                      type="text"
                      value={draftContent.navbar?.brandName || ''}
                      onChange={(e) =>
                        updateSiteField('navbar.brandName', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Status & Metadata */}
              <div className="space-y-4 pt-6 border-t border-[#333333]">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  B. HERO STATUS &amp; HEADLINE
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-3">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Status Indicator
                    </label>
                    <select
                      value={
                        draftContent.hero?.available !== false ? 'true' : 'false'
                      }
                      onChange={(e) =>
                        updateSiteField(
                          'hero.available',
                          e.target.value === 'true',
                          true
                        )
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#16a34a] outline-none"
                    >
                      <option value="true">● Available (Green Pulse)</option>
                      <option value="false">● Busy / Booked (Bronze)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    {renderFieldLabel(
                      'Availability Banner Text',
                      'hero.statusText'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.statusText || ''}
                      onChange={(e) =>
                        updateSiteField('hero.statusText', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    {renderFieldLabel(
                      'Location Text (Right)',
                      'hero.locationText'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.locationText || ''}
                      onChange={(e) =>
                        updateSiteField('hero.locationText', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {renderFieldLabel(
                      'Edition Tag (Left Pill)',
                      'hero.editionBadge'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.editionBadge || ''}
                      onChange={(e) =>
                        updateSiteField('hero.editionBadge', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel(
                      'Archive Tag (Right Pill)',
                      'hero.archiveLabel'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.archiveLabel || ''}
                      onChange={(e) =>
                        updateSiteField('hero.archiveLabel', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {renderFieldLabel('Main Headline (H1 Name)', 'hero.name')}
                    <input
                      type="text"
                      value={draftContent.hero?.name || ''}
                      onChange={(e) =>
                        updateSiteField('hero.name', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-display font-bold text-base text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel(
                      'Calligraphic Subtitle (Roles - Pisahkan dengan koma)',
                      'hero.subtitle'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.subtitle || ''}
                      onChange={(e) =>
                        updateSiteField('hero.subtitle', e.target.value)
                      }
                      placeholder="Software Engineer, Full-Stack Developer, Visual Designer"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                    <p className="mt-1 text-[10px] font-mono text-neutral-400">
                      💡 Tip: Masukkan lebih dari 1 role dipisahkan koma (contoh: <code>Software Engineer, Full-Stack Developer, Visual Designer</code>) untuk animasi berganti otomatis!
                    </p>
                  </div>
                </div>

                <div>
                  {renderFieldLabel(
                    'Executive Summary (Hero Description)',
                    'hero.summary'
                  )}
                  <textarea
                    rows={3}
                    value={draftContent.hero?.summary || ''}
                    onChange={(e) =>
                      updateSiteField('hero.summary', e.target.value)
                    }
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              {/* Hero Right Stamp & CTAs */}
              <div className="space-y-4 pt-6 border-t border-[#333333]">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  C. TECHNICAL STAMP, CTA BUTTONS &amp; DISCIPLINE PILLS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    {renderFieldLabel('Stamp Header', 'hero.stampTitle')}
                    <input
                      type="text"
                      value={draftContent.hero?.stampTitle || ''}
                      onChange={(e) =>
                        updateSiteField('hero.stampTitle', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    {renderFieldLabel(
                      'Stamp Description',
                      'hero.stampDescription'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.stampDescription || ''}
                      onChange={(e) =>
                        updateSiteField('hero.stampDescription', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {renderFieldLabel(
                      'Primary CTA Button Label',
                      'hero.primaryCtaText'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.primaryCtaText || ''}
                      onChange={(e) =>
                        updateSiteField('hero.primaryCtaText', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel(
                      'Secondary CTA Button Label',
                      'hero.secondaryCtaText'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.secondaryCtaText || ''}
                      onChange={(e) =>
                        updateSiteField('hero.secondaryCtaText', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    {renderFieldLabel('Repository Label', 'hero.githubLabel')}
                    <input
                      type="text"
                      value={draftContent.hero?.githubLabel || ''}
                      onChange={(e) =>
                        updateSiteField('hero.githubLabel', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Repository URL
                    </label>
                    <input
                      type="url"
                      value={draftContent.hero?.githubUrl || ''}
                      onChange={(e) =>
                        updateSiteField('hero.githubUrl', e.target.value, true)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel(
                      'Academic Affiliation',
                      'hero.affiliation'
                    )}
                    <input
                      type="text"
                      value={draftContent.hero?.affiliation || ''}
                      onChange={(e) =>
                        updateSiteField('hero.affiliation', e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Discipline Pills (Add / Remove + Per-Pill Translate Trigger) */}
                <div className="pt-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block font-mono font-bold text-xs text-[#d8d2c7] uppercase">
                      Discipline Pills Under Hero Summary (
                      {(draftContent.hero?.disciplines || []).length} Items)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = draftContent.hero?.disciplines || [];
                        const nextNum = String(current.length + 1).padStart(
                          2,
                          '0'
                        );
                        setBilingualDrafts((prev) => {
                          const idList = prev.id?.hero?.disciplines || [];
                          const enList = prev.en?.hero?.disciplines || [];
                          return {
                            ...prev,
                            id: {
                              ...prev.id,
                              hero: {
                                ...prev.id?.hero,
                                disciplines: [
                                  ...idList,
                                  {
                                    code: `${nextNum} / NEW`,
                                    label: 'Keahlian Baru',
                                  },
                                ],
                              },
                            },
                            en: {
                              ...prev.en,
                              hero: {
                                ...prev.en?.hero,
                                disciplines: [
                                  ...enList,
                                  {
                                    code: `${nextNum} / NEW`,
                                    label: 'New Discipline',
                                  },
                                ],
                              },
                            },
                          };
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8c7355] text-[#181818] hover:bg-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Discipline Pill</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(draftContent.hero?.disciplines || []).map((pill, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#141414] border border-[#3a3835] space-y-2"
                      >
                        {renderFieldLabel(
                          `Pill #${idx + 1} Label`,
                          `hero.disciplines.${idx}.label`
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pill.code}
                            placeholder="01 / SWE"
                            onChange={(e) =>
                              updateSiteField(
                                `hero.disciplines.${idx}.code`,
                                e.target.value,
                                true
                              )
                            }
                            className="w-24 px-2 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-mono font-bold text-xs text-[#8c7355] outline-none"
                          />
                          <input
                            type="text"
                            value={pill.label}
                            placeholder="Label keahlian..."
                            onChange={(e) =>
                              updateSiteField(
                                `hero.disciplines.${idx}.label`,
                                e.target.value
                              )
                            }
                            className="flex-1 min-w-0 px-2 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-sans font-semibold text-xs text-[#fcfbf9] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBilingualDrafts((prev) => ({
                                ...prev,
                                id: {
                                  ...prev.id,
                                  hero: {
                                    ...prev.id?.hero,
                                    disciplines: (
                                      prev.id?.hero?.disciplines || []
                                    ).filter((_, i) => i !== idx),
                                  },
                                },
                                en: {
                                  ...prev.en,
                                  hero: {
                                    ...prev.en?.hero,
                                    disciplines: (
                                      prev.en?.hero?.disciplines || []
                                    ).filter((_, i) => i !== idx),
                                  },
                                },
                              }));
                            }}
                            title="Remove Discipline Pill"
                            className="p-1.5 bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-800 hover:text-white transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              TAB 2: ABOUT ME & METRICS EDITOR
          ================================================================ */}
          {activeTab === 'about' && (
            <form
              onSubmit={(e) => handleSaveSiteSection(e, 'About & Metrics')}
              className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-8 space-y-5 sm:space-y-8"
            >
              <div className="pb-5 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    02 / SECTION: 01 / ABOUT ME
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                    Edit Biography &amp; Key Metrics
                  </h2>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save About Section</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('Section Heading (Main Serif)', 'about.headingMain')}
                  <input
                    type="text"
                    value={draftContent.about?.headingMain || ''}
 onChange={(e) => updateSiteField('about.headingMain', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
                <div>
                  {renderFieldLabel('Section Heading (Calligraphic Italic)', 'about.headingAccent')}
                  <input
                    type="text"
                    value={draftContent.about?.headingAccent || ''}
 onChange={(e) => updateSiteField('about.headingAccent', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              <div>
                {renderFieldLabel('Biographical Paragraph 1', 'about.paragraph1')}
                <textarea
                  rows={4}
                  value={draftContent.about?.paragraph1 || ''}
 onChange={(e) => updateSiteField('about.paragraph1', e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                />
              </div>

              <div>
                {renderFieldLabel('Biographical Paragraph 2', 'about.paragraph2')}
                <textarea
                  rows={4}
                  value={draftContent.about?.paragraph2 || ''}
 onChange={(e) => updateSiteField('about.paragraph2', e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                />
              </div>

              <div>
                {renderFieldLabel('Editorial Callout Quote', 'about.quote')}
                <input
                  type="text"
                  value={draftContent.about?.quote || ''}
 onChange={(e) => updateSiteField('about.quote', e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('Institution & Major', 'about.institution')}
                  <input
                    type="text"
                    value={draftContent.about?.institution || ''}
 onChange={(e) => updateSiteField('about.institution', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
                <div>
                  {renderFieldLabel('Base of Operations (Location)', 'about.location')}
                  <input
                    type="text"
                    value={draftContent.about?.location || ''}
 onChange={(e) => updateSiteField('about.location', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Key Highlight Metrics (Add / Remove + GitHub Repo Sync) */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                      KEY HIGHLIGHTS &amp; METRICS CARDS (
                      {(draftContent.about?.metrics || []).length} CARDS)
                    </h3>
                    <p className="font-sans font-medium text-xs text-[#d8d2c7]/80 mt-0.5">
                      Tambah/kurangi kartu metrik secara bebas. Kartu bertopik proyek dilengkapi tombol sinkronisasi repositori GitHub (`rtwone`).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateArrayBoth('about.metrics', (list, lang) => {
                        const letter = String.fromCharCode(65 + list.length);
                        return [
                          ...list,
                          {
                            index: `01.${letter}`,
                            value: '10+',
                            label:
                              lang === 'id'
                                ? 'Metrik Pencapaian Baru'
                                : 'New Achievement Metric',
                            detail:
                              lang === 'id'
                                ? 'Deskripsi singkat mengenai pencapaian atau indikator teknis.'
                                : 'Brief description regarding this technical milestone or indicator.',
                          },
                        ];
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8c7355] text-[#181818] hover:bg-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Metric Card</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(draftContent.about?.metrics || []).map((metric, idx) => {
                    const isProjectMetric =
                      metric.syncGithub === true ||
                      (metric.syncGithub !== false &&
                        (idx === 0 ||
                          metric.index === '01.A' ||
                          /proyek|project|repo/i.test(metric.label || '')));

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-[#141414] border border-[#3a3835] space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2c2c2c]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#8c7355]">
                                CARD #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={metric.index || ''}
                                placeholder="01.A"
                                onChange={(e) => {
                                  const updated = [
                                    ...(draftContent.about?.metrics || []),
                                  ];
                                  updated[idx] = {
                                    ...updated[idx],
                                    index: e.target.value,
                                  };
                                  setDraftContent((prev) => ({
                                    ...prev,
                                    about: { ...prev.about, metrics: updated },
                                  }));
                                }}
                                className="w-16 px-2 py-0.5 bg-[#1f1f1f] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isProjectMetric && (
                                <button
                                  type="button"
                                  disabled={syncingGithubIdx === idx}
                                  onClick={async () => {
                                    setSyncingGithubIdx(idx);
                                    try {
                                      const latestCount =
                                        await syncGithubRepoCount('rtwone');
                                      const resolvedCount =
                                        typeof latestCount === 'number'
                                          ? latestCount
                                          : githubRepoCount;
                                      if (typeof resolvedCount === 'number') {
                                        const updated = [
                                          ...(draftContent.about?.metrics ||
                                            []),
                                        ];
                                        updated[idx] = {
                                          ...updated[idx],
                                          value: `${resolvedCount}`,
                                          syncGithub: true,
                                        };
                                        setDraftContent((prev) => ({
                                          ...prev,
                                          about: {
                                            ...prev.about,
                                            metrics: updated,
                                          },
                                        }));
                                        showToast(
                                          `Berhasil disinkronkan dengan GitHub @rtwone: ${resolvedCount} repositori publik!`
                                        );
                                      } else {
                                        showToast(
                                          'Gagal mengambil data dari API GitHub.',
                                          'error'
                                        );
                                      }
                                    } finally {
                                      setSyncingGithubIdx(null);
                                    }
                                  }}
                                  title="Sinkronkan nilai metrik ini dengan jumlah repositori publik GitHub @rtwone"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16a34a]/20 border border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-[#fcfbf9] font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${
                                      syncingGithubIdx === idx
                                        ? 'animate-spin'
                                        : ''
                                    }`}
                                  />
                                  <span>Sync GitHub Repos</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  updateArrayBoth('about.metrics', (list) =>
                                    list.filter((_, i) => i !== idx)
                                  )
                                }
                                title="Hapus Metric Card ini"
                                className="p-1.5 bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-800 hover:text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block font-mono font-bold text-[11px] text-[#d8d2c7] uppercase">
                                Big Metric Value (e.g. 23, 3+ Years)
                              </label>
                              {isProjectMetric && (
                                <span className="font-mono font-bold text-[10px] text-[#16a34a]">
                                  ● GitHub @rtwone ({githubRepoCount ?? 23}{' '}
                                  repos)
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={metric.value}
                              onChange={(e) => {
                                const updated = [
                                  ...(draftContent.about?.metrics || []),
                                ];
                                updated[idx] = {
                                  ...updated[idx],
                                  value: e.target.value,
                                  // Jika user mengetik manual nilai lain, matikan auto-override kecuali di-sync lagi
                                  syncGithub: false,
                                };
                                setDraftContent((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, metrics: updated },
                                }));
                              }}
                              className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3a3835] font-display font-bold text-base text-[#fcfbf9] outline-none"
                            />
                          </div>

                          <div>
                            {renderFieldLabel(
                              'Title Label',
                              `about.metrics.${idx}.label`
                            )}
                            <input
                              type="text"
                              value={metric.label}
                              onChange={(e) =>
                                updateSiteField(
                                  `about.metrics.${idx}.label`,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3a3835] font-sans font-semibold text-xs text-[#fcfbf9] outline-none"
                            />
                          </div>

                          <div>
                            {renderFieldLabel(
                              'Short Description',
                              `about.metrics.${idx}.detail`
                            )}
                            <input
                              type="text"
                              value={metric.detail}
                              onChange={(e) =>
                                updateSiteField(
                                  `about.metrics.${idx}.detail`,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3a3835] font-sans font-medium text-xs text-[#d8d2c7] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              TAB 3: MANAGE PROJECTS (HEADING + FULL CRUD)
          ================================================================ */}
          {activeTab === 'projects' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Section Heading Editor */}
              <form
                onSubmit={(e) => handleSaveSiteSection(e, 'Projects Heading')}
                className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    <div>
                      {renderFieldLabel('Projects Heading (Main)', 'projectsSection.headingMain')}
                      <input
                        type="text"
                        value={draftContent.projectsSection?.headingMain || ''}
 onChange={(e) => updateSiteField('projectsSection.headingMain', e.target.value)}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                        Projects Heading (Calligraphic Italic)
                      </label>
                      <input
                        type="text"
                        value={
                          draftContent.projectsSection?.headingAccent || ''
                        }
                        onChange={(e) =>
                          setDraftContent((prev) => ({
                            ...prev,
                            projectsSection: {
                              ...prev.projectsSection,
                              headingAccent: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#8c7355] text-[#181818] font-mono font-bold text-xs uppercase hover:bg-[#fcfbf9] transition-colors cursor-pointer"
                  >
                    Save Heading
                  </button>
                </div>
              </form>

              {/* Projects List CRUD */}
              <div className="border border-[#333333] bg-[#1f1f1f]">
                <div className="p-4 sm:p-6 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                      03 / TABLE: PUBLIC.PROJECTS
                    </span>
                    <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                      Manage Portfolio Projects
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateProjectModal}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </button>
                </div>

                <div className="divide-y divide-[#333333]">
                  {projects.map((proj, idx) => {
                    const techArray = Array.isArray(proj.tech_stack)
                      ? proj.tech_stack
                      : String(proj.tech_stack || '')
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean);

                    return (
                      <div
                        key={proj.id}
                        className="p-4 sm:p-6 hover:bg-[#242424] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 sm:p-6"
                      >
                        {/* 16:9 Thumbnail Preview in Admin List */}
                        <div className="w-full md:w-48 aspect-video bg-[#141414] border border-[#3a3835] overflow-hidden shrink-0">
                          {proj.image_url ? (
                            <img
                              src={proj.image_url}
                              alt={proj.title}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#8c7355]">
                              <ImageIcon className="w-5 h-5 mb-1" />
                              <span className="font-mono font-bold text-[10px]">
                                NO 16:9 PHOTO
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-2 py-0.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#8c7355]">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#8c7355]/20 border border-[#8c7355] font-mono font-bold text-xs text-[#fcfbf9]">
                              {proj.category}
                            </span>
                            <span className="font-mono font-bold text-xs text-[#d8d2c7]">
                              {proj.year}
                            </span>
                            {Array.isArray(proj.gallery_items) &&
                            proj.gallery_items.length > 0 ? (
                              <span className="px-2 py-0.5 bg-[#16a34a]/20 border border-[#16a34a] font-mono font-bold text-xs text-[#16a34a]">
                                CAROUSEL: {proj.gallery_items.length} DESIGNS (.WEBP)
                              </span>
                            ) : (
                              <span className="font-mono font-semibold text-xs text-[#16a34a]">
                                [16:9 WEBP PHOTO]
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-base sm:text-xl text-[#fcfbf9]">
                            {proj.title}
                          </h3>

                          <p className="font-sans font-medium text-sm text-[#d8d2c7] leading-relaxed">
                            {proj.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {techArray.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-[#141414] border border-[#333333] font-mono font-bold text-[11px] text-[#d8d2c7]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditProjectModal(proj)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#141414] border border-[#444444] hover:border-[#fcfbf9] font-mono font-bold text-xs text-[#fcfbf9] uppercase cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#8c7355]" />
                            <span>Edit</span>
                          </button>

                          {confirmDeleteProjectId === proj.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfirmDeleteProject(proj.id)
                                }
                                className="px-3 py-2 bg-red-600 text-white font-mono font-bold text-xs uppercase cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProjectId(null)}
                                className="px-2.5 py-2 bg-[#333333] text-[#fcfbf9] font-mono font-bold text-xs uppercase cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProjectId(proj.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-950/50 border border-red-800 hover:bg-red-800 font-mono font-bold text-xs text-red-200 uppercase cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: MANAGE EXPERIENCES & CORE COMPETENCY PILLARS
          ================================================================ */}
          {activeTab === 'experiences' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="border border-[#333333] bg-[#1f1f1f]">
                <div className="p-4 sm:p-6 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                      04 / TABLE: PUBLIC.EXPERIENCES
                    </span>
                    <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                      Manage Career &amp; Education
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateExpModal}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Experience</span>
                  </button>
                </div>

                <div className="divide-y divide-[#333333]">
                  {experiences.map((exp) => {
                    const bullets = Array.isArray(exp.description_bullets)
                      ? exp.description_bullets
                      : [exp.description_bullets].filter(Boolean);

                    return (
                      <div
                        key={exp.id}
                        className="p-4 sm:p-6 hover:bg-[#242424] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 sm:p-6"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2.5 py-0.5 font-mono font-bold text-xs uppercase ${
                                exp.type === 'education'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-700'
                                  : 'bg-[#8c7355]/20 text-[#fcfbf9] border border-[#8c7355]'
                              }`}
                            >
                              {exp.type === 'education' ? 'EDUCATION' : 'WORK'}
                            </span>
                            <span className="font-mono font-bold text-xs text-[#d8d2c7]">
                              {exp.period}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-base sm:text-xl text-[#fcfbf9]">
                            {exp.role}
                          </h3>
                          <div className="font-calligraphic font-bold italic text-base sm:text-xl text-[#8c7355]">
                            {exp.company}
                          </div>

                          {(!exp.sub_experiences || exp.sub_experiences.length === 0) ? (
                            <ul className="space-y-1 pt-1">
                              {bullets.map((b, i) => (
                                <li
                                  key={i}
                                  className="font-sans font-medium text-sm text-[#d8d2c7]"
                                >
                                  • {b}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="pt-1 flex items-center gap-2 text-xs font-mono text-[#8c7355]">
                              <span>✦ {exp.sub_experiences.length} Sub-experiences terdaftar (bullets dikelola per sub-role)</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditExpModal(exp)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#141414] border border-[#444444] hover:border-[#fcfbf9] font-mono font-bold text-xs text-[#fcfbf9] uppercase cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#8c7355]" />
                            <span>Edit</span>
                          </button>

                          {confirmDeleteExpId === exp.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteExp(exp.id)}
                                className="px-3 py-2 bg-red-600 text-white font-mono font-bold text-xs uppercase cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteExpId(null)}
                                className="px-2.5 py-2 bg-[#333333] text-[#fcfbf9] font-mono font-bold text-xs uppercase cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteExpId(exp.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-950/50 border border-red-800 hover:bg-red-800 font-mono font-bold text-xs text-red-200 uppercase cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Core Competencies Pillars */}
              <form
                onSubmit={(e) =>
                  handleSaveSiteSection(e, 'Core Competency Pillars')
                }
                className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#8c7355] uppercase">
                      RIGHT COLUMN // 03 CORE COMPETENCY PILLARS
                    </span>
                    <h3 className="font-display font-bold text-base sm:text-xl text-[#fcfbf9]">
                      Edit Pilar Keahlian Utama
                    </h3>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Pillars</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(draftContent.experienceSection?.competencies || []).map(
                    (comp, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#141414] border border-[#3a3835] space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                              Code
                            </label>
                            <input
                              type="text"
                              value={comp.code}
                              onChange={(e) => {
                                const updated = [
                                  ...(draftContent.experienceSection
                                    ?.competencies || []),
                                ];
                                updated[idx] = {
                                  ...updated[idx],
                                  code: e.target.value,
                                };
                                setDraftContent((prev) => ({
                                  ...prev,
                                  experienceSection: {
                                    ...prev.experienceSection,
                                    competencies: updated,
                                  },
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-mono font-bold text-xs text-[#8c7355] outline-none"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            {renderFieldLabel(
                              'Pillar Title',
                              `experienceSection.competencies.${idx}.title`
                            )}
                            <input
                              type="text"
                              value={comp.title}
                              onChange={(e) =>
                                updateSiteField(
                                  `experienceSection.competencies.${idx}.title`,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-sans font-bold text-sm text-[#fcfbf9] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          {renderFieldLabel(
                            'Description',
                            `experienceSection.competencies.${idx}.detail`
                          )}
                          <input
                            type="text"
                            value={comp.detail}
                            onChange={(e) =>
                              updateSiteField(
                                `experienceSection.competencies.${idx}.detail`,
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-sans font-medium text-xs text-[#d8d2c7] outline-none"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ================================================================
              TAB 5: MANAGE SKILLS & CATEGORY DESCRIPTIONS
          ================================================================ */}
          {activeTab === 'skills' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Skills Section Heading & Category Descriptions Editor */}
              <form
                onSubmit={(e) =>
                  handleSaveSiteSection(e, 'Skills Heading & Descriptions')
                }
                className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#8c7355] uppercase">
                      02 / SKILLS SECTION HEADINGS &amp; DESCRIPTIONS
                    </span>
                    <h3 className="font-display font-bold text-base sm:text-xl text-[#fcfbf9]">
                      Edit Judul &amp; Deskripsi Kategori Skill
                    </h3>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Texts</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {renderFieldLabel('Skills Heading (Main)', 'skillsSection.headingMain')}
                    <input
                      type="text"
                      value={draftContent.skillsSection?.headingMain || ''}
 onChange={(e) => updateSiteField('skillsSection.headingMain', e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel('Skills Heading (Calligraphic Italic)', 'skillsSection.headingAccent')}
                    <input
                      type="text"
                      value={draftContent.skillsSection?.headingAccent || ''}
 onChange={(e) => updateSiteField('skillsSection.headingAccent', e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    {renderFieldLabel('Kategori 01 Description', 'skillsSection.cat1Desc')}
                    <textarea
                      rows={2}
                      value={draftContent.skillsSection?.cat1Desc || ''}
 onChange={(e) => updateSiteField('skillsSection.cat1Desc', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#3a3835] font-sans font-medium text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel('Kategori 02 Description', 'skillsSection.cat2Desc')}
                    <textarea
                      rows={2}
                      value={draftContent.skillsSection?.cat2Desc || ''}
 onChange={(e) => updateSiteField('skillsSection.cat2Desc', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#3a3835] font-sans font-medium text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                  <div>
                    {renderFieldLabel('Kategori 03 Description', 'skillsSection.cat3Desc')}
                    <textarea
                      rows={2}
                      value={draftContent.skillsSection?.cat3Desc || ''}
 onChange={(e) => updateSiteField('skillsSection.cat3Desc', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#3a3835] font-sans font-medium text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>
              </form>

              {/* Add Skill Form */}
              <div className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-6">
                <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  05 / TABLE: PUBLIC.SKILLS
                </span>
                <h2 className="font-display font-bold text-lg sm:text-2xl text-[#fcfbf9] mt-1 mb-5">
                  Add Technical Competency
                </h2>

                <form
                  onSubmit={handleAddSkill}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-2">
                      Category
                    </label>
                    <select
                      value={skillForm.category}
                      onChange={(e) =>
                        setSkillForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    >
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-2">
                      Skill / Tool Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={skillForm.name}
                      onChange={(e) =>
                        setSkillForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Docker, PostgreSQL, Redis"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Skill</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Skills Grouped by Category */}
              <div className="grid grid-cols-1 gap-4 sm:p-6">
                {SKILL_CATEGORIES.map((category) => {
                  const catSkills = skills.filter(
                    (s) => s.category === category
                  );
                  return (
                    <div
                      key={category}
                      className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-6"
                    >
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#333333]">
                        <h3 className="font-display font-bold text-base sm:text-xl text-[#fcfbf9]">
                          {category}
                        </h3>
                        <span className="font-mono font-bold text-xs text-[#8c7355]">
                          {catSkills.length} ITEMS
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {catSkills.map((sk) => (
                          <div
                            key={sk.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9]"
                          >
                            <span>{sk.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(sk.id, sk.name)}
                              aria-label={`Remove ${sk.name}`}
                              className="text-[#8c7355] hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 6: CONTACT, SOCIAL MEDIA DIRECTORY & FOOTER EDITOR
          ================================================================ */}
          {activeTab === 'contact' && (
            <form
              onSubmit={(e) =>
                handleSaveSiteSection(e, 'Contact, Socials & Footer')
              }
              className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-8 space-y-5 sm:space-y-8"
            >
              <div className="pb-5 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    06 / SECTION: 05 / GET IN TOUCH &amp; FOOTER
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                    Edit Contact, Socials &amp; Footer
                  </h2>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Contact &amp; Footer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('Contact Heading (Main)', 'contact.headingMain')}
                  <input
                    type="text"
                    value={draftContent.contact?.headingMain || ''}
 onChange={(e) => updateSiteField('contact.headingMain', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
                <div>
                  {renderFieldLabel('Contact Heading (Calligraphic Italic)', 'contact.headingAccent')}
                  <input
                    type="text"
                    value={draftContent.contact?.headingAccent || ''}
 onChange={(e) => updateSiteField('contact.headingAccent', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                    Direct Email (Copy Email Box)
                  </label>
                  <input
                    type="email"
                    value={draftContent.contact?.email || ''}
                    onChange={(e) =>
                      setDraftContent((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
                <div className="sm:col-span-7">
                  {renderFieldLabel('Collaboration Invitation Paragraph', 'contact.description')}
                  <textarea
                    rows={2}
                    value={draftContent.contact?.description || ''}
 onChange={(e) => updateSiteField('contact.description', e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              {/* Social Links Directory Editor */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    SOCIAL MEDIA DIRECTORY LINKS
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = draftContent.contact?.socials || [];
                      const nextIndex = String(current.length + 1).padStart(
                        2,
                        '0'
                      );
                      setDraftContent((prev) => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          socials: [
                            ...current,
                            {
                              index: nextIndex,
                              platform: 'New Platform',
                              handle: '@username',
                              url: 'https://',
                            },
                          ],
                        },
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#141414] border border-[#8c7355] font-mono font-bold text-xs text-[#fcfbf9] hover:bg-[#8c7355] hover:text-[#181818] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Social Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(draftContent.contact?.socials || []).map((soc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#141414] border border-[#3a3835] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={soc.platform}
                          onChange={(e) => {
                            const updated = [
                              ...(draftContent.contact?.socials || []),
                            ];
                            updated[idx] = {
                              ...updated[idx],
                              platform: e.target.value,
                            };
                            setDraftContent((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, socials: updated },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-sans font-bold text-xs text-[#fcfbf9] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                          Handle / Label
                        </label>
                        <input
                          type="text"
                          value={soc.handle}
                          onChange={(e) => {
                            const updated = [
                              ...(draftContent.contact?.socials || []),
                            ];
                            updated[idx] = {
                              ...updated[idx],
                              handle: e.target.value,
                            };
                            setDraftContent((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, socials: updated },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                          Destination URL
                        </label>
                        <input
                          type="text"
                          value={soc.url}
                          onChange={(e) => {
                            const updated = [
                              ...(draftContent.contact?.socials || []),
                            ];
                            updated[idx] = {
                              ...updated[idx],
                              url: e.target.value,
                            };
                            setDraftContent((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, socials: updated },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (
                              draftContent.contact?.socials || []
                            ).filter((_, i) => i !== idx);
                            setDraftContent((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, socials: updated },
                            }));
                          }}
                          className="p-2 bg-red-950/60 border border-red-800 text-red-200 hover:bg-red-800 cursor-pointer"
                          title="Remove Social Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Subject / Inquiry Types Dropdown Editor */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                      CONTACT FORM SUBJECT / PROJECT TYPES (
                      {(draftContent.contact?.projectTypes || []).length} OPTIONS)
                    </h3>
                    <p className="font-sans font-medium text-xs text-[#d8d2c7]/80 mt-0.5">
                      Kelola daftar pilihan dropdown &ldquo;03. Subjek / Jenis Proyek&rdquo; pada formulir kontak.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateArrayBoth('contact.projectTypes', (list, lang) => {
                        const defaultLabel =
                          lang === 'id'
                            ? 'Layanan Proyek Baru'
                            : 'New Project Inquiry';
                        return [
                          ...list,
                          { value: defaultLabel, label: defaultLabel },
                        ];
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8c7355] text-[#181818] hover:bg-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Subject Option</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(draftContent.contact?.projectTypes || []).map(
                    (item, idx) => {
                      const labelVal =
                        typeof item === 'string' ? item : item.label || '';
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 bg-[#141414] border border-[#3a3835]"
                        >
                          <span className="font-mono font-bold text-xs text-[#8c7355] px-1.5">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0 space-y-1">
                            {renderFieldLabel(
                              'Subject',
                              `contact.projectTypes.${idx}.label`
                            )}
                            <input
                              type="text"
                              value={labelVal}
                              placeholder="Nama subjek / jenis proyek..."
                              onChange={(e) => {
                                updateSiteField(
                                  `contact.projectTypes.${idx}.label`,
                                  e.target.value
                                );
                                updateSiteField(
                                  `contact.projectTypes.${idx}.value`,
                                  e.target.value
                                );
                              }}
                              className="w-full px-3 py-1.5 bg-[#1f1f1f] border border-[#3a3835] font-sans font-semibold text-xs text-[#fcfbf9] outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateArrayBoth('contact.projectTypes', (list) =>
                                list.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1.5 bg-red-950/60 border border-red-800 text-red-200 hover:bg-red-800 cursor-pointer shrink-0"
                            title="Hapus Opsi Subjek"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Footer Texts */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  FOOTER TEXTS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {renderFieldLabel('Footer Copyright (Left)', 'footer.copyright')}
                    <input
                      type="text"
                      value={draftContent.footer?.copyright || ''}
 onChange={(e) => updateSiteField('footer.copyright', e.target.value)}
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              TAB 7: SEO, SOCIAL SHARE (OPENGRAPH) & META TAGS
          ================================================================ */}
          {activeTab === 'seo' && (
            <form
              onSubmit={(e) => handleSaveSiteSection(e, 'SEO & Social Share')}
              className="border border-[#333333] bg-[#1f1f1f] p-4 sm:p-8 space-y-5 sm:space-y-8"
            >
              <div className="pb-5 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    07 / SECTION: SEO &amp; OPENGRAPH METADATA
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                    SEO &amp; Social Share Configuration
                  </h2>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#8c7355] hover:text-[#fcfbf9] transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save SEO Settings</span>
                </button>
              </div>

              {/* A. Bilingual SEO Title & Description */}
              <div className="space-y-4">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  A. DUAL-LANGUAGE SEO TITLE &amp; DESCRIPTION ({language.toUpperCase()})
                </h3>

                <div>
                  {renderFieldLabel(
                    `SEO Meta Title (${language.toUpperCase()})`,
                    'seo.metaTitle'
                  )}
                  <input
                    type="text"
                    value={draftContent.seo?.metaTitle || ''}
                    onChange={(e) =>
                      updateSiteField('seo.metaTitle', e.target.value)
                    }
                    placeholder="Irfan Hariyanto — Software Engineer & Visual Designer"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1">
                      {renderFieldLabel(
                        `SEO Meta Description (${language.toUpperCase()})`,
                        'seo.metaDescription'
                      )}
                    </div>
                    {(() => {
                      const len = (draftContent.seo?.metaDescription || '').length;
                      const isIdeal = len >= 150 && len <= 160;
                      return (
                        <span
                          className={`font-mono font-bold text-[11px] mb-1.5 ${
                            isIdeal
                              ? 'text-[#16a34a]'
                              : len > 160
                              ? 'text-amber-400'
                              : 'text-[#d8d2c7]/70'
                          }`}
                        >
                          {len} / 160 chars {isIdeal ? '(IDEAL)' : '(Ideal: 150–160)'}
                        </span>
                      );
                    })()}
                  </div>
                  <textarea
                    rows={3}
                    value={draftContent.seo?.metaDescription || ''}
                    onChange={(e) =>
                      updateSiteField('seo.metaDescription', e.target.value)
                    }
                    placeholder="Deskripsi singkat portofolio untuk snippet Google Search & kartu sosial media..."
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-medium text-sm text-[#fcfbf9] outline-none"
                  />
                </div>
              </div>

              {/* B. Shared SEO Settings (Keywords, Canonical URL, Theme Color) */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  B. KEYWORDS, CANONICAL DOMAIN &amp; THEME COLOR
                </h3>

                <div>
                  <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                    Meta Keywords (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={draftContent.seo?.metaKeywords || ''}
                    onChange={(e) =>
                      updateSiteField('seo.metaKeywords', e.target.value, true)
                    }
                    placeholder="Irfan Hariyanto, Software Engineer, Visual Designer, ..."
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Canonical URL (Primary Live Domain)
                    </label>
                    <input
                      type="url"
                      value={draftContent.seo?.canonicalUrl || ''}
                      onChange={(e) =>
                        updateSiteField('seo.canonicalUrl', e.target.value, true)
                      }
                      placeholder="https://irfanhariyanto.com"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Browser Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftContent.seo?.themeColor || '#f7f5f0'}
                        onChange={(e) =>
                          updateSiteField('seo.themeColor', e.target.value, true)
                        }
                        className="h-10 w-12 bg-[#141414] border border-[#3a3835] cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={draftContent.seo?.themeColor || '#f7f5f0'}
                        onChange={(e) =>
                          updateSiteField('seo.themeColor', e.target.value, true)
                        }
                        placeholder="#f7f5f0"
                        className="flex-1 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* C. OpenGraph Image Upload & Live Social Card Preview */}
              <div className="pt-6 border-t border-[#333333] space-y-4">
                <h3 className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                  C. OPENGRAPH IMAGE (1200×630) &amp; SOCIAL SHARE PREVIEW
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:p-6 items-start">
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block font-mono font-bold text-xs text-[#d8d2c7] uppercase">
                        OG Image URL or Upload (Auto 1200 × 630 WebP)
                      </label>
                      <span className="font-mono text-[10px] text-[#8c7355]">
                        STANDARD RATIO 1.91:1
                      </span>
                    </div>
                    <input
                      type="text"
                      value={draftContent.seo?.ogImageUrl || ''}
                      onChange={(e) =>
                        updateSiteField('seo.ogImageUrl', e.target.value, true)
                      }
                      placeholder="https://.../og-cover.webp atau klik tombol upload di bawah"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Tombol Crop & Upload (Interaktif dengan rasio 1200x630) */}
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8c7355] hover:bg-[#fcfbf9] text-[#181818] font-mono font-bold text-xs uppercase cursor-pointer transition-colors shadow-sm">
                        <Crop className="w-3.5 h-3.5" />
                        <span>
                          {uploadingImage ? 'Memproses 1200×630 WebP...' : 'Pilih & Crop Foto (1200×630)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setOgRawImageSrc(reader.result);
                              setOgRawFileName(file.name);
                              setOgCropModalOpen(true);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Tombol Cepat: Auto-Fit Langsung */}
                      <label className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#141414] border border-[#3a3835] hover:border-[#8c7355] font-mono font-bold text-xs text-[#d8d2c7] hover:text-[#fcfbf9] uppercase cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#8c7355]" />
                        <span>Auto-Fit (Crop Tengah)</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage(true);
                            try {
                              const res = await uploadProjectImageAsWebP(file, {
                                folder: 'seo',
                                exactCrop: { width: 1200, height: 630 },
                              });
                              updateSiteField('seo.ogImageUrl', res.url, true);
                              showToast('OG Image otomatis di-crop tengah ke 1200×630 .webp!');
                            } catch (err) {
                              showToast(
                                err?.message || 'Gagal mengunggah OG Image',
                                'error'
                              );
                            } finally {
                              setUploadingImage(false);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {draftContent.seo?.ogImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateSiteField('seo.ogImageUrl', '', true)
                          }
                          className="px-3 py-2.5 bg-red-950/50 border border-red-800 text-red-200 font-mono font-bold text-xs uppercase cursor-pointer hover:bg-red-900 transition-colors"
                        >
                          Clear Image
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
                      💡 Klik <strong>&quot;Pilih &amp; Crop Foto&quot;</strong> untuk mengatur zoom, rotasi, dan posisi pemotongan foto secara manual sebelum diunggah. Output akhir selalu dipotong presisi berdimensi <strong>1200 × 630 px (.webp)</strong> agar kartu pratinjau tampil tajam &amp; pas di WhatsApp, LinkedIn, dan X.
                    </p>
                  </div>

                  {/* Simulated Social Share Card (WhatsApp / LinkedIn / X) */}
                  <div className="lg:col-span-6">
                    <div className="font-mono font-bold text-[10px] text-[#8c7355] uppercase tracking-wider mb-2">
                      LIVE CARD PREVIEW (WHATSAPP / LINKEDIN / X)
                    </div>
                    <div className="border border-[#3a3835] bg-[#141414] overflow-hidden">
                      <div className="aspect-[1200/630] bg-[#1a1815] border-b border-[#333333] flex items-center justify-center overflow-hidden">
                        {draftContent.seo?.ogImageUrl ? (
                          <img
                            src={draftContent.seo.ogImageUrl}
                            alt="OpenGraph Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 text-[#8c7355]">
                            <ImageIcon className="w-7 h-7 mx-auto mb-1.5 opacity-70" />
                            <div className="font-mono font-bold text-xs">
                              NO OG IMAGE SET (1200 × 630 PX)
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <div className="font-mono font-semibold text-[11px] text-[#8c7355] truncate uppercase">
                          {(
                            draftContent.seo?.canonicalUrl ||
                            window.location.origin
                          ).replace(/^https?:\/\//, '')}
                        </div>
                        <div className="font-sans font-bold text-sm text-[#fcfbf9] line-clamp-1">
                          {draftContent.seo?.metaTitle ||
                            'Irfan Hariyanto — Software Engineer & Visual Designer'}
                        </div>
                        <div className="font-sans font-medium text-xs text-[#d8d2c7]/80 line-clamp-2">
                          {draftContent.seo?.metaDescription ||
                            'No meta description configured.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              TAB 8: INBOX MESSAGES
          ================================================================ */}
          {activeTab === 'messages' && (
            <div className="border border-[#333333] bg-[#1f1f1f]">
              <div className="p-4 sm:p-6 border-b border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider">
                    08 / TABLE: PUBLIC.MESSAGES
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-3xl text-[#fcfbf9] mt-1">
                    Contact Form Inbox ({messages.length})
                  </h2>
                </div>
                <span className="font-mono font-bold text-xs text-[#16a34a]">
                  {unreadCount} UNREAD MESSAGES
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center font-mono font-bold text-sm text-[#d8d2c7]">
                  Belum ada pesan masuk di tabel messages.
                </div>
              ) : (
                <div className="divide-y divide-[#333333]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 sm:p-6 transition-colors ${
                        msg.is_read ? 'bg-[#1a1a1a]' : 'bg-[#24221f]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#333333]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {!msg.is_read && (
                            <span className="px-2 py-0.5 bg-[#16a34a] text-[#fcfbf9] font-mono font-bold text-[10px] uppercase">
                              NEW
                            </span>
                          )}
                          <span className="font-sans font-bold text-base text-[#fcfbf9]">
                            {msg.name}
                          </span>
                          <span className="font-mono font-semibold text-xs text-[#8c7355]">
                            &lt;{msg.email}&gt;
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs text-[#d8d2c7]">
                            {msg.subject}
                          </span>
                          <span className="font-mono font-semibold text-xs text-[#d8d2c7]/70">
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <p className="font-sans font-medium text-sm sm:text-base text-[#fcfbf9] leading-relaxed">
                        {msg.message}
                      </p>

                      <div className="mt-4 pt-3 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleMessageRead(msg.id, msg.is_read)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-[#444444] hover:border-[#fcfbf9] font-mono font-bold text-xs text-[#fcfbf9] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                          <span>
                            {msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          </span>
                        </button>

                        {confirmDeleteMsgId === msg.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteMessage(msg.id);
                                setConfirmDeleteMsgId(null);
                                showToast('Pesan berhasil dihapus.');
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white font-mono font-bold text-xs uppercase cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMsgId(null)}
                              className="px-2.5 py-1.5 bg-[#333333] text-[#fcfbf9] font-mono font-bold text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMsgId(msg.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 border border-red-800 hover:bg-red-800 font-mono font-bold text-xs text-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ====================================================================
          MODAL: CREATE / UPDATE PROJECT
      ==================================================================== */}
      <AnimatePresence>
        {projectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              className="w-full max-w-2xl border border-[#8c7355] bg-[#1f1f1f] text-[#fcfbf9] p-4 sm:p-8 my-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#333333]">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase">
                    {editingProject ? 'UPDATE RECORD' : 'CREATE RECORD'} //
                    PUBLIC.PROJECTS
                  </span>
                  <h3 className="font-display font-bold text-lg sm:text-2xl text-[#fcfbf9]">
                    {editingProject ? 'Edit Project' : 'Add New Project'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#3a3835] bg-[#141414]">
                    <button
                      type="button"
                                            onClick={() => handleSwitchEditLanguage('id')}
                      className={`px-2.5 py-1.5 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer ${
                        language === 'id'
                          ? 'bg-[#8c7355] text-[#181818]'
                          : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                                            onClick={() => handleSwitchEditLanguage('en')}
                      className={`px-2.5 py-1.5 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#8c7355] text-[#181818]'
                          : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={requestCloseProjectModal}
                    className="p-2 border border-[#444444] text-[#d8d2c7] hover:text-[#fcfbf9] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    {renderProjectFieldLabel('Project Title *', 'title')}
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => updateProjectLangField('title', e.target.value)}
                      placeholder="e.g. Chitanda Eru Bot"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Year *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.year}
                      onChange={(e) =>
                        setProjectForm((p) => ({ ...p, year: e.target.value }))
                      }
                      placeholder="2025"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-bold text-sm text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                    Category *
                  </label>
                  <select
                    value={projectForm.category}
                    onChange={(e) =>
                      setProjectForm((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 16:9 Project Photo Uploader (Auto Convert to .webp + Supabase Storage) */}
                <div className="p-4 bg-[#141414] border border-[#3a3835] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#8c7355] uppercase block">
                        PROJECT PHOTO (16:9 ASPECT RATIO — AUTO .WEBP)
                      </span>
                      <span className="font-sans font-medium text-xs text-[#d8d2c7]">
                        File .jpg/.png/.jpeg otomatis dikonversi ke .webp &amp; diupload ke Supabase Storage
                      </span>
                    </div>

                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingImage
                          ? 'Converting to .webp...'
                          : 'Upload Foto Proyek'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageSelect}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Conversion & Upload Telemetry */}
                  {uploadStats && (
                    <div className="p-2.5 bg-[#1f1f1f] border border-[#16a34a] flex flex-wrap items-center justify-between gap-2 font-mono font-bold text-xs">
                      <span className="text-[#16a34a]">
                        ✓ {uploadStats.fileName} (
                        {uploadStats.wasConverted
                          ? `Converted ${uploadStats.originalKB}KB → ${uploadStats.webpKB}KB .webp`
                          : `${uploadStats.webpKB}KB .webp`}
                        )
                      </span>
                      <span className="text-[#d8d2c7]">
                        {uploadStats.uploadedToSupabase
                          ? 'UPLOADED TO SUPABASE (.WEBP)'
                          : 'READY (.WEBP DATA)'}
                      </span>
                    </div>
                  )}

                  {/* 16:9 Live Preview + Optional Direct URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5 aspect-video bg-[#1f1f1f] border border-[#3a3835] overflow-hidden flex items-center justify-center">
                      {projectForm.image_url ? (
                        <img
                          src={projectForm.image_url}
                          alt="16:9 Preview"
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <span className="font-mono font-bold text-[10px] text-[#8c7355]">
                          16:9 PREVIEW EMPTY
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-7 space-y-2">
                      <label className="block font-mono font-bold text-[11px] text-[#d8d2c7] uppercase">
                        Atau Tempel URL Gambar (.webp) Secara Langsung
                      </label>
                      <input
                        type="text"
                        value={projectForm.image_url || ''}
                        onChange={(e) =>
                          setProjectForm((p) => ({
                            ...p,
                            image_url: e.target.value,
                          }))
                        }
                        placeholder="https://.../project-photo.webp"
                        className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3a3835] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* VISUAL DESIGN CAROUSEL GALLERY MANAGER (Original Size .webp + Title + Direct Post Link) */}
                {(projectForm.category === 'Visual Design' ||
                  (projectForm.gallery_items &&
                    projectForm.gallery_items.length > 0)) && (
                  <div className="p-4 bg-[#141414] border-2 border-[#8c7355] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#333333]">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#8c7355] uppercase block">
                          VISUAL DESIGN CAROUSEL GALLERY (ORIGINAL SIZE .WEBP)
                        </span>
                        <span className="font-sans font-medium text-xs text-[#d8d2c7]">
                          Upload banyak desain sekaligus (ukuran asli dipertahankan, otomatis .webp). Setiap desain memiliki Judul &amp; Link Postingan (Instagram/Sosmed).
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#8c7355] text-[#181818] hover:bg-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {uploadingGalleryImage
                              ? 'Converting .webp...'
                              : '+ Upload Desain (Bisa Banyak)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryImagesSelect}
                            disabled={uploadingGalleryImage}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleAddEmptyGallerySlide}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-[#1f1f1f] border border-[#444444] hover:border-[#fcfbf9] font-mono font-bold text-xs text-[#fcfbf9] uppercase cursor-pointer"
                          title="Tambah Slide via URL"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>URL</span>
                        </button>
                      </div>
                    </div>

                    {/* List of Carousel Slides */}
                    {(!projectForm.gallery_items ||
                      projectForm.gallery_items.length === 0) ? (
                      <div className="p-4 sm:p-6 text-center border border-dashed border-[#3a3835] bg-[#1a1a1a]">
                        <ImageIcon className="w-6 h-6 text-[#8c7355] mx-auto mb-2" />
                        <p className="font-mono font-bold text-xs text-[#d8d2c7] uppercase">
                          Belum ada item desain di Carousel ini
                        </p>
                        <p className="font-sans font-medium text-xs text-[#d8d2c7]/70 mt-1">
                          Klik tombol &ldquo;+ Upload Desain (Bisa Banyak)&rdquo; di atas untuk mengunggah poster, feed Instagram, atau karya desain dengan ukuran asli (.webp).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {projectForm.gallery_items.map((slide, idx) => (
                          <div
                            key={slide.id || idx}
                            className="p-3 bg-[#1f1f1f] border border-[#3a3835] grid grid-cols-1 sm:grid-cols-12 gap-3 items-start"
                          >
                            {/* Slide Thumbnail (Original Ratio Preview) */}
                            <div className="sm:col-span-3 bg-[#141414] border border-[#333333] h-28 flex flex-col items-center justify-center overflow-hidden relative">
                              {slide.image_url ? (
                                <img
                                  src={slide.image_url}
                                  alt={slide.title || `Design ${idx + 1}`}
                                  className="max-w-full max-h-full w-auto h-auto object-contain"
                                />
                              ) : (
                                <span className="font-mono font-bold text-[10px] text-[#8c7355]">
                                  NO IMAGE
                                </span>
                              )}
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#181818]/90 text-[#8c7355] font-mono font-bold text-[10px]">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              {slide.width && slide.height && (
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[#181818]/90 text-[#16a34a] font-mono font-bold text-[9px]">
                                  {slide.width}×{slide.height}
                                </span>
                              )}
                            </div>

                            {/* Slide Fields: Title, Post URL, Image URL */}
                            <div className="sm:col-span-8 space-y-2">
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <label className="block font-mono font-bold text-[10px] text-[#8c7355] uppercase">
                                      Judul Karya Desain #{idx + 1} *
                                    </label>
                                    {modalChangedFields[`proj.gallery.${idx}.title`] === (language === 'id' ? 'en' : 'id') && (
                                      <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold text-[10px] uppercase animate-pulse">
                                        ● Berubah di {language === 'id' ? 'EN' : 'ID'}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleTranslateGallerySlideTitle(idx)}
                                    disabled={translatingFieldKey === `proj.gallery.${idx}.title`}
                                    title="Terjemahkan judul dari bahasa lainnya"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#141414] text-[#8c7355] border border-[#3a3835] hover:border-[#8c7355] font-mono font-bold text-[10px] uppercase cursor-pointer"
                                  >
                                    <Languages className="w-3 h-3" />
                                    <span>{language === 'id' ? 'EN → ID' : 'ID → EN'}</span>
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={slide.title || ''}
                                  onChange={(e) =>
                                    handleUpdateGallerySlide(
                                      idx,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  placeholder="cth. Poster Seminar Nasional HIMATIKA 2024"
                                  className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-xs text-[#fcfbf9] outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                                    Link Postingan (Instagram / Sosmed)
                                  </label>
                                  <input
                                    type="url"
                                    value={slide.post_url || ''}
                                    onChange={(e) =>
                                      handleUpdateGallerySlide(
                                        idx,
                                        'post_url',
                                        e.target.value
                                      )
                                    }
                                    placeholder="https://instagram.com/p/..."
                                    className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-semibold text-[11px] text-[#fcfbf9] outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block font-mono font-bold text-[10px] text-[#d8d2c7] uppercase mb-1">
                                    URL Gambar (.webp)
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.image_url || ''}
                                    onChange={(e) =>
                                      handleUpdateGallerySlide(
                                        idx,
                                        'image_url',
                                        e.target.value
                                      )
                                    }
                                    placeholder="https://.../design.webp"
                                    className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-semibold text-[11px] text-[#fcfbf9] outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Delete Slide Button */}
                            <div className="sm:col-span-1 flex sm:flex-col items-end justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveGallerySlide(idx)}
                                className="p-2 bg-red-950/60 border border-red-800 hover:bg-red-800 text-red-200 cursor-pointer"
                                title="Hapus desain ini dari carousel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  {renderProjectFieldLabel('Description *', 'description')}
                  <textarea
                    rows={3}
                    required
                    value={projectForm.description}
                    onChange={(e) => updateProjectLangField('description', e.target.value)}
                    placeholder="Deskripsi teknis dan dampak proyek..."
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                    Tech Stack (Pisahkan dengan koma) *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.tech_stack}
                    onChange={(e) =>
                      setProjectForm((p) => ({
                        ...p,
                        tech_stack: e.target.value,
                      }))
                    }
                    placeholder="Next.js 15, TypeScript, Tailwind CSS, Supabase"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-bold text-xs text-[#fcfbf9] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Live Preview URL
                    </label>
                    <input
                      type="url"
                      value={projectForm.live_url}
                      onChange={(e) =>
                        setProjectForm((p) => ({
                          ...p,
                          live_url: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/irfanhariyanto"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Source Repository URL
                    </label>
                    <input
                      type="url"
                      value={projectForm.repo_url}
                      onChange={(e) =>
                        setProjectForm((p) => ({
                          ...p,
                          repo_url: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/irfanhariyanto"
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] focus:border-[#8c7355] font-mono font-semibold text-xs text-[#fcfbf9] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#333333] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={requestCloseProjectModal}
                    className="px-4 py-2.5 bg-[#141414] border border-[#444444] font-mono font-bold text-xs uppercase text-[#d8d2c7] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {editingProject ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL: CREATE / UPDATE EXPERIENCE
      ==================================================================== */}
      <AnimatePresence>
        {expModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              className="w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-[#8c7355] bg-[#1f1f1f] text-[#fcfbf9] p-4 sm:p-8 my-auto shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#333333]">
                <div>
                  <span className="font-mono font-bold text-xs text-[#8c7355] uppercase">
                    {editingExp ? 'UPDATE RECORD' : 'CREATE RECORD'} //
                    PUBLIC.EXPERIENCES
                  </span>
                  <h3 className="font-display font-bold text-lg sm:text-2xl text-[#fcfbf9]">
                    {editingExp
                      ? 'Edit Experience'
                      : 'Add Experience / Education'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#3a3835] bg-[#141414]">
                    <button
                      type="button"
                                            onClick={() => handleSwitchEditLanguage('id')}
                      className={`px-2.5 py-1.5 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer ${
                        language === 'id'
                          ? 'bg-[#8c7355] text-[#181818]'
                          : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                                            onClick={() => handleSwitchEditLanguage('en')}
                      className={`px-2.5 py-1.5 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#8c7355] text-[#181818]'
                          : 'text-[#d8d2c7] hover:text-[#fcfbf9]'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={requestCloseExpModal}
                    className="p-2 border border-[#444444] text-[#d8d2c7] hover:text-[#fcfbf9] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveExp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                      Record Type *
                    </label>
                    <select
                      value={expForm.type}
                      onChange={(e) =>
                        setExpForm((p) => ({ ...p, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                    >
                      <option value="work">Work / Organization</option>
                      <option value="education">Education</option>
                    </select>
                  </div>

                  {/* Periode Terpisah: Tahun Mulai & Tahun Selesai */}
                  {(!expForm.sub_experiences || expForm.sub_experiences.length === 0) ? (
                    <div>
                      <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase mb-1 sm:mb-1.5">
                        Tahun Periode *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            required
                            value={expForm.start_year || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExpForm((p) => {
                                const end = p.is_current ? 'Present' : (p.end_year || '');
                                return {
                                  ...p,
                                  start_year: val,
                                  period: end ? `${val} — ${end}` : val,
                                };
                              });
                            }}
                            placeholder="Mulai (e.g. 2024)"
                            className="w-full px-2.5 py-2 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs sm:text-sm text-[#fcfbf9] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            disabled={expForm.is_current}
                            required={!expForm.is_current}
                            value={expForm.is_current ? 'Sekarang' : (expForm.end_year || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExpForm((p) => ({
                                ...p,
                                end_year: val,
                                period: p.start_year ? `${p.start_year} — ${val}` : val,
                              }));
                            }}
                            placeholder="Selesai (e.g. 2025)"
                            className={`w-full px-2.5 py-2 bg-[#141414] border border-[#3a3835] font-mono font-bold text-xs sm:text-sm text-[#fcfbf9] outline-none ${
                              expForm.is_current ? 'opacity-60 cursor-not-allowed text-[#8c7355]' : ''
                            }`}
                          />
                          <label className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-[#d8d2c7] shrink-0 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!expForm.is_current}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setExpForm((p) => ({
                                  ...p,
                                  is_current: checked,
                                  end_year: checked ? 'Present' : '',
                                  period: p.start_year ? `${p.start_year} — ${checked ? 'Present' : ''}` : '',
                                }));
                              }}
                              className="accent-[#8c7355]"
                            />
                            <span>Aktif</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <label className="block font-mono font-bold text-[10px] sm:text-xs text-[#d8d2c7] uppercase">
                          Period (Auto Dihitung)
                        </label>
                        <span className="font-mono text-[10px] text-[#8c7355] font-semibold">
                          Dari Sub-Roles
                        </span>
                      </div>
                      <input
                        type="text"
                        disabled
                        value="Otomatis dihitung dari periode sub-experience"
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-mono font-bold text-sm text-[#8c857b] opacity-60 cursor-not-allowed outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  {renderExpFieldLabel('Company / Institution *', 'company')}
                  <input
                    type="text"
                    required
                    value={expForm.company}
                    onChange={(e) => updateExpLangField('company', e.target.value)}
                    placeholder="e.g. Universitas Wiraraja Sumenep"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                  />
                </div>

                {/* Role Utama: Disembunyikan / opsional jika sudah ada Sub-Experiences (seperti LinkedIn) */}
                {(!expForm.sub_experiences || expForm.sub_experiences.length === 0) ? (
                  <>
                    <div>
                      {renderExpFieldLabel('Role / Degree Title *', 'role')}
                      <input
                        type="text"
                        required
                        value={expForm.role}
                        onChange={(e) => updateExpLangField('role', e.target.value)}
                        placeholder="e.g. Freelance Software Engineer & Visual Designer"
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                      />
                    </div>

                    <div>
                      {renderExpFieldLabel('Description Bullets (Satu poin per baris) *', 'description_bullets')}
                      <textarea
                        rows={4}
                        required
                        value={expForm.description_bullets}
                        onChange={(e) => updateExpLangField('description_bullets', e.target.value)}
                        placeholder="Tulis deskripsi tanggung jawab atau fokus studi..."
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#141414] border border-[#3a3835] font-sans font-semibold text-sm text-[#fcfbf9] outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-[#181818] border border-[#2b2b2b] flex items-center justify-between text-xs text-[#d8d2c7]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8c7355]" />
                      <span>Mode LinkedIn aktif: Jabatan & Tanggung Jawab dikelola via <strong>Sub-Experiences</strong> di bawah.</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#8c7355] font-bold">
                      {expForm.sub_experiences.length} SUB-ROLES
                    </span>
                  </div>
                )}

                {/* Nested Sub-Experiences (LinkedIn Style) */}
                <div className="pt-3 border-t border-[#333333]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="block font-mono font-bold text-xs text-[#8c7355] uppercase">
                        SUB-EXPERIENCES // LINKEDIN STYLE
                      </span>
                      <p className="text-xs text-[#8c857b] font-medium">
                        Tambahkan multi-posisi/peran dalam satu institusi/perusahaan (opsional).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubExp}
                      className="px-3 py-1.5 bg-[#141414] hover:bg-[#8c7355] hover:text-[#181818] border border-[#3a3835] text-[#d8d2c7] font-mono font-bold text-xs uppercase transition-colors cursor-pointer"
                    >
                      + Add Sub-Role
                    </button>
                  </div>

                  {Array.isArray(expForm.sub_experiences) &&
                    expForm.sub_experiences.length > 0 && (
                      <div className="space-y-4">
                        {expForm.sub_experiences.map((sub, sIdx) => (
                          <div
                            key={sub.id || sIdx}
                            className="p-3.5 sm:p-4 bg-[#141414] border border-[#3a3835] relative group/subitem"
                          >
                            <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[#262626]">
                              <span className="font-mono font-bold text-[11px] text-[#8c7355]">
                                SUB-ROLE #{sIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubExp(sub.id)}
                                className="text-red-400 hover:text-red-300 font-mono text-xs uppercase cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                {renderSubExpFieldLabel(sub, 'Role Title *', 'role')}
                                <input
                                  type="text"
                                  required
                                  value={
                                    language === 'en'
                                      ? sub.role_en || sub.role
                                      : sub.role_id || sub.role
                                  }
                                  onChange={(e) =>
                                    handleUpdateSubExpField(
                                      sub.id,
                                      'role',
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. Lead Designer / Frontend Dev"
                                  className="w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#3a3835] text-xs font-sans text-[#fcfbf9] outline-none"
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-[10px] sm:text-[11px] text-[#d8d2c7] uppercase mb-1">
                                  Periode Tahun *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    required
                                    value={sub.start_year || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setExpForm((prev) => ({
                                        ...prev,
                                        sub_experiences: (prev.sub_experiences || []).map((s) => {
                                          if (s.id !== sub.id) return s;
                                          return {
                                            ...s,
                                            start_year: val,
                                          };
                                        }),
                                      }));
                                    }}
                                    placeholder="Mulai (e.g. 2024)"
                                    className="w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#3a3835] text-xs font-mono text-[#fcfbf9] outline-none"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      disabled={sub.is_current}
                                      required={!sub.is_current}
                                      value={sub.is_current ? 'Aktif / Sekarang' : (sub.end_year || '')}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setExpForm((prev) => ({
                                          ...prev,
                                          sub_experiences: (prev.sub_experiences || []).map((s) => {
                                            if (s.id !== sub.id) return s;
                                            return {
                                              ...s,
                                              end_year: val,
                                            };
                                          }),
                                        }));
                                      }}
                                      placeholder="Selesai (e.g. 2025)"
                                      className={`w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#3a3835] text-xs font-mono text-[#fcfbf9] outline-none ${
                                        sub.is_current ? 'opacity-60 cursor-not-allowed text-[#8c7355]' : ''
                                      }`}
                                    />
                                    <label className="flex items-center gap-1 font-mono text-[10px] text-[#d8d2c7] shrink-0 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={!!sub.is_current}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setExpForm((prev) => ({
                                            ...prev,
                                            sub_experiences: (prev.sub_experiences || []).map((s) => {
                                              if (s.id !== sub.id) return s;
                                              return {
                                                ...s,
                                                is_current: checked,
                                                end_year: checked ? 'Present' : '',
                                              };
                                            }),
                                          }));
                                        }}
                                        className="accent-[#8c7355]"
                                      />
                                      <span>Aktif</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              {renderSubExpFieldLabel(sub, 'Description Bullets *', 'description_bullets')}
                              <textarea
                                rows={2}
                                required
                                value={
                                  language === 'en'
                                    ? sub.description_bullets_en ||
                                      sub.description_bullets
                                    : sub.description_bullets_id ||
                                      sub.description_bullets
                                }
                                onChange={(e) =>
                                  handleUpdateSubExpField(
                                    sub.id,
                                    'description_bullets',
                                    e.target.value
                                  )
                                }
                                placeholder="Satu poin per baris..."
                                className="w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#3a3835] text-xs font-sans text-[#fcfbf9] outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="pt-4 border-t border-[#333333] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={requestCloseExpModal}
                    className="px-4 py-2.5 bg-[#141414] border border-[#444444] font-mono font-bold text-xs uppercase text-[#d8d2c7] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {editingExp ? 'Save Changes' : 'Add Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Unsaved-Changes Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeConfirmDialog}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeConfirmDialog();
            }}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-amber-400/70 bg-[#1f1f1f] text-[#fcfbf9] shadow-2xl"
            >
              <div className="h-1 w-full bg-amber-400" />
              <div className="p-4 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-amber-400/15 border border-amber-400/60">
                    <AlertTriangle
                      className="w-5 h-5 text-amber-300"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[10px] text-amber-300 uppercase tracking-widest">
                      UNSAVED CHANGES
                    </span>
                    <h3
                      id="confirm-dialog-title"
                      className="font-display font-bold text-base sm:text-xl text-[#fcfbf9] mt-0.5"
                    >
                      {confirmDialog.title}
                    </h3>
                    <p
                      id="confirm-dialog-desc"
                      className="mt-2 font-sans font-medium text-xs sm:text-sm text-[#d8d2c7] leading-relaxed"
                    >
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const action = confirmDialog.onConfirm;
                      closeConfirmDialog();
                      action?.();
                    }}
                    className="min-h-[44px] px-3 py-2 sm:px-5 sm:py-2.5 bg-red-950/60 border border-red-700 hover:bg-red-700 text-red-100 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {confirmDialog.confirmLabel}
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={closeConfirmDialog}
                    className="min-h-[44px] px-3 py-2 sm:px-5 sm:py-2.5 bg-[#fcfbf9] text-[#181818] hover:bg-amber-400 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {confirmDialog.cancelLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)] px-3 py-2.5 sm:px-5 sm:py-3.5 bg-[#fcfbf9] text-[#181818] border-2 border-[#8c7355] shadow-editorial flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-[#16a34a] shrink-0" />
            <span className="font-mono font-bold text-xs">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive OpenGraph Image Crop Modal (1200 x 630) */}
      <ImageCropModal
        isOpen={ogCropModalOpen}
        imageSrc={ogRawImageSrc}
        fileName={ogRawFileName}
        aspectRatio={1200 / 630}
        targetWidth={1200}
        targetHeight={630}
        onClose={() => {
          setOgCropModalOpen(false);
          setOgRawImageSrc(null);
        }}
        onConfirm={async (croppedFile, previewUrl) => {
          setOgCropModalOpen(false);
          setUploadingImage(true);
          try {
            // Langsung unggah file hasil crop ke Supabase Storage (atau dataURL fallback)
            const res = await uploadProjectImageAsWebP(croppedFile, {
              folder: 'seo',
              preserveOriginalDimensions: true, // Dimensi sudah pas 1200x630
            });
            updateSiteField('seo.ogImageUrl', res.url || previewUrl, true);
            showToast('OG Image berhasil dicrop presisi (1200×630) & diunggah!');
          } catch (err) {
            console.error('OG image upload error:', err);
            // Fallback preview
            updateSiteField('seo.ogImageUrl', previewUrl, true);
            showToast(err?.message || 'Gagal mengunggah foto ke storage, memakai preview lokal', 'error');
          } finally {
            setUploadingImage(false);
            setOgRawImageSrc(null);
          }
        }}
      />
    </div>
  );
}
