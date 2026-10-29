// Accepts "98765 43210", "+91 9876543210", "09876543210"; returns the bare digits
// (10 for a well-formed Indian mobile). Non-strings pass through untouched.
export const normalizeIndianMobile = (value) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 && /^(91|0)/.test(digits) ? digits.slice(-10) : digits;
};

export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export const isIndianMobile = (value) => INDIAN_MOBILE_PATTERN.test(normalizeIndianMobile(value) || '');
