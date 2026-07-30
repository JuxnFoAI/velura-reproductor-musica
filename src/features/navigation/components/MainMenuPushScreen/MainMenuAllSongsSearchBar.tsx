/** Barra de búsqueda de canciones en la sección Todas las canciones. */

import { memo, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'

const SEARCH_PLACEHOLDER = '¿Que canción buscas?'

interface MainMenuAllSongsSearchBarProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Campo de búsqueda con icono de lupa para filtrar la biblioteca.
 */
export const MainMenuAllSongsSearchBar = memo(function MainMenuAllSongsSearchBar({
  value,
  onChange,
}: MainMenuAllSongsSearchBarProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.value)
    },
    [onChange],
  )

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
  }, [])

  const handleClear = useCallback((): void => {
    onChange('')
  }, [onChange])

  const hasQuery = value.length > 0

  return (
    <form
      role="search"
      className="main-menu-all-songs-search"
      aria-label="Buscar canciones"
      onSubmit={handleSubmit}
    >
      <Search
        className="main-menu-all-songs-search__icon"
        size={18}
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_PLACEHOLDER}
        autoComplete="off"
        enterKeyHint="search"
        className="main-menu-all-songs-search__input montserrat-regular"
      />

      {hasQuery ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="main-menu-all-songs-search__clear"
        >
          <X size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </form>
  )
})
