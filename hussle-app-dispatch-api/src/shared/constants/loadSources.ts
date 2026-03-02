/**
 * Load source constants — describes how a load entered the system.
 */
export const LOAD_SOURCES = ['DAT', 'MANUAL', 'EMAIL', 'DIRECT'] as const;

export type LoadSource = (typeof LOAD_SOURCES)[number];
