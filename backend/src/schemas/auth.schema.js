import { z } from 'zod';

import { normalizeOptionalHttpUrl, normalizeOptionalLinkedinUrl } from '../utils/url.js';

const email = z.string().trim().email('Enter a valid email address').toLowerCase();
const mobile = z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10 digit mobile number');
// Optional mobile that also accepts an empty string (mobile is no longer mandatory).
const optionalMobile = mobile.optional().or(z.literal(''));
const optionalEmail = email.optional().or(z.literal(''));
// Only a minimum length is enforced now; complexity requirements were removed by request.
const password = z.string().min(8, 'Password must be at least 8 characters long').max(128);

const optionalHttpUrl = z.preprocess(
  normalizeOptionalHttpUrl,
  z.string().url('Enter a valid website URL').optional().or(z.literal('')),
);

const optionalLinkedinUrl = z.preprocess(
  normalizeOptionalLinkedinUrl,
  z.string().url('Enter a valid LinkedIn URL').optional().or(z.literal('')),
);

const generatedResumeDataSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    summary: z.string().trim().max(1200).optional().default(''),
    skills: z.array(z.string().trim().min(1).max(80)).max(50),
    education: z
      .array(
        z
          .object({
            degree: z.string().trim().max(120).optional().default(''),
            institution: z.string().trim().max(160).optional().default(''),
            year: z.string().trim().max(40).optional().default(''),
            description: z.string().trim().max(400).optional().default(''),
          })
          .strict(),
      )
      .max(20),
    experience: z
      .array(
        z
          .object({
            title: z.string().trim().max(120).optional().default(''),
            company: z.string().trim().max(160).optional().default(''),
            duration: z.string().trim().max(80).optional().default(''),
            description: z.string().trim().max(400).optional().default(''),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1),
    role: z.enum(['candidate', 'client', 'admin']),
  })
  .strict();

// Only email + password are mandatory. Every other detail is optional and can be
// completed later from the candidate dashboard.
export const candidateRegisterSchema = z
  .object({
    email,
    password,
    mobile: optionalMobile,
    fullName: z.string().trim().min(2).max(120).optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer Not to Say']).optional(),
    address: z.string().trim().max(500).optional(),
    pincode: z
      .string()
      .regex(/^\d{6}$/, 'Enter a valid 6 digit pincode')
      .optional()
      .or(z.literal('')),
    linkedinUrl: optionalLinkedinUrl,
    portfolioUrl: optionalHttpUrl,
    highestQualification: z.string().trim().min(2).max(100).optional(),
    experienceStatus: z.enum(['fresher', 'experienced']).optional(),
    experienceDetails: z
      .object({
        currentCompany: z.string().trim().min(2).max(150).optional(),
        designation: z.string().trim().min(2).max(100).optional(),
        totalExperience: z.string().trim().min(1).max(50).optional(),
        industry: z.string().trim().min(2).max(100).optional(),
        currentCtcLpa: z.number().nonnegative().optional(),
        expectedCtcLpa: z.number().nonnegative().optional(),
        minimumCtcLpa: z.number().nonnegative().optional(),
        noticePeriod: z.string().trim().min(1).max(50).optional(),
        lastWorkingDay: z.coerce.date().optional(),
      })
      .optional(),
    preferences: z
      .object({
        preferredLocation: z.string().trim().max(100).optional(),
        preferredIndustry: z.string().trim().max(100).optional(),
        preferredRole: z.string().trim().max(100).optional(),
        workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).optional(),
      })
      .strict()
      .optional(),
    declarationAccepted: z.boolean().optional(),
    representationAuthorized: z.boolean().optional(),
    resumeType: z.enum(['uploaded', 'generated']).optional(),
    resumeUrl: optionalHttpUrl.optional(),
    resumeFileId: z.string().trim().min(3).max(255).optional(),
    resumeFileName: z.string().trim().min(1).max(255).optional(),
    resumeData: generatedResumeDataSchema.optional(),
  })
  .strict()
  .refine(
    (payload) =>
      !payload.resumeType ||
      (payload.resumeType === 'uploaded' &&
        Boolean(payload.resumeUrl) &&
        Boolean(payload.resumeFileId) &&
        !payload.resumeData) ||
      (payload.resumeType === 'generated' &&
        Boolean(payload.resumeData) &&
        !payload.resumeUrl &&
        !payload.resumeFileId),
    {
      message: 'Send either resumeUrl + resumeFileId for uploaded resumes or resumeData for generated resumes',
      path: ['resumeType'],
    },
  );

// Only email + password are mandatory. Company, SPOC, commercial and billing
// details are optional and can be completed later from the client dashboard.
export const clientRegisterSchema = z
  .object({
    email,
    password,
    mobile: optionalMobile,
    companyName: z.string().trim().max(180).optional(),
    industry: z.string().trim().max(100).optional(),
    companyWebsite: optionalHttpUrl,
    companySize: z.string().trim().max(80).optional(),
    companyType: z.string().trim().max(80).optional(),
    spoc: z
      .object({
        name: z.string().trim().max(120).optional(),
        designation: z.string().trim().max(120).optional(),
        mobile: optionalMobile,
        email: optionalEmail,
      })
      .strict()
      .optional(),
    commercial: z
      .object({
        recruitmentModel: z.string().trim().max(80).optional(),
        replacementPeriod: z.string().trim().max(80).optional(),
        paymentTerms: z.string().trim().max(120).optional(),
      })
      .strict()
      .optional(),
    billing: z
      .object({
        billingCompanyName: z.string().trim().max(180).optional(),
        gstNumber: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[0-9A-Z]{15}$/, 'Enter a valid 15 character GST number')
          .optional()
          .or(z.literal('')),
        billingAddress: z.string().trim().max(500).optional(),
        billingEmail: optionalEmail,
      })
      .strict()
      .optional(),
    declarationAccepted: z.boolean().optional(),
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: z.string().min(20).optional() }).strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string().min(6).optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'Confirm password must match new password',
      path: ['confirmPassword'],
    },
  )
  .strict();

export const resetPasswordParamsSchema = z
  .object({
    token: z.string().min(20),
  })
  .strict();
