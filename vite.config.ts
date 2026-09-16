import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base + hash routing (see src/main.tsx) lets this build be
// dropped into a GitHub Pages project site without hardcoding the repo name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // MapLibre v6 ships its own worker bundle (maplibre-gl-worker.mjs) that
  // conflicts with esbuild's dependency pre-bundling -- exclude it so Vite
  // serves it as-is instead of trying to optimize it.
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
})
