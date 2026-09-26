/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Canvas Render Orchestrator
 * Este archivo coordina todas las capas de dibujo del lienzo.
 * =========================================================
 */

import { W, H } from '../template.js';
import { state } from '../state.js';
import { drawSlots, drawSelection } from './slots.js';
import { drawName } from './name.js';
import { drawLogo } from './logo.js';
import { drawPill } from './pill.js';
import { drawSpotify } from './spotify.js';

/**
 * Configuración del fondo del canvas.
 */
const BACKGROUND_CONFIG = {
  START_COLOR: '#0b1a0b',
  END_COLOR: '#000000',
};

/**
 * Elemento canvas del DOM. Se valida su existencia para evitar errores silenciosos.
 * @type {HTMLCanvasElement}
 */
const canvasElement = document.getElementById('cv');

if (!canvasElement) {
  throw new Error("[Canvas] No se encontró el elemento <canvas> con id 'cv' en el DOM. Verifica el HTML.");
}

// ⚠️ CRÍTICO: Forzar la resolución interna del canvas para que coincida con las constantes.
// Esto previene distorsiones si el HTML tiene atributos width/height diferentes o ausentes.
canvasElement.width = W;
canvasElement.height = H;

export const cv = canvasElement;

/**
 * Contexto 2D del canvas. 
 * { alpha: false } optimiza el rendimiento indicando al navegador que no necesita 
 * calcular transparencia para el fondo, ya que siempre dibujamos un color sólido.
 * { willReadFrequently: true } optimiza las operaciones de lectura de píxeles (útil para exportación).
 * @type {CanvasRenderingContext2D}
 */
export const ctx = cv.getContext('2d', { 
  alpha: false, 
  willReadFrequently: true 
});

if (!ctx) {
  throw new Error("[Canvas] No se pudo obtener el contexto 2D. El navegador podría no soportarlo.");
}

/**
 * Función principal de renderizado. 
 * Dibuja todas las capas en el orden correcto (Z-index simulado).
 * 
 * NOTA DE RENDIMIENTO: Esta función debe ser llamada idealmente dentro de un 
 * `requestAnimationFrame` (gestionado por el módulo de interacción) para evitar 
 * sobrecargar el hilo principal durante arrastres o cambios rápidos.
 * 
 * @returns {void}
 */
export function draw() {
  // Validación defensiva: si el estado se corrompe, intentamos recuperarlo o fallar silenciosamente
  if (!state) {
    console.warn("[Canvas] Estado no definido. Abortando renderizado.");
    return;
  }

  // ---------------------------------------------------------
  // CAPA 0: Fondo base (Limpieza y Degradado vertical)
  // ---------------------------------------------------------
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, BACKGROUND_CONFIG.START_COLOR);
  gradient.addColorStop(1, BACKGROUND_CONFIG.END_COLOR);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // ---------------------------------------------------------
  // CAPA 1: Slots de fotos (Base de la composición)
  // ---------------------------------------------------------
  drawSlots(ctx);

  // ---------------------------------------------------------
  // CAPA 2: Elementos gráficos y de texto (Superpuestos)
  // ---------------------------------------------------------
  drawLogo(ctx);
  drawName(ctx);
  drawPill(ctx);
  drawSpotify(ctx);

  // ---------------------------------------------------------
  // CAPA 3: UI de edición (Solo visible en modo interactivo)
  // ---------------------------------------------------------
  if (!state.exporting) {
    drawSelection(ctx);
  }
}

/**
 * Limpia el canvas completamente (útil para reset o debugging).
 * @returns {void}
 */
export function clearCanvas() {
  ctx.clearRect(0, 0, W, H);
}