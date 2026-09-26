/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Application Entry Point
 * Versión: 3.0 | Arquitectura: ES6 Module Orchestration
 * =========================================================
 */

import { COLORS } from './template.js';
import { slots, state, NAME, PHOTOS } from './state.js';
// Si implementaste el módulo de historial, descomenta la siguiente línea:
// import { history } from './state.js'; 
import { draw } from './render/canvas.js';
import { initUpload } from './upload.js';
import { initInteraction } from './interaction.js'; // Renombrado de initDrag para mayor precisión
import { downloadPng, downloadPdf } from './export.js';
import { showToast } from './utils/ui.js'; // Asumiendo que creaste este helper

/**
 * Helper seguro y tipado para seleccionar elementos del DOM.
 * @param {string} id - El ID del elemento
 * @returns {HTMLElement|null}
 */
const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[UI] Elemento con ID '${id}' no encontrado en el DOM. Verifica el HTML.`);
  }
  return el;
};

/**
 * Renderiza los botones (chips) para seleccionar qué slot editar.
 * Optimizado para accesibilidad y rendimiento.
 */
function refreshChips() {
  const container = $('chips');
  if (!container) return;
  
  // Usar DocumentFragment para minimizar reflows del DOM
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i <= NAME; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip${state.sel === i ? ' on' : ''}`;
    btn.textContent = i < PHOTOS ? `Foto ${i + 1}` : 'Nombre';
    
    // Accesibilidad: patrón de botón de opción (toggle button)
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-pressed', state.sel === i);
    btn.setAttribute('aria-label', `Seleccionar ${i < PHOTOS ? 'Foto ' + (i + 1) : 'Nombre'} para editar`);
    
    btn.onclick = () => select(i);
    fragment.appendChild(btn);
  }
  
  container.innerHTML = '';
  container.appendChild(fragment);
}

/**
 * Selecciona un slot activo y actualiza la UI correspondiente.
 * @param {number} index - Índice del slot a seleccionar
 */
function select(index) {
  if (state.sel === index) return; // Evitar redibujados innecesarios
  
  state.sel = index;
  
  const zoomInput = $('zoom');
  if (zoomInput) {
    zoomInput.value = slots[index].zoom;
    // Actualizar atributos ARIA del range para lectores de pantalla
    zoomInput.setAttribute('aria-valuenow', slots[index].zoom);
    zoomInput.setAttribute('aria-valuetext', `${Math.round(slots[index].zoom * 100)} por ciento`);
  }
  
  refreshChips();
  draw();
}

/**
 * Vincula todos los eventos de la interfaz de usuario.
 */
