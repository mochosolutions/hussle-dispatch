import { generateShortSlug } from '../generateShortSlug';

describe('generateShortSlug', () => {
  it('returns an 8-character slug', () => {
    const slug = generateShortSlug();

    expect(slug).toHaveLength(8);
  });

  it('returns a slug containing only [A-Za-z0-9]', () => {
    const slug = generateShortSlug();

    expect(slug).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('produces statistically unique slugs over 1000 invocations', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      slugs.add(generateShortSlug());
    }

    expect(slugs.size).toBeGreaterThan(990);
  });
});
