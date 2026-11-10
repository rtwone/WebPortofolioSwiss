/**
 * Serverless Endpoint: POST /api/send-email
 * Mengirim email dari Contact Form menggunakan Resend API (https://api.resend.com/emails)
 */

export function buildEditorialEmailHtml({ name, email, subject, message }) {
  return `
    <div style="background-color:#f7f5f0;padding:32px;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#181818;">
      <div style="max-width:600px;margin:0 auto;background-color:#fcfbf9;border:1px solid #181818;padding:32px;">
        <div style="border-bottom:1px solid #d8d2c7;padding-bottom:16px;margin-bottom:24px;">
          <p style="font-family:monospace;font-size:12px;font-weight:700;color:#8c7355;margin:0 0 6px 0;text-transform:uppercase;">
            NEW PORTFOLIO INQUIRY // RESEND DISPATCH
          </p>
          <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#181818;margin:0;">
            ${subject || 'New Project Inquiry'}
          </h1>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:700;color:#5c5852;width:130px;">Sender Name</td>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:600;color:#181818;">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:700;color:#5c5852;">Reply-To Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:600;color:#181818;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:700;color:#5c5852;">Category</td>
            <td style="padding:8px 0;border-bottom:1px solid #d8d2c7;font-weight:600;color:#181818;">${subject}</td>
          </tr>
        </table>

        <div style="background-color:#f7f5f0;border:1px solid #d8d2c7;padding:20px;">
          <p style="font-family:monospace;font-size:11px;font-weight:700;color:#8c7355;margin:0 0 8px 0;text-transform:uppercase;">
            MESSAGE DETAILS
          </p>
          <p style="font-size:15px;line-height:1.6;color:#181818;margin:0;white-space:pre-wrap;">${message}</p>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #d8d2c7;font-family:monospace;font-size:11px;color:#5c5852;">
          Sent via Resend API — Irfan Hariyanto Portfolio
        </div>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =
    process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.VITE_RESEND_FROM_EMAIL ||
    'Portfolio Inquiry <onboarding@resend.dev>';
  const toEmail =
    process.env.RESEND_TO_EMAIL ||
    process.env.VITE_RESEND_TO_EMAIL ||
    'irfanhariyanto@gmail.com';

  const { name = '', email = '', subject = '', message = '', website_hp = '' } = req.body || {};

  // Silent success jika honeypot terisi
  if (String(website_hp).trim() !== '') {
    return res.status(200).json({ ok: true, simulated: true });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanSubject = String(subject || 'General').trim().slice(0, 100);
  const cleanMessage = String(message).trim();

  if (
    !cleanName ||
    cleanName.length > 100 ||
    !cleanEmail ||
    cleanEmail.length > 100 ||
    cleanMessage.length < 10 ||
    cleanMessage.length > 3000
  ) {
    return res.status(400).json({
      error: 'Invalid input length (name/email max 100, message 10–3000 chars).',
    });
  }

  if (!apiKey || apiKey.includes('re_your_api_key')) {
    return res.status(200).json({
      ok: true,
      simulated: true,
      message:
        'RESEND_API_KEY belum diisi di .env. Pesan tetap tersimpan di Inbox Admin.',
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: cleanEmail,
        subject: `[Portfolio Inquiry] ${cleanSubject} — from ${cleanName}`,
        html: buildEditorialEmailHtml({
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
        }),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: result?.message || 'Gagal mengirim email melalui Resend API.',
      });
    }

    return res.status(200).json({
      ok: true,
      simulated: false,
      id: result.id,
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Internal Server Error saat menghubungi Resend API',
    });
  }
}
