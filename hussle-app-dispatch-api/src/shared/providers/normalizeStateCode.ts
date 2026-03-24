const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

const VALID_STATE_CODES = new Set(Object.values(STATE_NAME_TO_CODE));

/**
 * Normalizes a US state value to a two-letter uppercase code.
 * Accepts full state names ("California" → "CA"), abbreviations ("ca" → "CA"),
 * or already-normalized codes ("CA" → "CA").
 * Returns the original value trimmed if no match is found.
 */
export const normalizeStateCode = (value: string): string => {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  if (VALID_STATE_CODES.has(upper) && upper.length === 2) {
    return upper;
  }

  const lower = trimmed.toLowerCase();
  const mapped = STATE_NAME_TO_CODE[lower];

  if (mapped !== undefined) {
    return mapped;
  }

  return trimmed;
};
