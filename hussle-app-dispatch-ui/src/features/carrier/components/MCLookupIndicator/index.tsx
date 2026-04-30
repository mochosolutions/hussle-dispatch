import { Meta } from 'components/Typography';
import type { LookupStatus } from '../../types';

interface MCLookupIndicatorProps {
  status: LookupStatus;
}

const STATUS_CONFIG: Record<Exclude<LookupStatus, 'idle'>, { color: string; text: string }> = {
  searching: { color: 'primary.main', text: 'Looking up FMCSA…' },
  found: { color: 'success.main', text: 'Authority verified ✓' },
  not_found: { color: 'warning.main', text: 'Not found — verify number' },
};

export const MCLookupIndicator = ({ status }: MCLookupIndicatorProps) => {
  if (status === 'idle') {
    return null;
  }

  const config = STATUS_CONFIG[status];

  return (
    <Meta sx={{ color: config.color, fontWeight: 500, mt: 0.5, display: 'block' }}>
      {status === 'searching' ? '⟳ ' : ''}
      {config.text}
    </Meta>
  );
};
