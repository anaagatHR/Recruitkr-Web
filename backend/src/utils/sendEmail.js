import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

import { ApiError } from './ApiError.js';
import { createQueue } from './taskQueue.js';

let transporter = null;

// Transactional email queue: SMTP handshakes are slow (100ms-2s each). A burst
// of password resets should drain in order, not open dozens of parallel SMTP
// sockets on a 0.5-CPU box.
const emailQueue = createQueue({
  name: 'email',
  concurrency: 2,
  maxQueue: 50,
  busyMessage: 'Too many emails queued right now. Please try again shortly.',
});

const getTransporter = () => {
  if (!env.BREVO_EMAIL || !env.BREVO_SMTP_KEY) {
    throw new ApiError(
      503,
      'Email service is not configured. Set BREVO_EMAIL and BREVO_SMTP_KEY.',
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: env.BREVO_EMAIL,
        pass: env.BREVO_SMTP_KEY,
      },
      // Bounded waits: a hung SMTP connection must fail fast instead of
      // holding the request (password reset etc.) open indefinitely.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  return transporter;
};

// Shared Brevo SMTP sender used by password reset and any future transactional emails.
export const sendEmail = async ({ to, subject, html, text }) => {
  const client = getTransporter();

  return emailQueue.run(() =>
    client.sendMail({
      from: env.BREVO_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  );
};
