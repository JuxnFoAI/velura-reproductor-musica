/** Sección de tamaño de fuentes del modo letra con vista previa antes de aplicar. */

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'

import { usePreviewState } from '@hooks/usePreviewState'

import { useCustomizationStore } from '../store'
import {
  LYRICS_FONT_SIZE_OPTIONS,
  getLyricsFontSizeById,
  type LyricsFontSizeId,
  type LyricsFontSizeOption,
} from '../types/lyricsFontSizes'

import { LyricsFontSizePreviewPanel } from './LyricsFontSizePreviewPanel'

interface LyricsFontSizeOptionButtonProps {
  sizeOption: LyricsFontSizeOption
  isPreviewSelected: boolean
  isApplied: boolean
  onSelect: (sizeId: LyricsFontSizeId) => void
}

function LyricsFontSizeOptionButton({
  sizeOption,
  isPreviewSelected,
  isApplied,
  onSelect,
}: LyricsFontSizeOptionButtonProps) {
  const previewFontSize = `clamp(${sizeOption.min}, ${sizeOption.preferred}, ${sizeOption.max})`

  return (
    <button
      type="button"
      className={[
        'main-menu-customization-font-size-section__option',
        isPreviewSelected ? 'main-menu-customization-font-size-section__option--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isPreviewSelected}
      onClick={() => onSelect(sizeOption.id)}
    >
      <span
        className="main-menu-customization-font-size-section__option-label montserrat-regular"
        style={{ fontSize: previewFontSize }}
      >
        {sizeOption.label}
      </span>

      {isApplied ? (
        <span className="main-menu-customization-font-size-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

/**
 * Permite previsualizar y aplicar un tamaño tipográfico para el panel de letras.
 */
export function LyricsFontSizeSettingsSection() {
  const appliedLyricsFontSizeId = useCustomizationStore((state) => state.appliedLyricsFontSizeId)
  const setLyricsFontSize = useCustomizationStore((state) => state.setLyricsFontSize)
  const [previewSizeId, setPreviewSizeId] = usePreviewState(appliedLyricsFontSizeId)
  const [applyError, setApplyError] = useState<string | null>(null)

  const previewSize = getLyricsFontSizeById(previewSizeId)

  const handleSelectSize = useCallback((sizeId: LyricsFontSizeId): void => {
    setApplyError(null)
    setPreviewSizeId(sizeId)
  }, [setPreviewSizeId])

  const handleApplySize = useCallback((): void => {
    if (previewSizeId === appliedLyricsFontSizeId) {
      return
    }

    setApplyError(null)

    try {
      setLyricsFontSize(previewSizeId)
    } catch {
      setApplyError('No se pudo aplicar el tamaño seleccionado.')
    }
  }, [appliedLyricsFontSizeId, previewSizeId, setLyricsFontSize])

  if (!previewSize) {
    return null
  }

  const canApply = previewSizeId !== appliedLyricsFontSizeId

  return (
    <section
      className="main-menu-customization-font-size-section flex min-h-0 flex-1 flex-col"
      aria-label="Tamaño de fuentes del modo letra"
    >
      <div className="main-menu-customization-font-size-section__header shrink-0">
        <LyricsFontSizePreviewPanel size={previewSize} />
      </div>

      <div className="main-menu-customization-font-size-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-customization-font-size-section__content">
          <nav
            className="main-menu-customization-font-size-section__list"
            aria-label="Tamaños de fuente disponibles"
          >
            {LYRICS_FONT_SIZE_OPTIONS.map((sizeOption) => (
              <LyricsFontSizeOptionButton
                key={sizeOption.id}
                sizeOption={sizeOption}
                isPreviewSelected={sizeOption.id === previewSizeId}
                isApplied={sizeOption.id === appliedLyricsFontSizeId}
                onSelect={handleSelectSize}
              />
            ))}
          </nav>

          <button
            type="button"
            className="main-menu-customization-font-size-section__apply-button montserrat-regular"
            disabled={!canApply}
            onClick={handleApplySize}
          >
            Aplicar tamaño
          </button>

          {applyError ? (
            <p
              className="main-menu-customization-font-size-section__error montserrat-regular"
              role="alert"
            >
              {applyError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
