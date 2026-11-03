import { defineConfig } from 'vite';

// Relative URLs work at both username.github.io and username.github.io/repository/.
export default defineConfig({ base: './', build: { target: 'es2022', rollupOptions: { input: { main: 'index.html', credits: 'credits.html' } } } });
