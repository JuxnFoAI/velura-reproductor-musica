/** Fila editable con icono de lápiz para metadatos de la pista en el panel push. */
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { Check, Pencil, X } from 'lucide-react'

const PENCIL_ICON_SIZE_PX = 16
const ACTION_ICON_SIZE_PX = 16

interface EditableTrackDetailRowProps {
  label: string
  value: string
  isEditable: boolean
  editAriaLabel: string
  acceptAriaLabel: string
  cancelAriaLabel: string
  onSave: (nextValue: string) => void
}

/**
 * Muestra un metadato con botón de edición que alterna a un campo de texto.
 */
export const EditableTrackDetailRow = memo(function EditableTrackDetailRow({
  label,
  value,
  isEditable,
  editAriaLabel,
  acceptAriaLabel,
  cancelAriaLabel,
  onSave,
}: EditableTrackDetailRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value)
    }
  }, [isEditing, value])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  const startEditing = useCallback((): void => {
    if (!isEditable) {
      return
    }

    setDraftValue(value)
    setIsEditing(true)
  }, [isEditable, value])

  const cancelEditing = useCallback((): void => {
    setDraftValue(value)
    setIsEditing(false)
  }, [value])

  const commitEditing = useCallback((): void => {
    const trimmedValue = draftValue.trim()

    if (!trimmedValue || trimmedValue === value) {
      cancelEditing()
      return
    }

    onSave(trimmedValue)
    setIsEditing(false)
  }, [cancelEditing, draftValue, onSave, value])

  const isAcceptDisabled = draftValue.trim().length === 0

  const handleActionMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault()
  }, [])

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitEditing()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        cancelEditing()
      }
    },
    [cancelEditing, commitEditing],
  )

  return (
    <div className="track-detail-row">
      <span className="track-detail-row__label">{label}</span>

      {isEditing ? (
        <div className="track-detail-row__edit-group">
          <input
            ref={inputRef}
            type="text"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label={editAriaLabel}
            className="track-detail-row__input montserrat-regular"
          />

          <div className="track-detail-row__edit-actions">
            <button
              type="button"
              onMouseDown={handleActionMouseDown}
              onClick={commitEditing}
              disabled={isAcceptDisabled}
              aria-label={acceptAriaLabel}
              className="track-detail-row__action-button track-detail-row__action-button--accept"
            >
              <Check size={ACTION_ICON_SIZE_PX} aria-hidden="true" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onMouseDown={handleActionMouseDown}
              onClick={cancelEditing}
              aria-label={cancelAriaLabel}
              className="track-detail-row__action-button track-detail-row__action-button--cancel"
            >
              <X size={ACTION_ICON_SIZE_PX} aria-hidden="true" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <div className="track-detail-row__value-group flex items-center gap-2">
          <span className="montserrat-regular min-w-0 flex-1 text-base text-[var(--player-text)]">
            {value}
          </span>

          {isEditable ? (
            <button
              type="button"
              onClick={startEditing}
              aria-label={editAriaLabel}
              className="track-detail-row__edit-button shrink-0"
            >
              <Pencil size={PENCIL_ICON_SIZE_PX} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
})
