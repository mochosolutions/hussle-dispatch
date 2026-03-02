/**
 * Geo source constants — derived from the GeoSource Prisma enum.
 * Describes how a place's coordinates were determined.
 */
export const GEO_SOURCES = Object.freeze({
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
} as const);

export type GeoSource = (typeof GEO_SOURCES)[keyof typeof GEO_SOURCES];
