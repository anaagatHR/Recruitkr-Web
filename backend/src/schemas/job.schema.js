import { z } from 'zod';

// Only jobTitle + jobDescription are mandatory. Every other field is optional
// so a requirement can be posted quickly and refined later.
export const createJobSchema = z
  .object({
    jobTitle: z.string().trim().min(2).max(120),
    jobDescription: z.string().trim().min(1).max(5000),
    company: z.string().trim().min(1).max(180).optional(),
    openings: z.number().int().positive().optional(),
    department: z.string().trim().max(100).optional(),
    category: z.string().trim().max(100).optional(),
    jobLocation: z.string().trim().max(100).optional(),
    employmentType: z.string().trim().max(50).optional(),
    experienceRequired: z.string().trim().max(80).optional(),
    qualification: z.string().trim().max(100).optional(),
    minCtcLpa: z.number().nonnegative().optional(),
    maxCtcLpa: z.number().nonnegative().optional(),
    fixedPrice: z.number().nonnegative().optional(),
    salaryCurrency: z.string().trim().max(10).optional(),
    preferredIndustryBackground: z.string().trim().max(120).optional(),
    genderPreference: z.string().trim().max(40).optional(),
    ageRequirement: z.string().trim().max(40).optional(),
    workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).optional(),
    requirements: z.array(z.string().trim().min(1).max(300)).optional(),
    responsibilities: z.array(z.string().trim().min(1).max(300)).optional(),
    skills: z.array(z.string().trim().min(1).max(120)).optional(),
    urgencyLevel: z.string().trim().max(80).optional(),
    expectedJoiningDate: z.coerce.date().optional(),
    contactEmail: z.string().trim().email().max(320).optional(),
  })
  .strict();

export const updateJobStatusSchema = z
  .object({
    status: z.enum(['active', 'on-hold', 'closed']),
  })
  .strict();

export const updateJobSchema = createJobSchema.partial().strict();

export const listJobsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    location: z.string().trim().max(80).optional(),
    type: z.string().trim().max(50).optional(),
  })
   .strict();

