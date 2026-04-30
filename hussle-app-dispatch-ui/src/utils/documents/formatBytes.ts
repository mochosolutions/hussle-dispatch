/**
 * Format a byte count as a human-readable string.
 *
 * Examples: 0 -> "0 B", 1024 -> "1 KB", 1536 -> "1.5 KB", 10485760 -> "10 MB".
 *
 * Returns an em-dash for null/undefined/NaN to allow direct rendering in tables.
 */
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return '—';
  }
  if (bytes === 0) {
    return '0 B';
  }

  const absBytes = Math.abs(bytes);
  const exponent = Math.min(
    Math.floor(Math.log(absBytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  // Show one decimal for fractional values, otherwise an integer.
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${formatted} ${UNITS[exponent]}`;
};
