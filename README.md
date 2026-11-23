# WebPortofolioSwiss

> **Bahasa:** **Bahasa Indonesia** (Utama) | [English](#english-version)

Website portofolio personal bergaya **Swiss Editorial Grid & Classic Calligraphic** yang dilengkapi **Admin Panel CMS** bawaan, dukungan dwibahasa (**ID / EN**), mode terang & gelap (*Light / Dark Mode*), *shortlink* dinamis, pengurutan projek kustom, *smooth scroll* Lenis, dan sinkronisasi cloud dengan **Supabase**.

Dibangun menggunakan **React 18**, **Vite 6**, **Tailwind CSS**, **Framer Motion**, **Lenis**, **Supabase**, dan **Vercel Serverless Functions**.

---

## Fitur Utama

- **Desain Swiss Editorial** — Grid asimetris, garis tepi presisi (*hairline borders*), tipografi editorial (`Playfair Display`, `Cormorant Garamond`, `Plus Jakarta Sans`, `JetBrains Mono`), serta aksen warna per kategori.
- **Animasi & Smooth Scroll** — Animasi judul muncul per kata saat di-scroll, animasi masuk & hover kartu dengan **Framer Motion**, dipadukan dengan *smooth scroll* **Lenis**.
- **Admin CMS Lengkap (`/admin`)** — Kelola seluruh isi website tanpa perlu mengubah kode (pintasan keyboard: `Ctrl + Alt + A` / `Cmd + Option + A`):
  - Edit Hero, About, Skills, Experiences (mendukung sub-peran bertingkat), Contact, metadata SEO, dan Footer.
  - **Custom Urutan Projek** — Atur urutan tampil projek ke posisi mana pun (`#01`..`#N`) atau geser naik/turun langsung dari dashboard.
  - **Kompresi & Crop `.webp` Otomatis** — Foto projek dan galeri *Visual Design* otomatis di-crop dan dikonversi ke `.webp` sebelum diunggah ke Supabase Storage.
  - **Shortlinks Manager Dinamis** — Buat tautan pendek khusus (contoh: `/cv`, `/wa`, `/kuesioner`) lengkap dengan pencatat klik.
  - **Analitik Total Klik Website** — Penghitung klik terpisah per domain dengan proteksi anti-spam berbasis identitas pengunjung (hash SHA-256 IP + User-Agent) di sisi server (`/api/track-click`).
  - **Kotak Masuk & Notifikasi Email** — Pesan dari form kontak tersimpan di Supabase dan dikirim ke email melalui **Resend API** (`/api/send-email`).
- **Dwibahasa (ID / EN) & Light / Dark Mode** — Pergantian bahasa dan tema secara instan dengan preferensi tersimpan.
- **Mode Fallback Lokal** — Tetap bisa dijalankan langsung dengan data bawaan dan `localStorage` meskipun belum terhubung ke Supabase.

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18, Vite 6, React Router v7 |
| Styling | Tailwind CSS 3, PostCSS |
| Animasi & Scroll | Framer Motion, Lenis |
| Ikon & Media | Lucide React, `react-easy-crop` |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Serverless API | Vercel Functions (`api/send-email.js`, `api/track-click.js`) |
| Email | Resend API |
| Hosting | Vercel |

---

## Struktur Folder

```text
├── api/
│   ├── send-email.js          # Vercel serverless function untuk notifikasi email Resend
│   └── track-click.js         # Pencatat klik server-side dengan anti-spam SHA-256 (IP+UA)
├── public/                    # Aset statis (robots.txt, sitemap, ikon)
├── src/
│   ├── components/            # Navbar, Hero, About, Skills, Projects, Experience, Contact, Footer, RevealWords, SmoothScroll
│   ├── context/               # PortfolioDataContext (sinkron Supabase, i18n, tema, CRUD, analitik)
│   ├── lib/                   # supabase.js, i18n.js, imageUpload.js, resend.js, translator.js
│   └── pages/                 # AdminDashboard, ProjectsArchivePage, DynamicShortlinkRedirect, NotFoundPage
├── supabase/
│   └── schema.sql             # Skema tabel database, storage bucket, dan kebijakan RLS
├── .env.example               # Template variabel lingkungan (.env)
└── vercel.json                # Konfigurasi rewrite SPA (mengecualikan /api/*)
```

---

## Cara Instalasi & Menjalankan Lokal

### 1. Prasyarat
- **Node.js** `v18+` dan **npm**
- Akun [Supabase](https://supabase.com) gratis (opsional untuk preview lokal, wajib untuk CMS cloud & upload gambar)
- Akun [Resend](https://resend.com) gratis (opsional, untuk notifikasi email form kontak)

### 2. Clone & Install Dependensi

```bash
git clone https://github.com/rtwone/WebPortofolioSwiss.git
cd WebPortofolioSwiss
npm install
```

### 3. Konfigurasi Environment Variables

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Lalu isi file `.env` dengan kredensial Anda:

```env
# 1. Supabase (Wajib untuk database cloud, auth & upload gambar)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# 2. Key khusus server (Disarankan dipasang di Vercel Environment Variables tanpa prefix VITE_)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Portfolio Inquiry <onboarding@resend.dev>
RESEND_TO_EMAIL=you@example.com

# 3. Kunci akses cepat Admin (Opsional — gunakan Supabase Auth untuk keamanan produksi)
VITE_ADMIN_ACCESS_KEY=ganti-dengan-kunci-rahasia-anda
```

> **Tips Keamanan:** Jangan pernah meng-commit file `.env` ke Git (sudah otomatis diabaikan di `.gitignore`). Saat deploy di Vercel, pastikan `RESEND_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` **tidak** memakai prefix `VITE_` agar tidak ikut masuk ke bundle browser.

### 4. Setup Database & Storage di Supabase

1. Buat projek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor → New Query**, salin isi file [`supabase/schema.sql`](supabase/schema.sql), lalu jalankan (*Run*).
3. Di menu **Storage**, pastikan terdapat bucket publik bernama `project-images` (untuk menyimpan thumbnail `.webp` dan gambar SEO OG).
4. Di menu **Authentication → Users**, buat akun admin (Email + Password) untuk login dengan aman ke `/admin`.

### 5. Jalankan di Lokal

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.
Untuk membuka Admin Panel, kunjungi `http://localhost:5173/admin` atau tekan **`Ctrl + Alt + A`** (`Cmd + Option + A` di macOS).

### 6. Build untuk Produksi

```bash
npm run build
npm run preview
```

---

## Deploy ke Vercel

1. Push repositori hasil fork/clone Anda ke GitHub.
2. Import repositori tersebut di [Vercel](https://vercel.com/new).
3. Framework Preset otomatis terdeteksi sebagai **Vite** (`npm run build`, folder output `dist`).
4. Tambahkan Environment Variables di **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(untuk `/api/track-click`)*
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL` *(untuk `/api/send-email`)*
5. Klik **Deploy**.

> **Kustomisasi Domain Analitik:** Untuk mengubah domain yang dipisahkan pada panel **Total Klik Website**, sesuaikan nama domain di `api/track-click.js`, `src/context/PortfolioDataContext.jsx`, dan `src/pages/AdminDashboard.jsx`.

---

## Lisensi

Projek ini bersifat *open source* dan bebas digunakan untuk keperluan personal maupun pembelajaran. Silakan fork, modifikasi, dan jadikan portofolio milik Anda sendiri!

---
---

<a id="english-version"></a>
# WebPortofolioSwiss (English)

> **Language:** [Bahasa Indonesia](#webportofolioswiss) | **English**

A **Swiss Editorial Grid & Classic Calligraphic** personal portfolio website with a built-in **Admin CMS Panel**, bilingual support (**ID / EN**), Light & Dark mode, dynamic URL shortlinks, custom project ordering, Lenis smooth scroll, and **Supabase** cloud sync.

Built with **React 18**, **Vite 6**, **Tailwind CSS**, **Framer Motion**, **Lenis**, **Supabase**, and **Vercel Serverless Functions**.

---

## Features

- **Swiss Editorial Design System** — Asymmetric grid, crisp hairline borders, classic editorial typography (`Playfair Display`, `Cormorant Garamond`, `Plus Jakarta Sans`, `JetBrains Mono`), and category-coded color accents.
- **Smooth Animations & Scroll** — Word-by-word scroll reveal headings, staggered card entrance & hover transitions powered by **Framer Motion**, paired with **Lenis** smooth scroll.
- **Full Admin CMS (`/admin`)** — Manage every section without editing code (shortcut: `Ctrl + Alt + A` / `Cmd + Option + A`):
  - Edit Hero, About, Skills, Experiences (including nested sub-roles), Contact, SEO metadata, and Footer.
  - **Custom Project Ordering** — Place any project at an exact display slot (`#01`..`#N`) or move it up/down directly from the dashboard.
  - **Automatic `.webp` Compression & Cropping** — Uploaded project thumbnails and Visual Design carousels are cropped and converted to `.webp` before uploading to Supabase Storage.
  - **Dynamic Shortlinks Manager** — Create custom short URLs (e.g., `/cv`, `/wa`, `/kuesioner`) with click tracking.
  - **Website Click Analytics** — Domain-separated click counters with server-side visitor-identity anti-spam (SHA-256 IP + User-Agent hash) via `/api/track-click`.
  - **Contact Inbox & Email Dispatch** — Saves inquiries to Supabase and dispatches email notifications via **Resend API** (`/api/send-email`).
- **Bilingual (ID / EN) & Light / Dark Mode** — Instant language and theme switching with persistent preferences.
- **Graceful Local Fallback** — Works out-of-the-box with default data and `localStorage` persistence even before connecting Supabase.

---

## Getting Started

### 1. Prerequisites
- **Node.js** `v18+` and **npm**
- A free [Supabase](https://supabase.com) account (optional for local preview, required for cloud CMS & uploads)
- A free [Resend](https://resend.com) account (optional, for contact form email notifications)

### 2. Clone & Install

```bash
git clone https://github.com/rtwone/WebPortofolioSwiss.git
cd WebPortofolioSwiss
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in `.env` with your credentials:

```env
# 1. Supabase (Required for cloud database, auth & image uploads)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# 2. Server-only keys (Recommended to set in Vercel Environment Variables without VITE_ prefix)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Portfolio Inquiry <onboarding@resend.dev>
RESEND_TO_EMAIL=you@example.com

# 3. Quick Admin Key (Optional — use Supabase Auth for production security)
VITE_ADMIN_ACCESS_KEY=change-this-secret-key
```

> **Security Tip:** Never commit `.env` to Git (it is already listed in `.gitignore`). On Vercel, keep `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` **without** the `VITE_` prefix so they are never exposed to the client bundle.

### 4. Setup Supabase Database & Storage

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New Query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. In **Storage**, verify a public bucket named `project-images` exists (for uploaded `.webp` thumbnails and SEO OG images).
4. In **Authentication → Users**, create your admin account (Email + Password) to sign in securely to `/admin`.

### 5. Run Locally & Deploy to Vercel

```bash
npm run dev      # Start local dev server at http://localhost:5173
npm run build    # Build for production
```

To deploy, import your GitHub repository in [Vercel](https://vercel.com/new), add the Environment Variables above (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`), and click **Deploy**.

> **Customizing Tracked Domains:** To change which domains are tracked in the **Total Klik Website** panel, update the domain keys in `api/track-click.js`, `src/context/PortfolioDataContext.jsx`, and `src/pages/AdminDashboard.jsx`.

---

## License

This project is open source and available for personal and educational use. Feel free to fork, customize, and make it your own!
