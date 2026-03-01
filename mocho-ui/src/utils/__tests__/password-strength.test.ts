import { strengthIndicator, strengthColor } from '../password-strength';

describe('strengthIndicator', () => {
  it('returns 0 for empty password', () => {
    expect(strengthIndicator('')).toBe(0);
  });

  it('returns 0 for very short passwords without other criteria', () => {
    // Short password with only lowercase letters
    expect(strengthIndicator('abc')).toBe(0);
    expect(strengthIndicator('hello')).toBe(0);
  });

  it('returns 1 for short passwords with numbers', () => {
    // Has number criteria but not length criteria
    expect(strengthIndicator('12345')).toBe(1);
    expect(strengthIndicator('abc1')).toBe(1);
  });

  it('returns 1 for passwords longer than 5 chars', () => {
    expect(strengthIndicator('abcdef')).toBe(1);
  });

  it('returns 2 for passwords longer than 7 chars', () => {
    expect(strengthIndicator('abcdefgh')).toBe(2);
  });

  it('adds 1 for passwords with numbers', () => {
    const withoutNumber = strengthIndicator('abcdefgh');
    const withNumber = strengthIndicator('abcdefg1');
    expect(withNumber).toBe(withoutNumber + 1);
  });

  it('adds 1 for passwords with special characters', () => {
    const withoutSpecial = strengthIndicator('abcdefgh');
    const withSpecial = strengthIndicator('abcdefg!');
    expect(withSpecial).toBe(withoutSpecial + 1);
  });

  it('adds 1 for passwords with mixed case', () => {
    const lowerOnly = strengthIndicator('abcdefgh');
    const mixedCase = strengthIndicator('Abcdefgh');
    expect(mixedCase).toBe(lowerOnly + 1);
  });

  it('returns maximum score of 5 for strong passwords', () => {
    // > 7 chars (2) + number (1) + special (1) + mixed case (1) = 5
    const strongPassword = 'MyP@ssw0rd';
    expect(strengthIndicator(strongPassword)).toBe(5);
  });
});

describe('strengthColor', () => {
  it('returns Poor for score 0-1', () => {
    expect(strengthColor(0)).toEqual({ label: 'Poor', color: 'error.main' });
    expect(strengthColor(1)).toEqual({ label: 'Poor', color: 'error.main' });
  });

  it('returns Weak for score 2', () => {
    expect(strengthColor(2)).toEqual({ label: 'Weak', color: 'warning.main' });
  });

  it('returns Normal for score 3', () => {
    expect(strengthColor(3)).toEqual({ label: 'Normal', color: 'warning.dark' });
  });

  it('returns Good for score 4', () => {
    expect(strengthColor(4)).toEqual({ label: 'Good', color: 'success.main' });
  });

  it('returns Strong for score 5', () => {
    expect(strengthColor(5)).toEqual({ label: 'Strong', color: 'success.dark' });
  });

  it('returns Poor for score 6 or higher (fallback)', () => {
    expect(strengthColor(6)).toEqual({ label: 'Poor', color: 'error.main' });
    expect(strengthColor(100)).toEqual({ label: 'Poor', color: 'error.main' });
  });

  it('returns Poor for negative scores', () => {
    expect(strengthColor(-1)).toEqual({ label: 'Poor', color: 'error.main' });
  });
});
