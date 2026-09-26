import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths for GitHub Pages, Vercel, and local previews
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
