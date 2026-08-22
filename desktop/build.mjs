/** Compila main (ESM) y preload (CJS, requerido por el sandbox del renderer). */
import * as esbuild from 'esbuild'

const sharedEsbuildOptions = {
  bundle: true,
  platform: 'node',
  sourcemap: true,
  logLevel: 'info',
  external: ['electron'],
  packages: 'external',
}

await esbuild.build({
  ...sharedEsbuildOptions,
  format: 'esm',
  entryPoints: ['desktop/main.ts'],
  outfile: 'desktop/dist/main.js',
})

await esbuild.build({
  ...sharedEsbuildOptions,
  format: 'cjs',
  entryPoints: ['desktop/preload.ts'],
  outfile: 'desktop/dist/preload.js',
})