function bindEvents() {
  // 1. Inputs de texto (Live preview + History on blur)
  ['name', 'top', 'phrase'].forEach((key) => {
    const input = $(key);
    if (input) {
      // Live preview optimizado (asumiendo que draw() usa requestAnimationFrame)
      input.addEventListener('input', (e) => {
        state[key] = e.target.value;
        draw();
      });
      
      // Guardar en historial solo cuando el usuario termina de escribir
      input.addEventListener('change', () => {
        if (typeof history !== 'undefined') history.save();
      });
    }
  });

  // 2. Paleta de colores (Patrón Radiogroup Accesible)
  const colorsContainer = $('colors');
  if (colorsContainer) {
    colorsContainer.setAttribute('role', 'radiogroup');
    colorsContainer.setAttribute('aria-label', 'Paleta de colores del marco');
    colorsContainer.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    COLORS.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `color-swatch${state.color === color ? ' active' : ''}`;
      btn.style.backgroundColor = color;
      btn.title = `Seleccionar color ${color}`;
      
      // Accesibilidad: patrón de radio button personalizado
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.color === color);
      btn.setAttribute('aria-label', `Color ${color}`);
      
      btn.onclick = () => {
        state.color = color;
        
        // Actualizar estados ARIA de todos los botones de color
        Array.from(colorsContainer.children).forEach(child => {
          const isActive = child === btn;
          child.setAttribute('aria-checked', isActive);
          child.classList.toggle('active', isActive);
        });
        
        if (typeof history !== 'undefined') history.save();
        draw();
        showToast('Color actualizado', 'success');
      };
      
      fragment.appendChild(btn);
    });
    colorsContainer.appendChild(fragment);
  }

  // 3. Controles de transformación (Zoom, Reset, Remove)
  const zoomInput = $('zoom');
  if (zoomInput) {
    zoomInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      slots[state.sel].zoom = val;
      zoomInput.setAttribute('aria-valuenow', val);
      zoomInput.setAttribute('aria-valuetext', `${Math.round(val * 100)} por ciento`);
      draw();
    });
    
    // Guardar historial al soltar el slider
    zoomInput.addEventListener('change', () => {
      if (typeof history !== 'undefined') history.save();
    });
  }

  const resetBtn = $('reset');
  if (resetBtn) {
    resetBtn.onclick = () => {
      const s = slots[state.sel];
      s.zoom = 1;
      s.ox = 0;
      s.oy = 0;
      if (zoomInput) {
        zoomInput.value = 1;
        zoomInput.setAttribute('aria-valuenow', 1);
        zoomInput.setAttribute('aria-valuetext', '100 por ciento');
      }
      if (typeof history !== 'undefined') history.save();
      draw();
      showToast('Vista restablecida', 'success');
    };
  }

  const removeBtn = $('remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      const s = slots[state.sel];
      
      // ⚠️ CRÍTICO: Liberar la memoria de la URL del objeto para evitar Memory Leaks
      if (s.url) {
        URL.revokeObjectURL(s.url);
        s.url = null;
      }
      
      s.img = null;
      s.zoom = 1;
      s.ox = 0;
      s.oy = 0;
      
      if (zoomInput) {
        zoomInput.value = 1;
        zoomInput.setAttribute('aria-valuenow', 1);
      }
      
      if (typeof history !== 'undefined') history.save();
      refreshChips();
      draw();
      showToast('Elemento eliminado correctamente', 'success');
    };
  }

  // 4. Botones de exportación
  const pngBtn = $('dlPng');
  const pdfBtn = $('dlPdf');
  
  if (pngBtn) pngBtn.onclick = downloadPng;
  if (pdfBtn) pdfBtn.onclick = downloadPdf;
}

/**
 * Inicializa la aplicación de manera segura y asíncrona.
 */
async function init() {
  console.log('[App] Inicializando Cuadro 3D Creator Studio...');
  
  try {
    // 1. Vincular eventos de la UI
    bindEvents();

    // 2. Inicializar módulos externos con sus callbacks de orquestación
    initUpload({ 
      onNameUpload: () => select(NAME) 
    });
    
    // Nota: Usa initInteraction si seguiste la mejora anterior, o initDrag si mantuviste el nombre original
    initInteraction({ 
      onSelect: select, 
      onZoom: (z) => {
        const zoomInput = $('zoom');
        if (zoomInput) {
          zoomInput.value = z;
          zoomInput.setAttribute('aria-valuenow', z);
          zoomInput.setAttribute('aria-valuetext', `${Math.round(z * 100)} por ciento`);
        }
      } 
    });

    // 3. Renderizado inicial de la UI
    refreshChips();

    // 4. Primer dibujado: esperar a que las fuentes del sistema estén cargadas
    // Esto evita el "FOUC" (Flash of Unstyled Content) o saltos de texto en el canvas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
      console.log('[App] Fuentes del sistema cargadas. Renderizando canvas inicial...');
    } else {
      console.log('[App] API de fuentes no disponible. Usando fallback de carga...');
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    
    // Renderizado final
    draw();
    console.log('[App] ✅ Inicialización completada exitosamente.');
    
  } catch (error) {
    console.error('[App] ❌ Error crítico durante la inicialización:', error);
    showToast('Error al cargar la aplicación. Recarga la página.', 'error');
  }
}

// Ejecutar la inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}