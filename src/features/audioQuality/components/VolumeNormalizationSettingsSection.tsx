/** Sección de normalización de volumen dentro de Calidad del audio. */

import { useCallback } from 'react'
import { Check } from 'lucide-react'

import { usePlayerStore } from '@features/musicPlayer'

import { useVolumeNormalizationStore } from '../store'
import {
  formatAppliedNormalizationGainDb,
  VOLUME_NORMALIZATION_MODE_OPTIONS,
  type VolumeNormalizationModeId,
  type VolumeNormalizationModeOption,
} from '../types/volumeNormalization'

interface VolumeNormalizationModeButtonProps {
  mode: VolumeNormalizationModeOption
  isSelected: boolean
  isApplied: boolean
  isDisabled: boolean
  onSelect: (modeId: VolumeNormalizationModeId) => void
}

function VolumeNormalizationModeButton({
  mode,
  isSelected,
  isApplied,
  isDisabled,
  onSelect,
}: VolumeNormalizationModeButtonProps) {
  return (
    <button
      type="button"
      className={[
        'main-menu-audio-normalization-section__mode',
        isSelected ? 'main-menu-audio-normalization-section__mode--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={() => onSelect(mode.id)}
    >
      <span className="main-menu-audio-normalization-section__mode-content">
        <span className="main-menu-audio-normalization-section__mode-label montserrat-regular">
          {mode.label}
        </span>
        <span className="main-menu-audio-normalization-section__mode-description montserrat-regular">
          {mode.description}
        </span>
      </span>

      {isApplied ? (
        <span className="main-menu-audio-normalization-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

/**
 * Permite activar la normalización de volumen y elegir el modo de ajuste por pista.
 */
export function VolumeNormalizationSettingsSection() {
  const isEnabled = useVolumeNormalizationStore((state) => state.isEnabled)
  const modeId = useVolumeNormalizationStore((state) => state.modeId)
  const appliedGainDb = useVolumeNormalizationStore((state) => state.appliedGainDb)
  const setEnabled = useVolumeNormalizationStore((state) => state.setEnabled)
  const setMode = useVolumeNormalizationStore((state) => state.setMode)

  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const hasReplayGainTag =
    typeof currentTrack?.replayGainTrackDb === 'number' &&
    Number.isFinite(currentTrack.replayGainTrackDb)

  const handleToggleEnabled = useCallback((): void => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  const handleSelectMode = useCallback(
    (nextModeId: VolumeNormalizationModeId): void => {
      setMode(nextModeId)
    },
    [setMode],
  )

  const appliedGainLabel = isEnabled
    ? formatAppliedNormalizationGainDb(appliedGainDb)
    : 'Desactivada'

  return (
    <section
      className="main-menu-audio-normalization-section flex min-h-0 flex-1 flex-col"
      aria-label="Normalización de volumen"
    >
      <div className="main-menu-audio-normalization-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-audio-normalization-section__content">
          <button
            type="button"
            className={[
              'main-menu-audio-normalization-section__toggle',
              isEnabled ? 'main-menu-audio-normalization-section__toggle--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isEnabled}
            onClick={handleToggleEnabled}
          >
            <span className="main-menu-audio-normalization-section__toggle-copy">
              <span className="main-menu-audio-normalization-section__toggle-label montserrat-regular">
                Normalización de volumen
              </span>
              <span className="main-menu-audio-normalization-section__toggle-description montserrat-regular">
                {isEnabled ? 'Activa en la reproducción' : 'Desactivada'}
              </span>
            </span>
            <span
              className="main-menu-audio-normalization-section__toggle-indicator"
              aria-hidden="true"
            />
          </button>

          <div
            className={[
              'main-menu-audio-normalization-section__panel',
              !isEnabled ? 'main-menu-audio-normalization-section__panel--disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="main-menu-audio-normalization-section__status">
              <div className="main-menu-audio-normalization-section__status-row">
                <span className="main-menu-audio-normalization-section__status-label montserrat-regular">
                  Ajuste en la pista actual
                </span>
                <span className="main-menu-audio-normalization-section__status-value montserrat-regular">
                  {appliedGainLabel}
                </span>
              </div>

              {currentTrack ? (
                <p className="main-menu-audio-normalization-section__status-track montserrat-regular">
                  {currentTrack.title}
                  {hasReplayGainTag ? ' · ReplayGain disponible' : null}
                </p>
              ) : (
                <p className="main-menu-audio-normalization-section__status-track montserrat-regular">
                  Reproduce una canción para ver el ajuste aplicado.
                </p>
              )}
            </div>

            <nav
              className="main-menu-audio-normalization-section__modes"
              aria-label="Modos de normalización"
            >
              {VOLUME_NORMALIZATION_MODE_OPTIONS.map((mode) => (
                <VolumeNormalizationModeButton
                  key={mode.id}
                  mode={mode}
                  isSelected={modeId === mode.id}
                  isApplied={modeId === mode.id}
                  isDisabled={!isEnabled}
                  onSelect={handleSelectMode}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}
