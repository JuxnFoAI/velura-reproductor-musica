/** Sección de colores del reproductor con color de letra y color de botones. */

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'

import { usePreviewState } from '@hooks/usePreviewState'

import { useCustomizationStore } from '../store'
import {
  PLAYER_BUTTON_COLOR_OPTIONS,
  PLAYER_COLOR_CATEGORY_LABELS,
  PLAYER_COLOR_CATEGORY_ORDER,
  PLAYER_LETTER_COLOR_OPTIONS,
  getPlayerButtonColorById,
  getPlayerLetterColorById,
  type PlayerButtonColorId,
  type PlayerButtonColorOption,
  type PlayerColorCategory,
  type PlayerLetterColorId,
  type PlayerLetterColorOption,
} from '../types/playerColors'

import { PlayerButtonColorPreviewPanel } from './PlayerButtonColorPreviewPanel'
import { PlayerLetterColorPreviewPanel } from './PlayerLetterColorPreviewPanel'

interface PlayerColorOptionButtonProps {
  label: string
  swatch: string
  isPreviewSelected: boolean
  isApplied: boolean
  onSelect: () => void
}

function PlayerColorOptionButton({
  label,
  swatch,
  isPreviewSelected,
  isApplied,
  onSelect,
}: PlayerColorOptionButtonProps) {
  return (
    <button
      type="button"
      className={[
        'main-menu-customization-player-colors-section__option',
        isPreviewSelected ? 'main-menu-customization-player-colors-section__option--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isPreviewSelected}
      onClick={onSelect}
    >
      <span className="main-menu-customization-player-colors-section__option-content">
        <span
          className="main-menu-customization-player-colors-section__swatch"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
        <span className="main-menu-customization-player-colors-section__option-label montserrat-regular">
          {label}
        </span>
      </span>

      {isApplied ? (
        <span className="main-menu-customization-player-colors-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

/**
 * Permite previsualizar y aplicar colores de letra y botones del reproductor.
 */
export function PlayerColorsSettingsSection() {
  const appliedPlayerLetterColorId = useCustomizationStore(
    (state) => state.appliedPlayerLetterColorId,
  )
  const appliedPlayerButtonColorId = useCustomizationStore(
    (state) => state.appliedPlayerButtonColorId,
  )
  const setPlayerLetterColor = useCustomizationStore((state) => state.setPlayerLetterColor)
  const setPlayerButtonColor = useCustomizationStore((state) => state.setPlayerButtonColor)

  const [activeCategory, setActiveCategory] = useState<PlayerColorCategory>('letter')
  const [previewLetterColorId, setPreviewLetterColorId] = usePreviewState(appliedPlayerLetterColorId)
  const [previewButtonColorId, setPreviewButtonColorId] = usePreviewState(appliedPlayerButtonColorId)
  const [applyError, setApplyError] = useState<string | null>(null)

  const previewLetterColor = getPlayerLetterColorById(previewLetterColorId)
  const previewButtonColor = getPlayerButtonColorById(previewButtonColorId)

  const handleSelectCategory = useCallback((category: PlayerColorCategory): void => {
    setActiveCategory(category)
    setApplyError(null)
  }, [])

  const handleSelectLetterColor = useCallback((colorId: PlayerLetterColorId): void => {
    setApplyError(null)
    setPreviewLetterColorId(colorId)
  }, [setPreviewLetterColorId])

  const handleSelectButtonColor = useCallback((colorId: PlayerButtonColorId): void => {
    setApplyError(null)
    setPreviewButtonColorId(colorId)
  }, [setPreviewButtonColorId])

  const handleApplyColor = useCallback((): void => {
    setApplyError(null)

    try {
      if (activeCategory === 'letter') {
        if (previewLetterColorId === appliedPlayerLetterColorId) {
          return
        }

        setPlayerLetterColor(previewLetterColorId)
        return
      }

      if (previewButtonColorId === appliedPlayerButtonColorId) {
        return
      }

      setPlayerButtonColor(previewButtonColorId)
    } catch {
      setApplyError('No se pudo aplicar el color seleccionado.')
    }
  }, [
    activeCategory,
    appliedPlayerButtonColorId,
    appliedPlayerLetterColorId,
    previewButtonColorId,
    previewLetterColorId,
    setPlayerButtonColor,
    setPlayerLetterColor,
  ])

  if (!previewLetterColor || !previewButtonColor) {
    return null
  }

  const isLetterCategory = activeCategory === 'letter'
  const canApply = isLetterCategory
    ? previewLetterColorId !== appliedPlayerLetterColorId
    : previewButtonColorId !== appliedPlayerButtonColorId

  return (
    <section
      className="main-menu-customization-player-colors-section flex min-h-0 flex-1 flex-col"
      aria-label="Colores del reproductor"
    >
      <div className="main-menu-customization-player-colors-section__header shrink-0">
        {isLetterCategory ? (
          <PlayerLetterColorPreviewPanel color={previewLetterColor} />
        ) : (
          <PlayerButtonColorPreviewPanel color={previewButtonColor} />
        )}

        <div
          className="main-menu-customization-player-colors-section__category-toggle"
          role="tablist"
          aria-label="Tipos de color del reproductor"
        >
          {PLAYER_COLOR_CATEGORY_ORDER.map((category) => {
            const isActive = activeCategory === category

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'main-menu-customization-player-colors-section__category-button montserrat-regular',
                  isActive
                    ? 'main-menu-customization-player-colors-section__category-button--active'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectCategory(category)}
              >
                {PLAYER_COLOR_CATEGORY_LABELS[category]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="main-menu-customization-player-colors-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-customization-player-colors-section__content">
          <nav
            className="main-menu-customization-player-colors-section__list"
            aria-label={`Colores de ${PLAYER_COLOR_CATEGORY_LABELS[activeCategory].toLowerCase()}`}
          >
            {isLetterCategory
              ? PLAYER_LETTER_COLOR_OPTIONS.map((colorOption: PlayerLetterColorOption) => (
                  <PlayerColorOptionButton
                    key={colorOption.id}
                    label={colorOption.label}
                    swatch={colorOption.swatch}
                    isPreviewSelected={colorOption.id === previewLetterColorId}
                    isApplied={colorOption.id === appliedPlayerLetterColorId}
                    onSelect={() => handleSelectLetterColor(colorOption.id)}
                  />
                ))
              : PLAYER_BUTTON_COLOR_OPTIONS.map((colorOption: PlayerButtonColorOption) => (
                  <PlayerColorOptionButton
                    key={colorOption.id}
                    label={colorOption.label}
                    swatch={colorOption.swatch}
                    isPreviewSelected={colorOption.id === previewButtonColorId}
                    isApplied={colorOption.id === appliedPlayerButtonColorId}
                    onSelect={() => handleSelectButtonColor(colorOption.id)}
                  />
                ))}
          </nav>

          <button
            type="button"
            className="main-menu-customization-player-colors-section__apply-button montserrat-regular"
            disabled={!canApply}
            onClick={handleApplyColor}
          >
            Aplicar color
          </button>

          {applyError ? (
            <p
              className="main-menu-customization-player-colors-section__error montserrat-regular"
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
