import { truncateRawData } from '../mappers/truncateRawData';

describe('truncateRawData', () => {
  it('strips array-valued keys', () => {
    const input = {
      name: 'test',
      stops: ['a', 'b'],
      comments: ['c'],
      city: 'Dallas',
    };

    const result = truncateRawData(input);

    expect(result.stops).toBeUndefined();
    expect(result.comments).toBeUndefined();
  });

  it('preserves non-array fields', () => {
    const input = {
      name: 'test',
      city: 'Dallas',
      rate: 1500,
      nested: { foo: 'bar' },
    };

    const result = truncateRawData(input);

    expect(result.name).toBe('test');
    expect(result.city).toBe('Dallas');
    expect(result.rate).toBe(1500);
    expect(result.nested).toEqual({ foo: 'bar' });
  });

  it('does not mutate the original object', () => {
    const input = { name: 'test', stops: ['a', 'b'] };
    truncateRawData(input);
    expect(input.stops).toEqual(['a', 'b']);
  });

  it('caps output at 2KB by removing largest keys', () => {
    const longString = 'x'.repeat(1500);
    const input = {
      bigField: longString,
      smallField: 'short',
    };

    const result = truncateRawData(input);

    const size = Buffer.byteLength(JSON.stringify(result), 'utf8');
    expect(size).toBeLessThanOrEqual(2048);
  });

  it('preserves small objects unchanged', () => {
    const input = { city: 'Dallas', state: 'TX', rate: 1500 };
    const result = truncateRawData(input);
    expect(result).toEqual(input);
  });

  it('handles empty object', () => {
    expect(truncateRawData({})).toEqual({});
  });
});
