/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Renderizado de Spotify
 * =========================================================
 */

import { W } from '../template.js';
import { state } from '../state.js';

/**
 * Configuración de posicionamiento para el elemento de Spotify.
 * NOTA: Las coordenadas X se definen como offsets (desplazamientos) 
 * relativos al centro del canvas (W / 2) para garantizar un centrado 
 * perfecto independientemente de la resolución.
 */
const SPOTIFY_CONFIG = {
  CODE_Y: 880,
  CODE_HEIGHT: 90,
  
  // Offsets relativos al centro (Basado en el diseño original centrado en X=742)
  LOGO_OFFSET_X: -182, 
  LOGO_Y: 925,
  LOGO_RADIUS: 26,
  
  BARS_START_OFFSET_X: -132,
  BAR_WIDTH: 8,
  BAR_SPACING: 20,
  BAR_BORDER_RADIUS: 4,
};

/**
 * Alturas de las barras del ecualizador de Spotify (placeholder).
 * @type {number[]}
 */
const EQUALIZER_BARS = [20, 50, 30, 70, 40, 60, 26, 54, 34, 74, 46, 22];

/**
 * Configuración de las ondas del logo de Spotify.
 * Los valores X son offsets relativos al centro.
 * @type {Array<{y: number, curvature: number, startOffset: number, controlOffset: number, endOffset: number}>}
 */
const SPOTIFY_WAVES = [
  { y: 917, curvature: 4, startOffset: -197, controlOffset: -181, endOffset: -165 },
  { y: 926, curvature: 3, startOffset: -195, controlOffset: -181, endOffset: -167 },
  { y: 934, curvature: 2, startOffset: -193, controlOffset: -181, endOffset: -169 },
];

/**
 * Dibuja el código de Spotify personalizado o el placeholder si no hay imagen cargada.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 */
export function drawSpotify(ctx) {
  // Programación defensiva
  if (!ctx || !state) return;

  ctx.save();
  const centerX = W / 2; // Centro dinámico
  
  if (state.code) {
    // Validar que la imagen tenga dimensiones válidas para evitar distorsión o NaN
    if (state.code.width > 0 && state.code.height > 0) {
      const aspectRatio = state.code.width / state.code.height;
      const displayHeight = SPOTIFY_CONFIG.CODE_HEIGHT;
      const displayWidth = aspectRatio * displayHeight;
      const displayX = centerX - (displayWidth / 2);
      
      ctx.drawImage(state.code, displayX, SPOTIFY_CONFIG.CODE_Y, displayWidth, displayHeight);
    }
  } else {
    // Renderizar placeholder del logo de Spotify
    drawSpotifyLogo(ctx, centerX);
    drawEqualizerBars(ctx, centerX);
  }
  
  ctx.restore();
}

/**
 * Dibuja el logo circular de Spotify con sus ondas características.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {number} centerX - Coordenada X central del canvas
 */
function drawSpotifyLogo(ctx, centerX) {
  const logoX = centerX + SPOTIFY_CONFIG.LOGO_OFFSET_X;

  // 1. Círculo verde de fondo
  ctx.fillStyle = '#1DB954';
  ctx.beginPath();
  ctx.arc(logoX, SPOTIFY_CONFIG.LOGO_Y, SPOTIFY_CONFIG.LOGO_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  
  // 2. Ondas del logo
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  SPOTIFY_WAVES.forEach(({ y, curvature, startOffset, controlOffset, endOffset }) => {
    ctx.beginPath();
    ctx.moveTo(centerX + startOffset, y);
    ctx.quadraticCurveTo(centerX + controlOffset, y - 6 + curvature, centerX + endOffset, y + curvature);
    ctx.stroke();
  });
}

/**
 * Dibuja las barras del ecualizador (estático).
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {number} centerX - Coordenada X central del canvas
 */
function drawEqualizerBars(ctx, centerX) {
  ctx.fillStyle = '#fff';
  
  EQUALIZER_BARS.forEach((barHeight, index) => {
    const barX = centerX + SPOTIFY_CONFIG.BARS_START_OFFSET_X + (index * SPOTIFY_CONFIG.BAR_SPACING);
    const barY = SPOTIFY_CONFIG.LOGO_Y - (barHeight / 2);
    
    ctx.beginPath();
    // Fallback de compatibilidad para roundRect
    if (ctx.roundRect) {
      ctx.roundRect(barX, barY, SPOTIFY_CONFIG.BAR_WIDTH, barHeight, SPOTIFY_CONFIG.BAR_BORDER_RADIUS);
    } else {
      ctx.rect(barX, barY, SPOTIFY_CONFIG.BAR_WIDTH, barHeight);
    }
    ctx.fill();
  });
}