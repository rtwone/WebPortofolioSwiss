-- ============================================================================
-- SUPABASE SQL SCHEMA — IRFAN HARIYANTO PORTFOLIO
-- Jalankan seluruh skrip SQL ini di Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. TABLE: site_settings (Menyimpan konten dinamis untuk Hero, About, Metrics, Contact, Socials, Footer, & SEO)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta_title_id TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer',
  meta_title_en TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer',
  meta_description_id TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer berbasis di Sumenep, Jawa Timur. Portofolio rekayasa perangkat lunak Full-Stack Web, Android, Bot Automation, dan Desain Komunikasi Visual.',
  meta_description_en TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer based in Sumenep, East Java. Portfolio of Full-Stack Web Engineering, Android, Bot Automation, and Visual Communication Design.',
  meta_keywords TEXT DEFAULT 'Irfan Hariyanto, Software Engineer, Visual Designer, Universitas Wiraraja, Chitanda Eru Bot, Full-Stack Developer, Sumenep',
  og_image_url TEXT DEFAULT '',
  canonical_url TEXT DEFAULT '',
  theme_color TEXT DEFAULT '#f7f5f0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom-kolom SEO tersedia jika tabel site_settings sudah dibuat sebelumnya
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_title_id TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_title_en TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_description_id TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer berbasis di Sumenep, Jawa Timur. Portofolio rekayasa perangkat lunak Full-Stack Web, Android, Bot Automation, dan Desain Komunikasi Visual.';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_description_en TEXT DEFAULT 'Irfan Hariyanto — Software Engineer & Visual Designer based in Sumenep, East Java. Portfolio of Full-Stack Web Engineering, Android, Bot Automation, and Visual Communication Design.';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_keywords TEXT DEFAULT 'Irfan Hariyanto, Software Engineer, Visual Designer, Universitas Wiraraja, Chitanda Eru Bot, Full-Stack Developer, Sumenep';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS og_image_url TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS canonical_url TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#f7f5f0';

-- 1. TABLE: projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '2025',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  live_url TEXT DEFAULT '',
  repo_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  mockup_type TEXT NOT NULL DEFAULT 'terminal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom image_url tersedia jika tabel sudah dibuat sebelumnya
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gallery_items JSONB DEFAULT '[]'::jsonb;

-- 2. TABLE: experiences
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  period TEXT NOT NULL,
  description_bullets TEXT[] NOT NULL DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('work', 'education')) DEFAULT 'work',
  order_index INTEGER NOT NULL DEFAULT 1,
  sub_experiences JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS sub_experiences JSONB DEFAULT '[]'::jsonb;

-- 3. TABLE: skills
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL DEFAULT 'Advanced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: messages (Contact Form Inbox)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 3 AND 100),
  subject TEXT NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 100),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 3000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan constraint panjang karakter juga diterapkan untuk data baru tanpa gagal pada baris lama (NOT VALID)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_length_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_length_check CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 100 AND
  char_length(btrim(email)) BETWEEN 3 AND 100 AND
  char_length(btrim(subject)) BETWEEN 1 AND 100 AND
  char_length(btrim(message)) BETWEEN 10 AND 3000
) NOT VALID;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Public Read Access for Portfolio Visitors
DROP POLICY IF EXISTS "Allow public read on site_settings" ON public.site_settings;
CREATE POLICY "Allow public read on site_settings"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on projects" ON public.projects;
CREATE POLICY "Allow public read on projects"
  ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on experiences" ON public.experiences;
CREATE POLICY "Allow public read on experiences"
  ON public.experiences FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on skills" ON public.skills;
CREATE POLICY "Allow public read on skills"
  ON public.skills FOR SELECT USING (true);

-- Public Insert Access for Contact Form (Pengunjung hanya boleh kirim pesan)
DROP POLICY IF EXISTS "Allow public insert on messages" ON public.messages;
CREATE POLICY "Allow public insert on messages"
  ON public.messages FOR INSERT WITH CHECK (true);

-- Admin Full CRUD Access (Hanya admin terautentikasi yang boleh membaca, mengubah, & menghapus pesan)
DROP POLICY IF EXISTS "Allow full CRUD on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated full access on messages" ON public.messages;
CREATE POLICY "Allow authenticated full access on messages"
  ON public.messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin Full CRUD Access for Content Management
DROP POLICY IF EXISTS "Allow full CRUD on site_settings" ON public.site_settings;
CREATE POLICY "Allow full CRUD on site_settings"
  ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full CRUD on projects" ON public.projects;
CREATE POLICY "Allow full CRUD on projects"
  ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full CRUD on experiences" ON public.experiences;
CREATE POLICY "Allow full CRUD on experiences"
  ON public.experiences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full CRUD on skills" ON public.skills;
CREATE POLICY "Allow full CRUD on skills"
  ON public.skills FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SUPABASE STORAGE BUCKET: project-images (Untuk Upload Foto Proyek 16:9 .webp)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read on project-images" ON storage.objects;
CREATE POLICY "Allow public read on project-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Allow upload and update on project-images" ON storage.objects;
CREATE POLICY "Allow upload and update on project-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Allow update on project-images" ON storage.objects;
CREATE POLICY "Allow update on project-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Allow delete on project-images" ON storage.objects;
CREATE POLICY "Allow delete on project-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-images');

-- ============================================================================
-- REALTIME: aktifkan sinkronisasi live ke website (aman dijalankan berulang)
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['site_settings', 'projects', 'experiences', 'skills', 'messages']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END
$$;
