/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Generates route-specific index.html files with custom OG tags for link previews.
// Each entry: [output path relative to dist, { title, description }]
const ogRoutes: [string, { title: string; description: string }][] = [
  ['register/verify/index.html', {
    title: 'CardCapture - Complete Your Registration',
    description: 'Tap to finish signing up and get your QR code.',
  }],
];

function ogTagsPlugin() {
  return {
    name: 'og-tags-per-route',
    closeBundle() {
      const distIndex = path.resolve(__dirname, 'dist/index.html');
      if (!fs.existsSync(distIndex)) return;
      const html = fs.readFileSync(distIndex, 'utf-8');

      for (const [routePath, meta] of ogRoutes) {
        let routeHtml = html
          .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
          .replace(/content="[^"]*"([^>]*property="og:title")/g, `content="${meta.title}"$1`)
          .replace(/property="og:title"([^>]*)content="[^"]*"/g, `property="og:title"$1content="${meta.title}"`)
          .replace(/property="og:description"([^>]*)content="[^"]*"/g, `property="og:description"$1content="${meta.description}"`);

        const outPath = path.resolve(__dirname, 'dist', routePath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, routeHtml);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    cors: true,
    hmr: {
      clientPort: 3000,
      host: 'localhost'
    },
    // Allow all ngrok subdomains
    allowedHosts: ['.ngrok-free.app']
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    ogTagsPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'e2e/',
      ],
    },
  },
}));
