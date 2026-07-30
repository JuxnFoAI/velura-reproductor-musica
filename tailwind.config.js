/** Configuración de Tailwind CSS v3 para la aplicación de escritorio. */

/** @type {import('tailwindcss').Config} */

export default {

  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  safelist: [
    'lyrics-panel__paragraph--active',
    'lyrics-panel__paragraph--past',
    'lyrics-panel__paragraph--next',
    'lyrics-panel__paragraph--preview',
  ],

  theme: {

    extend: {},

  },

  plugins: [],

}

