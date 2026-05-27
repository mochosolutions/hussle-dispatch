/**
 * Formats a raw phone string into (###) ###-#### format.
 * Strips all non-digit characters first, then applies the mask.
 * Returns the original value if it doesn't contain exactly 10 digits.
 */
const formatPhone = (value: string | null | undefined): string => {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');

  if (digits.length !== 10) return value;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default formatPhone;
