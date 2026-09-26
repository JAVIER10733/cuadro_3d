import { W, H } from './template.js';
import { slots, state, NAME, PHOTOS } from './state.js';
import { cv, draw } from './render/canvas.js';

/**
 * Constantes de configuración de interacción.
 * Centralizarlas facilita el ajuste fino y el mantenimiento.
 */
const CONFIG = {
  ZOOM_STEP: 0.05,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 3.0,
  KEYBOARD_STEP: 1,
  KEYBOARD_STEP_FAST: 10,
};

/**
 * Verifica si un punto p está dentro de los límites de un slot s (AABB Collision).
 * @param {Object} s - El slot { x, y, w, h }
 * @param {Object} p - El punto { x, y }
 * @returns {boolean}
 */
const hit = (s, p) => 
  p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;

/**
 * Calcula la posición del evento relativa al canvas, compensando el escalado CSS.
 * @param {PointerEvent} e - El evento del puntero
 * @returns {Object} { x, y, k } coordenadas escaladas y factor de escala
 */
function pos(e) {
  const r = cv.getBoundingClientRect();
  // Protección robusta contra división por cero o elementos no renderizados
  const k = r.width > 0 ? W / r.width : 1;
  
  return {
    x: (e.clientX - r.left) * k,
    y: (e.clientY - r.top) * k,
    k
  };
}

/**
 * Inicializa los eventos de interacción (drag, zoom, teclado) en el canvas.
 * @param {Object} callbacks - Funciones de retorno para desacoplar la lógica
 * @param {Function} callbacks.onSelect - Se ejecuta al seleccionar un slot
 * @param {Function} callbacks.onZoom - Se ejecuta al cambiar el zoom
 * @returns {Function} Función de limpieza (cleanup) para evitar memory leaks
 */
export function initInteraction({ onSelect, onZoom }) {
  let drag = null;
  let rafId = null; // Para throttling de renderizado

  /**
   * Programa un redibujado usando requestAnimationFrame.
   * Evita llamar a draw() múltiples veces en un mismo frame del navegador.
   */
  const scheduleDraw = () => {
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        draw();
        rafId = null;
      });
    }
  };

  const handlePointerDown = (e) => {
    // Ignorar clics con botón derecho o medio
    if (e.button !== 0) return;

    const p = pos(e);
    
    let i = slots.slice(0, PHOTOS).findIndex(s => hit(s, p));
    if (i < 0 && hit(slots[NAME], p)) {
      i = NAME;
    }
    
    if (i < 0) return;
    
    onSelect(i);
    drag = { x: e.clientX, y: e.clientY, k: p.k };
    
    cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    if (!drag) return;
    
    // Programación defensiva: verificar que el slot seleccionado existe
    const currentSlot = slots[state.sel];
    if (!currentSlot) return;
    
    currentSlot.ox += (e.clientX - drag.x) * drag.k;
    currentSlot.oy += (e.clientY - drag.y) * drag.k;
    
    drag.x = e.clientX;
    drag.y = e.clientY;
    
    scheduleDraw(); // Optimización de rendimiento
  };

  const handlePointerEnd = () => {
    if (!drag) return;
    drag = null;
    cv.style.cursor = 'grab';
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    const currentSlot = slots[state.sel];
    if (!currentSlot) return;

    const delta = e.deltaY < 0 ? CONFIG.ZOOM_STEP : -CONFIG.ZOOM_STEP;
    
    currentSlot.zoom = Math.min(CONFIG.ZOOM_MAX, Math.max(CONFIG.ZOOM_MIN, currentSlot.zoom + delta));
    
    onZoom(currentSlot.zoom);
    scheduleDraw();
  };

  /**
   * Soporte de teclado para accesibilidad (WCAG 2.1) y precisión.
   * Permite mover y hacer zoom sin mouse.
   */
  const handleKeyDown = (e) => {
    // Ignorar atajos si el usuario está escribiendo en un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const currentSlot = slots[state.sel];
    if (!currentSlot) return;

    const step = e.shiftKey ? CONFIG.KEYBOARD_STEP_FAST : CONFIG.KEYBOARD_STEP;
    let changed = false;

    switch (e.key) {
      case 'ArrowLeft':
        currentSlot.ox -= step;
        changed = true;
        break;
      case 'ArrowRight':
        currentSlot.ox += step;
        changed = true;
        break;
      case 'ArrowUp':
        currentSlot.oy -= step;
        changed = true;
        break;
      case 'ArrowDown':
        currentSlot.oy += step;
        changed = true;
        break;
      case '+':
      case '=':
        currentSlot.zoom = Math.min(CONFIG.ZOOM_MAX, currentSlot.zoom + CONFIG.ZOOM_STEP);
        onZoom(currentSlot.zoom);
        changed = true;
        break;
      case '-':
      case '_':
        currentSlot.zoom = Math.max(CONFIG.ZOOM_MIN, currentSlot.zoom - CONFIG.ZOOM_STEP);
        onZoom(currentSlot.zoom);
        changed = true;
        break;
      default:
        return; // Salir si no es una tecla que manejamos
    }

    if (changed) {
      e.preventDefault();
      scheduleDraw();
    }
  };

  // Registro de eventos
  cv.addEventListener('pointerdown', handlePointerDown);
  cv.addEventListener('pointermove', handlePointerMove);
  cv.addEventListener('pointerup', handlePointerEnd);
  cv.addEventListener('pointercancel', handlePointerEnd);
  cv.addEventListener('wheel', handleWheel, { passive: false });
  
  // El teclado se vincula al documento para capturar atajos globales
  document.addEventListener('keydown', handleKeyDown);
  
  cv.style.cursor = 'grab';

  // Función de cleanup profesional
  return function cleanup() {
    cv.removeEventListener('pointerdown', handlePointerDown);
    cv.removeEventListener('pointermove', handlePointerMove);
    cv.removeEventListener('pointerup', handlePointerEnd);
    cv.removeEventListener('pointercancel', handlePointerEnd);
    cv.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', handleKeyDown);
    
    // Limpiar estado pendiente
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    cv.style.cursor = 'default';
    drag = null;
  };
}