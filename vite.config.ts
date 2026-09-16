import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// maplibre-gl-worker.mjs is only reachable via a `?url` static-asset import
// (see StationMap.tsx), so Rollup never parses it as a module and never
// notices its own `import ... from "./maplibre-gl-shared.mjs"` -- that
// sibling file silently never makes it into the build, and the worker 404s
// on it at runtime (which surfaces as a generic "MIME type text/html"
// module-load error, since the 404 falls through to the SPA's index.html).
// Copy it next to wherever Rollup puts the hashed worker file so that
// relative import resolves.
function copyMaplibreWorkerSharedChunk(): Plugin {
  let outDir = 'dist'
  return {
    name: 'copy-maplibre-worker-shared-chunk',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const src = join(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs')
      const destDir = join(__dirname, outDir, 'assets')
      if (existsSync(src)) {
        copyFileSync(src, join(destDir, 'maplibre-gl-shared.mjs'))
      }
    },
  }
}

// Relative base + hash routing (see src/main.tsx) lets this build be
// dropped into a GitHub Pages project site without hardcoding the repo name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), copyMaplibreWorkerSharedChunk()],
  // MapLibre v6 ships its own worker bundle (maplibre-gl-worker.mjs) that
  // conflicts with esbuild's dependency pre-bundling -- exclude it so Vite
  // serves it as-is instead of trying to optimize it.
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
})
