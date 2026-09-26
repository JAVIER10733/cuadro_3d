/**
 * =========================================================
 * Cuadro 3D Creator · Studio — Core Application Logic
 * Versión: 5.0 | Final Consolidado con Toggle de Spotify
 * =========================================================
 */

const CONFIG = {
  W: 1485,
  H: 1050,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_FONT_SIZE: 2 * 1024 * 1024,
  HISTORY_LIMIT: 15,
  FONT_SCALE: 3.5,
  DEFAULT_FONT: "'Montserrat', sans-serif",
  DEFAULT_FONT_SIZE: 48,
};

const PHOTO_RECTS = [
  [30, 90, 330, 430], [390, 40, 260, 330], [850, 40, 260, 330],
  [1140, 90, 315, 430], [130, 700, 330, 320], [490, 740, 270, 280],
  [1050, 640, 380, 380]
];
const NAME_RECT = [60, 300, 1365, 400];
const COLORS = ['#39ff14', '#ff2d55', '#00e5ff', '#ffd60a', '#c77dff', '#ffffff'];

const PHOTOS_COUNT = PHOTO_RECTS.length;
const NAME_INDEX = PHOTOS_COUNT;

// =========================================================
// ESTADO GLOBAL
// =========================================================
const state = {
  name: 'TU NOMBRE',
  top: 'ARTISTA',
  phrase: 'TU FRASE AQUÍ',
  color: '#39ff14',
  sel: 0,
  code: null,
  codeUrl: null,
  exporting: false,
  fontFamily: CONFIG.DEFAULT_FONT,
  fontSize: CONFIG.DEFAULT_FONT_SIZE,
  spotifyVisible: true, // Controla la visibilidad de la sección de Spotify
};

const slots = [...PHOTO_RECTS, NAME_RECT].map(([x, y, w, h]) => ({
  x, y, w, h, img: null, url: null, zoom: 1, ox: 0, oy: 0
}));

// =========================================================
// HISTORIAL (Undo/Redo)
// =========================================================
const history = {
  stack: [],
  pointer: -1,
  save() {
    if (this.pointer < this.stack.length - 1) this.stack = this.stack.slice(0, this.pointer + 1);
    const snapshot = {
      name: state.name, top: state.top, phrase: state.phrase, color: state.color,
      fontFamily: state.fontFamily, fontSize: state.fontSize,
      spotifyVisible: state.spotifyVisible,
      slots: slots.map(s => ({ zoom: s.zoom, ox: s.ox, oy: s.oy, hasImg: !!s.img })),
      code: !!state.code
    };
    this.stack.push(snapshot);
    if (this.stack.length > CONFIG.HISTORY_LIMIT) this.stack.shift();
    else this.pointer++;
    updateHistoryButtons();
  },
  undo() { if (this.pointer > 0) { this.pointer--; applySnapshot(this.stack[this.pointer]); } },
  redo() { if (this.pointer < this.stack.length - 1) { this.pointer++; applySnapshot(this.stack[this.pointer]); } }
};

function applySnapshot(snapshot) {
  state.name = snapshot.name; 
  state.top = snapshot.top; 
  state.phrase = snapshot.phrase; 
  state.color = snapshot.color;
  state.fontFamily = snapshot.fontFamily || CONFIG.DEFAULT_FONT;
  state.fontSize = snapshot.fontSize || CONFIG.DEFAULT_FONT_SIZE;
  state.spotifyVisible = snapshot.spotifyVisible !== undefined ? snapshot.spotifyVisible : true;
  
  snapshot.slots.forEach((s, i) => { 
    if (slots[i]) { slots[i].zoom = s.zoom; slots[i].ox = s.ox; slots[i].oy = s.oy; } 
  });
  
  $('name').value = state.name; 
  $('top').value = state.top; 
  $('phrase').value = state.phrase;
  $('zoom').value = slots[state.sel].zoom;
  
  syncTypographyUI();
  syncSpotifyUI();
  updateHistoryButtons();
  requestDraw();
}

