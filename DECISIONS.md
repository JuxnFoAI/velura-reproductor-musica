# DECISIONS

Este documento explica **por qué** Velura funciona como lo hace. El [README](./README.md) dice qué es el proyecto y cómo usarlo; aquí respondemos decisiones concretas de diseño: por qué existe algo, por qué no existe otra cosa, y qué pasaría si eligiéramos distinto.

Cada respuesta es breve a propósito.

---

## ¿Por qué no hay selector de dispositivos de salida?

No es necesario: el usuario ya elige la salida desde el sistema operativo (altavoces, auriculares, HDMI). Duplicarlo en la app añade complejidad y APIs poco uniformes entre navegador y escritorio, sin un beneficio claro.

**Si no lo hiciéramos así:** mantendríamos código extra para APIs como `setSinkId`, casos borde por plataforma y una opción que muchas veces repite lo que el SO ya resolvió.

---

## ¿Por qué usamos Web Audio API y no un `<audio>` HTML?

El ecualizador, la normalización de volumen y el analizador de ondas necesitan una cadena de nodos (`BiquadFilter`, `GainNode`, `AnalyserNode`). Con `<audio>` no podemos procesar el sonido en tiempo real con ese control.

**Si no lo hiciéramos así:** perderíamos ecualizador, normalización y visualización; quedaríamos con volumen básico y poco más.

---

## ¿Por qué se carga y decodifica el MP3 completo en memoria?

Web Audio trabaja con `AudioBuffer`. Eso permite buscar posición exacta, repetir sin cortes, medir picos/RMS para normalizar y aplicar filtros sobre la señal ya decodificada.

**Si no lo hiciéramos así:** tendríamos que usar streaming con `<audio>`, perdiendo ecualizador y normalización, o implementar un decodificador por fragmentos mucho más complejo.

---

## ¿Por qué solo MP3?

Es el formato acordado para esta biblioteca local. Un solo formato simplifica indexación, renombrado, portadas y letras asociadas. Soportar FLAC, AAC u OGG multiplicaría pruebas y casos de compatibilidad en navegador.

**Si no lo hiciéramos así:** más extensiones, más errores de decodificación y una experiencia menos predecible para el usuario.

---

## ¿Por qué la música está en `mi-musica/` y no en la nube?

Velura es un reproductor **local**: tus archivos no salen del dispositivo. No hay cuentas, servidores ni suscripciones. La carpeta del proyecto es la fuente de verdad.

**Si no lo hiciéramos así:** haría falta backend, autenticación, almacenamiento remoto y resolver derechos de autor sobre contenido en streaming.

---

## ¿Por qué hace falta el servidor de Vite para escuchar música?

El navegador no puede leer carpetas del disco por sí solo. Un plugin de Vite expone `/api/music/*` para listar pistas, servir audio, guardar portadas y letras en disco.

**Si no lo hiciéramos así:** en desarrollo no habría forma segura de acceder a `mi-musica/`; solo funcionaría arrastrar archivos manualmente en cada sesión.

---

## ¿Por qué persistimos ajustes en `localStorage` y no en IndexedDB?

Volumen, favoritos, listas, ecualizador y sesión son datos pequeños (JSON de pocos KB). `localStorage` es suficiente, síncrono de leer al arrancar y no requiere esquemas ni migraciones.

**Si no lo hiciéramos así:** IndexedDB añadiría capas async, versionado de esquema y complejidad sin ganancia real para este volumen de datos.

---

## ¿Por qué se puede ocultar una canción además de eliminarla?

Ocultar la quita de "Todas las canciones" y de la cola visible, pero **no borra el MP3**. Sirve para limpiar la biblioteca sin perder el archivo en disco.

**Si no lo hiciéramos así:** la única alternativa sería borrar la pista o convivir con canciones que no quieres ver en la lista principal.

---

## ¿Por qué existe la Isla dinámica solo en escritorio?

En viewports pequeños no hay espacio útil para un widget flotante. En la app de escritorio empaquetada sí aporta controles rápidos sin salir de lo que estés haciendo. En desarrollo web se muestra igual para poder probar la UI en el navegador.

**Si no lo hiciéramos así:** en móvil taparía contenido; en escritorio perderíamos acceso rápido a play/pausa y pista actual.

---

## ¿Por qué se restaura la sesión al volver a abrir la app?

Guardamos qué pista sonaba, en qué segundo y si estaba en pausa. Así retomas donde lo dejaste sin buscar de nuevo en la biblioteca.

**Si no lo hiciéramos así:** cada recarga o reinicio empezaría desde cero, aunque acababas de escuchar algo a mitad.

---

## ¿Por qué las letras van en archivos `.lrc` / `.txt` aparte?

Muchos MP3 no traen letra sincronizada embebida. Archivos junto a la canción (en `Letras de canciones/`) se pueden editar, respaldar y versionar aparte del audio.

**Si no lo hiciéramos así:** solo tendríamos letra estática de etiquetas ID3 — cuando existiera — o ninguna sincronización línea a línea.

---

## ¿Por qué la convención `Artista - Título.mp3`?

El nombre del archivo es la forma más fiable de obtener artista y título sin depender de que el MP3 tenga etiquetas bien escritas. El servidor y la UI parsean ese patrón al indexar.

**Si no lo hiciéramos así:** pistas sin tags mostrarían nombres crípticos o "Desconocido", y emparejar portadas/letras sería más difícil.

---

## ¿Por qué aparece "Activar audio" al iniciar en el navegador?

Los navegadores bloquean `AudioContext` hasta que el usuario interactúa (política de autoplay). El banner pide un clic explícito para desbloquear el sonido.

