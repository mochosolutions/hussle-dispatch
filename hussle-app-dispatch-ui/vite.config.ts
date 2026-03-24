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
      features: path.resolve(__dirname, 'src/features'),
      pages: path.resolve(__dirname, 'src/pages'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      types: path.resolve(__dirname, 'src/types'),

      // Resolve mocho/ and @mocho/ui subpaths to local mocho directory in dispatch-ui
      mocho: path.resolve(__dirname, 'src/mocho'),
      '@mocho/ui/components': path.resolve(__dirname, 'src/mocho/components'),
      '@mocho/ui/redux': path.resolve(__dirname, 'src/mocho/redux'),
      '@mocho/ui/forms': path.resolve(__dirname, 'src/mocho/forms'),
      '@mocho/ui/theme': path.resolve(__dirname, 'src/mocho/theme'),
      '@mocho/ui/hooks': path.resolve(__dirname, 'src/mocho/hooks'),
      '@mocho/ui/utils': path.resolve(__dirname, 'src/mocho/utils'),
      '@mocho/ui/types': path.resolve(__dirname, 'src/mocho/types'),
      '@mocho/ui': path.resolve(__dirname, 'src/mocho'),
    },
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@reduxjs/toolkit',
      'react-redux',
      'react-router',
      'react-router-dom',
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
