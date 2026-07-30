/** Formulario inline para nombrar una nueva lista de reproducción. */

import { memo, useCallback, useEffect, useRef, type FormEvent } from 'react'

interface MainMenuCreatePlaylistFormProps {
  value: string
  onChange: (value: string) => void
  onAccept: () => void
  onCancel: () => void
  formLabel?: string
  placeholder?: string
  ariaLabel?: string
  inputId?: string
}

/**
 * Campo de nombre con acciones de aceptar o cancelar la creación.
 */
export const MainMenuCreatePlaylistForm = memo(function MainMenuCreatePlaylistForm({
  value,
  onChange,
  onAccept,
  onCancel,
  formLabel = 'Nombre de la lista',
  placeholder = 'Escribe el nombre de tu lista',
  ariaLabel = 'Crear lista de reproducción',
  inputId = 'playlist-name-input',
}: MainMenuCreatePlaylistFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isAcceptDisabled = value.trim().length === 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault()

      if (isAcceptDisabled) {
        return
      }

      onAccept()
    },
    [isAcceptDisabled, onAccept],
  )

  return (
    <form
      className="main-menu-playlists-section__form"
      onSubmit={handleSubmit}
      aria-label={ariaLabel}
    >
      <label
        htmlFor={inputId}
        className="main-menu-playlists-section__form-label montserrat-regular"
      >
        {formLabel}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={80}
        className="main-menu-playlists-section__form-input montserrat-regular"
        autoComplete="off"
      />

      <div className="main-menu-playlists-section__form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="main-menu-playlists-section__form-button main-menu-playlists-section__form-button--cancel montserrat-regular"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isAcceptDisabled}
          className="main-menu-playlists-section__form-button main-menu-playlists-section__form-button--accept montserrat-regular"
        >
          Aceptar
        </button>
      </div>
    </form>
  )
})
