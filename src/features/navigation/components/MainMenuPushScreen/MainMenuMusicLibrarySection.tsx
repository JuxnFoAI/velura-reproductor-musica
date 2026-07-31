/** Sección Biblioteca musical dentro de Ajustes: ruta en disco y guía de uso. */

import { useLocalMusicLibrary } from '@features/musicPlayer'
import { isDesktopApp } from '@lib/runtimeEnvironment'

const LIBRARY_STRUCTURE_ITEMS = [
  'Artista - Canción.mp3 — canciones en la raíz o subcarpetas',
  'portadas de canciones/ — imágenes .jpg, .png o .webp',
  'Letras de canciones/ — archivos .lrc o .txt',
  'cover-overrides.json — asociaciones manuales MP3 → portada (opcional)',
] as const

/**
 * Muestra la ruta de la biblioteca local y cómo organizar MP3, portadas y letras.
 */
export function MainMenuMusicLibrarySection() {
  const { status, errorMessage, musicDirectory } = useLocalMusicLibrary()
  const isDesktop = isDesktopApp()

  const introText = isDesktop
    ? 'Velura lee tu música desde esta carpeta en tu equipo. Añade MP3, portadas y letras directamente ahí.'
    : 'En el navegador, la biblioteca se sirve desde la carpeta mi-musica del proyecto.'

  return (
    <section
      className="main-menu-music-library-section main-menu-screen__scroll player-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
      aria-label="Biblioteca musical"
    >
      <p className="main-menu-music-library-section__intro montserrat-regular">{introText}</p>

      <div className="main-menu-music-library-section__group">
        <h3 className="main-menu-music-library-section__heading bebas-neue-regular">
          Ubicación en disco
        </h3>

        {status === 'loading' || status === 'idle' ? (
          <p className="main-menu-music-library-section__text montserrat-regular">
            Cargando ruta de la biblioteca…
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="main-menu-music-library-section__text main-menu-music-library-section__text--error montserrat-regular">
            {errorMessage ?? 'No se pudo obtener la ruta de la biblioteca.'}
          </p>
        ) : null}

        {status !== 'loading' && status !== 'idle' && status !== 'error' && musicDirectory ? (
          <p
            className="main-menu-music-library-section__path montserrat-regular"
            title={musicDirectory}
          >
            {musicDirectory}
          </p>
        ) : null}

        {status !== 'loading' && status !== 'idle' && status !== 'error' && !musicDirectory ? (
          <p className="main-menu-music-library-section__text montserrat-regular">
            No hay una carpeta de biblioteca configurada.
          </p>
        ) : null}

        {isDesktop ? (
          <p className="main-menu-music-library-section__hint montserrat-regular">
            También puedes abrirla con Win + R y escribir{' '}
            <code className="main-menu-music-library-section__code">%APPDATA%\Velura\mi-musica</code>
          </p>
        ) : null}
      </div>

      <div className="main-menu-music-library-section__group">
        <h3 className="main-menu-music-library-section__heading bebas-neue-regular">Estructura</h3>
        <ul className="main-menu-music-library-section__list montserrat-regular">
          {LIBRARY_STRUCTURE_ITEMS.map((item) => (
            <li key={item} className="main-menu-music-library-section__list-item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="main-menu-music-library-section__group">
        <h3 className="main-menu-music-library-section__heading bebas-neue-regular">Convención</h3>
        <p className="main-menu-music-library-section__text montserrat-regular">
          Usa el formato <strong>Artista - Título.mp3</strong> para el archivo de audio. Si la
          portada o la letra comparten el mismo nombre (salvo la extensión), Velura las detecta
          automáticamente.
        </p>
      </div>

      <div className="main-menu-music-library-section__group">
        <h3 className="main-menu-music-library-section__heading bebas-neue-regular">
          Canciones nuevas
        </h3>
        <p className="main-menu-music-library-section__text montserrat-regular">
          Después de copiar MP3 desde el Explorador de archivos, reinicia Velura para que aparezcan
          en la biblioteca. Los cambios de portada o letra hechos desde la app se guardan al
          instante.
        </p>
      </div>
    </section>
  )
}