function updateHistoryButtons() {
  const undoBtn = $('undoBtn'), redoBtn = $('redoBtn');
  if (undoBtn) undoBtn.disabled = history.pointer <= 0;
  if (redoBtn) redoBtn.disabled = history.pointer >= history.stack.length - 1;
}

// =========================================================
// UTILIDADES
// =========================================================
const $ = (id) => document.getElementById(id);

function showToast(message, type = 'success') {
  const container = $('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'}</svg><span>${message}</span>`;
  container.appendChild(toast);
  const announcer = $('announcer');
  if (announcer) announcer.textContent = message;
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transform = 'translateY(20px)'; 
    setTimeout(() => toast.remove(), 300); 
  }, 3500);
}

const loadImage = (file) => new Promise((resolve, reject) => {
  if (file.size > CONFIG.MAX_FILE_SIZE) return reject(new Error('El archivo excede el límite de 5MB'));
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => resolve({ img, url });
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo procesar la imagen')); };
  img.src = url;
});

let rafId = null;
function requestDraw() {
  if (!rafId) { rafId = requestAnimationFrame(() => { draw(); rafId = null; }); }
}

// =========================================================
// CANVAS Y RENDERIZADO
// =========================================================
const cv = $('cv');
const ctx = cv.getContext('2d', { alpha: false, willReadFrequently: true });
const oc = document.createElement('canvas');
oc.width = CONFIG.W; oc.height = CONFIG.H;
const octx = oc.getContext('2d');

function cover(c, img, s) {
  const k = Math.max(s.w / img.width, s.h / img.height) * s.zoom;
  c.drawImage(img, s.x + (s.w - img.width * k) / 2 + s.ox, s.y + (s.h - img.height * k) / 2 + s.oy, img.width * k, img.height * k);
}

function drawSlot(i) {
  const s = slots[i];
  ctx.save();
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, s.h, 18); ctx.clip(); }
  else { ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip(); }
  if (s.img) cover(ctx, s.img, s);
  else { ctx.fillStyle = '#132213'; ctx.fillRect(s.x, s.y, s.w, s.h); }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = state.color; ctx.lineWidth = 3; ctx.shadowColor = state.color; ctx.shadowBlur = 18;
  if (!s.img && ctx.setLineDash) ctx.setLineDash([14, 8]);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(s.x, s.y, s.w, s.h, 18); else ctx.rect(s.x, s.y, s.w, s.h);
  ctx.stroke();
  if (!s.img) {
    if (ctx.setLineDash) ctx.setLineDash([]);
    ctx.shadowBlur = 0; ctx.fillStyle = state.color; ctx.globalAlpha = 0.7;
    ctx.font = `bold 30px ${state.fontFamily}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`FOTO ${i + 1}`, s.x + s.w / 2, s.y + s.h / 2);
  }
  ctx.restore();
}

function drawSelection() {
  if (state.exporting) return;
  const s = slots[state.sel];
  ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
  if (ctx.setLineDash) ctx.setLineDash([10, 8]);
  ctx.strokeRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);
  ctx.restore();
}

