// Neon Shore Cover Lab — editor wiring: photos, panels, presets, undo, export.
// Every control below works on the live canvas; nothing here uploads anything.
import { renderCover, layoutRects, LAYOUTS, GRADES, PRESETS, makeScene } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');

const SIZES = {
  '1920x1080': [1920, 1080],
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1080x1920': [1080, 1920],
};

function blankPanel(photo = -1) {
  return { photo, scale: 1, dx: 0, dy: 0, grade: 'global', border: 'white', flip: false, rot: 0 };
}

function defaultState() {
  return {
    layout: 'nine', grade: 'sunset', gradeStrength: 85,
    title: 'NEON SHORE', subtitle: 'a neon coast story', badge: 'EST. 2026',
    titleFont: 'anton', titleStyle: 'gradient', titlePos: 'auto', heat: 4,
    grain: true, vignette: true, halftone: true,
    panels: [],
  };
}

const state = defaultState();
const photos = []; // { img, name }
let selected = 0;
let comparing = false;
let exported = false;
const touched = { arranged: false, lettering: false };

function panelCount() {
  const found = LAYOUTS.find((l) => l.id === state.layout);
  return found ? found.panels : 8;
}

function rebuildPanels(keep) {
  const n = panelCount();
  const old = keep ? state.panels : [];
  const next = [];
  for (let i = 0; i < n; i++) {
    if (old[i]) next.push(old[i]);
    else next.push(blankPanel(photos.length ? i % photos.length : -1));
  }
  state.panels = next;
  if (selected >= n) selected = 0;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

async function addPhoto(img, name) {
  photos.push({ img, name });
  refreshPhotoControls();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  await addPhoto(img, `${name}.jpg`);
  return img;
}

function makeSampleScenes() {
  return [
    { img: makeScene('beach'), name: 'Sunset Beach (scene)' },
    { img: makeScene('street'), name: 'Neon Street (scene)' },
  ];
}

// ---- history ---------------------------------------------------------------
const history = [];
let historyAt = -1;
function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  history.length = historyAt + 1;
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyAt = history.length - 1;
  syncUndoButtons();
}
function restoreHistory(json) {
  const parsed = JSON.parse(json);
  for (const key of Object.keys(state)) {
    if (key in parsed) state[key] = parsed[key];
  }
  if (selected >= panelCount()) selected = 0;
  syncControlsFromState();
  syncUndoButtons();
  render();
}
function undo() {
  if (historyAt <= 0) return;
  historyAt -= 1;
  restoreHistory(history[historyAt]);
}
function redo() {
  if (historyAt >= history.length - 1) return;
  historyAt += 1;
  restoreHistory(history[historyAt]);
}
function syncUndoButtons() {
  $('undo').disabled = historyAt <= 0;
  $('redo').disabled = historyAt >= history.length - 1;
}

// ---- rendering ---------------------------------------------------------------
function render() {
  renderCover(canvas, state, photos, { before: comparing });
  updateSteps();
  $('panelLabel').textContent = `Panel ${selected + 1} of ${panelCount()}`;
}

function updateSteps() {
  const done = [
    photos.length > 0,
    touched.arranged,
    touched.lettering,
    exported,
  ];
  const steps = document.querySelectorAll('.step');
  let current = 0;
  steps.forEach((el, i) => {
    el.classList.toggle('done', done[i]);
    if (done[i]) current = i + 1;
    el.classList.toggle('active', !done[i] && i === current);
  });
}

