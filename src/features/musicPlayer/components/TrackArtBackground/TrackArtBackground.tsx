/** Fondo dinámico del reproductor según portadas o imagen personalizada. */

import { memo } from 'react'

import {
  buildCustomBackgroundImageFilter,
  useCustomizationStore,
} from '@features/customization'

import { usePlayerStore } from '../../store/playerStore'

/**
 * Muestra la portada de la pista actual o una imagen fija como fondo difuminado.
 */
export const TrackArtBackground = memo(function TrackArtBackground() {
  const coverUrl = usePlayerStore((state) => state.currentTrack?.coverUrl)
  const appliedBackgroundMode = useCustomizationStore((state) => state.appliedBackgroundMode)
  const customBackgroundUrl = useCustomizationStore((state) => state.customBackgroundUrl)
  const customBackgroundAdjustments = useCustomizationStore(
    (state) => state.customBackgroundAdjustments,
  )

  const isCustomBackground = appliedBackgroundMode === 'custom'
  const backgroundImageUrl = isCustomBackground ? customBackgroundUrl : coverUrl
  const customBackgroundFilter = buildCustomBackgroundImageFilter(customBackgroundAdjustments)

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--player-background)]" />

      {backgroundImageUrl ? (
        <>
          <img
            src={backgroundImageUrl}
            alt=""
            className={[
              'track-art-background__image absolute inset-0 h-full w-full scale-110 object-cover',
              isCustomBackground ? 'track-art-background__image--custom' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={isCustomBackground ? { filter: customBackgroundFilter } : undefined}
          />
          <div className="track-art-background__overlay absolute inset-0" />
        </>
      ) : null}
    </div>
  )
})
