/**
 * storage.js
 * Persistencia del estado del diseño en localStorage
 * - Auto-guardado en cada cambio
 * - Exportar/Importar proyectos como JSON
 * - Límite de 5 proyectos guardados
 */

const STORAGE_KEY = 'cuadro3d_projects';
const MAX_PROJECTS = 5;

/**
 * Guarda el estado actual del diseño
 * @param {Object} state - Estado global de la app
 * @param {Array} slots - Array de slots con imágenes y transformaciones
 */
export function saveProject(state, slots) {
  try {
    const projects = getProjects();
    
    // Serializar (las imágenes se guardan como dataURL)
    const project = {
      id: Date.now(),
      name: state.name || 'Sin nombre',
      createdAt: new Date().toISOString(),
      data: {
        state: {
          name: state.name,
          top: state.top,
          phrase: state.phrase,
          color: state.color,
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
        },
        slots: slots.map(s => ({
          zoom: s.zoom,
          ox: s.ox,
          oy: s.oy,
          imgDataUrl: s.img ? imageToDataUrl(s.img) : null,
        })),
      },
    };

    // Mantener solo los últimos MAX_PROJECTS
    projects.unshift(project);
    if (projects.length > MAX_PROJECTS) projects.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (err) {
    console.error('[Storage] Error al guardar:', err);
    // Si falla por cuota, intentar sin imágenes
    return false;
  }
}

/**
 * Carga el último proyecto guardado
 * @returns {Object|null} Proyecto o null si no hay
 */
export function loadLastProject() {
  try {
    const projects = getProjects();
    return projects[0] || null;
  } catch (err) {
    console.error('[Storage] Error al cargar:', err);
    return null;
  }
}

/**
 * Obtiene todos los proyectos guardados
 */
export function getProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Elimina un proyecto por ID
 */
export function deleteProject(id) {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/**
 * Exporta el proyecto actual como archivo JSON descargable
 */
export function exportProject(state, slots) {
  const project = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    name: state.name || 'Sin nombre',
    data: {
      state: {
        name: state.name,
        top: state.top,
        phrase: state.phrase,
        color: state.color,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
      },
      slots: slots.map(s => ({
        zoom: s.zoom,
        ox: s.ox,
        oy: s.oy,
        imgDataUrl: s.img ? imageToDataUrl(s.img) : null,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuadro3d-${(state.name || 'proyecto').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Importa un proyecto desde un archivo JSON
 * @returns {Promise<Object>} Proyecto importado
 */
export function importProject(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result);
        if (!project.data || !project.data.state || !project.data.slots) {
          reject(new Error('Archivo de proyecto inválido'));
          return;
        }
        resolve(project);
      } catch (err) {
        reject(new Error('Error al leer el archivo JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

/**
 * Convierte una imagen HTMLImageElement a dataURL
 */
function imageToDataUrl(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Carga una imagen desde dataURL
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });
}

export default {
  saveProject,
  loadLastProject,
  getProjects,
  deleteProject,
  exportProject,
  importProject,
  loadImageFromDataUrl,
};