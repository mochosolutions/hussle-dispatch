import { prisma } from '../config/database';
import { SequenceError } from './errors';

export type SequenceType = 'LOAD' | 'INVOICE';

const SEQUENCE_PREFIX: Record<SequenceType, string> = {
  LOAD: 'LD',
  INVOICE: 'INV',
};

const MAX_RETRIES = 3;

/**
 * Returns the Postgres sequence name for a given type and org.
 * Sequences are per-organisation and continuous (no annual reset).
 */
const sequenceName = (type: SequenceType, orgId: string): string =>
  `seq_${type.toLowerCase()}_${orgId.replace(/-/g, '_')}`;

/**
 * Ensures the Postgres sequence exists, then advances it and returns the next value.
 */
const nextSequenceValue = async (name: string): Promise<bigint> => {
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS "${name}" START WITH 1 INCREMENT BY 1`,
  );
  const rows = await prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
    `SELECT nextval('"${name}"') AS nextval`,
  );
  const row = rows[0];
  if (row === undefined) {
    throw new SequenceError('Sequence returned no value');
  }
  return row.nextval;
};

/**
 * Formats a sequence number as a zero-padded 6-digit string with year prefix.
 * Pattern: {PREFIX}-{YYYY}-{NNNNNN}
 * Example: LD-2026-000001, INV-2026-000001
 *
 * The year is stamped at generation time; numbering is continuous (no annual reset).
 */
const formatSequenceNumber = (type: SequenceType, value: bigint): string => {
  const prefix = SEQUENCE_PREFIX[type];
  const year = new Date().getFullYear();
  const padded = String(value).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
};

/**
 * Generates a formatted sequence number for a load or invoice.
 * Retries on collision up to MAX_RETRIES times (decision L-011).
 *
 * @param type  'LOAD' | 'INVOICE'
 * @param orgId The organisation UUID — sequences are scoped per org
 * @returns     Formatted string e.g. LD-2026-000001 or INV-2026-000042
 */
export const generateSequenceNumber = async (
  type: SequenceType,
  orgId: string,
): Promise<string> => {
  const name = sequenceName(type, orgId);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const value = await nextSequenceValue(name);
      return formatSequenceNumber(type, value);
    } catch {
      // retry on transient failure
    }
  }

  throw new SequenceError(
    `Failed to generate sequence number after ${MAX_RETRIES} attempts`,
  );
};
