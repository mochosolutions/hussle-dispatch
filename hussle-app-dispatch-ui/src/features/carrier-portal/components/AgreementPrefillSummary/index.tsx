import { Box } from '@mui/material';

import { BodyMuted, KpiLabel } from 'components/Typography';

export interface AgreementPrefillSummaryProps {
  variables: Record<string, string>;
  title?: string;
}

/**
 * Convert snake_case → Title Case for human-readable labels.
 *   'carrier_legal_name' → 'Carrier Legal Name'
 */
const humanizeKey = (key: string): string =>
  key
    .split('_')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');

const AgreementPrefillSummary: React.FC<AgreementPrefillSummaryProps> = ({
  variables,
  title = 'Prefilled values',
}) => {
  const entries = Object.entries(variables);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        p: 2,
      }}
    >
      <KpiLabel sx={{ display: 'block', mb: 1.5, fontSize: 11 }}>{title}</KpiLabel>
      {entries.length === 0 ? (
        <BodyMuted sx={{ fontSize: 13 }}>No prefilled values.</BodyMuted>
      ) : (
        <Box component="dl" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {entries.map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Box
                component="dt"
                sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.5 }}
              >
                {humanizeKey(key)}
              </Box>
              <Box
                component="dd"
                sx={{ m: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}
              >
                {value}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AgreementPrefillSummary;
