import { defineConfig } from 'vite';

// Relative base — works at both the custom domain root (ofsaytnedir.com/)
// and the GitHub Pages fallback URL (username.github.io/offside-simulator/).
export default defineConfig({
  base: './',
});