**Si no lo hiciéramos así:** la app parecería rota: controles activos pero silencio total, sin explicación clara.

---

## ¿Por qué las portadas editadas se guardan en disco?

Un ajuste de recorte o una portada nueva debe persistir en `mi-musica/portadas de canciones/`, no solo en memoria del navegador. Así sobrevive a recargas y otros reproductores pueden usar la misma imagen.

**Si no lo hiciéramos así:** cada refresh perdería el cambio y volverías a la portada anterior o al placeholder.

---

## ¿Por qué los MP3 personales no se suben a Git?

Tu biblioteca es privada y puede ser grande. `.gitignore` usa `/mi-musica/**` para ignorar recursivamente MP3, portadas y letras; solo queda la estructura de carpetas, la plantilla `cover-overrides.example.json` y, opcionalmente, pistas de demo en `ejemplo/`.

**Si no lo hiciéramos así:** el repo crecería sin control y habría riesgo legal al compartir música con copyright.

---

## ¿Por qué las asociaciones de portada ya no están en el código?

Antes, un mapa fijo (`COVER_OVERRIDES`) en `musicLibraryPlugin.ts` enlazaba MP3 concretos con nombres de imagen distintos. Eso filtraba títulos de tu biblioteca personal al repositorio de GitHub.

Ahora vive en `mi-musica/cover-overrides.json`, ignorado por Git. En el repo solo queda `cover-overrides.example.json` como plantilla genérica. Cada desarrollador o usuario copia la plantilla y define sus propios pares localmente.

**Si no lo hiciéramos así:** el código fuente público revelaría qué canciones usas y mezclaría configuración personal con lógica compartida del reproductor.

---

## ¿Por qué hay una pista demo en `mi-musica/ejemplo/`?

Quien clone el repo en GitHub debe poder probar el reproductor sin tu biblioteca personal. `ejemplo/` es la única zona donde se versionan MP3 a propósito: incluye **Duodedos — AFTER**, con derechos para publicarse como demo.

El resto de `mi-musica/` sigue ignorado. Los clones ven esa pista al instante; tú puedes seguir añadiendo canciones privadas en la raíz de `mi-musica/` sin subirlas a Git.

**Si no lo hiciéramos así:** el repo estaría vacío de audio (mala primera impresión) o expondríamos música con copyright ajena como “ejemplo”.

La portada de la demo vive en `ejemplo/portadas de canciones/` (no en la carpeta compartida de la raíz) para que audio, arte y letras de demostración queden autocontenidos en un solo subárbol.

**Si no lo hiciéramos así:** la demo mezclaría archivos sueltos con tu biblioteca personal y sería más difícil saber qué es seguro publicar en Git.

---

## ¿Por qué la versión es 1.0.0 en `package.json` y `appInfo.ts`?

Velura ya es funcional como reproductor web completo (biblioteca, letras, personalización, listas). Unificar en **1.0.0** evita confusión entre la versión del paquete npm y la que muestra la UI en “Acerca de”.

**Si no lo hiciéramos así:** verías `0.0.0` en el proyecto y `1.0.0` en la app, como si fueran productos distintos.

---

## ¿Por qué el código es MIT pero la música no?

El repositorio en GitHub comparte **software**, no tu biblioteca personal. MIT permite clonar, modificar y empaquetar Velura con libertad. La música que añadas en `mi-musica/` sigue siendo tuya: derechos de autor, `.gitignore` y responsabilidad del usuario no cambian.

La excepción versionada es la demo en `ejemplo/` (Duodedos — AFTER), incluida a propósito para probar el reproductor.

**Si no lo hiciéramos así:** sin licencia de código, nadie sabría qué puede hacer legalmente con el repo; mezclar “proyecto privado” con código público generaría dudas.

---

## ¿Por qué la biblioteca vive en `shared/musicLibrary/`?

La lógica de indexar MP3, portadas y letras en disco debe servir tanto al plugin de Vite (HTTP en dev) como al proceso main de Electron (IPC). Un módulo Node compartido evita duplicar ~1700 líneas y garantiza el mismo comportamiento en web y escritorio.

El plugin `vite-plugins/musicLibraryPlugin.ts` queda como capa delgada: parsea requests HTTP y delega en funciones como `buildMusicLibrary`, `saveTrackCover` o `renameTrack`.

**Si no lo hiciéramos así:** Electron reimplementaría reglas de renombrado, deduplicación y rutas seguras con riesgo de divergencia respecto al dev server.

---

## ¿Por qué Zustand y no Redux u otro estado global?

El reproductor necesita estado compartido (cola, reproducción, menús) con poco boilerplate. Zustand encaja en un proyecto de este tamaño: stores por dominio, lecturas selectivas, sin providers anidados.

**Si no lo hiciéramos así:** más archivos de actions/reducers/selectors para un flujo que ya concentramos en features pequeñas y legibles.

---

## ¿Por qué la normalización de volumen es opcional?

No todos los MP3 traen ReplayGain y no todos quieren el mismo nivel sonoro. Forzarla siempre podría aplastar dinámica en pistas ya bien masterizadas.

**Si no lo hiciéramos así:** algunas canciones sonarían artificialmente planas o demasiado fuertes según el modo elegido.

---

## Cómo añadir una nueva decisión

Copia una sección existente. Formula la pregunta como la haría un usuario ("¿Por qué…?"). Responde en uno o dos párrafos cortos. Usa bullets solo si hace falta listar (máximo 8). Cierra con **Si no lo hiciéramos así:** cuando ayude a contrastar la alternativa rechazada.
