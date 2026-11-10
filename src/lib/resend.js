/**
 * ============================================================================
 * RESEND EMAIL API CLIENT — src/lib/resend.js
 * ============================================================================
 * Mengirim pesan dari Contact Form ke endpoint `/api/send-email` yang
 * meneruskan payload ke `https://api.resend.com/emails`.
 *
 * Variabel `.env` yang didukung:
 *   VITE_RESEND_API_KEY=re_xxxxxxxxx
 *   VITE_RESEND_FROM_EMAIL=Portfolio Inquiry <onboarding@resend.dev>
 *   VITE_RESEND_TO_EMAIL=irfanhariyanto@gmail.com
 * ============================================================================
 */

export async function sendEmailViaResend({ name, email, subject, message }) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || 'Gagal mengirim email melalui Resend API.'
    );
  }

  return data;
}