function drawName() {
  const t = (state.name || ' ').toUpperCase();
  const baseSize = state.fontSize * CONFIG.FONT_SCALE;
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `${baseSize}px ${state.fontFamily}`;
  const measured = tempCtx.measureText(t).width || 1;
  const fs = Math.min(420, baseSize * 1300 / measured);
  const font = `${fs}px ${state.fontFamily}`;
  const s = slots[NAME_INDEX];

  octx.globalCompositeOperation = 'source-over'; octx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  const g = octx.createLinearGradient(0, s.y, 0, s.y + s.h);
  g.addColorStop(0, state.color); g.addColorStop(1, '#0b3d0b');
  octx.fillStyle = g; octx.fillRect(s.x, s.y, s.w, s.h);
  if (s.img) { octx.save(); octx.beginPath(); octx.rect(s.x, s.y, s.w, s.h); octx.clip(); cover(octx, s.img, s); octx.restore(); }
  octx.globalCompositeOperation = 'destination-in';
  octx.font = font; octx.textAlign = 'center'; octx.textBaseline = 'middle'; octx.fillStyle = '#000';
  octx.fillText(t, CONFIG.W / 2, s.y + s.h / 2 + fs * 0.05);
  octx.globalCompositeOperation = 'source-over';
  ctx.drawImage(oc, 0, 0);

  ctx.save(); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = state.color; ctx.lineWidth = 5; ctx.shadowColor = state.color; ctx.shadowBlur = 18;
  ctx.strokeText(t, CONFIG.W / 2, s.y + s.h / 2 + fs * 0.05);
  ctx.restore();
}

