/** Sección de personalización de la Isla dinámica con toggle y colores. */

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'

import {
  DYNAMIC_ISLAND_COLOR_OPTIONS,
  getDynamicIslandColorById,
  useCustomizationStore,
  type DynamicIslandColorId,
  type DynamicIslandColorOption,
} from '@features/customization'
import { usePreviewState } from '@hooks/usePreviewState'

interface DynamicIslandColorOptionButtonProps {
  option: DynamicIslandColorOption
  isPreviewSelected: boolean
  isApplied: boolean
  isDisabled: boolean
  onSelect: (colorId: DynamicIslandColorId) => void
}

function DynamicIslandColorOptionButton({
  option,
  isPreviewSelected,
  isApplied,
  isDisabled,
  onSelect,
}: DynamicIslandColorOptionButtonProps) {
  return (
    <button
      type="button"
      className={[
        'main-menu-customization-dynamic-island-section__option',
        isPreviewSelected
          ? 'main-menu-customization-dynamic-island-section__option--selected'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isPreviewSelected}
      disabled={isDisabled}
      onClick={() => onSelect(option.id)}
    >
      <span className="main-menu-customization-dynamic-island-section__option-content">
        <span
          className="main-menu-customization-dynamic-island-section__swatch"
          style={{ backgroundColor: option.swatch }}
          aria-hidden="true"
        />
        <span className="main-menu-customization-dynamic-island-section__option-label montserrat-regular">
          {option.label}
        </span>
      </span>

      {isApplied ? (
        <span className="main-menu-customization-dynamic-island-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

/**
 * Permite activar o desactivar la Isla dinámica y elegir su color de fondo.
 */
export function MainMenuCustomizationDynamicIslandSection() {
  const isDynamicIslandEnabled = useCustomizationStore((state) => state.isDynamicIslandEnabled)
  const appliedDynamicIslandColorId = useCustomizationStore(
    (state) => state.appliedDynamicIslandColorId,
  )
  const setDynamicIslandEnabled = useCustomizationStore((state) => state.setDynamicIslandEnabled)
  const setDynamicIslandColor = useCustomizationStore((state) => state.setDynamicIslandColor)

  const [previewColorId, setPreviewColorId] = usePreviewState(appliedDynamicIslandColorId)
  const [applyError, setApplyError] = useState<string | null>(null)

  const previewColor = getDynamicIslandColorById(previewColorId)

  const handleToggleEnabled = useCallback((): void => {
    setDynamicIslandEnabled(!isDynamicIslandEnabled)
  }, [isDynamicIslandEnabled, setDynamicIslandEnabled])

  const handleSelectColor = useCallback((colorId: DynamicIslandColorId): void => {
    setApplyError(null)
    setPreviewColorId(colorId)
  }, [setPreviewColorId])

  const handleApplyColor = useCallback((): void => {
    setApplyError(null)

    if (previewColorId === appliedDynamicIslandColorId) {
      return
    }

    try {
      setDynamicIslandColor(previewColorId)
    } catch {
      setApplyError('No se pudo aplicar el color seleccionado.')
    }
  }, [appliedDynamicIslandColorId, previewColorId, setDynamicIslandColor])

  if (!previewColor) {
    return null
  }

  const canApply = previewColorId !== appliedDynamicIslandColorId

  return (
    <section
      className="main-menu-customization-dynamic-island-section flex min-h-0 flex-1 flex-col"
      aria-label="Isla dinámica"
    >
      <div className="main-menu-customization-dynamic-island-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-customization-dynamic-island-section__content">
          <button
            type="button"
            className={[
              'main-menu-customization-dynamic-island-section__toggle',
              isDynamicIslandEnabled
                ? 'main-menu-customization-dynamic-island-section__toggle--active'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isDynamicIslandEnabled}
            onClick={handleToggleEnabled}
          >
            <span className="main-menu-customization-dynamic-island-section__toggle-copy">
              <span className="main-menu-customization-dynamic-island-section__toggle-label montserrat-regular">
                Isla dinámica
              </span>
              <span className="main-menu-customization-dynamic-island-section__toggle-description montserrat-regular">
                {isDynamicIslandEnabled
                  ? 'Visible en la parte superior del escritorio'
                  : 'Desactivada'}
              </span>
            </span>
            <span
              className="main-menu-customization-dynamic-island-section__toggle-indicator"
              aria-hidden="true"
            />
          </button>

          <div
            className={[
              'main-menu-customization-dynamic-island-section__panel',
              !isDynamicIslandEnabled
                ? 'main-menu-customization-dynamic-island-section__panel--disabled'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="main-menu-customization-dynamic-island-section__preview">
              <div
                className="main-menu-customization-dynamic-island-section__preview-island"
                style={{ backgroundColor: previewColor.background }}
                aria-hidden="true"
              >
                <span className="main-menu-customization-dynamic-island-section__preview-cover" />
                <span className="main-menu-customization-dynamic-island-section__preview-title montserrat-regular">
                  Vista previa
                </span>
              </div>
            </div>

            <nav
              className="main-menu-customization-dynamic-island-section__list"
              aria-label="Colores de la Isla dinámica"
            >
              {DYNAMIC_ISLAND_COLOR_OPTIONS.map((colorOption) => (
                <DynamicIslandColorOptionButton
                  key={colorOption.id}
                  option={colorOption}
                  isPreviewSelected={colorOption.id === previewColorId}
                  isApplied={colorOption.id === appliedDynamicIslandColorId}
                  isDisabled={!isDynamicIslandEnabled}
                  onSelect={handleSelectColor}
                />
              ))}
            </nav>

            <button
              type="button"
              className="main-menu-customization-dynamic-island-section__apply-button montserrat-regular"
              disabled={!canApply || !isDynamicIslandEnabled}
              onClick={handleApplyColor}
            >
              Aplicar color
            </button>

            {applyError ? (
              <p
                className="main-menu-customization-dynamic-island-section__error montserrat-regular"
                role="alert"
              >
                {applyError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
