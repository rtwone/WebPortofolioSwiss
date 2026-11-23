import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowUpRight, Send } from 'lucide-react';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { sendEmailViaResend } from '../lib/resend';
import RevealWords from './RevealWords';
const SUBMIT_COOLDOWN_KEY = 'portfolio_contact_last_submit';
const SUBMIT_COOLDOWN_MS = 60_000;
const MIN_FILL_TIME_MS = 2_500;

const SOCIAL_DIRECTORY = [
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
];

const PROJECT_TYPES = [
  'Web Development',
  'WhatsApp Bot',
  'Visual Design',
  'Other',
];

export default function Contact() {
  const { submitMessage, dbMode, siteContent, t, language } =
    usePortfolioData();
  const contactConfig = siteContent?.contact || {};
  const emailAddress = contactConfig.email || 'halo@irfanhariyanto.my.id';
  const socialLinks = Array.isArray(contactConfig.socials)
    ? contactConfig.socials
    : SOCIAL_DIRECTORY;
  const projectTypeOptions = useMemo(() => {
    if (
      Array.isArray(contactConfig.projectTypes) &&
      contactConfig.projectTypes.length > 0
    ) {
      return contactConfig.projectTypes.map((item) =>
        typeof item === 'string'
          ? { value: item, label: item }
          : {
              value: item.value || item.label || 'Inquiry',
              label: item.label || item.value || 'Inquiry',
            }
      );
    }
    return t.contact.projectTypes || [];
  }, [contactConfig.projectTypes, t.contact.projectTypes]);
  const [copied, setCopied] = useState(false);
  const mountedAtRef = useRef(Date.now());

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'Web Development',
    message: '',
    website_hp: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [resendStatusText, setResendStatusText] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(emailAddress);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = emailAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitSuccess) setSubmitSuccess(false);
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setResendStatusText('');
    setSubmitError('');

    const now = Date.now();

    // 1. Honeypot & Time-trap (< 2.5s): silent success agar bot tidak mendeteksi filter
    if (
      formData.website_hp.trim() !== '' ||
      now - mountedAtRef.current < MIN_FILL_TIME_MS
    ) {
      setSubmitSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        subject: 'Web Development',
        message: '',
        website_hp: '',
      });
      return;
    }

    // 2. Cooldown check (60s via localStorage)
    const lastSubmit = Number(localStorage.getItem(SUBMIT_COOLDOWN_KEY) || 0);
    const remainingSec = Math.ceil(
      (SUBMIT_COOLDOWN_MS - (now - lastSubmit)) / 1000
    );
    if (lastSubmit && remainingSec > 0) {
      setSubmitError(
        language === 'id'
          ? `Mohon tunggu ${remainingSec} detik sebelum mengirim pesan lagi.`
          : `Please wait ${remainingSec} seconds before sending another message.`
      );
      return;
    }

    // 3. Sanitization & Length Validation
    const payload = {
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    if (
      !payload.name ||
      payload.name.length > 100 ||
      !payload.email ||
      payload.email.length > 100 ||
      payload.message.length < 10 ||
      payload.message.length > 3000
    ) {
      setSubmitError(
        language === 'id'
          ? 'Nama/email maks 100 karakter, dan pesan harus antara 10–3000 karakter.'
          : 'Name/email max 100 chars, and message must be between 10–3000 characters.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Kirim email melalui Resend API (/api/send-email -> api.resend.com/emails)
      // 2. Simpan salinan pesan ke Inbox Messages (Supabase) agar bisa dipantau di /admin
      // Keduanya berjalan independen: pesan tetap tersimpan di inbox walau email gagal terkirim.
      const [emailOutcome, inboxOutcome] = await Promise.allSettled([
        sendEmailViaResend(payload),
        submitMessage(payload),
      ]);

      if (
        emailOutcome.status === 'rejected' &&
        inboxOutcome.status === 'rejected'
      ) {
        throw emailOutcome.reason;
      }

      localStorage.setItem(SUBMIT_COOLDOWN_KEY, String(Date.now()));
      mountedAtRef.current = Date.now();
      setSubmitSuccess(true);
      if (emailOutcome.status === 'rejected') {
        setResendStatusText(
          language === 'id'
            ? 'Pesan Anda sudah tercatat, tetapi email notifikasi belum terkirim. Saya tetap akan melihatnya.'
            : 'Your message has been received, but the email notification could not be sent. It will still be seen.'
        );
      } else {
        setResendStatusText('');
      }
      setFormData({
        fullName: '',
        email: '',
        subject: 'Web Development',
        message: '',
        website_hp: '',
      });
    } catch (err) {
      setSubmitError(
        err?.message || 'Gagal mengirim email melalui Resend API. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative py-20 sm:py-24 lg:py-28 border-b border-[#d8d2c7] bg-[#f7f5f0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pb-8 sm:pb-12 border-b border-[#d8d2c7]"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-[#8c7355]">
              {t.contact.sectionLabel}
            </span>
            <span className="h-[1px] w-12 bg-[#8c7355]" aria-hidden="true" />
          </div>

          <h2
            id="contact-heading"
            className="font-display font-bold text-2xl sm:text-3xl md:text-5xl text-[#181818] tracking-tight leading-tight md:leading-[1.12]"
          >
            <RevealWords text={contactConfig.headingMain || "Let's Build Something"} />{' '}
            <span className="font-calligraphic font-bold italic text-[#8c7355] text-3xl sm:text-4xl md:text-6xl">
              <RevealWords
                text={contactConfig.headingAccent || 'Meaningful Together'}
                delay={0.18}
              />
            </span>
          </h2>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (5 Cols): Direct Contact & Social Directory */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-5 space-y-6 min-w-0"
          >
            <div className="p-4 sm:p-8 border border-[#d8d2c7] bg-[#fcfbf9]">
              <div className="font-mono font-bold text-xs sm:text-sm text-[#8c7355] uppercase tracking-wider mb-3">
                {t.contact.dispatchLabel}
              </div>

              <p className="font-sans font-medium text-sm sm:text-base md:text-lg text-[#3a3835] leading-relaxed">
                {contactConfig.description}
              </p>

              {/* Interactive Copy Email Box */}
              <div className="mt-6 p-4 bg-[#f7f5f0] border border-[#d8d2c7] border-l-4 border-l-[#2563eb]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-[11px] text-[#2563eb] uppercase tracking-wider">
                    {t.contact.directEmailLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[11px] text-[#16a34a]">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                    {t.contact.activeInbox}
                  </span>
                </div>

                <div className="font-mono font-bold text-sm sm:text-base text-[#181818] break-all">
                  {emailAddress}
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider border transition-colors duration-200 cursor-pointer ${
                    copied
                      ? 'bg-[#16a34a] text-[#fcfbf9] border-[#16a34a]'
                      : 'bg-[#181818] text-[#fcfbf9] border-[#181818] hover:bg-[#2563eb] hover:border-[#2563eb]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>{t.contact.copiedEmail}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>{t.contact.copyEmail}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Social Media Directory */}
              <div className="mt-8">
                <div className="font-mono font-bold text-xs text-[#5c5852] uppercase tracking-wider pb-3 border-b border-[#d8d2c7]">
                  {t.contact.socialDirectoryLabel}
                </div>

                <ul className="divide-y divide-[#d8d2c7] border-b border-[#d8d2c7]">
                  {socialLinks.map((social, idx) => (
                    <li key={social.platform || idx}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group py-4 flex items-center justify-between gap-4 hover:bg-[#f7f5f0] px-2 -mx-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-[#8c7355]">
                            {social.index || String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="font-sans font-bold text-sm text-[#181818] group-hover:text-[#8c7355] transition-colors">
                              {social.platform}
                            </div>
                            <div className="font-mono font-semibold text-xs text-[#5c5852]">
                              {social.handle}
                            </div>
                          </div>
                        </div>

                        <ArrowUpRight
                          className="w-4 h-4 text-[#181818] group-hover:text-[#8c7355] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right Column (7 Cols): Interactive Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-7 min-w-0"
          >
            <div className="p-4 sm:p-8 lg:p-10 border border-[#d8d2c7] border-t-4 border-t-[#dc2626] bg-[#fcfbf9] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 sm:mb-6 border-b border-[#d8d2c7]">
                <div>
                  <span className="font-mono font-bold text-xs text-[#dc2626] uppercase tracking-wider block">
                    {t.contact.formSubtitle}
                  </span>
                  <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-[#181818] mt-1 leading-snug">
                    {t.contact.formTitle}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 relative">
                {/* Honeypot anti-bot field */}
                <input
                  type="text"
                  name="website_hp"
                  value={formData.website_hp}
                  onChange={handleInputChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="opacity-0 absolute -z-50 pointer-events-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block font-mono font-bold text-xs text-[#181818] uppercase tracking-wider mb-2"
                    >
                      {t.contact.fieldFullName}
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      maxLength={100}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={t.contact.placeholderFullName}
                      className="w-full px-4 py-3 bg-[#f7f5f0] border border-[#d8d2c7] focus:border-[#181818] focus:bg-[#fcfbf9] font-sans font-semibold text-base sm:text-sm text-[#181818] placeholder:text-[#5c5852]/70 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-mono font-bold text-xs text-[#181818] uppercase tracking-wider mb-2"
                    >
                      {t.contact.fieldEmail}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={100}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t.contact.placeholderEmail}
                      className="w-full px-4 py-3 bg-[#f7f5f0] border border-[#d8d2c7] focus:border-[#181818] focus:bg-[#fcfbf9] font-sans font-semibold text-base sm:text-sm text-[#181818] placeholder:text-[#5c5852]/70 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block font-mono font-bold text-xs text-[#181818] uppercase tracking-wider mb-2"
                  >
                    {t.contact.fieldSubject}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#f7f5f0] border border-[#d8d2c7] focus:border-[#181818] focus:bg-[#fcfbf9] font-sans font-semibold text-base sm:text-sm text-[#181818] outline-none transition-colors cursor-pointer"
                  >
                    {projectTypeOptions.map((type, idx) => (
                      <option key={`${type.value}-${idx}`} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block font-mono font-bold text-xs text-[#181818] uppercase tracking-wider mb-2"
                  >
                    {t.contact.fieldMessage}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    minLength={10}
                    maxLength={3000}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t.contact.placeholderMessage}
                    className="w-full px-4 py-3 bg-[#f7f5f0] border border-[#d8d2c7] focus:border-[#181818] focus:bg-[#fcfbf9] font-sans font-semibold text-base sm:text-sm text-[#181818] placeholder:text-[#5c5852]/70 outline-none transition-colors resize-y"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#181818] text-[#fcfbf9] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#dc2626] disabled:opacity-60 transition-colors duration-200 cursor-pointer"
                  >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isSubmitting
                        ? t.contact.sendingBtn
                        : t.contact.sendBtn}
                    </span>
                  </button>
                </div>

                {/* Error Feedback */}
                {submitError && (
                  <div className="p-4 bg-[#f7f5f0] border-2 border-red-600 font-sans font-semibold text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                {/* Success Message Feedback */}
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      role="status"
                      aria-live="polite"
                      className="p-4 bg-[#f7f5f0] border-2 border-[#16a34a] flex items-start gap-3"
                    >
                      <Check
                        className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <div className="font-mono font-bold text-xs uppercase text-[#16a34a]">
                          {t.contact.confirmHeader}
                        </div>
                        <p className="mt-0.5 font-sans font-semibold text-sm text-[#181818]">
                          {t.contact.confirmBody}
                        </p>
                        {resendStatusText && (
                          <p className="mt-1 font-mono font-semibold text-xs text-[#5c5852]">
                            {resendStatusText}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Toast Notification for Clipboard Copy */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-[#181818] text-[#fcfbf9] border border-[#8c7355] shadow-editorial flex items-center gap-3"
          >
            <span className="w-6 h-6 bg-[#16a34a] text-[#fcfbf9] flex items-center justify-center">
              <Check className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <div className="font-mono font-bold text-xs text-[#fcfbf9]">
                Copied to Clipboard ✓
              </div>
              <div className="font-mono font-semibold text-[11px] text-[#d8d2c7]">
                {emailAddress}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
