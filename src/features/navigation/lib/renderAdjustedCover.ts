/** Utilidad para exportar una portada recortada con escala y rotación aplicadas. */

const COVER_OUTPUT_SIZE_PX = 512
const JPEG_QUALITY = 0.92

export interface CoverAdjustTransform {
  scale: number
  rotation: number
}

/**
 * Carga una imagen desde una URL y la resuelve cuando está lista para dibujar.
 */
function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'))

    image.src = imageUrl
  })
}

/**
 * Calcula dimensiones tipo object-cover para encajar la imagen en un cuadrado.
 */
function getCoverDrawDimensions(
  imageWidth: number,
  imageHeight: number,
  frameSize: number,
): { drawWidth: number; drawHeight: number } {
  const imageAspectRatio = imageWidth / imageHeight

  if (imageAspectRatio >= 1) {
    return {
      drawHeight: frameSize,
      drawWidth: frameSize * imageAspectRatio,
    }
  }

  return {
    drawWidth: frameSize,
    drawHeight: frameSize / imageAspectRatio,
  }
}

/**
 * Renderiza la portada ajustada en un canvas y devuelve un object URL del resultado.
 */
export async function renderAdjustedCover(
  imageUrl: string,
  transform: CoverAdjustTransform,
): Promise<string> {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = COVER_OUTPUT_SIZE_PX
  canvas.height = COVER_OUTPUT_SIZE_PX

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('No se pudo preparar el lienzo para exportar la portada.')
  }

  const { drawWidth, drawHeight } = getCoverDrawDimensions(
    image.naturalWidth,
    image.naturalHeight,
    COVER_OUTPUT_SIZE_PX,
  )

  const frameCenter = COVER_OUTPUT_SIZE_PX / 2
  const rotationRadians = (transform.rotation * Math.PI) / 180

  context.save()
  context.translate(frameCenter, frameCenter)
  context.rotate(rotationRadians)
  context.scale(transform.scale, transform.scale)
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  context.restore()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
          return
        }

        reject(new Error('No se pudo exportar la portada ajustada.'))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })

  return URL.createObjectURL(blob)
}
