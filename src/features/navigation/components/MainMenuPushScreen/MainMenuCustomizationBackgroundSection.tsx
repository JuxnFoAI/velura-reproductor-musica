/** Sección de fondo del reproductor con modo predeterminado o imagen personalizada. */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Check, ImagePlus } from 'lucide-react'

import {
  DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS,
  PLAYER_BACKGROUND_OPTIONS,
  arePlayerBackgroundAdjustmentsEqual,
  useCustomizationStore,
  type PlayerBackgroundAdjustments,
  type PlayerBackgroundMode,
  type PlayerBackgroundOption,
} from '@features/customization'
import { BackgroundAdjustmentsControls } from './BackgroundAdjustmentsControls'
import { BackgroundPreviewPanel } from './BackgroundPreviewPanel'

const BACKGROUND_IMAGE_ACCEPT = 'image/*'
const MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024

interface BackgroundOptionButtonProps {
  option: PlayerBackgroundOption
  isPreviewSelected: boolean
  isApplied: boolean
  onSelect: (mode: PlayerBackgroundMode) => void
}

function BackgroundOptionButton({
  option,
  isPreviewSelected,
  isApplied,
  onSelect,
}: BackgroundOptionButtonProps) {
  return (
    <button
      type="button"
      className={[
        'main-menu-customization-background-section__option',
        isPreviewSelected ? 'main-menu-customization-background-section__option--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isPreviewSelected}
      onClick={() => onSelect(option.id)}
    >
      <span className="main-menu-customization-background-section__option-content">
        <span className="main-menu-customization-background-section__option-label montserrat-regular">
          {option.label}
        </span>
        <span className="main-menu-customization-background-section__option-description montserrat-regular">
          {option.description}
        </span>
      </span>

      {isApplied ? (
        <span className="main-menu-customization-background-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

/**
 * Convierte un archivo de imagen a data URL para persistir el fondo personalizado.
 */
function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('No se pudo leer la imagen seleccionada.'))
    }

    reader.onerror = () => {
      reject(new Error('No se pudo leer la imagen seleccionada.'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Permite elegir entre el fondo dinámico de portadas o una imagen personalizada.
 */
export function MainMenuCustomizationBackgroundSection() {
  const appliedBackgroundMode = useCustomizationStore((state) => state.appliedBackgroundMode)
  const appliedCustomBackgroundUrl = useCustomizationStore((state) => state.customBackgroundUrl)
  const appliedCustomBackgroundAdjustments = useCustomizationStore(
    (state) => state.customBackgroundAdjustments,
  )
  const setPlayerBackground = useCustomizationStore((state) => state.setPlayerBackground)

  const [previewMode, setPreviewMode] = useState<PlayerBackgroundMode>(appliedBackgroundMode)
  const [previewCustomBackgroundUrl, setPreviewCustomBackgroundUrl] = useState<string | null>(
    appliedCustomBackgroundUrl,
  )
  const [previewAdjustments, setPreviewAdjustments] = useState<PlayerBackgroundAdjustments>(
    appliedCustomBackgroundAdjustments,
  )
  const [applyError, setApplyError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewMode(appliedBackgroundMode)
    setPreviewCustomBackgroundUrl(appliedCustomBackgroundUrl)
    setPreviewAdjustments(appliedCustomBackgroundAdjustments)
  }, [
    appliedBackgroundMode,
    appliedCustomBackgroundUrl,
    appliedCustomBackgroundAdjustments,
  ])

  const handleSelectMode = useCallback((mode: PlayerBackgroundMode): void => {
    setApplyError(null)
    setPreviewMode(mode)
  }, [])

  const handleOpenFilePicker = useCallback((): void => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      setApplyError('Selecciona un archivo de imagen válido.')
      return
    }

    if (selectedFile.size > MAX_BACKGROUND_IMAGE_BYTES) {
      setApplyError('La imagen debe pesar menos de 5 MB.')
      return
    }

    void readImageFileAsDataUrl(selectedFile)
      .then((dataUrl) => {
        setApplyError(null)
        setPreviewMode('custom')
        setPreviewCustomBackgroundUrl(dataUrl)
        setPreviewAdjustments({ ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS })
      })
      .catch(() => {
        setApplyError('No se pudo cargar la imagen seleccionada.')
      })
  }, [])

  const handleApplyBackground = useCallback((): void => {
    if (previewMode === 'custom' && !previewCustomBackgroundUrl) {
      setApplyError('Selecciona una imagen antes de aplicar un fondo personalizado.')
      return
    }

    const hasChanges =
      previewMode !== appliedBackgroundMode ||
      (previewMode === 'custom' &&
        (previewCustomBackgroundUrl !== appliedCustomBackgroundUrl ||
          !arePlayerBackgroundAdjustmentsEqual(
            previewAdjustments,
            appliedCustomBackgroundAdjustments,
          )))

    if (!hasChanges) {
      return
    }

    setApplyError(null)

    try {
      setPlayerBackground(previewMode, previewCustomBackgroundUrl, previewAdjustments)
    } catch {
      setApplyError('No se pudo aplicar el fondo seleccionado.')
    }
  }, [
    appliedBackgroundMode,
    appliedCustomBackgroundAdjustments,
    appliedCustomBackgroundUrl,
    previewAdjustments,
    previewCustomBackgroundUrl,
    previewMode,
    setPlayerBackground,
  ])

  const canApply =
    previewMode !== appliedBackgroundMode ||
    (previewMode === 'custom' &&
      (previewCustomBackgroundUrl !== appliedCustomBackgroundUrl ||
        !arePlayerBackgroundAdjustmentsEqual(
          previewAdjustments,
          appliedCustomBackgroundAdjustments,
        )))

  return (
    <section
      className="main-menu-customization-background-section flex min-h-0 flex-1 flex-col"
      aria-label="Fondo del reproductor"
    >
      {previewMode === 'custom' && previewCustomBackgroundUrl ? (
        <div className="main-menu-customization-background-section__header shrink-0">
          <BackgroundPreviewPanel
            customBackgroundUrl={previewCustomBackgroundUrl}
            adjustments={previewAdjustments}
          />
        </div>
      ) : null}

      <div className="main-menu-customization-background-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-customization-background-section__content">
          <nav
            className="main-menu-customization-background-section__list"
            aria-label="Modos de fondo disponibles"
          >
            {PLAYER_BACKGROUND_OPTIONS.map((option) => (
              <BackgroundOptionButton
                key={option.id}
                option={option}
                isPreviewSelected={option.id === previewMode}
                isApplied={option.id === appliedBackgroundMode}
                onSelect={handleSelectMode}
              />
            ))}
          </nav>

          {previewMode === 'custom' ? (
            <>
              <button
                type="button"
                className="main-menu-customization-background-section__pick-button montserrat-regular"
                onClick={handleOpenFilePicker}
              >
                <ImagePlus size={18} aria-hidden="true" />
                Seleccionar imagen
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={BACKGROUND_IMAGE_ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
              />

              {previewCustomBackgroundUrl ? (
                <BackgroundAdjustmentsControls
                  adjustments={previewAdjustments}
                  onChange={setPreviewAdjustments}
                />
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            className="main-menu-customization-background-section__apply-button montserrat-regular"
            disabled={!canApply}
            onClick={handleApplyBackground}
          >
            Aplicar fondo
          </button>

          {applyError ? (
            <p
              className="main-menu-customization-background-section__error montserrat-regular"
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
