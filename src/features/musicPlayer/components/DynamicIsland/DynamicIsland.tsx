/** Isla dinámica flotante; en escritorio se renderiza en una ventana always-on-top. */

import { memo, useRef } from 'react'
import { useDynamicIslandInteraction } from '../../hooks/useDynamicIslandInteraction'
import { useDynamicIslandLayout } from '../../hooks/useDynamicIslandLayout'
import { useDynamicIslandVisibility } from '../../hooks/useDynamicIslandVisibility'
import { usePlayerStore } from '../../store/playerStore'
import type { PlayerStatus, Track } from '../../types'
import { DynamicIslandCollapsedContent } from './DynamicIslandCollapsedContent'
import { DynamicIslandControls } from './DynamicIslandControls'

function toClassName(...parts: Array<string | false>): string {
  return parts.filter(Boolean).join(' ')
}

interface DynamicIslandSurfaceProps {
  track: Track
  status: PlayerStatus
}

const DynamicIslandSurface = memo(function DynamicIslandSurface({
  track,
  status,
}: DynamicIslandSurfaceProps) {
  const expandedRef = useRef<HTMLDivElement>(null)
  const {
    isExpanded,
    isRetracted,
    isSizeTransitionEnabled,
    islandRef,
    stackRef,
    deployIsland,
    scheduleRetractIsland,
    handleIslandMouseEnter,
    handleIslandMouseLeave,
  } = useDynamicIslandInteraction()
  const size = useDynamicIslandLayout({
    isExpanded,
    expandedRef,
    trackId: track.id,
  })

  return (
    <div
      className={toClassName(
        'dynamic-island-anchor',
        isRetracted && 'dynamic-island-anchor--retracted',
      )}
    >
      <div
        ref={stackRef}
        className={toClassName(
          'dynamic-island-stack',
          isRetracted && 'dynamic-island-stack--retracted',
        )}
        onMouseEnter={deployIsland}
        onMouseLeave={scheduleRetractIsland}
      >
        <aside
          ref={islandRef}
          className={toClassName(
            'dynamic-island',
            isExpanded && 'dynamic-island--expanded',
            isSizeTransitionEnabled && 'dynamic-island--size-transition',
          )}
          onMouseEnter={isRetracted ? undefined : handleIslandMouseEnter}
          onMouseLeave={isRetracted ? undefined : handleIslandMouseLeave}
          style={isExpanded ? { width: size.width, height: size.height } : undefined}
          aria-label="Reproductor flotante"
          aria-expanded={isExpanded}
          aria-hidden={isRetracted}
          {...(isRetracted ? { inert: true } : {})}
        >
          <div className="dynamic-island__layers">
            <div
              className={toClassName(
                'dynamic-island__layer',
                'dynamic-island__layer--collapsed',
                isExpanded ? 'dynamic-island__layer--hidden' : 'dynamic-island__layer--visible',
              )}
              aria-hidden={isExpanded}
              {...(isExpanded ? { inert: true } : {})}
            >
              <DynamicIslandCollapsedContent
                coverUrl={track.coverUrl}
                title={track.title}
                isPlaying={status === 'playing'}
                isDisabled={status === 'loading'}
              />
            </div>

            <div
              ref={expandedRef}
              className={toClassName(
                'dynamic-island__layer',
                'dynamic-island__layer--expanded',
                isExpanded ? 'dynamic-island__layer--visible' : 'dynamic-island__layer--hidden',
              )}
              aria-hidden={!isExpanded}
              {...(!isExpanded ? { inert: true } : {})}
            >
              <DynamicIslandControls />
            </div>
          </div>
        </aside>

        <button
          type="button"
          onFocus={deployIsland}
          aria-expanded={!isRetracted}
          aria-label="Mostrar reproductor flotante"
          className="dynamic-island__handle"
        >
          <span className="dynamic-island__handle-bar" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
})

/**
 * Widget flotante en la parte superior.
 * En reposo solo se ve el indicador; al pasar el cursor por la línea, la isla se despliega.
 */
export const DynamicIsland = memo(function DynamicIsland() {
  const isVisible = useDynamicIslandVisibility()
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const status = usePlayerStore((state) => state.status)

  if (!isVisible || currentTrack === null) {
    return null
  }

  return <DynamicIslandSurface track={currentTrack} status={status} />
})
