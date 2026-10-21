import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      // The SPA reads CMS content over a relative /api/cms/* path, which
      // Cloudflare Pages proxies to the Worker in production. `vite preview`
      // does not, so a locally served dist had no CMS at all: every article
      // route hydrated into its no-data fallback and the hydration probe
      // compared that against the prerendered markup and failed. Mirror the
      // production proxy so local dist behaves like the deployed site.
      proxy: {
        '/api': {
          target: process.env.CMS_API_BASE || 'https://store.balancebiketoddler.com',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/config/pageCopy')) {
              return 'copy-data';
            }
            if (id.includes('/src/lib/translate')) {
              return 'i18n-data';
            }
            if (id.includes('/src/data/transparencyPages')) {
              return 'transparency-data';
            }
            if (id.includes('/src/config/defaultSeo') || id.includes('/src/config/seoKeywordMap')) {
              return 'seo-config';
            }
            if (id.includes('/src/data/guidesData')) {
              return 'guides-data';
            }
            if (id.includes('/src/data/newsData')) {
              return 'news-data';
            }
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('/node_modules/firebase/')) {
              return 'firebase-vendor';
            }
            if (id.includes('/node_modules/lucide-react/')) {
              return 'icons-vendor';
            }
            if (id.includes('/node_modules/motion/')) {
              return 'motion-vendor';
            }
            if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-')) {
              return 'charts-vendor';
            }
            return undefined;
          },
        },
      },
    },
  };
});
