import { PROHIBITED_COMMODITIES_DEFAULT } from '../commodities';

describe('PROHIBITED_COMMODITIES_DEFAULT', () => {
  it('includes garbage, refuse, recyclables, and dirty recyclables', () => {
    expect(PROHIBITED_COMMODITIES_DEFAULT).toContain('garbage');
    expect(PROHIBITED_COMMODITIES_DEFAULT).toContain('refuse');
    expect(PROHIBITED_COMMODITIES_DEFAULT).toContain('recyclables');
    expect(PROHIBITED_COMMODITIES_DEFAULT).toContain('dirty recyclables');
  });

  it('has exactly 4 entries', () => {
    expect(PROHIBITED_COMMODITIES_DEFAULT).toHaveLength(4);
  });

  it('is a frozen array', () => {
    expect(Object.isFrozen(PROHIBITED_COMMODITIES_DEFAULT)).toBe(true);
  });
});
