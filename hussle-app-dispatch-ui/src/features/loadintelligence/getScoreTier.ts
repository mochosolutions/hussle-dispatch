export interface ScoreTierResult {
  tier: string;
  label: string;
  color: string;
  bgColor: string;
  icon: 'star' | 'x';
}

const EXCELLENT: ScoreTierResult = {
  tier: 'excellent',
  label: 'Excellent',
  color: '#2e7d32',
  bgColor: '#e8f5e9',
  icon: 'star',
};

const GOOD: ScoreTierResult = {
  tier: 'good',
  label: 'Good',
  color: '#43a047',
  bgColor: '#e8f5e9',
  icon: 'star',
};

const FAIR: ScoreTierResult = {
  tier: 'fair',
  label: 'Fair',
  color: '#ef6c00',
  bgColor: '#fff3e0',
  icon: 'x',
};

const PASS: ScoreTierResult = {
  tier: 'pass',
  label: 'Pass',
  color: '#e53935',
  bgColor: '#ffebee',
  icon: 'x',
};

const FAIL: ScoreTierResult = {
  tier: 'fail',
  label: 'Fail',
  color: '#b71c1c',
  bgColor: '#ffebee',
  icon: 'x',
};

export const getScoreTier = (score: number): ScoreTierResult => {
  if (score >= 90) {
    return EXCELLENT;
  }

  if (score >= 70) {
    return GOOD;
  }

  if (score >= 50) {
    return FAIR;
  }

  if (score >= 25) {
    return PASS;
  }

  return FAIL;
};
