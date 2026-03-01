import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Button, Stack, Paper, Grid, TextField, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Component to display a color swatch
const ColorSwatch = ({ color, label, hex }: { color: string; label: string; hex?: string }) => (
  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
    <Box
      sx={{
        width: 60,
        height: 60,
        backgroundColor: color,
        borderRadius: 1,
        mb: 1,
        mx: 'auto',
        border: '1px solid',
        borderColor: 'divider',
      }}
    />
    <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    {hex && (
      <Typography variant="caption" display="block" color="text.secondary">
        {hex}
      </Typography>
    )}
  </Box>
);

// Component to display a color palette row
const PaletteRow = ({ name, palette }: { name: string; palette: Record<string, string> }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
      {name}
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {palette.lighter && <ColorSwatch color={palette.lighter} label="lighter" />}
      {palette.light && <ColorSwatch color={palette.light} label="light" />}
      {palette.main && <ColorSwatch color={palette.main} label="main" />}
      {palette.dark && <ColorSwatch color={palette.dark} label="dark" />}
      {palette.darker && <ColorSwatch color={palette.darker} label="darker" />}
    </Stack>
  </Box>
);

// Main theme showcase component
const ThemeShowcase = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Typography variant="h4" gutterBottom>
        Theme Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Use the toolbar controls above to switch between theme presets and light/dark modes.
      </Typography>

      {/* Color Palettes */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Color Palettes
        </Typography>

        <PaletteRow
          name="Primary"
          palette={{
            lighter: theme.palette.primary.lighter,
            light: theme.palette.primary.light,
            main: theme.palette.primary.main,
            dark: theme.palette.primary.dark,
            darker: theme.palette.primary.darker,
          }}
        />

        <PaletteRow
          name="Secondary"
          palette={{
            lighter: theme.palette.secondary.lighter,
            light: theme.palette.secondary.light,
            main: theme.palette.secondary.main,
            dark: theme.palette.secondary.dark,
            darker: theme.palette.secondary.darker,
          }}
        />

        <PaletteRow
          name="Error"
          palette={{
            lighter: theme.palette.error.lighter,
            light: theme.palette.error.light,
            main: theme.palette.error.main,
            dark: theme.palette.error.dark,
            darker: theme.palette.error.darker,
          }}
        />

        <PaletteRow
          name="Warning"
          palette={{
            lighter: theme.palette.warning.lighter,
            light: theme.palette.warning.light,
            main: theme.palette.warning.main,
            dark: theme.palette.warning.dark,
            darker: theme.palette.warning.darker,
          }}
        />

        <PaletteRow
          name="Info"
          palette={{
            lighter: theme.palette.info.lighter,
            light: theme.palette.info.light,
            main: theme.palette.info.main,
            dark: theme.palette.info.dark,
            darker: theme.palette.info.darker,
          }}
        />

        <PaletteRow
          name="Success"
          palette={{
            lighter: theme.palette.success.lighter,
            light: theme.palette.success.light,
            main: theme.palette.success.main,
            dark: theme.palette.success.dark,
            darker: theme.palette.success.darker,
          }}
        />
      </Paper>

      {/* Typography */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Typography
        </Typography>

        <Stack spacing={2}>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
          <Typography variant="subtitle1">Subtitle 1</Typography>
          <Typography variant="subtitle2">Subtitle 2</Typography>
          <Typography variant="body1">
            Body 1 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
          <Typography variant="body2">
            Body 2 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
          <Typography variant="caption">Caption text</Typography>
          <Typography variant="overline">Overline text</Typography>
        </Stack>
      </Paper>

      {/* Component Showcase */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Component Showcase
        </Typography>

        {/* Buttons */}
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Buttons
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button variant="contained" color="primary">
            Primary
          </Button>
          <Button variant="contained" color="secondary">
            Secondary
          </Button>
          <Button variant="contained" color="error">
            Error
          </Button>
          <Button variant="contained" color="warning">
            Warning
          </Button>
          <Button variant="contained" color="info">
            Info
          </Button>
          <Button variant="contained" color="success">
            Success
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button variant="outlined" color="primary">
            Primary
          </Button>
          <Button variant="outlined" color="secondary">
            Secondary
          </Button>
          <Button variant="outlined" color="error">
            Error
          </Button>
          <Button variant="outlined" color="warning">
            Warning
          </Button>
          <Button variant="outlined" color="info">
            Info
          </Button>
          <Button variant="outlined" color="success">
            Success
          </Button>
        </Stack>

        {/* Chips */}
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Chips
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Chip label="Primary" color="primary" />
          <Chip label="Secondary" color="secondary" />
          <Chip label="Error" color="error" />
          <Chip label="Warning" color="warning" />
          <Chip label="Info" color="info" />
          <Chip label="Success" color="success" />
        </Stack>

        {/* Text Fields */}
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Text Fields
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Standard" variant="standard" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Outlined" variant="outlined" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Filled" variant="filled" fullWidth />
          </Grid>
        </Grid>
      </Paper>

      {/* Grey Scale */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Grey Scale
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <ColorSwatch
              key={shade}
              color={(theme.palette.grey as Record<number, string>)[shade] || '#ccc'}
              label={String(shade)}
            />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

const meta: Meta = {
  title: 'Theme/Overview',
  component: ThemeShowcase,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ThemeShowcase>;

export const Default: Story = {};
