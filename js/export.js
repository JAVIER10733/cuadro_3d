import { state } from './state.js';
import { cv, draw } from './render/canvas.js';
// Asumimos que tienes una utilidad de notificaciones. Si no, puedes crear una simple.
import { showToast } from './utils/ui.js'; 

/**
 * Constantes de configuración de exportación.
 */
const EXPORT_CONFIG = {
  JPEG_QUALITY: 0.95,
  BLOB_TIMEOUT_MS: 15000, // 15 segundos de timeout por seguridad en canvas grandes
  MAX_FILENAME_LENGTH: 100,
};

/**
 * Genera un nombre de archivo seguro, legible y con longitud limitada.
 * @param {string} prefix - Prefijo del archivo (ej. 'cuadro3d')
 * @returns {string} Nombre de archivo sanitizado
 */
const generateSafeFilename = (prefix) => {
  const safeName = (state.name || 'diseno')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') // Elimina guiones al inicio o final
    .substring(0, EXPORT_CONFIG.MAX_FILENAME_LENGTH); // Previene nombres excesivamente largos
  
  return `${prefix}-${safeName}`;
};

/**
 * Dispara la descarga de un Blob de forma segura y compatible con móviles.
 * @param {Blob} blob - El archivo a descargar
 * @param {string} filename - Nombre del archivo
 */
const triggerDownload = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // Agregar al DOM es una práctica más robusta para ciertos navegadores móviles (iOS Safari)
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Liberar memoria de forma asíncrona para no bloquear el hilo principal
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (error) {
    console.error('Error crítico al guardar el archivo:', error);
    showToast('No se pudo iniciar la descarga. Verifica el espacio de almacenamiento.', 'error');
    throw new Error('Fallo en la descarga del archivo.');
  }
};

/**
 * Envuelve canvas.toBlob en una Promesa con manejo de errores y timeout.
 * Previene que la aplicación se cuelgue indefinidamente si el navegador falla.
 * @param {string} type - Tipo MIME (ej. 'image/png')
 * @param {number} [quality] - Calidad para JPEG/WebP (0 a 1)
 * @returns {Promise<Blob>}
 */
const canvasToBlob = (type, quality) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: El navegador tardó más de ${EXPORT_CONFIG.BLOB_TIMEOUT_MS}ms en generar el blob.`));
    }, EXPORT_CONFIG.BLOB_TIMEOUT_MS);

    try {
      cv.toBlob(
        (blob) => {
          clearTimeout(timeoutId);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('El navegador devolvió un blob nulo. Posible problema de memoria o canvas tainted.'));
          }
        },
        type,
        quality
      );
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
};

/**
 * Gestiona el estado visual del canvas durante la exportación.
 * CRÍTICO: Introduce un micro-delay para asegurar que el navegador 
 * ha pintado el frame sin la UI de selección antes de capturar el blob.
 * @param {Function} exportFn - Función asíncrona que realiza la exportación
 */
const withExportState = async (exportFn) => {
  state.exporting = true;
  draw(); // Redibuja sin la UI de selección (borde punteado)
  
  // Esperar al siguiente ciclo de pintado del navegador + un pequeño margen
  // Esto garantiza que el borde de selección NO se incluya en la imagen final.
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 50));
  
  try {
    await exportFn();
  } catch (error) {
    console.error('Error durante la exportación:', error);
    showToast('Ocurrió un error al generar el archivo. Inténtalo de nuevo.', 'error');
    throw error; 
  } finally {
    state.exporting = false;
    draw(); // Restaura la UI de selección inmediatamente
  }
};

/**
 * Exporta el canvas actual como imagen PNG de alta resolución.
 * @returns {Promise<void>}
 */
export const downloadPng = async () => {
  await withExportState(async () => {
    const blob = await canvasToBlob('image/png');
    triggerDownload(blob, `${generateSafeFilename('cuadro3d')}.png`);
    showToast('¡Imagen PNG descargada exitosamente!', 'success');
  });
};

/**
 * Exporta el canvas actual como documento PDF (A4 Horizontal) sin librerías externas.
 * Construye manualmente un PDF 1.4 mínimo que incrusta el JPEG del canvas.
 * @returns {Promise<void>}
 */
export const downloadPdf = async () => {
  await withExportState(async () => {
    // 1. Obtener datos de la imagen comprimida
    const jpgBlob = await canvasToBlob('image/jpeg', EXPORT_CONFIG.JPEG_QUALITY);
    const jpgBuffer = await jpgBlob.arrayBuffer();
    const jpgBytes = new Uint8Array(jpgBuffer);

    const enc = new TextEncoder();
    const parts = [];
    let len = 0;
    const offs = [];

    // Helper tipado para agregar bytes o strings al stream del PDF
    const push = (data) => {
      const bytes = typeof data === 'string' ? enc.encode(data) : data;
      parts.push(bytes);
      len += bytes.length;
    };

    // Dimensiones A4 Landscape en puntos (1 pt = 1/72 pulgada)
    // 842 x 595 pts tiene una relación de aspecto (~1.415) casi idéntica a 1485x1050 (~1.414)
    const PW = 842;
    const PH = 595;
    const contentStream = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;

    // 2. Construcción del PDF (Estructura mínima válida PDF 1.4)
    push('%PDF-1.4\n');

    offs[1] = len;
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    offs[2] = len;
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    offs[3] = len;
    push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

    offs[4] = len;
    // Se usan cv.width y cv.height reales para que el diccionario de imagen coincida con el JPEG
    push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`);
    push(jpgBytes);
    push('\nendstream\nendobj\n');

    offs[5] = len;
    push(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

    // 3. Tabla de referencias cruzadas (xref)
    const xrefOffset = len;
    push('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) {
      push(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
    }

    // 4. Trailer y finalización
    push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    // 5. Disparar descarga
    const pdfBlob = new Blob(parts, { type: 'application/pdf' });
    triggerDownload(pdfBlob, `${generateSafeFilename('cuadro3d')}.pdf`);
    showToast('¡Documento PDF descargado exitosamente!', 'success');
  });
};