function drawLogo() {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = state.color; ctx.strokeStyle = state.color; ctx.shadowColor = state.color; ctx.shadowBlur = 18;
  ctx.font = `italic 90px ${state.fontFamily}`;
  ctx.fillText(state.top.toUpperCase(), CONFIG.W / 2, 130);
  ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(CONFIG.W / 2, 230, 55, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 7; ctx.beginPath();
  ctx.moveTo(715, 212); ctx.lineTo(737, 234); ctx.moveTo(737, 212); ctx.lineTo(715, 234);
  ctx.moveTo(747, 212); ctx.lineTo(769, 234); ctx.moveTo(769, 212); ctx.lineTo(747, 234);
  ctx.moveTo(712, 250); ctx.quadraticCurveTo(742, 282, 772, 250);
  ctx.stroke(); ctx.restore();
}

function drawPill() {
  ctx.save(); ctx.font = `italic 58px ${state.fontFamily}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.max(300, ctx.measureText(state.phrase).width + 110);
  ctx.fillStyle = state.color; ctx.shadowColor = state.color; ctx.shadowBlur = 18;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(CONFIG.W / 2 - w / 2, 740, w, 95, 48); else ctx.rect(CONFIG.W / 2 - w / 2, 740, w, 95);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#04110a';
  ctx.fillText(state.phrase, CONFIG.W / 2, 787);
  ctx.restore();
}

function drawSpotify() {
  if (!state.spotifyVisible) return; // 🆕 No dibuja si está oculto
  
  ctx.save();
  if (state.code) {
    const h = 90; const w = (state.code.width / state.code.height) * h;
    ctx.drawImage(state.code, CONFIG.W / 2 - w / 2, 880, w, h);
  } else {
    ctx.fillStyle = '#1DB954'; ctx.beginPath(); ctx.arc(560, 925, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    [[917, 4], [926, 3], [934, 2]].forEach(([y, c], i) => {
      ctx.beginPath(); ctx.moveTo(545 + i * 2, y); ctx.quadraticCurveTo(561, y - 6 + c, 577 - i * 2, y + c); ctx.stroke();
    });
    const hs = [20, 50, 30, 70, 40, 60, 26, 54, 34, 74, 46, 22];
    ctx.fillStyle = '#fff';
    hs.forEach((h, i) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(610 + i * 20, 925 - h / 2, 8, h, 4); else ctx.rect(610 + i * 20, 925 - h / 2, 8, h); ctx.fill(); });
  }
  ctx.restore();
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
  g.addColorStop(0, '#0b1a0b'); g.addColorStop(1, '#000000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  for (let i = 0; i < PHOTOS_COUNT; i++) drawSlot(i);
  drawLogo(); drawName(); drawPill(); drawSpotify(); drawSelection();
}

// =========================================================
// CARGA DE ARCHIVOS
// =========================================================
async function handleFiles(files) {
  let loadedCount = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const emptySlotIndex = slots.slice(0, PHOTOS_COUNT).findIndex((s) => !s.img);
    if (emptySlotIndex < 0) { showToast('No hay más espacios disponibles', 'error'); break; }
    try {
      const { img, url } = await loadImage(file);
      if (slots[emptySlotIndex].url) URL.revokeObjectURL(slots[emptySlotIndex].url);
      slots[emptySlotIndex].img = img; slots[emptySlotIndex].url = url;
      loadedCount++;
    } catch (err) { showToast(`Error con ${file.name}: ${err.message}`, 'error'); }
  }
  if (loadedCount > 0) { history.save(); refreshChips(); requestDraw(); showToast(`${loadedCount} imagen(es) cargada(s)`); }
}

function initUpload() {
  const fMulti = $('fMulti');
  if (fMulti) {
    fMulti.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFiles(Array.from(e.target.files)); e.target.value = ''; });
  }

  const dropZone = $('dropZoneMulti');
  if (dropZone && fMulti) {
    dropZone.addEventListener('click', () => fMulti.click());
    dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fMulti.click(); } });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('is-dragging'); }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('is-dragging'); }, false);
    });
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) handleFiles(Array.from(dt.files));
    }, false);
  }

  const fName = $('fName');
  if (fName) {
    fName.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const { img, url } = await loadImage(file);
        if (slots[NAME_INDEX].url) URL.revokeObjectURL(slots[NAME_INDEX].url);
        slots[NAME_INDEX].img = img; slots[NAME_INDEX].url = url;
        select(NAME_INDEX); history.save(); showToast('Imagen aplicada al nombre');
      } catch (err) { showToast(err.message, 'error'); }
      e.target.value = '';
    });
  }

  const fCode = $('fCode');
  if (fCode) {
    fCode.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const { img, url } = await loadImage(file);
        if (state.codeUrl) URL.revokeObjectURL(state.codeUrl);
        state.code = img; state.codeUrl = url;
        history.save(); requestDraw(); showToast('Código de Spotify añadido');
      } catch (err) { showToast(err.message, 'error'); }
      e.target.value = '';
    });
  }
}

// =========================================================
// DRAG & DROP EN CANVAS
// =========================================================
const hit = (s, p) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
const getPos = (e) => {
  const r = cv.getBoundingClientRect(); const k = CONFIG.W / r.width;
  return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k };
};

function initDrag() {
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = getPos(e);
    let i = slots.slice(0, PHOTOS_COUNT).findIndex((s) => hit(s, p));
    if (i < 0 && hit(slots[NAME_INDEX], p)) i = NAME_INDEX;
    if (i < 0) return;
    select(i); drag = { x: e.clientX, y: e.clientY, k: p.k };
    cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const s = slots[state.sel];
    s.ox += (e.clientX - drag.x) * drag.k; s.oy += (e.clientY - drag.y) * drag.k;
    drag.x = e.clientX; drag.y = e.clientY;
    requestDraw();
  });
  const endDrag = () => { if (drag) { drag = null; cv.style.cursor = 'grab'; history.save(); } };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('mouseleave', endDrag);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const s = slots[state.sel];
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    s.zoom = Math.min(3, Math.max(0.5, s.zoom + delta));
    $('zoom').value = s.zoom;
    requestDraw();
  }, { passive: false });
}

// =========================================================
// ATAJOS DE TECLADO
// =========================================================
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const s = slots[state.sel]; const step = e.shiftKey ? 10 : 1; let changed = false;
    if (e.key === 'ArrowLeft') { s.ox -= step; changed = true; }
    else if (e.key === 'ArrowRight') { s.ox += step; changed = true; }
    else if (e.key === 'ArrowUp') { s.oy -= step; changed = true; }
    else if (e.key === 'ArrowDown') { s.oy += step; changed = true; }
    else if (e.key === '+' || e.key === '=') { s.zoom = Math.min(3, s.zoom + 0.05); $('zoom').value = s.zoom; changed = true; }
    else if (e.key === '-') { s.zoom = Math.max(0.5, s.zoom - 0.05); $('zoom').value = s.zoom; changed = true; }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); history.undo(); return; }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); history.redo(); return; }
    else if (e.key === 'F1') { e.preventDefault(); $('helpDialog')?.showModal(); return; }
    if (changed) { e.preventDefault(); requestDraw(); }
  });
}

// =========================================================
// EXPORTACIÓN (PNG / PDF)
// =========================================================
const slug = () => (state.name || 'diseno').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
const saveFile = (blob, filename) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
const toBlob = (type, quality) => new Promise((resolve, reject) => {
  cv.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Error al generar el blob')); }, type, quality);
});

async function cleanExport(fn) {
  state.exporting = true; requestDraw();
  await new Promise(r => setTimeout(r, 50));
  try { await fn(); } finally { state.exporting = false; requestDraw(); }
}

const downloadPng = async () => {
  const btn = $('dlPng'); const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generando PNG...'; btn.disabled = true;
  await cleanExport(async () => {
    const blob = await toBlob('image/png');
    saveFile(blob, `cuadro3d-${slug()}.png`);
    showToast('¡PNG descargado exitosamente!');
  });
  btn.innerHTML = originalText; btn.disabled = false;
};

const downloadPdf = async () => {
  const btn = $('dlPdf'); const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generando PDF...'; btn.disabled = true;
  await cleanExport(async () => {
    try {
      const jpgBlob = await toBlob('image/jpeg', 0.95);
      const jpgBuffer = await jpgBlob.arrayBuffer();
      const jpg = new Uint8Array(jpgBuffer);
      const enc = new TextEncoder(); const parts = []; let len = 0; const offs = [];
      const push = (b) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
      const PW = 842, PH = 595; const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
      push('%PDF-1.4\n');
      offs[1] = len; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      offs[2] = len; push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
      offs[3] = len; push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
      offs[4] = len; push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${CONFIG.W} /Height ${CONFIG.H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
      push(jpg); push('\nendstream\nendobj\n');
      offs[5] = len; push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
      const xref = len; push('xref\n0 6\n0000000000 65535 f \n');
      for (let i = 1; i <= 5; i++) push(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
      push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
      saveFile(new Blob(parts, { type: 'application/pdf' }), `cuadro3d-${slug()}.pdf`);
      showToast('¡PDF descargado exitosamente!');
    } catch (err) { console.error(err); showToast('Error al generar el PDF.', 'error'); }
  });
  btn.innerHTML = originalText; btn.disabled = false;
};

// =========================================================
// CHIPS DE FOTOS Y SELECCIÓN
// =========================================================
function refreshChips() {
  const c = $('chips'); if (!c) return; c.innerHTML = '';
  for (let i = 0; i <= NAME_INDEX; i++) {
    const b = document.createElement('button');
    b.className = 'chip' + (state.sel === i ? ' on' : '');
    b.textContent = i < NAME_INDEX ? `Foto ${i + 1}` : 'Nombre';
    b.type = 'button'; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', state.sel === i);
    b.onclick = () => select(i); c.appendChild(b);
  }
}

function select(i) {
  state.sel = i;
  const zoomInput = $('zoom'); if (zoomInput) zoomInput.value = slots[i].zoom;
  refreshChips(); requestDraw();
}

// =========================================================
// 🆕 TIPOGRAFÍAS
// =========================================================
function syncTypographyUI() {
  const fontInput = $('selectedFont');
  if (fontInput) fontInput.value = state.fontFamily;
  
  const fontSizeInput = $('fontSize');
  if (fontSizeInput) fontSizeInput.value = state.fontSize;
  
  const fontSizeOut = $('fontSizeOut');
  if (fontSizeOut) fontSizeOut.textContent = `${state.fontSize}px`;
  
  document.querySelectorAll('.font-chip').forEach(chip => {
    const isActive = chip.dataset.font === state.fontFamily;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', isActive);
  });
}

function initTypography() {
  const fontChips = document.querySelectorAll('.font-chip');
  const fontSizeSlider = $('fontSize');
  const fontSizeOutput = $('fontSizeOut');

  fontChips.forEach((chip) => {
    chip.addEventListener('click', async (e) => {
      if (e.target.classList.contains('font-remove')) return;
      await selectFontChip(chip);
    });
  });

  if (fontSizeSlider && fontSizeOutput) {
    let debounceTimer;
    fontSizeSlider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value, 10);
      state.fontSize = size;
      fontSizeOutput.textContent = `${size}px`;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        history.save();
        requestDraw();
      }, 80);
    });
  }
  syncTypographyUI();
}

async function selectFontChip(chip) {
  const newFont = chip.dataset.font;
  document.querySelectorAll('.font-chip').forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
  });
  chip.classList.add('active');
  chip.setAttribute('aria-pressed', 'true');

  state.fontFamily = newFont;
  const fontInput = $('selectedFont');
  if (fontInput) fontInput.value = newFont;

  try {
    await document.fonts.load(`16px ${newFont}`, 'AaBbCc123');
  } catch (err) {
    console.warn('Error cargando fuente:', newFont);
  }
  history.save();
  requestDraw();
}

// =========================================================
// 🆕 SPOTIFY TOGGLE
// =========================================================
function syncSpotifyUI() {
  const wrapper = $('spotifySection');
  const toggleBtn = $('toggleSpotifyBtn');
  const toggleText = $('spotifyToggleText');
  
  if (!wrapper || !toggleBtn || !toggleText) return;
  
  if (state.spotifyVisible) {
    wrapper.classList.remove('is-hidden');
    toggleText.textContent = 'Ocultar';
    toggleBtn.classList.add('on');
  } else {
    wrapper.classList.add('is-hidden');
    toggleText.textContent = 'Mostrar';
    toggleBtn.classList.remove('on');
  }
}

function initSpotifyToggle() {
  const wrapper = $('spotifySection');
  const toggleBtn = $('toggleSpotifyBtn');
  const confirmDialog = $('spotifyConfirmDialog');
  const cancelBtn = $('cancelSpotifyRemove');
  const confirmBtn = $('confirmSpotifyRemove');
  const fCodeInput = $('fCode');

  if (!wrapper || !toggleBtn || !confirmDialog) return;

  function showSpotifySection() {
    state.spotifyVisible = true;
    syncSpotifyUI();
    history.save();
    requestDraw();
  }

  function hideSpotifySection() {
    state.spotifyVisible = false;
    if (state.codeUrl) {
      URL.revokeObjectURL(state.codeUrl);
      state.codeUrl = null;
    }
    state.code = null;
    if (fCodeInput) fCodeInput.value = '';
    
    syncSpotifyUI();
    history.save();
    requestDraw();
    showToast('Sección de Spotify ocultada');
  }

  toggleBtn.addEventListener('click', () => {
    if (state.spotifyVisible) {
      confirmDialog.showModal();
    } else {
      showSpotifySection();
    }
  });

  if (cancelBtn) cancelBtn.addEventListener('click', () => confirmDialog.close());
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      hideSpotifySection();
      confirmDialog.close();
    });
  }

  confirmDialog.addEventListener('click', (e) => {
    if (e.target === confirmDialog) confirmDialog.close();
  });

  syncSpotifyUI();
}

// =========================================================
// UI GENERAL
// =========================================================
function initUI() {
  ['name', 'top', 'phrase'].forEach((k) => {
    const el = $(k);
    if (el) {
      el.addEventListener('input', (e) => { state[k] = e.target.value; requestDraw(); });
      el.addEventListener('change', () => history.save());
    }
  });

  const colorsContainer = $('colors');
  if (colorsContainer) {
    colorsContainer.innerHTML = '';
    COLORS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'color-swatch' + (state.color === c ? ' active' : '');
      b.style.background = c; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', state.color === c);
      b.setAttribute('aria-label', `Seleccionar color ${c}`); b.title = c;
      b.onclick = () => {
        state.color = c;
        Array.from(colorsContainer.children).forEach(child => {
          child.setAttribute('aria-checked', child === b); child.classList.toggle('active', child === b);
        });
        history.save(); requestDraw();
      };
      colorsContainer.appendChild(b);
    });
  }

  const zoomInput = $('zoom');
  if (zoomInput) {
    zoomInput.addEventListener('input', (e) => { 
      slots[state.sel].zoom = parseFloat(e.target.value); 
      $('zoomOut').textContent = `${parseFloat(e.target.value).toFixed(2)}×`;
      requestDraw(); 
    });
    zoomInput.addEventListener('change', () => history.save());
  }

  const resetBtn = $('reset');
  if (resetBtn) {
    resetBtn.onclick = () => {
      const s = slots[state.sel]; s.zoom = 1; s.ox = 0; s.oy = 0;
      if (zoomInput) zoomInput.value = 1;
      $('zoomOut').textContent = '1.00×';
      history.save(); requestDraw(); showToast('Vista restablecida');
    };
  }

  const removeBtn = $('remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      const dialog = $('confirmDeleteDialog');
      if (dialog) dialog.showModal(); else performRemove();
    };
  }

  const confirmDeleteBtn = $('confirmDelete');
  if (confirmDeleteBtn) confirmDeleteBtn.onclick = () => { performRemove(); $('confirmDeleteDialog').close(); };
  
  const cancelDeleteBtn = $('cancelDelete');
  if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => $('confirmDeleteDialog').close();

  const dlPngBtn = $('dlPng'); if (dlPngBtn) dlPngBtn.onclick = downloadPng;
  const dlPdfBtn = $('dlPdf'); if (dlPdfBtn) dlPdfBtn.onclick = downloadPdf;
  const undoBtn = $('undoBtn'); if (undoBtn) undoBtn.onclick = () => history.undo();
  const redoBtn = $('redoBtn'); if (redoBtn) redoBtn.onclick = () => history.redo();

  const helpBtn = $('helpBtn'); const helpDialog = $('helpDialog');
  if (helpBtn && helpDialog) {
    helpBtn.onclick = () => helpDialog.showModal();
    const closeHelp = $('closeHelp'); if (closeHelp) closeHelp.onclick = () => helpDialog.close();
    const confirmHelp = $('confirmHelp'); if (confirmHelp) confirmHelp.onclick = () => helpDialog.close();
    helpDialog.addEventListener('click', (e) => {
      if (e.target === helpDialog) helpDialog.close();
    });
  }
}

function performRemove() {
  const s = slots[state.sel];
  if (s.url) { URL.revokeObjectURL(s.url); s.url = null; }
  s.img = null; s.zoom = 1; s.ox = 0; s.oy = 0;
  const zoomInput = $('zoom'); if (zoomInput) zoomInput.value = 1;
  $('zoomOut').textContent = '1.00×';
  history.save(); refreshChips(); requestDraw(); showToast('Elemento eliminado');
}

// =========================================================
// INICIALIZACIÓN
// =========================================================
function init() {
  console.log('🚀 Iniciando Cuadro 3D Creator...');
  initUpload(); 
  initDrag(); 
  initKeyboard(); 
  initUI(); 
  initTypography();
  initSpotifyToggle(); // 🆕 Inicializa el toggle de Spotify
  refreshChips(); 
  history.save();
  
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      console.log('✅ Fuentes cargadas');
      requestDraw();
    });
  } else {
    window.addEventListener('load', requestDraw);
  }
  console.log('✅ App lista');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}