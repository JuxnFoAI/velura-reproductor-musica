/** Sección de fuentes del modo letra con vista previa antes de aplicar. */

import { useCallback, useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import {
  LYRICS_FONT_CATEGORY_LABELS,
  LYRICS_FONT_CATEGORY_ORDER,
  getLyricsFontById,
  getLyricsFontsByCategory,
  loadLyricsFont,
  preloadLyricsFonts,
  useCustomizationStore,
  type LyricsFontCategory,
  type LyricsFontId,
  type LyricsFontOption,
} from '@features/customization'
import { usePreviewState } from '@hooks/usePreviewState'

import { LyricsFontPreviewPanel } from './LyricsFontPreviewPanel'

interface LyricsFontOptionButtonProps {
  fontOption: LyricsFontOption
  isPreviewSelected: boolean
  isApplied: boolean
  onSelect: (fontId: LyricsFontId) => void
}

function LyricsFontOptionButton({
  fontOption,
  isPreviewSelected,
  isApplied,
  onSelect,
}: LyricsFontOptionButtonProps) {
  return (
    <button
      type="button"
      className={[
        'main-menu-customization-fonts-section__option',
        isPreviewSelected ? 'main-menu-customization-fonts-section__option--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isPreviewSelected}
      onClick={() => onSelect(fontOption.id)}
    >
      <span
        className="main-menu-customization-fonts-section__option-label"
        style={{ fontFamily: fontOption.fontFamily }}
      >
        {fontOption.label}
      </span>

      {isApplied ? (
        <span className="main-menu-customization-fonts-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activa
        </span>
      ) : null}
    </button>
  )
}

function resolveInitialCategory(fontId: LyricsFontId): LyricsFontCategory {
  return getLyricsFontById(fontId)?.category ?? 'standard'
}

/**
 * Permite previsualizar y aplicar una fuente exclusiva para el panel de letras.
 */
export function MainMenuCustomizationFontsSection() {
  const appliedLyricsFontId = useCustomizationStore((state) => state.appliedLyricsFontId)
  const setLyricsFont = useCustomizationStore((state) => state.setLyricsFont)
  const [previewFontId, setPreviewFontId] = usePreviewState(appliedLyricsFontId)
  const [activeCategory, setActiveCategory] = useState<LyricsFontCategory>(() =>
    resolveInitialCategory(appliedLyricsFontId),
  )
  const [previousAppliedFontId, setPreviousAppliedFontId] = useState(appliedLyricsFontId)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [loadedPreviewFontId, setLoadedPreviewFontId] = useState<LyricsFontId | null>(null)

  const previewFont = getLyricsFontById(previewFontId)
  const visibleFonts = getLyricsFontsByCategory(activeCategory)
  const isPreviewFontReady = previewFont !== undefined && loadedPreviewFontId === previewFont.id

  if (previousAppliedFontId !== appliedLyricsFontId) {
    setPreviousAppliedFontId(appliedLyricsFontId)
    setActiveCategory(resolveInitialCategory(appliedLyricsFontId))
  }

  useEffect(() => {
    void preloadLyricsFonts(getLyricsFontsByCategory(activeCategory)).catch(() => {
      // El error concreto se reporta al cargar la fuente en vista previa.
    })
  }, [activeCategory])

  useEffect(() => {
    if (!previewFont) {
      return undefined
    }

    let cancelled = false

    void loadLyricsFont(previewFont)
      .then(() => {
        if (!cancelled) {
          setLoadedPreviewFontId(previewFont.id)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedPreviewFontId(null)
          setApplyError(`No se pudo cargar la fuente ${previewFont.label}.`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [previewFont])

  const handleSelectCategory = useCallback((category: LyricsFontCategory): void => {
    setActiveCategory(category)
    setApplyError(null)
  }, [])

  const handleSelectFont = useCallback((fontId: LyricsFontId): void => {
    setApplyError(null)
    setPreviewFontId(fontId)
  }, [setPreviewFontId])

  const handleApplyFont = useCallback(async (): Promise<void> => {
    if (previewFontId === appliedLyricsFontId) {
      return
    }

    setIsApplying(true)
    setApplyError(null)

    try {
      await setLyricsFont(previewFontId)
    } catch {
      setApplyError('No se pudo aplicar la fuente seleccionada.')
    } finally {
      setIsApplying(false)
    }
  }, [appliedLyricsFontId, previewFontId, setLyricsFont])

  if (!previewFont) {
    return null
  }

  const canApply = previewFontId !== appliedLyricsFontId

  return (
    <section
      className="main-menu-customization-fonts-section flex min-h-0 flex-1 flex-col"
      aria-label="Fuentes del modo letra"
    >
      <div className="main-menu-customization-fonts-section__header shrink-0">
        <LyricsFontPreviewPanel
          key={`${previewFont.id}-${isPreviewFontReady ? 'ready' : 'loading'}`}
          font={previewFont}
          isLoading={!isPreviewFontReady}
        />

        <div
          className="main-menu-customization-fonts-section__category-toggle"
          role="tablist"
          aria-label="Categorías de fuentes"
        >
          {LYRICS_FONT_CATEGORY_ORDER.map((category) => {
            const isActive = activeCategory === category

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'main-menu-customization-fonts-section__category-button montserrat-regular',
                  isActive ? 'main-menu-customization-fonts-section__category-button--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectCategory(category)}
              >
                {LYRICS_FONT_CATEGORY_LABELS[category]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="main-menu-customization-fonts-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-customization-fonts-section__content">
          <nav
            className="main-menu-customization-fonts-section__list"
            aria-label={`Fuentes ${LYRICS_FONT_CATEGORY_LABELS[activeCategory].toLowerCase()}`}
          >
            {visibleFonts.map((fontOption) => (
              <LyricsFontOptionButton
                key={fontOption.id}
                fontOption={fontOption}
                isPreviewSelected={fontOption.id === previewFontId}
                isApplied={fontOption.id === appliedLyricsFontId}
                onSelect={handleSelectFont}
              />
            ))}
          </nav>

          <button
            type="button"
            className="main-menu-customization-fonts-section__apply-button montserrat-regular"
            disabled={!canApply || isApplying}
            onClick={() => {
              void handleApplyFont()
            }}
          >
            {isApplying ? 'Aplicando…' : 'Aplicar fuente'}
          </button>

          {applyError ? (
            <p
              className="main-menu-customization-fonts-section__error montserrat-regular"
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
