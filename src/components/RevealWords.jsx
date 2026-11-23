import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * Word-by-word scroll reveal powered by Motion (framer-motion).
 * Observes the stationary outer wrapper (not the clipped/translated word) so
 * IntersectionObserver always triggers reliably across all viewports.
 */
export default function RevealWords({
  text = '',
  className = '',
  delay = 0,
  stagger = 0.055,
  immediate = false,
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const shouldAnimate = immediate || isInView;

  return (
    <span className={className}>
      {words.map((word, idx) => (
        <span
          key={idx}
          ref={idx === 0 ? containerRef : undefined}
          className="inline-block overflow-hidden align-bottom py-[0.08em] -my-[0.08em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '100%', opacity: 0 }}
            animate={
              shouldAnimate
                ? { y: '0%', opacity: 1 }
                : { y: '100%', opacity: 0 }
            }
            transition={{
              duration: 0.55,
              delay: shouldAnimate ? delay + idx * stagger : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {idx < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
