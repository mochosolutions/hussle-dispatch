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
    // Proxy DocuSeal through the dev server so the carrier portal can iframe
    // signing pages. Three things to make this work:
    //
    //   1. `/docuseal-embed/s/SLUG` proxies to DocuSeal's `/s/SLUG` and strips
    //      `x-frame-options: SAMEORIGIN` so the parent at localhost:5173 can
    //      iframe it.
    //   2. The signing HTML references absolute URLs at `/packs/*`,
    //      `/rails/*`, `/disk/*`, `/api/*`, `/javascripts/*` — proxy those
    //      from the dev server origin so they resolve from the iframe.
    //   3. DocuSeal generates download/preview URLs server-side using the
    //      request `Host`. Inside docker the proxy target is
    //      `hussle-app-docuseal:3000`, which the browser cannot resolve.
    //      Force `Host: localhost:3030` on every proxied request so DocuSeal
    //      generates URLs the browser can reach through this same proxy.
    //
    // Prod: replicate at the edge (nginx) with the same `/docuseal-embed`
    // mount, the same shared static prefixes, and the same Host header
    // override.
    proxy: (() => {
      const target = process.env.DOCUSEAL_PROXY_TARGET ?? 'http://localhost:3030';
      const stripFrameHeaders = (proxy: { on: (event: 'proxyRes', listener: (proxyRes: { headers: Record<string, unknown> }) => void) => void }) => {
        proxy.on('proxyRes', (proxyRes) => {
          delete proxyRes.headers['x-frame-options'];
          delete proxyRes.headers['content-security-policy'];
        });
      };
      const docusealCommon = {
        target,
        changeOrigin: true,
        headers: { Host: 'localhost:3030' },
        configure: stripFrameHeaders,
      };
      return {
        '/docuseal-embed': {
          ...docusealCommon,
          rewrite: (urlPath: string) => urlPath.replace(/^\/docuseal-embed/, ''),
        },
        '/packs': docusealCommon,
        '/disk': docusealCommon,
        '/rails': docusealCommon,
        '/javascripts': docusealCommon,
      };
    })(),
  },
});
