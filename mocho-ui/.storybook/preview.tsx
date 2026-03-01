import React from 'react';
import type { Preview } from '@storybook/react';
import { CssBaseline } from '@mui/material';
import ThemeCustomization from '../src/theme';
import { ThemeMode, PresetColor } from '../src/types/config';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      name: 'Theme Preset',
      description: 'Color theme preset',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default (Ant Blue)' },
          { value: 'theme1', title: 'Theme 1 (Blue)' },
          { value: 'theme2', title: 'Theme 2 (Purple)' },
          { value: 'theme3', title: 'Theme 3 (Green)' },
          { value: 'theme4', title: 'Theme 4 (Navy)' },
          { value: 'theme5', title: 'Theme 5 (Orange)' },
          { value: 'theme6', title: 'Theme 6 (Teal)' },
          { value: 'theme7', title: 'Theme 7 (Green)' },
          { value: 'theme8', title: 'Theme 8 (Cyan)' },
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      name: 'Color Mode',
      description: 'Light or dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme || 'default') as PresetColor;
      const mode = (context.globals.mode || 'light') as ThemeMode;

      return (
        <ThemeCustomization presetColor={theme} mode={mode}>
          <CssBaseline />
          <Story />
        </ThemeCustomization>
      );
    },
  ],
};

export default preview;
