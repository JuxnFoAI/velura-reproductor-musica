/** Editor visual de escala y rotación para la portada dentro del marco cuadrado. */
import { memo, type ChangeEvent } from 'react'

const MIN_SCALE = 1
const MAX_SCALE = 3
const MIN_ROTATION = -180
const MAX_ROTATION = 180
const SCALE_STEP = 0.01
const ROTATION_STEP = 1

interface CoverImageEditorProps {
  imageUrl: string
  scale: number
  rotation: number
  onScaleChange: (scale: number) => void
  onRotationChange: (rotation: number) => void
}

interface AdjustSliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

function AdjustSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: AdjustSliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(event.target.value))
  }

  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2)

  return (
    <div className="cover-adjust-editor__control">
      <div className="cover-adjust-editor__control-header">
        <label htmlFor={id} className="cover-adjust-editor__label montserrat-regular">
          {label}
        </label>
        <span className="cover-adjust-editor__value montserrat-regular" aria-hidden="true">
          {formattedValue}
          {unit}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="cover-adjust-editor__slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  )
}

/**
 * Muestra la vista previa recortada y los controles de tamaño y ángulo.
 */
export const CoverImageEditor = memo(function CoverImageEditor({
  imageUrl,
  scale,
  rotation,
  onScaleChange,
  onRotationChange,
}: CoverImageEditorProps) {
  return (
    <div className="cover-adjust-editor">
      <div className="cover-adjust-editor__frame" aria-hidden="true">
        <img
          src={imageUrl}
          alt=""
          decoding="async"
          draggable={false}
          className="cover-adjust-editor__image"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      <div className="cover-adjust-editor__controls">
        <AdjustSlider
          id="cover-adjust-scale"
          label="Tamaño"
          value={scale}
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={SCALE_STEP}
          unit="x"
          onChange={onScaleChange}
        />

        <AdjustSlider
          id="cover-adjust-rotation"
          label="Ángulo"
          value={rotation}
          min={MIN_ROTATION}
          max={MAX_ROTATION}
          step={ROTATION_STEP}
          unit="°"
          onChange={onRotationChange}
        />
      </div>
    </div>
  )
})
