import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { buildEditorialEmailHtml } from './api/send-email.js';

/**
 * Vite Dev Server Middleware untuk menangani POST `/api/send-email`
 * menggunakan Resend API (`https://api.resend.com/emails`) secara server-side
 * agar bebas dari kendala CORS browser dan menjaga keamanan API Key.
 */
function resendApiDevPlugin(env) {
  return {
    name: 'vite-plugin-resend-api',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          try {
            const payload = JSON.parse(body || '{}');
            const { name, email, subject, message } = payload;

            if (!name || !email || !message) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  error: 'Nama, email, dan isi pesan wajib diisi.',
                })
              );
              return;
            }

            const apiKey =
              env.RESEND_API_KEY || env.VITE_RESEND_API_KEY || '';
            const fromEmail =
              env.RESEND_FROM_EMAIL ||
              env.VITE_RESEND_FROM_EMAIL ||
              'Portfolio Inquiry <onboarding@resend.dev>';
            const toEmail =
              env.RESEND_TO_EMAIL ||
              env.VITE_RESEND_TO_EMAIL ||
              'irfanhariyanto@gmail.com';

            if (!apiKey || apiKey.includes('re_your_api_key')) {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  simulated: true,
                  message:
                    'VITE_RESEND_API_KEY belum dikonfigurasi di .env (Mode Simulasi Aktif).',
                })
              );
              return;
            }

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: email,
                subject: `[Portfolio Inquiry] ${subject || 'General'} — from ${name}`,
                html: buildEditorialEmailHtml({
                  name,
                  email,
                  subject,
                  message,
                }),
              }),
            });

            const result = await resendRes.json();

            if (!resendRes.ok) {
              res.statusCode = resendRes.status;
              res.end(
                JSON.stringify({
                  error:
                    result?.message ||
                    'Gagal mengirim email melalui Resend API.',
                })
              );
              return;
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                ok: true,
                simulated: false,
                id: result.id,
              })
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: err?.message || 'Gagal memproses permintaan Resend API.',
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), resendApiDevPlugin(env)],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion', 'lucide-react'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
