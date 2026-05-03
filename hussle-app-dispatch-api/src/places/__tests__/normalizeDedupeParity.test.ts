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

describe('normalize_dedupe <-> normalize parity', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.each(SAMPLES)('produces identical output for %j', async (input) => {
    const result = await prisma.$queryRaw<{ out: string }[]>`
      SELECT normalize_dedupe(${input}) AS out
    `;
    const sql = result[0]?.out ?? '';
    const ts = normalize(input);
    expect(sql).toBe(ts);
  });
});
