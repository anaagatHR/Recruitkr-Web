import { z } from 'zod';

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().toLowerCase().trim(),
    mobile: z
      .string()
      .trim()
      .regex(/^\d{10}$/)
      .optional()
      .or(z.literal('')),
    message: z.string().trim().min(10).max(3000),
    // Honeypot: a visually hidden field real users never fill in. Bots that
    // autofill every input trip it. Must be empty (or absent).
    website: z.string().max(0).optional().or(z.literal('')),
    // Cloudflare Turnstile response token; verified server-side when the
    // secret is configured.
    turnstileToken: z.string().trim().max(2048).optional().or(z.literal('')),
    // Which page sent it. Business OS lists these as Client Queries and filters
    // by page; the partners form sends "partners". Absent = the contact page.
    source: z.enum(['contact', 'partners']).optional(),
    company: z.string().trim().max(120).optional().or(z.literal('')),
    subject: z.string().trim().max(120).optional().or(z.literal('')),
  })
  .strict();

export const contactStatusSchema = z
  .object({
    status: z.enum(['unread', 'read']),
  })
  .strict();
