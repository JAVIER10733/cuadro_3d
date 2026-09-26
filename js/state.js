import { PHOTO_RECTS, NAME_RECT } from './template.js';

/**
 * Número total de slots dedicados a fotos (excluyendo el slot de nombre).
 * @type {number}
 */
export const PHOTOS = PHOTO_RECTS.length;

/**
 * Índice del slot correspondiente al "Nombre" en el array de slots.
 * @type {number}
 */
export const NAME = PHOTOS;

/**
 * Estado global reactivo de la aplicación.
 * @typedef {Object} AppState
 * @property {string} name - Texto principal (nombre).
 * @property {string} top - Texto superior (logo/artista).
 * @property {string} phrase - Frase o cita personalizada.
 * @property {string} color - Color hexadecimal del tema (ej. '#39ff14').
 * @property {number} sel - Índice del slot actualmente seleccionado para editar.
 * @property {HTMLImageElement|null} code - Imagen cargada del código de Spotify.
 * @property {string|null} codeUrl - URL del objeto de la imagen del código (para limpieza de memoria).
 * @property {boolean} exporting - Bandera que indica si se está generando una exportación (oculta la UI de selección).
 */

/** @type {AppState} */
export const state = {
  name: 'TU NOMBRE',               // Placeholder genérico y amigable
  top: 'ARTISTA',                  // Placeholder genérico (encaja con la temática musical)
  phrase: 'Tu frase o dedicatoria aquí', // Instrucción clara para el usuario
  color: '#39ff14',
  sel: 0,
  code: null,
  codeUrl: null, // ⚠️ CRÍTICO: Necesario para URL.revokeObjectURL en upload.js
  exporting: false,
};

/**
 * Representa un área del canvas donde se puede renderizar una imagen o texto.
 * @typedef {Object} Slot
 * @property {number} x - Coordenada X inicial.
 * @property {number} y - Coordenada Y inicial.
 * @property {number} w - Ancho del slot.
 * @property {number} h - Alto del slot.
 * @property {HTMLImageElement|null} img - Objeto de imagen cargada (null si está vacío).
 * @property {string|null} url - URL del objeto (Object URL) de la imagen.
 * @property {number} zoom - Factor de zoom aplicado a la imagen (0.5 a 3.0).
 * @property {number} ox - Desplazamiento (offset) acumulado en el eje X.
 * @property {number} oy - Desplazamiento (offset) acumulado en el eje Y.
 */

/**
 * Array que contiene todos los slots de renderizado (7 fotos + 1 nombre).
 * @type {Slot[]}
 */
export const slots = [...PHOTO_RECTS, NAME_RECT].map(([x, y, w, h]) => ({
  x,
  y,
  w,
  h,
  img: null,
  url: null, // ⚠️ CRÍTICO: Permite liberar la memoria con URL.revokeObjectURL al cambiar o eliminar la foto
  zoom: 1,
  ox: 0,
  oy: 0,
}));