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
      external: (id) => {
        // Externalize peer/optional dependencies and all their subpath imports.
        // Using a function because exact strings (e.g. '@mui/material') don't match
        // subpath imports (e.g. '@mui/material/styles'), which causes Rollup to
        // bundle MUI internals and break default-export interop.
        const patterns = [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@mui',
          '@emotion',
          'styled-components',
          '@reduxjs/toolkit',
          'react-redux',
          'redux-saga',
          'normalizr',
          'formik',
          'yup',
          'framer-motion',
          'notistack',
          'ag-grid-community',
          'ag-grid-react',
          '@ag-grid-community',
          '@tiptap',
          'date-fns',
          'dompurify',
          'lodash',
          'react-router-dom',
          'react-router',
          'react-dropzone',
          'simplebar-react',
          '@ant-design',
          '@babel/runtime',
        ];
        return patterns.some((p) => id === p || id.startsWith(`${p}/`));
      },
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
