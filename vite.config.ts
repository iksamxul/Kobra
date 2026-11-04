import { defineConfig, type Plugin } from 'vite';
import { renderContent } from './src/content-html';

// Writes the claims in src/content.ts into <!--content:slot--> markers, so they are part of
// the static page. Vite restarts the dev server when content.ts changes.
const content = (): Plugin => ({
  name: 'kobra-content',
  transformIndexHtml: { order: 'pre', handler: html => html.replace(/<!--content:([a-z-]+)-->/g, (_, slot: string) => renderContent(slot)) },
});

// Relative URLs work at both username.github.io and username.github.io/repository/.
export default defineConfig({
  base: './',
  plugins: [content()],
  build: {
    target: 'es2022',
    // Three.js stays a separate, lazily loaded chunk (hero display and download emblem).
    chunkSizeWarningLimit: 600,
    rollupOptions: { input: { main: 'index.html', credits: 'credits.html' }, output: { manualChunks: { three: ['three'] } } },
  },
});
