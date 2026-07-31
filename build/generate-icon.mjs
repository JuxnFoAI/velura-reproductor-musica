/** Genera icon.png e icon.ico de Windows a partir de build/icon.svg. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import toIco from 'to-ico'

const buildDirectory = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(buildDirectory, 'icon.svg')
const svgBuffer = fs.readFileSync(svgPath)

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svgBuffer).resize(size, size).png().toBuffer()),
)

await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(buildDirectory, 'icon.png'))
fs.writeFileSync(path.join(buildDirectory, 'icon.ico'), await toIco(pngBuffers))

console.log('Iconos generados: build/icon.png, build/icon.ico')
