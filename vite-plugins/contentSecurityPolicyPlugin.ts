/** Inyecta Content-Security-Policy estricta en el HTML de producción. */
import type { Plugin } from 'vite'

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' velura-media: blob: data:",
  "media-src 'self' velura-media: blob:",
  "font-src 'self' data:",
  "connect-src 'self' velura-media: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`

/** Añade CSP al index.html solo en builds de producción (Electron empaquetado). */
export function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: 'content-security-policy',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (context.server) {
          return html
        }

        return html.replace('<head>', `<head>\n    ${CSP_META_TAG}`)
      },
    },
  }
}
