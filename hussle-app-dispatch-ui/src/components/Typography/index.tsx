import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Stack, Typography } from '@mui/material';

// ==============================|| SHARED PROPS ||============================== //

interface TypoProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

// ==============================|| DISPLAY — h1 (20px / 800) ||============================== //
// Entity IDs, large totals — Load numbers, invoice numbers, action bar amounts

export const EntityId: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h1" sx={{ letterSpacing: '-0.02em', ...sx }}>
    {children}
  </Typography>
);

export const AmountDisplay: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h1" sx={{ fontVariantNumeric: 'tabular-nums', ...sx }}>
    {children}
  </Typography>
);

// ==============================|| TITLE — h2 (18px / 700) ||============================== //
// Page titles, modal titles, drawer titles

export const PageTitle: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h2" sx={sx}>
    {children}
  </Typography>
);

export const DrawerTitle: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h2" sx={sx}>
    {children}
  </Typography>
);

export const ModalTitle: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h2" sx={sx}>
    {children}
  </Typography>
);

// ==============================|| SUBTITLE — h3 (15px / 700) ||============================== //
// Card headers, slide-over IDs, strip amounts

export const SectionTitle: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h3" sx={sx}>
    {children}
  </Typography>
);

export const SlideOverId: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h3" sx={sx}>
    {children}
  </Typography>
);

export const GrossAmount: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h3" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', ...sx }}>
    {children}
  </Typography>
);

// ==============================|| BODY — body1 (13px / 400) ||============================== //
// Table cells, detail row labels/values, nav items, KPI values, form field values

export const Body: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body1" sx={sx}>
    {children}
  </Typography>
);

export const BodyStrong: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body1" sx={{ fontWeight: 600, ...sx }}>
    {children}
  </Typography>
);

export const BodyMedium: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body1" sx={{ fontWeight: 500, ...sx }}>
    {children}
  </Typography>
);

export const BodyMuted: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body1" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const Amount: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', ...sx }}>
    {children}
  </Typography>
);

export const LinkText: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography
    variant="body1"
    sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, ...sx }}
  >
    {children}
  </Typography>
);

// ==============================|| META — body2 (11px / 400) ||============================== //
// Sub-lines, timestamps, metadata, file sizes, broker refs

export const Meta: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const MetaStrong: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, ...sx }}>
    {children}
  </Typography>
);

export const Timestamp: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" color="text.disabled" sx={sx}>
    {children}
  </Typography>
);

export const WarningText: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" sx={{ color: 'warning.main', ...sx }}>
    {children}
  </Typography>
);

export const ErrorText: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" sx={{ color: 'error.main', ...sx }}>
    {children}
  </Typography>
);

export const SuccessText: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" sx={{ color: 'success.main', ...sx }}>
    {children}
  </Typography>
);

export const HintText: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', lineHeight: 1.4, ...sx }}>
    {children}
  </Typography>
);

// ==============================|| LABEL — overline (10px / 700 / UPPERCASE) ||============================== //
// KPI labels, table headers, card labels, form field labels, nav section labels

export const KpiLabel: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="overline" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const TableHeaderLabel: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="overline" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const SectionLabel: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="overline" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const FieldLabel: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="overline" color="text.secondary" sx={sx}>
    {children}
  </Typography>
);

export const NavSectionLabel: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="overline" sx={{ color: 'rgba(255,255,255,.25)', ...sx }}>
    {children}
  </Typography>
);

export const BrandName: React.FC<TypoProps> = ({ children, sx }) => (
  <Typography variant="h3" sx={{ fontWeight: 700, color: 'common.white', ...sx }}>
    {children}
  </Typography>
);

// ==============================|| COMPOSITE COMPONENTS ||============================== //

interface TwoLineCellProps {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  primaryProps?: SxProps<Theme>;
  secondaryProps?: SxProps<Theme>;
  sx?: SxProps<Theme>;
}

export const TwoLineCell: React.FC<TwoLineCellProps> = ({
  primary,
  secondary,
  primaryProps,
  secondaryProps,
  sx,
}) => (
  <Box sx={sx}>
    <Typography variant="body1" sx={primaryProps}>
      {primary}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={secondaryProps}>
      {secondary}
    </Typography>
  </Box>
);

interface KpiCellProps {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueProps?: SxProps<Theme>;
  sx?: SxProps<Theme>;
}

export const KpiCell: React.FC<KpiCellProps> = ({ label, value, sub, valueProps, sx }) => (
  <Stack spacing={0.5} sx={sx}>
    <Typography variant="overline" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, ...valueProps }}>
      {value}
    </Typography>
    {sub && (
      <Typography variant="body2" color="text.secondary">
        {sub}
      </Typography>
    )}
  </Stack>
);

interface DetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueColor?: string;
  noBorder?: boolean;
  sx?: SxProps<Theme>;
}

export const DetailRow: React.FC<DetailRowProps> = ({ label, value, valueColor, noBorder, sx }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="baseline"
    sx={{
      borderBottom: noBorder ? 'none' : '1px solid',
      borderColor: 'grey.200',
      py: 1.25,
      px: 2,
      ...sx,
    }}
  >
    <Typography variant="body1" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, ...(valueColor ? { color: valueColor } : {}) }}>
      {value}
    </Typography>
  </Stack>
);
