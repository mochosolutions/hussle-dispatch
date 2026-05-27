import { extractErrorMessage } from '../extractErrorMessage';

describe('extractErrorMessage', () => {
  it('returns the backend envelope message when present', () => {
    const error = {
      response: { data: { errors: [{ message: 'Cooldown not elapsed' }] } },
    };

    expect(extractErrorMessage(error)).toBe('Cooldown not elapsed');
  });

  it('falls back to Error.message when no backend envelope is present', () => {
    const error = new Error('Network down');

    expect(extractErrorMessage(error)).toBe('Network down');
  });

  it('returns the provided fallback for unknown error shapes', () => {
    expect(extractErrorMessage('weird', 'Failed to do thing')).toBe('Failed to do thing');
  });

  it('returns the default fallback when no fallback is provided', () => {
    expect(extractErrorMessage(undefined)).toBe('Something went wrong');
  });

  it('skips an empty backend message and falls through to Error.message', () => {
    const error = Object.assign(new Error('underlying'), {
      response: { data: { errors: [{ message: '' }] } },
    });

    expect(extractErrorMessage(error)).toBe('underlying');
  });

  it('skips an empty Error.message and returns the fallback', () => {
    const error = new Error('');

    expect(extractErrorMessage(error, 'fallback')).toBe('fallback');
  });
});
