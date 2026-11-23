import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Word-by-word scroll reveal powered by Motion (framer-motion).
 * Splits text into individual words and masks each word upward as it enters the viewport.
 */
export default function RevealWords({
  text = '',
  className = '',
  delay = 0,
  stagger = 0.055,
  immediate = false,
}) {
  const shouldReduceMotion = useReducedMotion();
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="inline-block overflow-hidden align-bottom py-[0.06em] -my-[0.06em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '105%', opacity: 0 }}
            {...(immediate
              ? { animate: { y: '0%', opacity: 1 } }
              : {
                  whileInView: { y: '0%', opacity: 1 },
                  viewport: { once: true, amount: 0.35 },
                })}
            transition={{
              duration: 0.55,
              delay: delay + idx * stagger,
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
