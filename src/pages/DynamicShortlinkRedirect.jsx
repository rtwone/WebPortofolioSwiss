import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { ExternalLink, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function DynamicShortlinkRedirect() {
  const { slug } = useParams();
  const { siteContent, recordShortlinkClick } = usePortfolioData();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const cleanSlug = slug.toLowerCase().trim();

    // Reserved routes yang tidak boleh di-redirect sebagai shortlink
    const reserved = ['admin', 'projects', 'kuesioner'];
    if (reserved.includes(cleanSlug)) {
      return;
    }

    const shortlinks = Array.isArray(siteContent?.shortlinks)
      ? siteContent.shortlinks
      : [];

    const matched = shortlinks.find(
      (s) => (s.slug || '').toLowerCase().trim() === cleanSlug && s.is_active !== false
    );

    if (matched && matched.target_url) {
      let target = matched.target_url.trim();
      if (!/^https?:\/\//i.test(target)) {
        target = `https://${target}`;
      }

      // Catat hit klik jika handler tersedia
      if (typeof recordShortlinkClick === 'function') {
        recordShortlinkClick(matched.id || cleanSlug);
      }

      // Redirect seketika
      window.location.replace(target);
    } else {
      // Tunggu sebentar untuk memastikan data selesai termuat dari Supabase/storage
      const timer = setTimeout(() => {
        setNotFound(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [slug, siteContent, recordShortlinkClick]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#181818] text-[#fcfbf9] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center mb-4 text-red-300">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider block mb-1">
          404 // SHORTLINK NOT FOUND
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#fcfbf9] tracking-tight">
          Shortlink &quot;/{slug}&quot; Tidak Ditemukan
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#8c857b] max-w-md mt-2 leading-relaxed">
          Tautan pendek ini mungkin telah dinonaktifkan, dihapus, atau Anda salah mengetikkan alamat URL.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181818] text-[#fcfbf9] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-10 h-10 border-2 border-[#8c7355] border-t-transparent rounded-full animate-spin mb-4" />
      <span className="font-mono font-bold text-xs text-[#8c7355] uppercase tracking-wider block mb-1">
        REDIRECTING // SHORTLINK
      </span>
      <h1 className="font-display font-bold text-xl sm:text-2xl text-[#fcfbf9] tracking-tight">
        Mengarahkan ke tujuan...
      </h1>
      <p className="font-mono text-xs text-[#8c857b] mt-2">
        Harap tunggu sejenak, Anda sedang dialihkan.
      </p>
    </div>
  );
}
