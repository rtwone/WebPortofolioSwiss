# WebPortofolioSwiss

A **Swiss Editorial Grid & Classic Calligraphic** personal portfolio website with a built-in CMS Admin Panel, bilingual support (**ID / EN**), Light & Dark mode, dynamic URL shortlinks, custom project ordering, Lenis smooth scroll, and Supabase cloud sync.

Built with **React 18**, **Vite 6**, **Tailwind CSS**, **Framer Motion**, **Lenis**, **Supabase**, and **Vercel Serverless Functions**.

---

## Features

- **Swiss Editorial Design System** — Asymmetric grid, crisp hairline borders, calligraphic italic accents (`Playfair Display`, `Cormorant Garamond`, `Plus Jakarta Sans`, `JetBrains Mono`), and category-coded color accents.
- **Smooth Animations & Scroll** — Word-by-word scroll reveal headings, staggered card entrance & hover transitions powered by **Framer Motion**, paired with **Lenis** smooth scroll.
- **Full Admin CMS (`/admin`)** — Manage every section without touching code (shortcut: `Ctrl + Alt + A` / `Cmd + Option + A`):
  - Edit Hero, About, Skills, Experiences (with nested sub-roles), Contact, SEO metadata, and Footer.
  - **Custom Project Ordering** — Reorder portfolio projects to any exact position (`#01`..`#N`) or nudge up/down.
  - **Automatic `.webp` Image Compression & Cropping** — Uploaded project photos and Visual Design carousels are cropped and compressed to `.webp` before uploading to Supabase Storage.
  - **Dynamic Shortlinks Manager** — Create custom short URLs (e.g., `/cv`, `/wa`, `/kuesioner`) with click tracking.
  - **Website Click Analytics** — Domain-separated click counter with server-side visitor-identity anti-spam (`/api/track-click`).
  - **Contact Inbox & Email Dispatch** — Stores messages in Supabase and sends email notifications via **Resend API** (`/api/send-email`).
- **Bilingual (ID / EN) & Light / Dark Mode** — Instant language and theme switching with persistent preferences.
- **Graceful Local Fallback** — Runs out-of-the-box with built-in default data and `localStorage` persistence even before connecting Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, React Router v7 |
| Styling | Tailwind CSS 3, PostCSS |
| Motion & Scroll | Framer Motion, Lenis |
| Icons & Media | Lucide React, `react-easy-crop` |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage) |
| Serverless API | Vercel Functions (`api/send-email.js`, `api/track-click.js`) |
| Email | Resend API |
| Hosting | Vercel |

---

## Project Structure

```text
├── api/
│   ├── send-email.js          # Vercel serverless function for Resend email notifications
│   └── track-click.js         # Server-side click tracking with IP+UA SHA-256 anti-spam
├── public/                    # Static assets (robots.txt, sitemap, icons)
├── src/
│   ├── components/            # Navbar, Hero, About, Skills, Projects, Experience, Contact, Footer, RevealWords, SmoothScroll
│   ├── context/               # PortfolioDataContext (Supabase sync, i18n, theme, CRUD, analytics)
│   ├── lib/                   # supabase.js, i18n.js, imageUpload.js, resend.js, translator.js
│   └── pages/                 # AdminDashboard, ProjectsArchivePage, DynamicShortlinkRedirect, NotFoundPage
├── supabase/
│   └── schema.sql             # Database tables, storage bucket, and RLS policies
├── .env.example               # Environment variable template
└── vercel.json                # SPA rewrites (excluding /api/*)
```

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

> **Security Tip:** Never commit `.env` to Git (it is already in `.gitignore`). For production on Vercel, keep `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` **without** the `VITE_` prefix so they are never exposed to the browser bundle.

### 4. Setup Supabase Database & Storage

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New Query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. In **Storage**, ensure a public bucket named `project-images` exists (for uploaded `.webp` project thumbnails and SEO OG images).
4. In **Authentication → Users**, create your admin user account (Email + Password) to log in securely to `/admin`.

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.
To access the Admin Panel, navigate to `http://localhost:5173/admin` or press **`Ctrl + Alt + A`** (`Cmd + Option + A` on macOS).

### 6. Build for Production

```bash
npm run build
npm run preview
```

---

## Deploying to Vercel

1. Push your forked/cloned repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Framework Preset will auto-detect **Vite** (`npm run build`, output directory `dist`).
4. Add your environment variables in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(for `/api/track-click`)*
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL` *(for `/api/send-email`)*
5. Click **Deploy**.

> **Customizing Tracked Domains:** If you want to customize which domains are separated in the **Total Klik Website** panel, update the domain keys in `api/track-click.js`, `src/context/PortfolioDataContext.jsx`, and `src/pages/AdminDashboard.jsx`.

---

## License

This project is open source and available for personal and educational use. Feel free to fork, customize, and make it your own!
