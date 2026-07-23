import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    checker({
      typescript: true,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error', 'warning'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Canonical catalog — same registry.json the CLI and backend use.
      '@repo-registry': path.resolve(__dirname, '../registry.json'),
    },
  },
  server: {
    port: 8081,
    fs: {
      allow: [path.resolve(__dirname, '../registry.json')],
    },
  },
  preview: {
    port: 8081,
  },
});
