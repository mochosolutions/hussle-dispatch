import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'src/**/*.test.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'redux/index': resolve(__dirname, 'src/redux/index.ts'),
        'forms/index': resolve(__dirname, 'src/forms/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'theme/index': resolve(__dirname, 'src/theme/index.tsx'),
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const extension = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${extension}`;
      },
    },
    rollupOptions: {
      external: [
        // React ecosystem
        'react',
        'react-dom',
        'react/jsx-runtime',
        // MUI ecosystem
        '@mui/material',
        '@mui/base',
        '@mui/icons-material',
        '@mui/lab',
        '@mui/system',
        '@mui/x-date-pickers',
        // Emotion
        '@emotion/react',
        '@emotion/styled',
        'styled-components',
        // Redux ecosystem
        '@reduxjs/toolkit',
        'react-redux',
        'redux-saga',
        'normalizr',
        // Form libraries
        'formik',
        'yup',
        // Third-party UI
        'framer-motion',
        'notistack',
        // AG Grid
        'ag-grid-community',
        'ag-grid-react',
        '@ag-grid-community/react',
        // Tiptap
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
        '@tiptap/extension-placeholder',
        '@tiptap/pm',
        // Other utilities
        'date-fns',
        'dompurify',
        'lodash',
        'react-router-dom',
        'react-dropzone',
        'simplebar-react',
        '@ant-design/colors',
        '@ant-design/icons',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@mui/material': 'MaterialUI',
          '@emotion/react': 'emotionReact',
          '@emotion/styled': 'emotionStyled',
        },
      },
    },
    sourcemap: true,
    target: 'es2021',
    minify: false,
  },
});
