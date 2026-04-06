// ============================================
// Kirim email (reset password). Butuh SMTP di .env — lihat ENV_SETUP.md
// ============================================

import nodemailer from 'nodemailer';

/**
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST?.trim() || !SMTP_USER?.trim()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========== RESET PASSWORD (SMTP belum diset) ==========');
      console.log(`Email: ${to}`);
      console.log(`Buka di browser: ${resetUrl}`);
      console.log('========================================================\n');
    }
    return { sent: false, reason: 'no_smtp' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.trim(),
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_PORT || '') === '465',
    auth: {
      user: SMTP_USER.trim(),
      pass: (SMTP_PASS || '').trim(),
    },
  });

  const from = (SMTP_FROM || SMTP_USER).trim();

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset password — Gudang ATK',
      text: `Reset password (berlaku 1 jam). Buka tautan:\n${resetUrl}\n\nJangan bagikan tautan ini.`,
      html: `<p>Reset password (berlaku <strong>1 jam</strong>).</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Jangan bagikan tautan ini.</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error('[sendMail] Gagal kirim email reset:', err?.message || err);
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========== FALLBACK: tautan reset (email gagal) ==========');
      console.log(`Email: ${to}`);
      console.log(`Buka di browser: ${resetUrl}`);
      console.log('==========================================================\n');
    }
    return { sent: false, reason: 'send_failed' };
  }
}
