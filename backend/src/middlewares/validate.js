import { ZodError } from 'zod';

import { ApiError } from '../utils/ApiError.js';

const HUMANIZED_FIELD_LABELS = {
  email: 'Email',
  mobile: 'Mobile number',
  pincode: 'Pincode',
  password: 'Password',
  confirmPassword: 'Confirm password',
  linkedinUrl: 'LinkedIn URL',
  portfolioUrl: 'Portfolio URL',
  companyWebsite: 'Company website',
  gstNumber: 'GST number',
  preferredLocation: 'Preferred location',
  preferredIndustry: 'Preferred industry',
  preferredRole: 'Preferred role',
  workModes: 'Work mode',
  fullName: 'Full name',
  dateOfBirth: 'Date of birth',
};

const toSentenceCase = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

const toReadableFieldName = (path = []) => {
  const key = String(path[path.length - 1] || '').trim();
  if (!key) return 'Field';
  return HUMANIZED_FIELD_LABELS[key] || toSentenceCase(key.replace(/([A-Z])/g, ' $1').trim());
};

const normalizeIssueMessage = (issue) => {
  const fieldName = toReadableFieldName(issue.path);
  const message = String(issue.message || '').trim();

  if (!message) {
    return `${fieldName} is invalid.`;
  }

  if (/invalid string: must match pattern/i.test(message)) {
    if (/mobile/i.test(fieldName)) return 'Enter a valid 10 digit mobile number.';
    if (/pincode/i.test(fieldName)) return 'Enter a valid 6 digit pincode.';
    if (/gst/i.test(fieldName)) return 'Enter a valid GST number.';
    return `${fieldName} format is invalid.`;
  }

  if (/invalid email address/i.test(message)) {
    return 'Enter a valid email address.';
  }

  if (/invalid url/i.test(message)) {
    return `${fieldName} is not a valid URL.`;
  }

  if (/invalid input: expected date/i.test(message)) {
    return `${fieldName} is not a valid date.`;
  }

  if (/invalid option/i.test(message) || /invalid enum value/i.test(message)) {
    return `${fieldName} has an invalid value.`;
  }

  if (/too small/i.test(message) || /too short/i.test(message)) {
    return message.endsWith('.') ? message : `${message}.`;
  }

  if (/too big/i.test(message) || /too long/i.test(message)) {
    return message.endsWith('.') ? message : `${message}.`;
  }

  if (/required/i.test(message) || /must include/i.test(message) || /must match/i.test(message)) {
    return message.endsWith('.') ? message : `${message}.`;
  }

  return message.endsWith('.') ? message : `${message}.`;
};

const formatZodIssues = (issues = []) =>
  issues.map((issue) => ({
    ...issue,
    message: normalizeIssueMessage(issue),
  }));

// export const validate = (schema, target = 'body') => (req, _res, next) => {
//   try {
//     req[target] = schema.parse(req[target]);
//     next();
//   } catch (error) {
//     if (error instanceof ZodError) {
//       return next(new ApiError(400, 'Validation failed', error.issues));
//     }
//     return next(error);
//   }
// };

export const validate = (schema, target = 'body') => (req, _res, next) => {
  try {
    const parsed = schema.parse(req[target]);

    if (target === 'query') {
      req.validatedQuery = parsed; // ✅ safe
    } else {
      req[target] = parsed; // body is OK to override
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(400, 'Please check the highlighted form details.', formatZodIssues(error.issues)));
    }
    return next(error);
  }
};
