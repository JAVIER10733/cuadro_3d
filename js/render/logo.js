/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Renderizado del Logo
 * =========================================================
 */

import { FONT, W } from '../template.js';
import { state } from '../state.js';

/**
 * Configuración para el renderizado del logo superior.
 * NOTA: Las coordenadas del símbolo se definen como offsets (desplazamientos) 
 * relativos al centro horizontal (W / 2) y al eje Y del círculo. 
 * Esto garantiza un centrado matemático perfecto sin importar el ancho del canvas.
 */
const LOGO_CONFIG = {
  TEXT_Y: 130,
  FONT_SIZE: 90,
  SHADOW_BLUR: 18,
  
  CIRCLE_Y: 230,
  CIRCLE_RADIUS: 55,
  CIRCLE_LINE_WIDTH: 8,
  SYMBOL_LINE_WIDTH: 7,
  
  // Offsets relativos al centro (X = 0, Y = 0 es el centro del círculo)
  // Basado en el diseño original centrado en X=742, Y=230
  SYMBOL_OFFSETS: [
    { x1: -27, y1: -18, x2: -5, y2: 4 },   // Primera cruz (izq)
    { x1: -5, y1: -18, x2: -27, y2: 4 },   // Primera cruz (der)
    { x1: 5, y1: -18, x2: 27, y2: 4 },     // Segunda cruz (izq)
    { x1: 27, y1: -18, x2: 5, y2: 4 },     // Segunda cruz (der)
  ],
  CURVE_START: { x: -30, y: 20 },
  CURVE_CONTROL: { x: 0, y: 52 },
  CURVE_END: { x: 30, y: 20 },
};

/**
 * Dibuja el logo superior (texto del artista + símbolo personalizado) 
 * con efecto de neón.
 * 
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 */
export function drawLogo(ctx) {
  // Programación defensiva: evitar fallos si el estado no está inicializado
  if (!state) return;

  ctx.save();
  
  const centerX = W / 2; // Centro dinámico, mucho más robusto que un número fijo
  const displayText = (state.top || 'ARTISTA').toUpperCase(); // Fallback seguro

  // 1. Configuración general de estilo
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = state.color;
  ctx.strokeStyle = state.color;
  ctx.shadowColor = state.color;
  ctx.shadowBlur = LOGO_CONFIG.SHADOW_BLUR;
  ctx.font = `italic ${LOGO_CONFIG.FONT_SIZE}px ${FONT}`;

  // 2. Dibujar texto superior
  ctx.fillText(displayText, centerX, LOGO_CONFIG.TEXT_Y);

  // 3. Dibujar círculo exterior del símbolo
  ctx.lineWidth = LOGO_CONFIG.CIRCLE_LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round'; // Mejora la renderización de las uniones de las líneas
  
  ctx.beginPath();
  ctx.arc(centerX, LOGO_CONFIG.CIRCLE_Y, LOGO_CONFIG.CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Dibujar símbolo interior y curva inferior
  ctx.lineWidth = LOGO_CONFIG.SYMBOL_LINE_WIDTH;
  ctx.beginPath();
  
  // Patrones de cruz (aplicando offsets relativos al centro)
  LOGO_CONFIG.SYMBOL_OFFSETS.forEach(({ x1, y1, x2, y2 }) => {
    ctx.moveTo(centerX + x1, LOGO_CONFIG.CIRCLE_Y + y1);
    ctx.lineTo(centerX + x2, LOGO_CONFIG.CIRCLE_Y + y2);
  });
  
  // Curva inferior (sonrisa/arco)
  ctx.moveTo(centerX + LOGO_CONFIG.CURVE_START.x, LOGO_CONFIG.CIRCLE_Y + LOGO_CONFIG.CURVE_START.y);
  ctx.quadraticCurveTo(
    centerX + LOGO_CONFIG.CURVE_CONTROL.x, 
    LOGO_CONFIG.CIRCLE_Y + LOGO_CONFIG.CURVE_CONTROL.y, 
    centerX + LOGO_CONFIG.CURVE_END.x, 
    LOGO_CONFIG.CIRCLE_Y + LOGO_CONFIG.CURVE_END.y
  );
  
  ctx.stroke();
  ctx.restore();
}