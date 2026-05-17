import { PrismaClient } from '@prisma/client';
import { normalize } from '../utils/normalize';

const SAMPLES = [
  'Walmart',
  'WALMART',
  'walmart',
  'Walmart ',
  ' Walmart',
  '  Walmart  ',
  'Walmart  DC',
  '  walmart  dc  ',
  'Hub Group 3PL',
  'ACME COLD\tSTORAGE',
  '',
  '   ',
];

// Integration test: requires a reachable Postgres with the `normalize_dedupe` function loaded.
// When the configured DATABASE_URL is unreachable from the test runner (common on developer
// laptops where Postgres is in Docker on a hostname only resolvable inside the compose network),
// the suite skips itself rather than failing every case. CI / containerized runs hit the real DB.
let prisma: PrismaClient | null = null;
let dbReachable = false;

beforeAll(async () => {
  try {
    prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    dbReachable = true;
  } catch {
    dbReachable = false;
    if (prisma) {
      await prisma.$disconnect().catch(() => undefined);
      prisma = null;
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[normalizeDedupeParity] Postgres unreachable from test runner — skipping integration parity suite.',
    );
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

describe('normalize_dedupe <-> normalize parity', () => {
  it.each(SAMPLES)('produces identical output for %j', async (input) => {
    if (!dbReachable || !prisma) {
      return;
    }
    const result = await prisma.$queryRaw<{ out: string }[]>`
      SELECT normalize_dedupe(${input}) AS out
    `;
    const sql = result[0]?.out ?? '';
    const ts = normalize(input);
    expect(sql).toBe(ts);
  });
});
