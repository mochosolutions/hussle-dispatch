import { ADMIN_ONLY_TRANSITIONS, NOTES_REQUIRED_TRANSITIONS } from '../stateMachine';

describe('ADMIN_ONLY_TRANSITIONS', () => {
  it('contains EXCEPTION and PAID', () => {
    expect(ADMIN_ONLY_TRANSITIONS).toContain('EXCEPTION');
    expect(ADMIN_ONLY_TRANSITIONS).toContain('PAID');
  });

  it('contains exactly 2 transitions', () => {
    expect(ADMIN_ONLY_TRANSITIONS).toHaveLength(2);
  });

  it('is a frozen array', () => {
    expect(Object.isFrozen(ADMIN_ONLY_TRANSITIONS)).toBe(true);
  });
});

describe('NOTES_REQUIRED_TRANSITIONS', () => {
  it('contains EXCEPTION and CANCELED', () => {
    expect(NOTES_REQUIRED_TRANSITIONS).toContain('EXCEPTION');
    expect(NOTES_REQUIRED_TRANSITIONS).toContain('CANCELED');
  });

  it('contains exactly 2 transitions', () => {
    expect(NOTES_REQUIRED_TRANSITIONS).toHaveLength(2);
  });

  it('is a frozen array', () => {
    expect(Object.isFrozen(NOTES_REQUIRED_TRANSITIONS)).toBe(true);
  });
});
