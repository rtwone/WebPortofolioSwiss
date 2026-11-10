/**
 * ============================================================================
 * SUPABASE CLIENT & DATABASE CONFIGURATION
 * ============================================================================
 *
 * CARA KONFIGURASI SUPABASE:
 * 1. Buat proyek baru di https://supabase.com/dashboard
 * 2. Buka menu "SQL Editor" -> "New Query", lalu salin & jalankan isi file `supabase/schema.sql`
 *    (atau skrip SQL di bawah ini).
 * 3. Buat file `.env` di root proyek dan isi:
 *      VITE_SUPABASE_URL=https://xxxx.supabase.co
 *      VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *      VITE_ADMIN_ACCESS_KEY=irfan-admin-2025
 *
 * ============================================================================
 * SQL SCHEMA RINGKAS (JALANKAN DI SUPABASE SQL EDITOR):
 * ============================================================================
 * CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 *
 * CREATE TABLE IF NOT EXISTS public.site_settings (
 *   id TEXT PRIMARY KEY DEFAULT 'main',
 *   content JSONB NOT NULL DEFAULT '{}'::jsonb,
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE IF NOT EXISTS public.projects (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   title TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   description TEXT NOT NULL,
 *   year TEXT NOT NULL DEFAULT '2025',
 *   tech_stack TEXT[] NOT NULL DEFAULT '{}',
 *   live_url TEXT DEFAULT '',
 *   repo_url TEXT DEFAULT '',
 *   mockup_type TEXT NOT NULL DEFAULT 'terminal',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE IF NOT EXISTS public.experiences (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   role TEXT NOT NULL,
 *   company TEXT NOT NULL,
 *   period TEXT NOT NULL,
 *   description_bullets TEXT[] NOT NULL DEFAULT '{}',
 *   type TEXT NOT NULL CHECK (type IN ('work', 'education')) DEFAULT 'work',
 *   order_index INTEGER NOT NULL DEFAULT 1,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE IF NOT EXISTS public.skills (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   category TEXT NOT NULL,
 *   name TEXT NOT NULL,
 *   proficiency_level TEXT NOT NULL DEFAULT 'Advanced',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE IF NOT EXISTS public.messages (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   name TEXT NOT NULL,
 *   email TEXT NOT NULL,
 *   subject TEXT NOT NULL,
 *   message TEXT NOT NULL,
 *   is_read BOOLEAN NOT NULL DEFAULT FALSE,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const viteEnv = import.meta.env || {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-public-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const ADMIN_SECRET_KEY =
  viteEnv.VITE_ADMIN_ACCESS_KEY || 'irfan-admin-2025';

// ============================================================================
// DEFAULT SITE CONTENT (NAVBAR, HERO, ABOUT, COMPETENCIES, CONTACT, FOOTER)
// Dapat diedit sepenuhnya dari /admin!
// ============================================================================

export const INITIAL_SITE_CONTENT = {
  // 00. Navbar & Hero Section
  navbar: {
    brandName: 'IRFAN HARIYANTO',
    badgeText: 'SWE & VISUAL DESIGN',
    ctaText: "Let's Talk",
  },
  hero: {
    available: true,
    statusText: 'AVAILABLE FOR FREELANCE & COLLABORATION',
    locationText: 'BASED IN SUMENEP, EAST JAVA — ID',
    editionBadge: 'EDITION // 2025',
    archiveLabel: 'ENGINEERING & VISUAL ARCHIVE',
    name: 'Irfan Hariyanto',
    subtitle:
      'Desainer Grafis, Spesialis Media Sosial, Pemrogram Pemula, Penggemar AI, Mahasiswa Aktif',
    summary:
      'Mahasiswa aktif Teknik Informatika di Universitas Wiraraja yang memadukan kreativitas desain grafis, strategi media sosial, eksplorasi pemrograman, dan antusiasme terhadap teknologi AI untuk menciptakan karya visual maupun digital yang bermakna.',
    stampLabel: 'DISCIPLINARY MATRIX',
    stampTitle: 'DESIGN × TECHNOLOGY',
    stampDescription:
      'Harmoni estetika visual kreatif, strategi media sosial, dan eksplorasi logika komputasi.',
    primaryCtaText: 'Explore Selected Works ↓',
    secondaryCtaText: 'Contact / Collaboration ↗',
    githubLabel: 'github.com/rtwone',
    githubUrl: 'https://github.com/rtwone',
    affiliation: 'UNIVERSITAS WIRARAJA',
    disciplines: [
      { code: 'DES-01', label: 'Graphic Design & Visual Identity' },
      { code: 'SOC-02', label: 'Social Media Content & Strategy' },
      { code: 'DEV-03', label: 'Novice Programming & Web Tech' },
      { code: 'AI-04', label: 'AI Exploration & Modern Workflows' },
    ],
  },

  // 01. About Me Section
  about: {
    headingMain: 'Bridging Visual Creativity',
    headingAccent: 'with Technology & AI',
    dossierLabel: 'BIOGRAPHICAL DOSSIER // IRFAN HARIYANTO',
    dossierCode: '',
    paragraph1:
      'Saya adalah mahasiswa aktif S1 Teknik Informatika di Universitas Wiraraja (Sumenep) yang mendedikasikan waktu dan minat pada persimpangan antara estetika desain grafis, strategi media sosial, serta perkembangan dunia komputasi dan kecerdasan buatan (AI). Berangkat dari kecintaan merancang identitas visual yang komunikatif dan tata kelola media sosial yang memikat, saya terus memperluas keahlian ke ranah pemrograman web dan teknologi masa depan.',
    paragraph2:
      'Dalam setiap proses berkarya, saya memadukan kepekaan tipografi, komposisi warna, dan riset audiens dengan eksperimen kode serta alur kerja berbantuan AI untuk mencapai hasil yang efisien dan berkualitas tinggi. Baik saat merancang materi branding, mengelola akun sosial media organisasi, maupun mengeksplorasi kode program, fokus saya adalah menyajikan solusi visual dan digital yang estetik, solutif, dan berdampak nyata.',
    quote:
      'Desain visual memberi jiwa dan daya tarik; logika teknologi dan AI membuka peluang masa depan tanpa batas.',
    institution: 'S1 Teknik Informatika — Universitas Wiraraja (Aktif)',
    location: 'Sumenep, Jawa Timur — Indonesia',
    metrics: [
      {
        index: '01.A',
        value: '23',
        syncGithub: true,
        label: 'Proyek Publik di Repositori GitHub',
        detail: 'Repositori kode & eksplorasi proyek open-source publik terindeks realtime.',
      },
      {
        index: '01.B',
        value: '5+ Tahun',
        label: 'Dedikasi Desain Grafis & Pemrograman',
        detail: 'Eksplorasi konsisten dalam merancang visual kreatif dan mempelajari dunia pemrograman sejak 2020.',
      },
      {
        index: '01.C',
        value: 'AI Driven',
        label: 'Eksplorasi & Pemanfaatan AI Modern',
        detail: 'Mengintegrasikan tools AI untuk efisiensi workflow kreatif dan teknologi.',
      },
      {
        index: '01.D',
        value: 'Mahasiswa',
        label: 'Aktif S1 Informatika di Universitas Wiraraja',
        detail: 'Menyeimbangkan dunia akademik, eksplorasi teknologi, dan karya kreatif.',
      },
    ],
  },

  // 02. Skills Section Headings & Category Descriptions
  skillsSection: {
    headingMain: 'Technical Arsenal &',
    headingAccent: 'Creative Tools',
    cat1Desc:
      'Fondasi penulisan logika pemrograman, struktur dokumen, dan kueri basis data.',
    cat2Desc:
      'Ekosistem modern untuk membangun aplikasi web reaktif, API, dan bot otomatis.',
    cat3Desc:
      'Peralatan manajemen data, kontrol versi, serta perancangan antarmuka dan grafis.',
  },

  // 03. Projects Section Headings
  projectsSection: {
    headingMain: 'Selected Works &',
    headingAccent: 'Digital Products',
  },

  // 04. Experience Section Headings & Core Competency Pillars
  experienceSection: {
    headingMain: 'Career Journey &',
    headingAccent: 'Academic Background',
    competencies: [
      {
        code: 'FOCUS // 01',
        title: 'Full-Stack Web Architecture',
        detail:
          'Perancangan aplikasi web modern menggunakan React.js, Next.js 15, TypeScript, Laravel, dan RESTful API dengan fokus pada skalabilitas serta performa.',
      },
      {
        code: 'FOCUS // 02',
        title: 'Automated Messaging Systems',
        detail:
          'Pengembangan ekosistem bot WhatsApp multi-device berbasis Node.js & Baileys MD dengan arsitektur plugin cepat dan manajemen sesi otomatis.',
      },
      {
        code: 'FOCUS // 03',
        title: 'UI/UX & Editorial Graphic Design',
        detail:
          'Penyusunan sistem identitas visual, tata letak tipografi Swiss Grid, serta desain komunikasi visual untuk organisasi dan produk digital.',
      },
    ],
  },

  // 05. Contact & Footer Section
  contact: {
    headingMain: "Let's Build Something",
    headingAccent: 'Meaningful Together',
    description:
      'Terbuka untuk kolaborasi karya desain grafis, pengelolaan konten & strategi media sosial, perancangan identitas visual brand, serta eksplorasi proyek pemrograman dan kecerdasan buatan (AI).',
    email: 'halo@irfanhariyanto.my.id',
    projectTypes: [
      { value: 'Visual Design', label: 'Graphic & Visual Design' },
      { value: 'Social Media', label: 'Social Media Management & Strategy' },
      { value: 'Web Development', label: 'Web Programming & Development' },
      { value: 'AI Exploration', label: 'AI & Creative Collaboration' },
      { value: 'Other', label: 'Other Inquiry' },
    ],
    socials: [
      {
        index: '01',
        platform: 'GitHub',
        handle: 'github.com/rtwone',
        url: 'https://github.com/rtwone',
      },
      {
        index: '02',
        platform: 'LinkedIn',
        handle: 'linkedin.com/in/irfanhariyanto',
        url: 'https://linkedin.com/in/irfanhariyanto',
      },
      {
        index: '03',
        platform: 'Instagram',
        handle: 'instagram.com/irfvnny',
        url: 'https://instagram.com/irfvnny',
      },
    ],
  },
  footer: {
    copyright: '© 2025 IRFAN HARIYANTO. ALL RIGHTS RESERVED.',
    edition: '',
  },
  seo: {
    metaTitle: 'Irfan Hariyanto — Graphic Designer & Creative Tech',
    metaDescription:
      'Irfan Hariyanto — Desainer Grafis, Spesialis Media Sosial, Pemrogram Pemula, Penggemar AI, dan Mahasiswa Aktif Teknik Informatika di Universitas Wiraraja.',
    metaKeywords:
      'Irfan Hariyanto, Desainer Grafis, Social Media Specialist, Universitas Wiraraja, AI Enthusiast, Sumenep, rtwone',
    ogImageUrl: '',
    canonicalUrl: 'https://irfanhariyanto.my.id',
    themeColor: '#f7f5f0',
  },
};

// ============================================================================
// DEFAULT FALLBACK / SEED DATA FOR TABLES
// ============================================================================

export const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    title: 'RSUD System',
    category: 'Development',
    year: '2026',
    description:
      'Mengembangkan sistem manajemen rumah sakit (RSUD System) berbasis desktop menggunakan C# Windows Forms. Aplikasi dirancang untuk mengelola alur operasional layanan kesehatan secara terintegrasi, termasuk manajemen data pasien, rekam medis, dan pencatatan administrasi rumah sakit dengan antarmuka yang andal.',
    tech_stack: ['C#', 'WinForms', 'MySQL', 'XAMPP'],
    live_url: 'https://github.com/rtwone/RSUD-SYSTEM',
    repo_url: 'https://github.com/rtwone/RSUD-SYSTEM',
    image_url:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1280&q=80&fm=webp',
    mockup_type: 'dashboard',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'proj-2',
    title: 'Baileys Base',
    category: 'Development',
    year: '2026',
    description:
      'Mengembangkan kerangka kerja dasar (boilerplate) bot WhatsApp modular dan andal berbasis Node.js menggunakan library Baileys. Sistem dirancang untuk memudahkan integrasi otomatisasi pesan, pengelolaan sesi, serta pengembangan fitur interaktif secara efisien.',
    tech_stack: ['Node.js', 'TypeScript', 'JavaScript', 'Baileys'],
    live_url: 'https://wa.me/6285172303027?text=Hai+Chitanda+Eru',
    repo_url: 'https://github.com/rtwone/baileys-base',
    image_url:
      'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1280&q=80&fm=webp',
    mockup_type: 'terminal',
    created_at: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'proj-3',
    title: 'Film Pendek | Vlogger Sial',
    category: 'Other',
    year: '2024',
    description:
      'Sebuah film pendek bergenre horor-vlog yang mengisahkan perjalanan sekelompok vlogger yang mengalami kejadian-kejadian mistis dan menyeramkan setelah tinggal di sebuah rumah pinjaman.',
    tech_stack: ['Canon Camera', 'Apple iPhone', 'CapCut'],
    live_url: 'https://www.youtube.com/watch?v=NtVBdxHxJb8',
    repo_url: 'https://www.youtube.com/watch?v=NtVBdxHxJb8',
    image_url:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1280&q=80&fm=webp',
    mockup_type: 'browser',
    created_at: '2026-01-03T08:00:00.000Z',
  },
  {
    id: 'proj-4',
    title: 'HIMATIKA Visual Identity & Digital Media',
    category: 'Visual Design',
    year: '2026',
    description:
      'Perancangan sistem identitas visual, tata letak feed media sosial Instagram, poster publikasi acara akademik, dan pedoman branding digital untuk Himpunan Mahasiswa Teknik Informatika (HIMATIKA) Universitas Wiraraja.',
    tech_stack: ['Canva', 'Pinterest', 'Capcut'],
    live_url: 'https://instagram.com/himatika.unija',
    repo_url: 'https://instagram.com/himatika.unija',
    image_url:
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1280&q=80&fm=webp',
    mockup_type: 'editorial',
    gallery_items: [
      {
        id: 'gal-1',
        title: 'Sistem Grid Feed Instagram HIMATIKA',
        title_id: 'Sistem Grid Feed Instagram HIMATIKA',
        title_en: 'HIMATIKA Instagram Feed Grid System',
        image_url:
          'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1080&q=85&fm=webp',
        post_url: 'https://instagram.com/himatika.unija',
        width: 1080,
        height: 1350,
      },
      {
        id: 'gal-2',
        title: 'Poster Publikasi Acara Akademik',
        title_id: 'Poster Publikasi Acara Akademik',
        title_en: 'Academic Event Publication Poster',
        image_url:
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1080&q=85&fm=webp',
        post_url: 'https://instagram.com/himatika.unija',
        width: 1080,
        height: 1350,
      },
    ],
    created_at: '2026-01-04T08:00:00.000Z',
  },
];

export const INITIAL_EXPERIENCES = [
  {
    id: 'exp-1',
    role: 'Freelance Graphic Designer & Digital Creative',
    company: 'Mandiri / Remote',
    period: '2020 — Sekarang',
    description_bullets: [
      'Merancang identitas visual, poster, materi promosi, dan aset grafis kreatif untuk berbagai kebutuhan klien dan UMKM.',
      'Mengeksplorasi perpaduan desain grafis modern dengan efisiensi generative AI.',
    ],
    type: 'work',
    order_index: 1,
  },
  {
    id: 'exp-2',
    role: 'Social Media Specialist & Creative Designer',
    company: 'HIMATIKA Universitas Wiraraja',
    period: '2025 — Sekarang',
    description_bullets: [
      'Bertanggung jawab atas strategi visual media sosial himpunan, perencanaan konten edukasi teknologi, dan publikasi agenda resmi organisasi.',
      'Meningkatkan engagement dan konsistensi branding media sosial himpunan mahasiswa.',
    ],
    type: 'work',
    order_index: 2,
  },
  {
    id: 'exp-3',
    role: 'Praktik Kerja Lapangan (PKL) — Desainer Grafis',
    company: 'Dinas Komunikasi dan Informatika (Diskominfo) Kabupaten Sumenep',
    period: 'Nov 2024 — Feb 2025',
    description_bullets: [
      'Berpartisipasi aktif sebagai desainer grafis dalam perancangan materi komunikasi visual, publikasi informasi publik, dan dokumentasi konten digital instansi pemerintah daerah.',
      'Mengenal implementasi tata kelola media komunikasi publik serta alur kerja penerbitan informasi resmi di lingkungan Diskominfo.',
    ],
    type: 'work',
    order_index: 3,
  },
  {
    id: 'edu-1',
    role: 'S1 Teknik Informatika (Mahasiswa Aktif)',
    company: 'Universitas Wiraraja, Sumenep',
    period: '2025 — Sekarang (Aktif)',
    description_bullets: [
      'Mempelajari dasar-dasar ilmu komputer, logika pemrograman, rekayasa perangkat lunak, sistem informasi, dan teknologi komputasi modern.',
    ],
    type: 'education',
    order_index: 1,
  },
];

export const INITIAL_SKILLS = [
  // 1. Creative & Visual Arts (Design)
  { id: 'sk-1', category: 'Creative & Visual Arts', name: 'Adobe Photoshop', proficiency_level: 'Expert' },
  { id: 'sk-2', category: 'Creative & Visual Arts', name: 'CorelDRAW', proficiency_level: 'Expert' },
  { id: 'sk-3', category: 'Creative & Visual Arts', name: 'Adobe Illustrator', proficiency_level: 'Advanced' },
  { id: 'sk-4', category: 'Creative & Visual Arts', name: 'Canva', proficiency_level: 'Expert' },
  { id: 'sk-5', category: 'Creative & Visual Arts', name: 'Figma', proficiency_level: 'Advanced' },
  { id: 'sk-6', category: 'Creative & Visual Arts', name: 'Adobe Premiere', proficiency_level: 'Intermediate' },

  // 2. Engineering & Computing (Development)
  { id: 'sk-7', category: 'Engineering & Computing', name: 'JavaScript', proficiency_level: 'Advanced' },
  { id: 'sk-8', category: 'Engineering & Computing', name: 'TypeScript', proficiency_level: 'Intermediate' },
  { id: 'sk-9', category: 'Engineering & Computing', name: 'C#', proficiency_level: 'Intermediate' },
  { id: 'sk-10', category: 'Engineering & Computing', name: 'NodeJS', proficiency_level: 'Intermediate' },
  { id: 'sk-11', category: 'Engineering & Computing', name: 'MySQL', proficiency_level: 'Intermediate' },
  { id: 'sk-12', category: 'Engineering & Computing', name: 'XAMPP', proficiency_level: 'Advanced' },

  // 3. Ecosystem & Productivity (Tools & AI)
  { id: 'sk-13', category: 'Ecosystem & Productivity', name: 'Git', proficiency_level: 'Intermediate' },
  { id: 'sk-14', category: 'Ecosystem & Productivity', name: 'GitHub', proficiency_level: 'Intermediate' },
  { id: 'sk-15', category: 'Ecosystem & Productivity', name: 'VS Code', proficiency_level: 'Advanced' },
  { id: 'sk-16', category: 'Ecosystem & Productivity', name: 'GitHub Copilot (AI)', proficiency_level: 'Advanced' },
];

export const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    name: 'Raka Pratama — Tech Lead',
    email: 'raka.pratama@example.id',
    subject: 'Web Development',
    message:
      'Halo Irfan, kami tertarik dengan pendekatan Swiss Editorial Grid pada portofolio Anda. Apakah Anda tersedia untuk kolaborasi proyek web dashboard bulan depan?',
    is_read: false,
    created_at: '2025-02-15T09:30:00.000Z',
  },
];
