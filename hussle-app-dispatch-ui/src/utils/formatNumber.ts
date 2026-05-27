/**
 * Formats a number with thousand separators (commas).
 * Returns '—' for null/undefined values.
 *
 * @param value - The number to format
 * @param decimals - Maximum decimal places (default: 0)
 */
const formatNumber = (
  value: number | string | null | undefined,
  decimals = 0,
): string => {
  if (value === null || value === undefined || value === '') return '—';

  const num = typeof value === 'string' ? Number(value) : value;

  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(num);
};

export default formatNumber;
