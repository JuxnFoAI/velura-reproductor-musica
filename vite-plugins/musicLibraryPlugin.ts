/** Plugin de Vite: capa HTTP sobre el módulo compartido de biblioteca musical. */

import type { ServerResponse } from 'node:http'

import fs from 'node:fs'

import type { Connect } from 'vite'

import type { Plugin } from 'vite'

import {

  buildMusicLibrary,

  deleteTrack,

  ensureProjectMusicDirectory,

  MUSIC_LIBRARY_ENDPOINTS,

  readBoundedRequestBody,

  readTrackLyricsFromDisk,

  renameTrack,

  RequestBodyTooLargeError,

  resolveCoverContentType,

  resolveProjectRootFromModule,

  resolveSafeAudioPath,

  resolveSafeCoverPath,

  saveTrackCover,

  saveTrackLyrics,

  type DeleteTrackRequest,

  type RenameTrackRequest,

  type SaveTrackCoverRequest,

  type SaveTrackLyricsRequest,

} from '../shared/musicLibrary'



const {

  tracks: TRACKS_ENDPOINT,

  track: TRACK_ENDPOINT,

  audio: AUDIO_ENDPOINT_PREFIX,

  cover: COVER_ENDPOINT_PREFIX,

  lyrics: LYRICS_ENDPOINT,

} = MUSIC_LIBRARY_ENDPOINTS



function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {

  response.statusCode = statusCode

  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  response.end(JSON.stringify(payload))

}



function sendServiceResult<T>(

  response: ServerResponse,

  result: { ok: true; data: T } | { ok: false; status: number; message: string },

): void {

  if (result.ok) {

    sendJson(response, 200, result.data)

    return

  }



  sendJson(response, result.status, { message: result.message })

}



function handleJsonMutationRequest<T>(

  request: Connect.IncomingMessage,

  response: ServerResponse,

  handler: (body: string) => { ok: true; data: T } | { ok: false; status: number; message: string },

  invalidMessage: string,

): void {

  void readBoundedRequestBody(request)

    .then((body) => sendServiceResult(response, handler(body)))

    .catch((error: unknown) => {

      if (error instanceof RequestBodyTooLargeError) {

        sendJson(response, error.status, { message: error.message })

        return

      }



      sendJson(response, 400, { message: invalidMessage })

    })

}



function createMusicLibraryMiddleware(getMusicDirectory: () => string): Connect.NextHandleFunction {

  return (request, response, next) => {

    if (!request.url) {

      next()

      return

    }



    const requestUrl = new URL(request.url, 'http://localhost')

    const musicDirectory = getMusicDirectory()



    if (request.method === 'GET' && requestUrl.pathname === TRACKS_ENDPOINT) {

      void buildMusicLibrary(musicDirectory)

        .then((library) => {

          sendJson(response, 200, library)

        })

        .catch(() => {

          sendJson(response, 500, { message: 'No se pudo construir la biblioteca de música.' })

        })

      return

    }



    if (request.method === 'GET' && requestUrl.pathname === COVER_ENDPOINT_PREFIX) {

      const relativePath = requestUrl.searchParams.get('path')



      if (!relativePath) {

        sendJson(response, 404, { message: 'Portada no encontrada.' })

        return

      }



      const coverPath = resolveSafeCoverPath(musicDirectory, relativePath)



      if (!coverPath) {

        sendJson(response, 404, { message: 'Portada no encontrada.' })

        return

      }



      response.statusCode = 200

      response.setHeader('Content-Type', resolveCoverContentType(relativePath))

      fs.createReadStream(coverPath).pipe(response)

      return

    }



    if (request.method === 'PUT' && requestUrl.pathname === COVER_ENDPOINT_PREFIX) {

      handleJsonMutationRequest(

        request,

        response,

        (body) => saveTrackCover(musicDirectory, JSON.parse(body) as SaveTrackCoverRequest),

        'Solicitud de portada inválida.',

      )

      return

    }



    if (request.method === 'GET' && requestUrl.pathname === LYRICS_ENDPOINT) {

      const relativePath = requestUrl.searchParams.get('path')



      if (!relativePath) {

        sendJson(response, 404, { message: 'Letra no encontrada.' })

        return

      }



      const lyricsResult = readTrackLyricsFromDisk(musicDirectory, relativePath)



      if (!lyricsResult.ok) {

        sendJson(response, lyricsResult.status, { message: lyricsResult.message })

        return

      }



      response.statusCode = 200

      response.setHeader('Content-Type', 'text/plain; charset=utf-8')

      response.setHeader('Cache-Control', 'no-store')

      response.end(lyricsResult.data)

      return

    }



    if (request.method === 'PUT' && requestUrl.pathname === LYRICS_ENDPOINT) {

      handleJsonMutationRequest(

        request,

        response,

        (body) => saveTrackLyrics(musicDirectory, JSON.parse(body) as SaveTrackLyricsRequest),

        'Solicitud de letra inválida.',

      )

      return

    }



    if (request.method === 'PUT' && requestUrl.pathname === TRACK_ENDPOINT) {

      handleJsonMutationRequest(

        request,

        response,

        (body) => renameTrack(musicDirectory, JSON.parse(body) as RenameTrackRequest),

        'Solicitud de renombrado inválida.',

      )

      return

    }



    if (request.method === 'DELETE' && requestUrl.pathname === TRACK_ENDPOINT) {

      handleJsonMutationRequest(

        request,

        response,

        (body) => deleteTrack(musicDirectory, JSON.parse(body) as DeleteTrackRequest),

        'Solicitud de eliminación inválida.',

      )

      return

    }



    if (request.method === 'GET' && requestUrl.pathname === AUDIO_ENDPOINT_PREFIX) {

      const relativePath = requestUrl.searchParams.get('path')



      if (!relativePath) {

        sendJson(response, 404, { message: 'Archivo no encontrado.' })

        return

      }



      const audioPath = resolveSafeAudioPath(musicDirectory, relativePath)



      if (!audioPath) {

        sendJson(response, 404, { message: 'Archivo no encontrado.' })

        return

      }



      response.statusCode = 200

      response.setHeader('Content-Type', 'audio/mpeg')

      fs.createReadStream(audioPath).pipe(response)

      return

    }



    next()

  }

}



const projectRoot = resolveProjectRootFromModule(import.meta.url)



/** Registra endpoints locales para listar y reproducir MP3 de la carpeta mi-musica. */

export function musicLibraryPlugin(): Plugin {

  const getMusicDirectory = (): string => ensureProjectMusicDirectory(projectRoot)



  return {

    name: 'music-library',

    configureServer(server) {

      server.middlewares.use(createMusicLibraryMiddleware(getMusicDirectory))

    },

  }

}

