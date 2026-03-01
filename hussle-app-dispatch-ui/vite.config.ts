import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isDocker = Boolean(process.env.CHOKIDAR_USEPOLLING);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // App path aliases
      store: path.resolve(__dirname, 'src/store'),
      utils: path.resolve(__dirname, 'src/utils'),
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      types: path.resolve(__dirname, 'src/types'),

      // In Docker, resolve @mocho/ui subpaths to TypeScript source for HMR
      ...(isDocker && {
        '@mocho/ui/components': path.resolve(__dirname, '../mocho-ui/src/components'),
        '@mocho/ui/redux': path.resolve(__dirname, '../mocho-ui/src/redux'),
        '@mocho/ui/forms': path.resolve(__dirname, '../mocho-ui/src/forms'),
        '@mocho/ui/theme': path.resolve(__dirname, '../mocho-ui/src/theme'),
        '@mocho/ui/hooks': path.resolve(__dirname, '../mocho-ui/src/hooks'),
        '@mocho/ui/utils': path.resolve(__dirname, '../mocho-ui/src/utils'),
        '@mocho/ui/types': path.resolve(__dirname, '../mocho-ui/src/types'),
        '@mocho/ui': path.resolve(__dirname, '../mocho-ui/src'),
      }),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-is',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@reduxjs/toolkit',
      'react-redux',
    ],
  },
  server: {
    ...(isDocker && {
      host: '0.0.0.0',
      watch: {
        usePolling: true,
      },
    }),
  },
});
