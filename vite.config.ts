import { defineConfig, Plugin } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import manifest from './src/manifest.json'

function fixServiceWorkerLoader(): Plugin {
  return {
    name: 'fix-service-worker-loader',
    writeBundle(options, bundle) {
      const backgroundChunk = Object.values(bundle).find(
        (chunk): chunk is Extract<typeof chunk, { type: 'chunk' }> =>
          chunk.type === 'chunk' && chunk.name === 'background'
      )
      if (!backgroundChunk) return
      const loaderPath = resolve(__dirname, 'dist/service-worker-loader.js')
      writeFileSync(loaderPath, `import './${backgroundChunk.fileName}';\n`)
    },
  }
}

export default defineConfig({
  plugins: [
    crx({ manifest }),
    fixServiceWorkerLoader(),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
    },
  },
})
