/** Menú de opciones del encabezado de la sección Calidad del audio. */

import { memo, useCallback, useRef, type MouseEvent } from 'react'
import { RotateCcw } from 'lucide-react'

import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'
import { useToastStore } from '@features/musicPlayer'
import { useDismissibleMenu } from '@lib/useDismissibleMenu'

import { useEqualizerStore, useVolumeNormalizationStore } from '../store'
import { DEFAULT_EQUALIZER_PRESET_ID } from '../types/equalizer'
import { DEFAULT_VOLUME_NORMALIZATION_MODE_ID } from '../types/volumeNormalization'

const MENU_ICON_SIZE_PX = 16
const AUDIO_QUALITY_RESET_TOAST_MESSAGE =
  'Calidad del audio restablecida a los ajustes predeterminados.'

interface AudioQualityOptionsMenuProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

/**
 * Despliega acciones de la sección Calidad del audio.
 */
export const AudioQualityOptionsMenu = memo(function AudioQualityOptionsMenu({
  isOpen,
  onToggle,
  onClose,
}: AudioQualityOptionsMenuProps) {
  const menuRootRef = useRef<HTMLDivElement>(null)
  const equalizerIsEnabled = useEqualizerStore((state) => state.isEnabled)
  const equalizerPresetId = useEqualizerStore((state) => state.presetId)
  const resetEqualizerToDefaults = useEqualizerStore((state) => state.resetToDefaults)
  const volumeNormalizationIsEnabled = useVolumeNormalizationStore((state) => state.isEnabled)
  const volumeNormalizationModeId = useVolumeNormalizationStore((state) => state.modeId)
  const resetVolumeNormalizationToDefaults = useVolumeNormalizationStore(
    (state) => state.resetToDefaults,
  )
  const addToast = useToastStore((state) => state.addToast)

  const isDefaultSettingsApplied =
    !equalizerIsEnabled &&
    equalizerPresetId === DEFAULT_EQUALIZER_PRESET_ID &&
    !volumeNormalizationIsEnabled &&
    volumeNormalizationModeId === DEFAULT_VOLUME_NORMALIZATION_MODE_ID

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onToggle()
    },
    [onToggle],
  )

  const handleResetToDefaultClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()

      if (isDefaultSettingsApplied) {
        return
      }

      resetEqualizerToDefaults()
      resetVolumeNormalizationToDefaults()

      addToast({
        type: 'success',
        message: AUDIO_QUALITY_RESET_TOAST_MESSAGE,
        duration: 2500,
      })

      onClose()
    },
    [
      addToast,
      isDefaultSettingsApplied,
      onClose,
      resetEqualizerToDefaults,
      resetVolumeNormalizationToDefaults,
    ],
  )

  useDismissibleMenu(isOpen, menuRootRef, onClose)

  return (
    <div ref={menuRootRef} className="music-library-track-options relative shrink-0">
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label="Opciones de calidad del audio"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="music-library-track-options__trigger flex items-center justify-center rounded-md px-1 py-2 text-[var(--player-text-muted)] transition-colors hover:bg-[var(--player-background)] hover:text-[var(--player-text)]"
      >
        <NavigationMenuDotsIcon merged={isOpen} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Opciones de calidad del audio"
          className="music-library-track-options__panel"
        >
          <button
            type="button"
            role="menuitem"
            disabled={isDefaultSettingsApplied}
            onClick={handleResetToDefaultClick}
            className="music-library-track-options__action montserrat-regular disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Restablecer ajustes predeterminados
          </button>
        </div>
      ) : null}
    </div>
  )
})
