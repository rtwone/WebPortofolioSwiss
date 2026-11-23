import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

/**
 * Global Lenis Smooth Scroll controller.
 * Active on public portfolio pages, automatically disabled on /admin
 * and when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Keep /admin on native scroll for dense forms & nested drawers
    if (pathname.startsWith('/admin')) return undefined;

    // Respect OS reduced-motion preference
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      if (window.__lenis === lenis) {
        delete window.__lenis;
      }
    };
  }, [pathname]);

  return null;
}
