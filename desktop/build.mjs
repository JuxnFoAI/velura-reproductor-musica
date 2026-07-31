/** Compila main y preload de Electron en bundles ESM listos para Node. */
import * as esbuild from 'esbuild'

const sharedEsbuildOptions = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  logLevel: 'info',
  external: ['electron'],
  packages: 'external',
}

await esbuild.build({
  ...sharedEsbuildOptions,
  entryPoints: ['desktop/main.ts'],
  outfile: 'desktop/dist/main.js',
})

await esbuild.build({
  ...sharedEsbuildOptions,
  entryPoints: ['desktop/preload.ts'],
  outfile: 'desktop/dist/preload.js',
})
