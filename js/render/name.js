import { W, H, FONT } from '../template.js';
import { slots, state, NAME } from '../state.js';
import { cover } from './slots.js';

const NAME_CONFIG = {
  MAX_FONT_SIZE: 420,
  MAX_TEXT_WIDTH_RATIO: 0.87,
  STROKE_WIDTH: 5,
  SHADOW_BLUR: 18,
  GRADIENT_END_COLOR: '#0b3d0b',
  MASK_COLOR: '#000000',
  VERTICAL_OFFSET_RATIO: 0.62,
};

const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = W;
offscreenCanvas.height = H;
const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });

function calculateOptimalFontSize(text, maxWidth) {
  let fontSize = NAME_CONFIG.MAX_FONT_SIZE;
  let fontString = `${fontSize}px ${FONT}`;
  offscreenCtx.font = fontString;
  let measuredWidth = offscreenCtx.measureText(text).width;
  
  while (measuredWidth > maxWidth && fontSize > 40) {
    fontSize -= 10;
    fontString = `${fontSize}px ${FONT}`;
    offscreenCtx.font = fontString;
    measuredWidth = offscreenCtx.measureText(text).width;
  }
  return { fontSize, fontString };
}

export function drawName(ctx) {
  if (!ctx || !state || !slots[NAME]) return;

  const slot = slots[NAME];
  const text = (state.name || 'NOMBRE').toUpperCase();
  const centerX = slot.x + (slot.w / 2);
  const textY = slot.y + (slot.h * NAME_CONFIG.VERTICAL_OFFSET_RATIO);
  const maxWidth = slot.w * NAME_CONFIG.MAX_TEXT_WIDTH_RATIO;
  
  const { fontString } = calculateOptimalFontSize(text, maxWidth);

  offscreenCtx.globalCompositeOperation = 'source-over';
  offscreenCtx.clearRect(0, 0, W, H);

  const gradient = offscreenCtx.createLinearGradient(0, slot.y, 0, slot.y + slot.h);
  gradient.addColorStop(0, state.color);
  gradient.addColorStop(1, NAME_CONFIG.GRADIENT_END_COLOR);
  
  offscreenCtx.fillStyle = gradient;
  offscreenCtx.fillRect(slot.x, slot.y, slot.w, slot.h);

  if (slot.img) {
    offscreenCtx.save();
    offscreenCtx.beginPath();
    offscreenCtx.rect(slot.x, slot.y, slot.w, slot.h);
    offscreenCtx.clip();
    cover(offscreenCtx, slot.img, slot);
    offscreenCtx.restore();
  }

  offscreenCtx.globalCompositeOperation = 'destination-in';
  offscreenCtx.font = fontString;
  offscreenCtx.textAlign = 'center';
  offscreenCtx.textBaseline = 'alphabetic';
  offscreenCtx.fillStyle = NAME_CONFIG.MASK_COLOR;
  offscreenCtx.fillText(text, centerX, textY);
  offscreenCtx.globalCompositeOperation = 'source-over';

  ctx.drawImage(offscreenCanvas, 0, 0);

  ctx.save();
  ctx.font = fontString;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = state.color;
  ctx.lineWidth = NAME_CONFIG.STROKE_WIDTH;
  ctx.shadowColor = state.color;
  ctx.shadowBlur = NAME_CONFIG.SHADOW_BLUR;
  ctx.strokeText(text, centerX, textY);
  ctx.restore();
}