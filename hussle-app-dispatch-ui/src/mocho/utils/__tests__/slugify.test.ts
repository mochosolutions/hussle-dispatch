import { generateSlug } from '../slugify';

describe('generateSlug', () => {
  it('converts text to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('hello world')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world');
    expect(generateSlug('Test@#$%String')).toBe('teststring');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('hello   world')).toBe('hello-world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('-hello-world-')).toBe('hello-world');
  });

  it('handles multiple consecutive hyphens', () => {
    expect(generateSlug('hello---world')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('');
  });

  it('preserves numbers', () => {
    expect(generateSlug('Version 2.0 Release')).toBe('version-20-release');
  });

  it('handles mixed case and special characters', () => {
    expect(generateSlug('TypeScript & React')).toBe('typescript-react');
  });

  it('handles accented characters by removing them', () => {
    expect(generateSlug('café résumé')).toBe('caf-rsum');
  });

  it('handles underscores (keeps them as word characters)', () => {
    expect(generateSlug('hello_world')).toBe('hello_world');
  });
});
