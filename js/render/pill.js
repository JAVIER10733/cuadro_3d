import { W } from '../template.js';
import { state } from '../state.js';

/**
 * Constantes de configuración para el renderizado del "pill" (frase).
 */
const PILL_CONFIG = {
  FONT: 'italic 58px Georgia, serif',
  MIN_WIDTH: 300,
  HORIZONTAL_PADDING: 110,
  Y: 740,
  HEIGHT: 95,
  BORDER_RADIUS: 48,
  TEXT_COLOR: '#04110a',
  SHADOW_BLUR: 18,
  // Ajuste óptico de +2px para centrar visualmente la fuente Georgia Italic
  TEXT_VERTICAL_OFFSET: 2, 
};

/**
 * Dibuja la "píldora" con la frase personalizada centrada en el canvas.
 * El ancho se ajusta dinámicamente según la longitud del texto.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 */
export function drawPill(ctx) {
  if (!ctx || !state) return;

  ctx.save();
  
  const centerX = W / 2; // Centrado dinámico real
  const phrase = state.phrase || 'Tu frase aquí'; // Fallback seguro
  
  ctx.font = PILL_CONFIG.FONT;
  const textWidth = ctx.measureText(phrase).width;
  const pillWidth = Math.max(PILL_CONFIG.MIN_WIDTH, textWidth + PILL_CONFIG.HORIZONTAL_PADDING);
  const pillX = centerX - pillWidth / 2;
  
  // Cálculo dinámico del centro vertical óptico
  const textY = PILL_CONFIG.Y + (PILL_CONFIG.HEIGHT / 2) + PILL_CONFIG.TEXT_VERTICAL_OFFSET;

  // 1. Dibujar fondo del pill con efecto neón
  ctx.fillStyle = state.color;
  ctx.shadowColor = state.color;
  ctx.shadowBlur = PILL_CONFIG.SHADOW_BLUR;
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(pillX, PILL_CONFIG.Y, pillWidth, PILL_CONFIG.HEIGHT, PILL_CONFIG.BORDER_RADIUS);
  } else {
    ctx.rect(pillX, PILL_CONFIG.Y, pillWidth, PILL_CONFIG.HEIGHT); // Fallback seguro
  }
  ctx.fill();

  // 2. Dibujar texto de la frase
  ctx.shadowBlur = 0;
  ctx.fillStyle = PILL_CONFIG.TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(phrase, centerX, textY);
  
  ctx.restore();
}