import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Remove Storybook's default React plugin so we can add one with Emotion config
    const plugins = (config.plugins ?? []).flat();
    config.plugins = plugins.filter(
      (p) => p && typeof p === 'object' && 'name' in p && p.name !== 'vite:react-babel',
    );

    config.plugins.push(
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
    );

    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': resolve(__dirname, '../src'),
          '@/types': resolve(__dirname, '../src/types'),
          '@/theme': resolve(__dirname, '../src/theme'),
          '@/components': resolve(__dirname, '../src/components'),
          '@/hooks': resolve(__dirname, '../src/hooks'),
          '@/utils': resolve(__dirname, '../src/utils'),
        },
      },
    });
  },
};

export default config;
