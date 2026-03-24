import { Box, Divider, Stack, Typography, useTheme } from '@mui/material';

interface SwatchProps {
  label: string;
  color: string;
}

const Swatch: React.FC<SwatchProps> = ({ label, color }) => (
  <Stack alignItems="center" spacing={0.5}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 1,
        bgcolor: color,
        border: 1,
        borderColor: 'divider',
      }}
    />
    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography
      variant="caption"
      sx={{ fontFamily: 'monospace', fontSize: '0.625rem', color: 'text.secondary' }}
    >
      {color}
    </Typography>
  </Stack>
);

interface PaletteRowProps {
  title: string;
  swatches: SwatchProps[];
}

const PaletteRow: React.FC<PaletteRowProps> = ({ title, swatches }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
      {title}
    </Typography>
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {swatches.map((swatch) => (
        <Swatch key={swatch.label} {...swatch} />
      ))}
    </Stack>
  </Box>
);

const SCALE_KEYS = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] as const;

type ScaleShape = Record<string, string>;

const scaleToSwatches = (scale: ScaleShape): SwatchProps[] =>
  SCALE_KEYS.map((key) => ({ label: key, color: scale[key] }));

const PaletteSection = () => {
  const theme = useTheme();
  const { primary, secondary, grey, error, warning, info, success } = theme.palette;

  return (
    <Box>
      <PaletteRow
        title="Primary (Blue)"
        swatches={scaleToSwatches(primary as unknown as ScaleShape)}
      />
      <PaletteRow
        title="Secondary (Green)"
        swatches={scaleToSwatches(secondary as unknown as ScaleShape)}
      />
      <PaletteRow
        title="Grey"
        swatches={[
          { label: '100', color: grey[100] },
          { label: '200', color: grey[200] },
          { label: '300', color: grey[300] },
          { label: '400', color: grey[400] },
          { label: '500', color: grey[500] },
          { label: '600', color: grey[600] },
          { label: '700', color: grey[700] },
          { label: '800', color: grey[800] },
          { label: '900', color: grey[900] },
          { label: '1000', color: (grey as ScaleShape)[1000] },
        ]}
      />
      <PaletteRow
        title="Semantic"
        swatches={[
          { label: 'success', color: success.main },
          { label: 'info', color: info.main },
          { label: 'warning', color: warning.main },
          { label: 'error', color: error.main },
        ]}
      />
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Text & Background
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Swatch label="text.primary" color={theme.palette.text.primary} />
          <Swatch label="text.secondary" color={theme.palette.text.secondary ?? grey[500]} />
          <Swatch label="bg.default" color={theme.palette.background.default} />
          <Swatch label="bg.paper" color={theme.palette.background.paper} />
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Tertiary Colors
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Supporting color scales for data visualization, accents, and semantic states. Access via
        theme.palette.cyan[500], theme.palette.teal[700], etc.
      </Typography>

      <PaletteRow title="Cyan" swatches={scaleToSwatches(theme.palette.cyan as unknown as ScaleShape)} />
      <PaletteRow title="Teal" swatches={scaleToSwatches(theme.palette.teal as unknown as ScaleShape)} />
      <PaletteRow title="Indigo" swatches={scaleToSwatches(theme.palette.indigo as unknown as ScaleShape)} />
      <PaletteRow title="Orange" swatches={scaleToSwatches(theme.palette.orange as unknown as ScaleShape)} />
      <PaletteRow title="Light Blue Vivid" swatches={scaleToSwatches(theme.palette.lightBlueVivid as unknown as ScaleShape)} />
      <PaletteRow title="Red Vivid" swatches={scaleToSwatches(theme.palette.redVivid as unknown as ScaleShape)} />
      <PaletteRow title="Yellow Vivid" swatches={scaleToSwatches(theme.palette.yellowVivid as unknown as ScaleShape)} />
    </Box>
  );
};

export default PaletteSection;
