import { slots, state, PHOTOS } from '../state.js';

/**
 * Constantes de configuración para el renderizado de slots.
 */
const SLOT_CONFIG = {
  BORDER_RADIUS: 18,
  BORDER_WIDTH: 3,
  SHADOW_BLUR: 18,
  DASH_PATTERN: [14, 8],
  EMPTY_BG_COLOR: '#132213',
  PLACEHOLDER_ALPHA: 0.7,
};

/**
 * Configuración del borde de selección.
 */
const SELECTION_CONFIG = {
  COLOR: '#ffffff',
  WIDTH: 4,
  DASH_PATTERN: [10, 8],
  OFFSET: 4,
};

/**
 * Dibuja una imagen dentro de un slot usando el modo "cover" (relleno completo manteniendo proporciones).
 * Aplica zoom y desplazamiento (offset) según la configuración del slot.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {HTMLImageElement} img - Imagen a dibujar
 * @param {Object} s - Slot con propiedades { x, y, w, h, zoom, ox, oy }
 */
export function cover(ctx, img, s) {
  if (!img || img.width === 0 || img.height === 0) return;
  
  const scale = Math.max(s.w / img.width, s.h / img.height) * s.zoom;
  const displayWidth = img.width * scale;
  const displayHeight = img.height * scale;
  
  const drawX = s.x + (s.w - displayWidth) / 2 + s.ox;
  const drawY = s.y + (s.h - displayHeight) / 2 + s.oy;
  
  ctx.drawImage(img, drawX, drawY, displayWidth, displayHeight);
}

/**
 * Dibuja el contenido de un slot individual (imagen o placeholder).
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {number} index - Índice del slot a dibujar
 */
function drawSlot(ctx, index) {
  const slot = slots[index];
  if (!slot) return;

  // 1. Dibujar contenido (imagen o fondo vacío) con recorte
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(slot.x, slot.y, slot.w, slot.h, SLOT_CONFIG.BORDER_RADIUS);
  } else {
    ctx.rect(slot.x, slot.y, slot.w, slot.h); // Fallback para navegadores antiguos
  }
  ctx.clip();
  
  if (slot.img) {
    cover(ctx, slot.img, slot);
  } else {
    ctx.fillStyle = SLOT_CONFIG.EMPTY_BG_COLOR;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
  }
  ctx.restore();

  // 2. Dibujar borde neón
  ctx.save();
  ctx.strokeStyle = state.color;
  ctx.lineWidth = SLOT_CONFIG.BORDER_WIDTH;
  ctx.shadowColor = state.color;
  ctx.shadowBlur = SLOT_CONFIG.SHADOW_BLUR;
  
  if (!slot.img && ctx.setLineDash) {
    ctx.setLineDash(SLOT_CONFIG.DASH_PATTERN);
  }
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(slot.x, slot.y, slot.w, slot.h, SLOT_CONFIG.BORDER_RADIUS);
  } else {
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
  }
  ctx.stroke();
  ctx.restore();

  // 3. Dibujar texto placeholder si está vacío
  if (!slot.img) {
    drawSlotPlaceholder(ctx, slot, index);
  }
}

/**
 * Dibuja el texto placeholder dentro de un slot vacío con tamaño de fuente dinámico.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {Object} slot - Objeto del slot
 * @param {number} index - Índice del slot
 */
function drawSlotPlaceholder(ctx, slot, index) {
  ctx.save();
  if (ctx.setLineDash) ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.fillStyle = state.color;
  ctx.globalAlpha = SLOT_CONFIG.PLACEHOLDER_ALPHA;
  
  // Tamaño de fuente dinámico y responsivo al tamaño del slot
  const dynamicFontSize = Math.min(32, Math.floor(slot.w * 0.08));
  ctx.font = `bold ${dynamicFontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(`FOTO ${index + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2);
  ctx.restore();
}

/**
 * Dibuja todos los slots de fotos (excluyendo el slot de nombre).
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 */
export function drawSlots(ctx) {
  if (!ctx) return;
  for (let i = 0; i < PHOTOS; i++) {
    drawSlot(ctx, i);
  }
}

/**
 * Dibuja el borde de selección alrededor del slot actualmente activo.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 */
export function drawSelection(ctx) {
  if (!ctx || !state || slots[state.sel] === undefined) return;
  
  const slot = slots[state.sel];
  
  ctx.save();
  ctx.strokeStyle = SELECTION_CONFIG.COLOR;
  ctx.lineWidth = SELECTION_CONFIG.WIDTH;
  if (ctx.setLineDash) ctx.setLineDash(SELECTION_CONFIG.DASH_PATTERN);
  
  ctx.strokeRect(
    slot.x - SELECTION_CONFIG.OFFSET,
    slot.y - SELECTION_CONFIG.OFFSET,
    slot.w + SELECTION_CONFIG.OFFSET * 2,
    slot.h + SELECTION_CONFIG.OFFSET * 2
  );
  ctx.restore();
}