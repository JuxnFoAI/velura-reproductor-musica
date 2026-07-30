/** Sección del ecualizador dentro de Calidad del audio. */

import { useCallback, type ChangeEvent } from 'react'
import { Check } from 'lucide-react'

import {
  EQ_BAND_DEFINITIONS,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_GAIN_STEP_DB,
  EQUALIZER_PRESET_OPTIONS,
  formatEqualizerGainDb,
  useEqualizerStore,
  type EqualizerBandId,
  type EqualizerPresetId,
  type EqualizerPresetOption,
} from '@features/audioQuality'

interface EqualizerPresetButtonProps {
  preset: EqualizerPresetOption
  isSelected: boolean
  isApplied: boolean
  isDisabled: boolean
  onSelect: (presetId: EqualizerPresetId) => void
}

function EqualizerPresetButton({
  preset,
  isSelected,
  isApplied,
  isDisabled,
  onSelect,
}: EqualizerPresetButtonProps) {
  if (preset.id === 'custom') {
    return null
  }

  return (
    <button
      type="button"
      className={[
        'main-menu-audio-equalizer-section__preset',
        isSelected ? 'main-menu-audio-equalizer-section__preset--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={() => onSelect(preset.id)}
    >
      <span className="main-menu-audio-equalizer-section__preset-content">
        <span className="main-menu-audio-equalizer-section__preset-label montserrat-regular">
          {preset.label}
        </span>
        <span className="main-menu-audio-equalizer-section__preset-description montserrat-regular">
          {preset.description}
        </span>
      </span>

      {isApplied ? (
        <span className="main-menu-audio-equalizer-section__applied-badge montserrat-regular">
          <Check size={14} aria-hidden="true" />
          Activo
        </span>
      ) : null}
    </button>
  )
}

interface EqualizerBandSliderProps {
  bandId: EqualizerBandId
  label: string
  frequencyHz: number
  value: number
  disabled: boolean
  onChange: (bandId: EqualizerBandId, gainDb: number) => void
}

function EqualizerBandSlider({
  bandId,
  label,
  frequencyHz,
  value,
  disabled,
  onChange,
}: EqualizerBandSliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(bandId, Number(event.target.value))
  }

  const frequencyLabel =
    frequencyHz >= 1000 ? `${Math.round(frequencyHz / 1000)} kHz` : `${frequencyHz} Hz`

  return (
    <div className="main-menu-audio-equalizer-section__band">
      <div className="main-menu-audio-equalizer-section__band-header">
        <label
          htmlFor={`equalizer-band-${bandId}`}
          className="main-menu-audio-equalizer-section__band-label montserrat-regular"
        >
          {label}
        </label>
        <span className="main-menu-audio-equalizer-section__band-value montserrat-regular">
          {formatEqualizerGainDb(value)}
        </span>
      </div>

      <input
        id={`equalizer-band-${bandId}`}
        type="range"
        min={EQ_GAIN_MIN_DB}
        max={EQ_GAIN_MAX_DB}
        step={EQ_GAIN_STEP_DB}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className="main-menu-audio-equalizer-section__band-slider"
        aria-valuemin={EQ_GAIN_MIN_DB}
        aria-valuemax={EQ_GAIN_MAX_DB}
        aria-valuenow={value}
        aria-valuetext={formatEqualizerGainDb(value)}
      />

      <div className="main-menu-audio-equalizer-section__band-meta montserrat-regular" aria-hidden="true">
        <span>{frequencyLabel}</span>
        <span>{EQ_GAIN_MIN_DB} dB</span>
        <span>0</span>
        <span>{EQ_GAIN_MAX_DB} dB</span>
      </div>
    </div>
  )
}

/**
 * Permite activar el ecualizador, elegir presets y ajustar bandas manualmente.
 */
export function MainMenuAudioQualityEqualizerSection() {
  const isEnabled = useEqualizerStore((state) => state.isEnabled)
  const presetId = useEqualizerStore((state) => state.presetId)
  const bandGains = useEqualizerStore((state) => state.bandGains)
  const setEnabled = useEqualizerStore((state) => state.setEnabled)
  const setPreset = useEqualizerStore((state) => state.setPreset)
  const setBandGain = useEqualizerStore((state) => state.setBandGain)
  const resetToFlat = useEqualizerStore((state) => state.resetToFlat)

  const handleToggleEnabled = useCallback((): void => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  const handleSelectPreset = useCallback(
    (nextPresetId: EqualizerPresetId): void => {
      setPreset(nextPresetId)
    },
    [setPreset],
  )

  const handleBandGainChange = useCallback(
    (bandId: EqualizerBandId, gainDb: number): void => {
      setBandGain(bandId, gainDb)
    },
    [setBandGain],
  )

  const selectablePresets = EQUALIZER_PRESET_OPTIONS.filter((preset) => preset.id !== 'custom')

  return (
    <section
      className="main-menu-audio-equalizer-section flex min-h-0 flex-1 flex-col"
      aria-label="Ecualizador"
    >
      <div className="main-menu-audio-equalizer-section__body main-menu-screen__scroll player-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="main-menu-audio-equalizer-section__content">
          <button
            type="button"
            className={[
              'main-menu-audio-equalizer-section__toggle',
              isEnabled ? 'main-menu-audio-equalizer-section__toggle--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isEnabled}
            onClick={handleToggleEnabled}
          >
            <span className="main-menu-audio-equalizer-section__toggle-copy">
              <span className="main-menu-audio-equalizer-section__toggle-label montserrat-regular">
                Ecualizador
              </span>
              <span className="main-menu-audio-equalizer-section__toggle-description montserrat-regular">
                {isEnabled ? 'Activo en la reproducción' : 'Desactivado'}
              </span>
            </span>
            <span className="main-menu-audio-equalizer-section__toggle-indicator" aria-hidden="true" />
          </button>

          <div
            className={[
              'main-menu-audio-equalizer-section__panel',
              !isEnabled ? 'main-menu-audio-equalizer-section__panel--disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="main-menu-audio-equalizer-section__visualizer" aria-hidden="true">
              {EQ_BAND_DEFINITIONS.map((band) => {
                const gain = bandGains[band.id]
                const normalizedHeight = ((gain - EQ_GAIN_MIN_DB) / (EQ_GAIN_MAX_DB - EQ_GAIN_MIN_DB)) * 100

                return (
                  <span key={band.id} className="main-menu-audio-equalizer-section__visualizer-bar">
                    <span
                      className="main-menu-audio-equalizer-section__visualizer-fill"
                      style={{ height: `${normalizedHeight}%` }}
                    />
                  </span>
                )
              })}
            </div>

            <nav
              className="main-menu-audio-equalizer-section__presets"
              aria-label="Presets del ecualizador"
            >
              {selectablePresets.map((preset) => (
                <EqualizerPresetButton
                  key={preset.id}
                  preset={preset}
                  isSelected={presetId === preset.id}
                  isApplied={presetId === preset.id}
                  isDisabled={!isEnabled}
                  onSelect={handleSelectPreset}
                />
              ))}
            </nav>

            <div className="main-menu-audio-equalizer-section__bands" aria-label="Ajuste por bandas">
              {EQ_BAND_DEFINITIONS.map((band) => (
                <EqualizerBandSlider
                  key={band.id}
                  bandId={band.id}
                  label={band.label}
                  frequencyHz={band.frequencyHz}
                  value={bandGains[band.id]}
                  disabled={!isEnabled}
                  onChange={handleBandGainChange}
                />
              ))}
            </div>

            <button
              type="button"
              className="main-menu-audio-equalizer-section__reset-button montserrat-regular"
              disabled={!isEnabled}
              onClick={resetToFlat}
            >
              Restablecer plano
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