// ---- controls ----------------------------------------------------------------
function refreshPhotoControls() {
  const select = $('panelPhoto');
  select.innerHTML = '';
  photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1} — ${p.name}`;
    select.appendChild(opt);
  });
  const panel = state.panels[selected];
  if (panel) select.value = String(Math.max(0, panel.photo));

  const thumbs = $('thumbs');
  thumbs.innerHTML = '';
  photos.forEach((p, i) => {
    let node;
    if (p.img instanceof HTMLCanvasElement) {
      node = document.createElement('canvas');
      node.width = 64; node.height = 64;
      node.getContext('2d').drawImage(p.img, 0, 0, 64, 64);
    } else {
      node = document.createElement('img');
      node.src = p.img.src;
      node.alt = p.name;
    }
    node.title = p.name;
    node.addEventListener('click', () => {
      state.panels[selected].photo = i;
      touched.arranged = true;
      pushHistory();
      refreshPhotoControls();
      render();
    });
    thumbs.appendChild(node);
  });
}

function refreshPanelChips() {
  const box = $('panelChips');
  box.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    b.setAttribute('aria-pressed', String(i === selected));
    b.addEventListener('click', () => { selected = i; syncPanelControls(); render(); });
    box.appendChild(b);
  }
}

function syncPanelControls() {
  const panel = state.panels[selected];
  if (!panel) return;
  $('panelPhoto').value = String(Math.max(0, panel.photo));
  $('panelBorder').value = panel.border;
  $('panelGrade').value = panel.grade;
  $('zoom').value = String(panel.scale);
  refreshPanelChips();
  $('panelLabel').textContent = `Panel ${selected + 1} of ${panelCount()}`;
}

function syncControlsFromState() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('titleFont').value = state.titleFont;
  $('titleStyle').value = state.titleStyle;
  $('titlePos').value = state.titlePos;
  $('heat').value = String(state.heat);
  $('heatVal').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  $('gradeStrength').value = String(state.gradeStrength);
  $('gradeStrengthVal').textContent = `${state.gradeStrength}%`;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('halftone').checked = state.halftone;
  document.querySelectorAll('#layoutBtns button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout)));
  document.querySelectorAll('#gradeBtns button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade)));
  syncPanelControls();
}

function buildButtons() {
  const layoutBox = $('layoutBtns');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name;
    b.dataset.layout = l.id;
    b.setAttribute('aria-pressed', String(l.id === state.layout));
    b.addEventListener('click', () => {
      state.layout = l.id;
      rebuildPanels(true);
      touched.arranged = true;
      pushHistory();
      syncControlsFromState();
      render();
    });
    layoutBox.appendChild(b);
  });

  const gradeBox = $('gradeBtns');
  for (const [id, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-swatch';
    b.dataset.grade = id;
    b.setAttribute('aria-pressed', String(id === state.grade));
    const stops = g.stops.map(([p, c]) => `${c} ${Math.round(p * 100)}%`).join(', ');
    b.innerHTML = `<i style="background:linear-gradient(135deg, ${stops})"></i><span></span>`;
    b.querySelector('span').textContent = g.name;
    b.addEventListener('click', () => {
      state.grade = id;
      touched.arranged = true;
      pushHistory();
      syncControlsFromState();
      render();
    });
    gradeBox.appendChild(b);
  }

  const presetBox = $('presetBtns');
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      state.layout = p.layout;
      state.grade = p.grade;
      state.titleFont = p.titleFont;
      state.titleStyle = p.titleStyle;
      state.titlePos = p.titlePos;
      state.halftone = p.halftone;
      state.grain = p.grain;
      state.vignette = p.vignette;
      rebuildPanels(true);
      touched.arranged = true;
      touched.lettering = true;
      pushHistory();
      syncControlsFromState();
      render();
      setStatus(`Preset applied: ${p.name}`);
    });
    presetBox.appendChild(b);
  });

  const gradeSelect = $('panelGrade');
  for (const [id, g] of Object.entries(GRADES)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = g.name;
    gradeSelect.appendChild(opt);
  }

  const samplesBox = $('samples');
  const kitSamples = ['boulevard', 'pier'];
  kitSamples.forEach((name) => {
    const img = document.createElement('img');
    img.src = `samples/${name}.jpg`;
    img.alt = name;
    img.title = `${name}.jpg — click to use in the selected panel`;
    img.addEventListener('click', async () => {
      const found = photos.findIndex((p) => p.name === `${name}.jpg`);
      const idx = found >= 0 ? found : photos.length;
      if (found < 0) await loadSample(name);
      state.panels[selected].photo = idx;
      touched.arranged = true;
      pushHistory();
      syncPanelControls();
      render();
    });
    samplesBox.appendChild(img);
  });
  for (const scene of makeSampleScenes()) {
    const thumb = document.createElement('canvas');
    thumb.width = 64; thumb.height = 64;
    thumb.getContext('2d').drawImage(scene.img, 0, 0, 64, 64);
    thumb.title = `${scene.name} — click to use in the selected panel`;
    thumb.addEventListener('click', () => {
      const found = photos.findIndex((p) => p.name === scene.name);
      const idx = found >= 0 ? found : photos.length;
      if (found < 0) photos.push(scene);
      state.panels[selected].photo = idx;
      touched.arranged = true;
      pushHistory();
      refreshPhotoControls();
      syncPanelControls();
      render();
    });
    samplesBox.appendChild(thumb);
  }
}

function setStatus(text) {
  $('status').textContent = text;
}

function slugify(text) {
  const slug = (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'neon-shore-cover';
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportSize(key) {
  const [w, h] = SIZES[key];
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  renderCover(off, state, photos, { before: false });
  const filename = `${slugify(state.title)}-${w}x${h}.png`;
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      downloadBlob(blob, filename);
      exported = true;
      setStatus(`Saved ${filename} (${w} × ${h})`);
      updateSteps();
      resolve({ w, h, bytes: blob ? blob.size : 0, filename });
    }, 'image/png');
  });
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    await exportSize(key);
  }
  setStatus('Saved all 4 sizes — check your downloads.');
}

// ---- events ------------------------------------------------------------------
function bindEvents() {
  $('photoFiles').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      await addPhoto(img, file.name);
    }
    if (files.length) {
      const panel = state.panels[selected];
      if (panel && panel.photo < 0) panel.photo = photos.length - files.length;
      touched.arranged = true;
      pushHistory();
      render();
      setStatus(`Added ${files.length} photo${files.length > 1 ? 's' : ''}.`);
    }
    e.target.value = '';
  });

  const zone = $('dropZone');
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('dragging');
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      await addPhoto(img, file.name);
    }
    if (files.length) {
      touched.arranged = true;
      pushHistory();
      render();
      setStatus(`Dropped ${files.length} photo${files.length > 1 ? 's' : ''}.`);
    }
  });

  $('fillAll').addEventListener('click', () => {
    const photo = state.panels[selected].photo;
    if (photo < 0) return;
    state.panels.forEach((p) => { p.photo = photo; });
    touched.arranged = true;
    pushHistory();
    render();
    setStatus('Every panel now uses the selected photo.');
  });

  $('shuffle').addEventListener('click', () => {
    if (!photos.length) return;
    state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * photos.length); });
    touched.arranged = true;
    pushHistory();
    syncPanelControls();
    render();
    setStatus('Photos shuffled across the panels.');
  });

  $('flipPanel').addEventListener('click', () => {
    const p = state.panels[selected];
    p.flip = !p.flip;
    touched.arranged = true;
    pushHistory();
    render();
  });

  $('rotatePanel').addEventListener('click', () => {
    const p = state.panels[selected];
    p.rot = (p.rot + 90) % 360;
    touched.arranged = true;
    pushHistory();
    render();
  });

  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[selected].photo = Number(e.target.value);
    touched.arranged = true;
    pushHistory();
    render();
  });
  $('panelBorder').addEventListener('change', (e) => {
    state.panels[selected].border = e.target.value;
    touched.arranged = true;
    pushHistory();
    render();
  });
  $('panelGrade').addEventListener('change', (e) => {
    state.panels[selected].grade = e.target.value;
    touched.arranged = true;
    pushHistory();
    render();
  });

  $('zoom').addEventListener('input', (e) => {
    state.panels[selected].scale = Number(e.target.value);
    render();
  });
  $('zoom').addEventListener('change', () => pushHistory());
  $('centerPanel').addEventListener('click', () => {
    const p = state.panels[selected];
    p.dx = 0; p.dy = 0; p.scale = 1;
    $('zoom').value = '1';
    touched.arranged = true;
    pushHistory();
    render();
  });

  $('title').addEventListener('input', (e) => { state.title = e.target.value; touched.lettering = true; render(); });
  $('title').addEventListener('change', () => pushHistory());
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; touched.lettering = true; render(); });
  $('subtitle').addEventListener('change', () => pushHistory());
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; touched.lettering = true; render(); });
  $('badge').addEventListener('change', () => pushHistory());
  $('titleFont').addEventListener('change', (e) => { state.titleFont = e.target.value; touched.lettering = true; pushHistory(); render(); });
  $('titleStyle').addEventListener('change', (e) => { state.titleStyle = e.target.value; touched.lettering = true; pushHistory(); render(); });
  $('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; touched.lettering = true; pushHistory(); render(); });
  $('heat').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    $('heatVal').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    render();
  });
  $('heat').addEventListener('change', () => pushHistory());
  $('gradeStrength').addEventListener('input', (e) => {
    state.gradeStrength = Number(e.target.value);
    $('gradeStrengthVal').textContent = `${state.gradeStrength}%`;
    render();
  });
  $('gradeStrength').addEventListener('change', () => pushHistory());
  $('grain').addEventListener('change', (e) => { state.grain = e.target.checked; pushHistory(); render(); });
  $('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; pushHistory(); render(); });
  $('halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; pushHistory(); render(); });

  $('previewSize').addEventListener('change', (e) => {
    const [w, h] = SIZES[e.target.value];
    const scale = Math.min(960 / w, 540 / h);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    render();
  });
  $('previewZoom').addEventListener('input', (e) => {
    canvas.style.transform = `scale(${Number(e.target.value) / 100})`;
  });

  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('exportAll').addEventListener('click', exportAll);
  $('exp1920').addEventListener('click', () => exportSize('1920x1080'));
  $('exp1080').addEventListener('click', () => exportSize('1080x1080'));
  $('exp1350').addEventListener('click', () => exportSize('1080x1350'));
  $('expStory').addEventListener('click', () => exportSize('1080x1920'));

  const compareBtn = $('compare');
  const startCompare = () => { comparing = true; render(); };
  const stopCompare = () => { comparing = false; render(); };
  compareBtn.addEventListener('pointerdown', startCompare);
  compareBtn.addEventListener('pointerup', stopCompare);
  compareBtn.addEventListener('pointerleave', stopCompare);

  // Panel picking, drag to pan, wheel to zoom.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const { panels } = layoutRects(state.layout, canvas.width, canvas.height, state.titlePos || 'auto');
    for (let i = panels.length - 1; i >= 0; i--) {
      const r = panels[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        selected = i;
        syncPanelControls();
        dragging = { lastX: e.clientX, lastY: e.clientY, panel: i, moved: false };
        canvas.setPointerCapture(e.pointerId);
        render();
        return;
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const { panels } = layoutRects(state.layout, canvas.width, canvas.height, state.titlePos || 'auto');
    const r = panels[dragging.panel];
    if (!r) return;
    const p = state.panels[dragging.panel];
    p.dx += ((e.clientX - dragging.lastX) * scaleX) / r.w;
    p.dy += ((e.clientY - dragging.lastY) * scaleY) / r.h;
    p.dx = Math.max(-0.6, Math.min(0.6, p.dx));
    p.dy = Math.max(-0.6, Math.min(0.6, p.dy));
    dragging.lastX = e.clientX;
    dragging.lastY = e.clientY;
    dragging.moved = true;
    $('zoom').value = String(p.scale);
    render();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging?.moved) { touched.arranged = true; pushHistory(); }
    dragging = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selected];
    p.scale = Math.max(1, Math.min(3, p.scale * Math.exp(-e.deltaY * 0.001)));
    $('zoom').value = String(p.scale);
    touched.arranged = true;
    render();
    clearTimeout(canvas._wheelTimer);
    canvas._wheelTimer = setTimeout(() => pushHistory(), 400);
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((mod && e.key.toLowerCase() === 'z' && e.shiftKey) || (mod && e.key.toLowerCase() === 'y')) { e.preventDefault(); redo(); return; }
    if (e.key === 'e' || e.key === 'E') { exportAll(); return; }
    if (e.key === 'b' || e.key === 'B') { comparing = true; render(); return; }
    if (e.key >= '1' && e.key <= '8') {
      const layout = LAYOUTS[Number(e.key) - 1];
      if (layout) {
        state.layout = layout.id;
        rebuildPanels(true);
        touched.arranged = true;
        pushHistory();
        syncControlsFromState();
        render();
      }
      return;
    }
    if (e.key.startsWith('Arrow')) {
      const p = state.panels[selected];
      const step = 0.02;
      if (e.key === 'ArrowLeft') p.dx -= step;
      if (e.key === 'ArrowRight') p.dx += step;
      if (e.key === 'ArrowUp') p.dy -= step;
      if (e.key === 'ArrowDown') p.dy += step;
      p.dx = Math.max(-0.6, Math.min(0.6, p.dx));
      p.dy = Math.max(-0.6, Math.min(0.6, p.dy));
      touched.arranged = true;
      e.preventDefault();
      render();
      clearTimeout(canvas._keyTimer);
      canvas._keyTimer = setTimeout(() => pushHistory(), 400);
    }
  });
  document.addEventListener('keyup', (e) => {
    if ((e.key === 'b' || e.key === 'B') && comparing) { comparing = false; render(); }
  });
}

// ---- startup -----------------------------------------------------------------
async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`100px Anton`),
      document.fonts.load(`100px Pacifico`),
      document.fonts.load(`100px 'Bebas Neue'`),
      document.fonts.load(`100px 'Archivo Black'`),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to system fonts; the cover still renders.
  }
}

async function bootSamples() {
  if (!photos.length) {
    await loadSample('boulevard');
    await loadSample('pier');
  }
  rebuildPanels(false);
}

async function initEditor() {
  buildButtons();
  bindEvents();
  await ensureFonts();
  await bootSamples();
  rebuildPanels(false);
  pushHistory();
  syncControlsFromState();
  render();
}

// ---- shot mode (deterministic scenes for screenshots) -------------------------
const query = new URLSearchParams(location.search);
const shot = query.get('shot');

window.__lab = {
  state, photos, render, exportSize, exportAll, layoutRects, undo, redo,
  setComparing(v) { comparing = v; render(); },
};

if (shot) {
  buildButtons();
  bindEvents();
  await ensureFonts();
  await runShot(shot, query, {
    async loadSamples(names) {
      for (const name of names) {
        if (!photos.some((p) => p.name === `${name}.jpg`)) await loadSample(name);
      }
    },
    applyShot(preset) {
      if (preset.layout) state.layout = preset.layout;
      if (preset.grade) state.grade = preset.grade;
      if (preset.title) state.title = preset.title;
      if (preset.subtitle) state.subtitle = preset.subtitle;
      if (preset.badge) state.badge = preset.badge;
      if (preset.titleFont) state.titleFont = preset.titleFont;
      if (preset.titleStyle) state.titleStyle = preset.titleStyle;
      if (preset.titlePos) state.titlePos = preset.titlePos;
      if (preset.heat !== undefined) state.heat = preset.heat;
      rebuildPanels(false);
      if (preset.photos) {
        state.panels.forEach((p, i) => {
          const name = preset.photos[i % preset.photos.length];
          const idx = photos.findIndex((ph) => ph.name === `${name}.jpg`);
          if (idx >= 0) p.photo = idx;
        });
      }
      syncControlsFromState();
    },
    setPreviewSize(w, h) { canvas.width = w; canvas.height = h; },
    render,
  });
} else {
  initEditor();
}
