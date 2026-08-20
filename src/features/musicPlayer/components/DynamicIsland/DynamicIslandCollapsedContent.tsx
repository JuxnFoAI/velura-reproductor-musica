/** Contenido compacto de la isla dinámica en estado colapsado. */

import { memo } from 'react'
import { useTransportControls } from '../../hooks/useTransportControls'
import { PlayPauseButton } from '../PlayerControls/PlayPauseButton'

interface DynamicIslandCollapsedContentProps {
  coverUrl?: string
  title: string
  isPlaying: boolean
  isDisabled: boolean
}

export const DynamicIslandCollapsedContent = memo(function DynamicIslandCollapsedContent({
  coverUrl,
  title,
  isPlaying,
  isDisabled,
}: DynamicIslandCollapsedContentProps) {
  const { handlePlayPause } = useTransportControls()

  return (
    <div className="dynamic-island__collapsed-inner">
      <div className="dynamic-island__slot dynamic-island__slot--leading">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            decoding="async"
            className="dynamic-island__cover"
            aria-hidden="true"
          />
        ) : (
          <div
            className="dynamic-island__cover dynamic-island__cover--placeholder"
            aria-hidden="true"
          >
            <span className="text-xs text-white">♪</span>
          </div>
        )}
      </div>

      <span className="dynamic-island__title montserrat-regular" title={title}>
        {title}
      </span>

      <div className="dynamic-island__slot dynamic-island__slot--trailing">
        <div className="dynamic-island__play-indicator">
          <PlayPauseButton
            isPlaying={isPlaying}
            disabled={isDisabled}
            onClick={handlePlayPause}
          />
        </div>
      </div>
    </div>
  )
})
