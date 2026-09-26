import { slots, state, NAME, PHOTOS } from './state.js';
import { draw } from './render/canvas.js';

/**
 * Configuración de límites para la subida
 */
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

/**
 * Valida que un archivo sea una imagen válida
 */
const validateFile = (file) => {
  if (!UPLOAD_CONFIG.ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`Formato no soportado: ${file.type}. Usa JPG, PNG o WEBP.`);
  }
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`El archivo "${file.name}" pesa más de 5MB.`);
  }
};

/**
 * Carga una imagen de forma segura
 */
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    try {
      validateFile(file);
    } catch (err) {
      return reject(err);
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo procesar: ${file.name}`));
    };
    img.src = url;
  });
};

/**
 * Notificación simple (reemplaza alerts)
 */
const notify = (message, isError = false) => {
  console[isError ? 'error' : 'log'](`[Upload] ${message}`);
  
  // Si tienes un sistema de toasts, úsalo aquí
  // showToast(message, isError ? 'error' : 'success');
};

/**
 * Procesa múltiples archivos y los asigna a slots vacíos
 */
const processFiles = async (files) => {
  let loadedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const emptyIndex = slots.slice(0, PHOTOS).findIndex((s) => !s.img);
    
    if (emptyIndex < 0) {
      notify('No hay más espacios disponibles para fotos', true);
      break;
    }

    try {
      if (slots[emptyIndex].url) {
        URL.revokeObjectURL(slots[emptyIndex].url);
      }
      
      const { img, url } = await loadImage(file);
      slots[emptyIndex].img = img;
      slots[emptyIndex].url = url;
      loadedCount++;
    } catch (err) {
      console.error(err);
      notify(err.message, true);
      errorCount++;
    }
  }

  if (loadedCount > 0) {
    draw();
    notify(`${loadedCount} imagen(es) cargada(s) correctamente`);
  }
  
  if (errorCount > 0) {
    notify(`${errorCount} archivo(s) con errores`, true);
  }
};

/**
 * Inicializa la lógica de subida (Clic + Drag & Drop)
 */
export function initUpload({ onName } = {}) {
  const $ = (id) => document.getElementById(id);

  // =====================================================
  // 1. SUBIDA POR CLIC (Inputs ocultos)
  // =====================================================
  
  const fMulti = $('fMulti');
  if (fMulti) {
    fMulti.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await processFiles(files);
      }
      e.target.value = '';
    });
  }

  const fName = $('fName');
  if (fName) {
    fName.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        if (slots[NAME].url) URL.revokeObjectURL(slots[NAME].url);
        const { img, url } = await loadImage(file);
        slots[NAME].img = img;
        slots[NAME].url = url;
        
        draw();
        notify('Imagen del nombre aplicada correctamente');
        
        if (typeof onName === 'function') {
          onName();
        }
      } catch (err) {
        console.error(err);
        notify(err.message, true);
      }
      e.target.value = '';
    });
  }

  const fCode = $('fCode');
  if (fCode) {
    fCode.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        if (state.codeUrl) URL.revokeObjectURL(state.codeUrl);
        const { img, url } = await loadImage(file);
        state.code = img;
        state.codeUrl = url;
        
        draw();
        notify('Código de Spotify añadido correctamente');
      } catch (err) {
        console.error(err);
        notify(err.message, true);
      }
      e.target.value = '';
    });
  }

  // =====================================================
  // 2. SUBIDA POR ARRASTRE (Drag & Drop)
  // =====================================================
  
  const dropZone = $('dropZoneMulti');
  
  if (dropZone && fMulti) {
    
    // Clic en la zona activa el input
    dropZone.addEventListener('click', () => fMulti.click());
    
    // Soporte para teclado
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fMulti.click();
      }
    });

    // Eventos de Drag & Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('is-dragging');
      }, false);
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('is-dragging');
      }, false);
    });

    // Cuando se sueltan los archivos
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processFiles(Array.from(dt.files));
      }
    }, false);
  }
}