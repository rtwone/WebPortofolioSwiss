import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { PortfolioDataProvider, usePortfolioData } from './context/PortfolioDataContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SmoothScroll from './components/SmoothScroll';
import ErrorBoundary from './components/ErrorBoundary';
import ProjectsArchivePage from './pages/ProjectsArchivePage';
import NotFoundPage from './pages/NotFoundPage';
import DynamicShortlinkRedirect from './pages/DynamicShortlinkRedirect';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

/**
 * Mencatat Total Klik kunjungan halaman publik tepat 1 kali per load,
 * dipisah berdasarkan domain (irfan.sang.ceo vs irfanhariyanto.my.id).
 * Mengabaikan /admin dan route shortlink agar hitungan tetap akurat.
 */
function SiteVisitTracker() {
  const { pathname } = useLocation();
  const { recordSiteClick } = usePortfolioData();
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (hasRecordedRef.current) return;
    // Hanya catat kunjungan halaman publik utama (/ dan /projects)
    const isPublicPortfolioRoute = pathname === '/' || pathname === '/projects';
    if (!isPublicPortfolioRoute) return;

    hasRecordedRef.current = true;
    if (typeof recordSiteClick === 'function') {
      recordSiteClick(window.location.hostname);
    }
  }, [pathname, recordSiteClick]);

  return null;
}

/**
 * Global Keyboard Shortcut: CTRL + ALT + A (atau CMD + OPTION + A di macOS)
 * Membuka /admin secara langsung dan bebas bentrok dari halaman mana pun.
 */
function AdminShortcutListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Abaikan jika user sedang mengetik di dalam input/textarea/editable element
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isKeyA = e.key.toLowerCase() === 'a' || e.code === 'KeyA';

      // Jika CTRL/CMD + ALT + A ditekan bersamaan
      if (isModifier && isAlt && isKeyA) {
        e.preventDefault();
        navigate('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
}

function PublicPortfolioPage() {
  return (
    <div className="theme-portfolio min-h-screen flex flex-col bg-[#f7f5f0] text-[#181818] selection:bg-[#181818] selection:text-[#fcfbf9] transition-colors duration-200">
      {/* Skip to Main Content for Keyboard Accessibility */}
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#181818] focus:text-[#fcfbf9] focus:font-mono focus:font-bold focus:text-xs"
      >
        Skip to content
      </a>

      {/* Sticky Swiss Topbar */}
      <Navbar />

      {/* Main Editorial Content */}
      <main className="flex-1">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PortfolioDataProvider>
        <BrowserRouter>
          <SmoothScroll />
          <SiteVisitTracker />
          <AdminShortcutListener />
          <Routes>
            <Route path="/" element={<PublicPortfolioPage />} />
            <Route path="/projects" element={<ProjectsArchivePage />} />
            <Route path="/s/:slug" element={<DynamicShortlinkRedirect />} />
            <Route path="/:slug" element={<DynamicShortlinkRedirect />} />
            <Route
              path="/admin"
              element={
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#181818] text-[#fcfbf9] flex items-center justify-center font-mono font-bold text-xs uppercase tracking-widest">
                      Loading Admin Console...
                    </div>
                  }
                >
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </PortfolioDataProvider>
    </ErrorBoundary>
  );
}
