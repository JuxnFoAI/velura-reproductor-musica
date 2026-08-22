/** Vista previa del fondo personalizado subido por el usuario. */

import { buildCustomBackgroundImageFilter } from '../lib/buildCustomBackgroundImageFilter'
import type { PlayerBackgroundAdjustments } from '../types/playerBackgroundAdjustments'

interface BackgroundPreviewPanelProps {
  customBackgroundUrl: string
  adjustments: PlayerBackgroundAdjustments
}

/**
 * Muestra una miniatura del fondo personalizado seleccionado.
 */
export function BackgroundPreviewPanel({
  customBackgroundUrl,
  adjustments,
}: BackgroundPreviewPanelProps) {
  return (
    <section className="background-preview" aria-label="Vista previa del fondo">
      <p className="background-preview__heading montserrat-regular">Vista previa</p>

      <div className="background-preview__frame" aria-hidden="true">
        <div className="background-preview__canvas">
          <img
            src={customBackgroundUrl}
            alt=""
            className="background-preview__image"
            style={{ filter: buildCustomBackgroundImageFilter(adjustments, { preview: true }) }}
          />
          <div className="background-preview__overlay" />
        </div>
      </div>

      <p className="background-preview__caption montserrat-regular">
        Tu imagen se mantiene fija como fondo del reproductor.
      </p>
    </section>
  )
}
