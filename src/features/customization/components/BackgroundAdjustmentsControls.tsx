/** Controles deslizantes para brillo, contraste, tonalidad y desenfoque del fondo personalizado. */

import { type ChangeEvent } from 'react'

import {
  BACKGROUND_ADJUSTMENT_MAX,
  BACKGROUND_ADJUSTMENT_MIN,
  BACKGROUND_ADJUSTMENT_STEP,
  formatBackgroundAdjustmentValue,
  type PlayerBackgroundAdjustments,
} from '../types/playerBackgroundAdjustments'

interface BackgroundAdjustmentSliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function BackgroundAdjustmentSlider({
  id,
  label,
  value,
  onChange,
}: BackgroundAdjustmentSliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(event.target.value))
  }

  return (
    <div className="background-adjustments__control">
      <div className="background-adjustments__control-header">
        <label htmlFor={id} className="background-adjustments__label montserrat-regular">
          {label}
        </label>
        <span className="background-adjustments__value montserrat-regular" aria-hidden="true">
          {formatBackgroundAdjustmentValue(value)}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={BACKGROUND_ADJUSTMENT_MIN}
        max={BACKGROUND_ADJUSTMENT_MAX}
        step={BACKGROUND_ADJUSTMENT_STEP}
        value={value}
        onChange={handleChange}
        className="background-adjustments__slider"
        aria-valuemin={BACKGROUND_ADJUSTMENT_MIN}
        aria-valuemax={BACKGROUND_ADJUSTMENT_MAX}
        aria-valuenow={value}
      />

      <div className="background-adjustments__range-labels montserrat-regular" aria-hidden="true">
        <span>{BACKGROUND_ADJUSTMENT_MIN}</span>
        <span>0</span>
        <span>{BACKGROUND_ADJUSTMENT_MAX}</span>
      </div>
    </div>
  )
}

interface BackgroundAdjustmentsControlsProps {
  adjustments: PlayerBackgroundAdjustments
  onChange: (adjustments: PlayerBackgroundAdjustments) => void
}

/**
 * Permite ajustar brillo, contraste, tonalidad y desenfoque del fondo personalizado.
 */
export function BackgroundAdjustmentsControls({
  adjustments,
  onChange,
}: BackgroundAdjustmentsControlsProps) {
  const handleBrightnessChange = (brightness: number): void => {
    onChange({ ...adjustments, brightness })
  }

  const handleContrastChange = (contrast: number): void => {
    onChange({ ...adjustments, contrast })
  }

  const handleToneChange = (tone: number): void => {
    onChange({ ...adjustments, tone })
  }

  const handleBlurChange = (blur: number): void => {
    onChange({ ...adjustments, blur })
  }

  return (
    <div className="background-adjustments" aria-label="Ajustes del fondo personalizado">
      <BackgroundAdjustmentSlider
        id="background-adjust-brightness"
        label="Brillo"
        value={adjustments.brightness}
        onChange={handleBrightnessChange}
      />

      <BackgroundAdjustmentSlider
        id="background-adjust-contrast"
        label="Contraste"
        value={adjustments.contrast}
        onChange={handleContrastChange}
      />

      <BackgroundAdjustmentSlider
        id="background-adjust-tone"
        label="Tonalidad"
        value={adjustments.tone}
        onChange={handleToneChange}
      />

      <BackgroundAdjustmentSlider
        id="background-adjust-blur"
        label="Desenfoque"
        value={adjustments.blur}
        onChange={handleBlurChange}
      />
    </div>
  )
}
