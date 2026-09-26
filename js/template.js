/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Plantilla y Constantes
 * Este archivo contiene la configuración estática del lienzo.
 * =========================================================
 */

/**
 * Dimensiones nativas del canvas (Alta resolución para impresión/exportación).
 * Relación de aspecto ~1.414 (similar a A4 horizontal).
 */
export const W = 1485;
export const H = 1050;

/**
 * Familia tipográfica principal para los textos del diseño.
 * Se usan fuentes del sistema para evitar tiempos de carga y problemas de CORS en el canvas.
 */
export const FONT = 'Impact, "Arial Black", sans-serif';

/**
 * Coordenadas y dimensiones de los 7 slots destinados a fotografías.
 * Formato: [x, y, width, height]
 */
export const PHOTO_RECTS = [
  [30, 90, 330, 430],    // Foto 1: Izquierda grande
  [390, 40, 260, 330],   // Foto 2: Centro-izquierda pequeña
  [850, 40, 260, 330],   // Foto 3: Centro-derecha pequeña
  [1140, 90, 315, 430],  // Foto 4: Derecha grande
  [130, 700, 330, 320],  // Foto 5: Inferior izquierda
  [490, 740, 270, 280],  // Foto 6: Inferior centro
  [1050, 640, 380, 380], // Foto 7: Inferior derecha grande
];

/**
 * Coordenadas y dimensiones del slot destinado al texto principal (Nombre).
 * Formato: [x, y, width, height]
 */
export const NAME_RECT = [60, 300, 1365, 400];

/**
 * Paleta de colores disponibles para el tema (marcos, textos y acentos).
 * Incluye el verde neón por defecto y variantes para personalización.
 */
export const COLORS = [
  '#39ff14', // Verde Neón (Default)
  '#ff2d55', // Rosa/Rojo Neón
  '#00e5ff', // Cyan Neón
  '#ffd60a', // Amarillo Neón
  '#c77dff', // Púrpura Neón
  '#ffffff', // Blanco
];