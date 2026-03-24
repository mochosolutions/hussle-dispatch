import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material';

interface VariantRow {
  variant:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'overline'
    | 'button';
  sample: string;
  role: string;
}

const VARIANT_ROWS: VariantRow[] = [
  { variant: 'h1', sample: 'LD-2026-000007 — $4,250.00', role: 'Display — entity IDs, totals' },
  { variant: 'h2', sample: 'Dispatch Board', role: 'Title — page, modal, drawer' },
  { variant: 'h3', sample: 'Load Information', role: 'Subtitle — card headers, amounts' },
  { variant: 'h4', sample: 'Active Loads', role: 'Compat — not primary UI' },
  { variant: 'h5', sample: 'Driver Assignment', role: 'Compat' },
  { variant: 'h6', sample: 'Last updated 3 min ago', role: 'Compat' },
  { variant: 'subtitle1', sample: 'Total Revenue This Week', role: 'Subtitle 1' },
  { variant: 'subtitle2', sample: 'Showing 24 of 128 results', role: 'Subtitle 2' },
  {
    variant: 'body1',
    sample: 'Pickup at 1200 Industrial Blvd, Dallas TX 75207. Contact: Jim (214) 555-0142.',
    role: 'Body — table cells, detail rows, nav',
  },
  {
    variant: 'body2',
    sample: 'Rate confirmation sent on Mar 18, 2026. Awaiting carrier signature.',
    role: 'Meta — sub-lines, timestamps',
  },
  { variant: 'caption', sample: 'MC# 483291 | DOT# 2847103', role: 'Caption — 10px' },
  { variant: 'overline', sample: 'Invoice Status', role: 'Label — KPI, headers, fields' },
  { variant: 'button', sample: 'Create Load', role: 'Button — no auto-capitalize' },
];

const getSpecValue = (spec: unknown, key: string): string => {
  if (typeof spec === 'object' && spec !== null && key in spec) {
    return String((spec as Record<string, unknown>)[key]);
  }
  return '—';
};

const TypographySection = () => {
  const theme = useTheme();
  const typo = theme.typography;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Font family: <strong>{String(typo.fontFamily)}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Weights: Light {String(typo.fontWeightLight)} | Regular{' '}
        {String(typo.fontWeightRegular)} | Medium {String(typo.fontWeightMedium)} | Bold{' '}
        {String(typo.fontWeightBold)}
      </Typography>

      <Stack spacing={0}>
        {VARIANT_ROWS.map((row) => {
          const spec = typo[row.variant];
          const fontSize = getSpecValue(spec, 'fontSize');
          const fontWeight = getSpecValue(spec, 'fontWeight');
          const lineHeight = getSpecValue(spec, 'lineHeight');
          const letterSpacing = getSpecValue(spec, 'letterSpacing');
          const textTransform = getSpecValue(spec, 'textTransform');

          return (
            <Box key={row.variant}>
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                sx={{ py: 2 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {row.variant === 'button' ? (
                    <Button variant="contained" size="medium">
                      {row.sample}
                    </Button>
                  ) : (
                    <Typography variant={row.variant}>{row.sample}</Typography>
                  )}
                </Box>
                <Stack
                  direction="column"
                  spacing={0.25}
                  sx={{ flexShrink: 0, ml: 3, alignItems: 'flex-end' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="baseline">
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'primary.main',
                        minWidth: 72,
                      }}
                    >
                      {row.variant}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                    >
                      {fontSize} / {fontWeight} / {lineHeight}
                      {letterSpacing !== '—' ? ` / ls:${letterSpacing}` : ''}
                      {textTransform !== '—' ? ` / ${textTransform}` : ''}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: 'text.secondary', fontStyle: 'italic' }}
                  >
                    {row.role}
                  </Typography>
                </Stack>
              </Stack>
              <Divider />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default TypographySection;
