/** Pantalla push para editar el archivo de letra adjunto a la pista. */

import { useCallback, useEffect, useState } from 'react'

import { ChevronLeft } from 'lucide-react'

import {
  fetchTrackLyricsContent,
  getLyricsFilename,
  toastStore,
  usePlayerStore,
} from '@features/musicPlayer'

import { usePushScreenVisibility } from '../../hooks'

import { useNavigationStore } from '../../store'

import type { LyricsEditSession } from '../../store/navigationStore'



const LYRICS_EDIT_SCREEN_TITLE = 'EDITAR LETRA'

const LYRICS_SAVE_NOTE =

  'Ten en cuenta que estos cambios también se verán reflejados en el archivo original.'



/**

 * Panel deslizable para editar y guardar la letra en el archivo original en disco.

 */

export function LyricsEditPushScreen() {

  const isLyricsEditScreenOpen = useNavigationStore((state) => state.isLyricsEditScreenOpen)

  const lyricsEditSession = useNavigationStore((state) => state.lyricsEditSession)

  const closeLyricsEditScreen = useNavigationStore((state) => state.closeLyricsEditScreen)

  const saveTrackLyricsContent = usePlayerStore((state) => state.saveTrackLyricsContent)



  const { isMounted, isVisible } = usePushScreenVisibility(isLyricsEditScreenOpen, false)

  const [displaySession, setDisplaySession] = useState<LyricsEditSession | null>(null)

  const [draftLyricsContent, setDraftLyricsContent] = useState('')

  const [savedLyricsContent, setSavedLyricsContent] = useState('')

  const [loadedLoadKey, setLoadedLoadKey] = useState<string | null>(null)

  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)



  if (lyricsEditSession && displaySession !== lyricsEditSession) {

    setDisplaySession(lyricsEditSession)

  }



  if (

    !isMounted &&

    (displaySession !== null ||

      draftLyricsContent !== '' ||

      savedLyricsContent !== '' ||

      loadedLoadKey !== null ||

      loadErrorMessage !== null ||

      isSaving)

  ) {

    setDisplaySession(null)

    setDraftLyricsContent('')

    setSavedLyricsContent('')

    setLoadedLoadKey(null)

    setLoadErrorMessage(null)

    setIsSaving(false)

  }



  const loadKey =

    isLyricsEditScreenOpen && displaySession

      ? displaySession.lyricsRelativePath

      : null



  useEffect(() => {

    if (!loadKey || !displaySession) {

      return undefined

    }



    let isCancelled = false



    void fetchTrackLyricsContent(displaySession.lyricsRelativePath)

      .then((content) => {

        if (isCancelled) {

          return

        }



        setDraftLyricsContent(content)

        setSavedLyricsContent(content)

        setLoadErrorMessage(null)

        setLoadedLoadKey(loadKey)

      })

      .catch((error: unknown) => {

        if (isCancelled) {

          return

        }



        const message =

          error instanceof Error ? error.message : 'No se pudo cargar la letra seleccionada.'



        setDraftLyricsContent('')

        setSavedLyricsContent('')

        setLoadErrorMessage(message)

        setLoadedLoadKey(loadKey)

      })



    return () => {

      isCancelled = true

    }

  }, [displaySession, loadKey])



  const isLoading = loadKey !== null && loadedLoadKey !== loadKey

  const hasUnsavedChanges = draftLyricsContent !== savedLyricsContent



  const handleClose = useCallback((): void => {

    if (isSaving) {

      return

    }



    closeLyricsEditScreen()

  }, [closeLyricsEditScreen, isSaving])



  const handleSave = useCallback(async (): Promise<void> => {

    if (!displaySession || isSaving || !hasUnsavedChanges) {

      return

    }



    setIsSaving(true)



    try {

      await saveTrackLyricsContent(displaySession.trackId, draftLyricsContent)

      setSavedLyricsContent(draftLyricsContent)

      closeLyricsEditScreen()



      toastStore.getState().addToast({

        type: 'success',

        message: 'Letra guardada en el archivo original.',

      })

    } catch (error: unknown) {

      const message =

        error instanceof Error ? error.message : 'No se pudo guardar la letra editada.'



      toastStore.getState().addToast({

        type: 'error',

        message,

      })

    } finally {

      setIsSaving(false)

    }

  }, [

    closeLyricsEditScreen,

    draftLyricsContent,

    hasUnsavedChanges,

    isSaving,

    displaySession,

    saveTrackLyricsContent,

  ])



  const handleKeyDown = useCallback(

    (event: KeyboardEvent): void => {

      if (event.key === 'Escape') {

        handleClose()

      }

    },

    [handleClose],

  )



  useEffect(() => {

    if (!isMounted) {

      return undefined

    }



    document.addEventListener('keydown', handleKeyDown)



    return () => {

      document.removeEventListener('keydown', handleKeyDown)

    }

  }, [handleKeyDown, isMounted])



  if (!isMounted || !displaySession) {

    return null

  }



  const lyricsFilename = getLyricsFilename(displaySession.lyricsRelativePath)



  return (

    <div

      className="push-screen push-screen--nested push-screen--lyrics-edit fixed inset-0 z-[65] overflow-hidden"

      aria-hidden={!isVisible}

    >

      <button

        type="button"

        aria-label="Cerrar vista de letra"

        onClick={handleClose}

        disabled={isSaving}

        className={`push-screen__backdrop absolute inset-0 ${

          isVisible ? 'push-screen__backdrop--visible' : ''

        }`}

      />



      <div

        role="dialog"

        aria-modal="true"

        aria-labelledby="lyrics-edit-screen-title"

        className={`push-screen__panel pointer-events-none absolute ${

          isVisible ? 'push-screen__panel--visible' : ''

        }`}

      >

        <div className="push-screen__content pointer-events-auto flex h-full min-h-[100dvh] w-full flex-col overflow-hidden">

          <div className="push-screen__layout lyrics-edit-screen__layout">

            <header className="cover-adjust-screen__header shrink-0">

              <button

                type="button"

                onClick={handleClose}

                disabled={isSaving}

                aria-label="Volver a información de la canción"

                className="cover-adjust-screen__back-button"

              >

                <ChevronLeft size={22} aria-hidden="true" />

              </button>



              <h1

                id="lyrics-edit-screen-title"

                className="push-screen__title bebas-neue-regular text-2xl tracking-wide text-[var(--player-play-button)]"

              >

                {LYRICS_EDIT_SCREEN_TITLE}

              </h1>

            </header>



            <div className="lyrics-edit-screen__document-panel">

              <p className="lyrics-edit-screen__filename montserrat-regular">{lyricsFilename}</p>



              {isLoading ? (

                <p className="lyrics-edit-screen__status montserrat-regular">Cargando letra…</p>

              ) : null}



              {!isLoading && loadErrorMessage ? (

                <p className="lyrics-edit-screen__status lyrics-edit-screen__status--error montserrat-regular">

                  {loadErrorMessage}

                </p>

              ) : null}



              {!isLoading && !loadErrorMessage ? (

                <div className="lyrics-edit-screen__scroll">

                  <textarea

                    value={draftLyricsContent}

                    onChange={(event) => setDraftLyricsContent(event.target.value)}

                    disabled={isSaving}

                    aria-label="Editor de letra"

                    spellCheck={false}

                    className="lyrics-edit-screen__editor montserrat-regular"

                  />



                  <div className="lyrics-edit-screen__actions">

                    <button

                      type="button"

                      onClick={() => void handleSave()}

                      disabled={isSaving || !hasUnsavedChanges}

                      className="lyrics-edit-screen__save-button cover-adjust-screen__button cover-adjust-screen__button--primary montserrat-regular"

                    >

                      {isSaving ? 'Guardando…' : 'Guardar cambios'}

                    </button>

                  </div>

                </div>

              ) : null}

            </div>



            {!isLoading && !loadErrorMessage ? (

              <p className="lyrics-edit-screen__save-note montserrat-regular">{LYRICS_SAVE_NOTE}</p>

            ) : null}

          </div>

        </div>

      </div>

    </div>

  )

}

