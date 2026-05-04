import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig, loadEnv } from 'vite';
import viteReact from '@vitejs/plugin-react';

/** Inline public env from `.env` / `.env.local` into `process.env` for client bundles (Next + optional `VITE_PUBLIC_*` aliases). */
function publicEnvDefine(mode: string): Record<string, string> {
  const env = loadEnv(mode, process.cwd(), '');
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_PUBLIC_')) {
      define[`process.env.${key}`] = JSON.stringify(value);
    }
  }
  return define;
}

export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  define: publicEnvDefine(mode),
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
}));
