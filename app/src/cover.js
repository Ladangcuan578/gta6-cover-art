// Neon Shore Cover Lab — cover renderer. Vanilla canvas 2D, no network, no imports.
// Layouts, gradient-map grades, lettering, halftone, grain, vignette, ribbon, stars.

export const LAYOUTS = [
  { id: 'nine', name: 'Nine-Panel Grid', panels: 8 },
  { id: 'hero', name: 'Hero + Three', panels: 4 },
  { id: 'four', name: 'Four-Panel', panels: 4 },
  { id: 'tilt', name: 'Tilted Snapshots', panels: 5 },
  { id: 'split', name: 'Split Screen', panels: 2 },
  { id: 'bleed', name: 'Full-Bleed', panels: 1 },
  { id: 'triptych', name: 'Triptych', panels: 3 },
  { id: 'magazine', name: 'Magazine', panels: 3 },
];

export const GRADES = {
  sunset: { name: 'Sunset', stops: [[0, '#12041f'], [0.25, '#3b0f54'], [0.5, '#a4135c'], [0.75, '#ff5e3a'], [1, '#ffd166']] },
  neon: { name: 'Neon Nights', stops: [[0, '#03071a'], [0.3, '#0b3d66'], [0.55, '#0ea5b7'], [0.75, '#ff2e88'], [1, '#ffe9f5']] },
  heat: { name: 'Heat', stops: [[0, '#160202'], [0.3, '#6b0f0f'], [0.55, '#d9381e'], [0.8, '#ff7a1a'], [1, '#ffe9a8']] },
  vice: { name: 'Vice', stops: [[0, '#1c0418'], [0.3, '#5b0f4d'], [0.55, '#d63384'], [0.8, '#ff7ab8'], [1, '#ffe3f1']] },
  golden: { name: 'Golden Hour', stops: [[0, '#1a0e02'], [0.3, '#5c2e05'], [0.55, '#c47f17'], [0.8, '#f2b705'], [1, '#fff3c4']] },
  pastel: { name: 'Pastel Vice', stops: [[0, '#2b1d3a'], [0.3, '#7a5c8f'], [0.55, '#e8a2c0'], [0.8, '#ffd6a5'], [1, '#fff6e8']] },
  mono: { name: 'Mono Noir', stops: [[0, '#000000'], [0.25, '#1a1a1a'], [0.5, '#666666'], [0.75, '#b3b3b3'], [1, '#ffffff']] },
};

export const PRESETS = [
  { id: 'sleeve', name: 'Sunset Sleeve', layout: 'nine', grade: 'sunset', titleFont: 'anton', titleStyle: 'gradient', titlePos: 'auto', halftone: true, grain: true, vignette: true },
  { id: 'neon', name: 'Neon Nights', layout: 'hero', grade: 'neon', titleFont: 'anton', titleStyle: 'neon', titlePos: 'auto', halftone: false, grain: true, vignette: true },
  { id: 'pier', name: 'Pier Pressure', layout: 'tilt', grade: 'vice', titleFont: 'archivo', titleStyle: 'white', titlePos: 'auto', halftone: true, grain: true, vignette: false },
  { id: 'golden', name: 'Golden Hour', layout: 'triptych', grade: 'golden', titleFont: 'bebas', titleStyle: 'gradient', titlePos: 'auto', halftone: false, grain: false, vignette: true },
  { id: 'mono', name: 'Mono Noir', layout: 'magazine', grade: 'mono', titleFont: 'archivo', titleStyle: 'outline', titlePos: 'auto', halftone: false, grain: true, vignette: true },
];

export const TITLE_FONTS = { anton: 'Anton', archivo: 'Archivo Black', bebas: 'Bebas Neue' };

const DEFAULTS = {
  nine: 'center', hero: 'bottom', four: 'center', tilt: 'center',
  split: 'center', bleed: 'bottom', triptych: 'bottom', magazine: 'top',
};

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildLut(stops) {
  const lut = new Uint8Array(768);
  const pts = stops.map(([p, hex]) => [p, hexRgb(hex)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = pts[0], b = pts[pts.length - 1];
    for (let k = 0; k < pts.length - 1; k++) {
      if (t >= pts[k][0] && t <= pts[k + 1][0]) { a = pts[k]; b = pts[k + 1]; break; }
    }
    const span = (b[0] - a[0]) || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}

const LUTS = {};
for (const key of Object.keys(GRADES)) LUTS[key] = buildLut(GRADES[key].stops);

/** Panel rectangles (fractions of the canvas) and the title block for a layout. */
export function layoutRects(layoutId, W, H, titlePos = 'auto') {
  const pos = titlePos === 'auto' ? (DEFAULTS[layoutId] || 'center') : titlePos;
  const g = Math.max(4, Math.round(W * 0.012));
  const R = (x, y, w, h, rot = 0) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), rot });
  switch (layoutId) {
    case 'nine': {
      const cw = (W - 4 * g) / 3, ch = (H - 4 * g) / 3;
      const cell = (i) => R(g + (i % 3) * (cw + g), g + Math.floor(i / 3) * (ch + g), cw, ch);
      const titleCell = pos === 'top' ? 1 : pos === 'bottom' ? 7 : 4;
      const panels = [];
      for (let i = 0; i < 9; i++) if (i !== titleCell) panels.push(cell(i));
      return { panels, title: { ...cell(titleCell), band: true } };
    }
    case 'hero': {
      const heroW = (W - 3 * g) * 0.62, heroH = H - 2 * g;
      const rx = g + heroW + g, rw = W - g - rx, ph = (H - 4 * g) / 3;
      const panels = [R(g, g, heroW, heroH)];
      for (let i = 0; i < 3; i++) panels.push(R(rx, g + i * (ph + g), rw, ph));
      const ty = pos === 'top' ? g + heroH * 0.05 : pos === 'center' ? g + heroH * 0.36 : g + heroH * 0.64;
      return { panels, title: { x: Math.round(g + heroW * 0.05), y: Math.round(ty), w: Math.round(heroW * 0.9), h: Math.round(heroH * 0.28), band: true } };
    }
    case 'four': {
      const cw = (W - 3 * g) / 2, ch = (H - 3 * g) / 2;
      const panels = [R(g, g, cw, ch), R(g + cw + g, g, cw, ch), R(g, g + ch + g, cw, ch), R(g + cw + g, g + ch + g, cw, ch)];
      const ty = pos === 'top' ? H * 0.06 : pos === 'bottom' ? H * 0.74 : H * 0.40;
      return { panels, title: { x: Math.round(g), y: Math.round(ty), w: Math.round(W - 2 * g), h: Math.round(H * 0.20), band: true } };
    }
    case 'tilt': {
      const pw = W * 0.40, ph = H * 0.42;
      const spots = [[0.04, 0.04, -4], [0.54, 0.03, 3], [0.06, 0.52, 2], [0.52, 0.52, -3], [0.30, 0.27, 1]];
      const panels = spots.map(([fx, fy, rot]) => R(W * fx, H * fy, pw, ph, rot));
      const ty = pos === 'top' ? H * 0.04 : pos === 'bottom' ? H * 0.70 : H * 0.38;
      return { panels, title: { x: Math.round(W * 0.24), y: Math.round(ty), w: Math.round(W * 0.52), h: Math.round(H * 0.26), band: true } };
    }
    case 'split': {
      const panels = [R(0, 0, W / 2 - 2, H), R(W / 2 + 2, 0, W / 2 - 2, H)];
      const ty = pos === 'top' ? H * 0.05 : pos === 'bottom' ? H * 0.73 : H * 0.40;
      return { panels, title: { x: Math.round(W * 0.14), y: Math.round(ty), w: Math.round(W * 0.72), h: Math.round(H * 0.22), band: true } };
    }
    case 'bleed': {
      const panels = [R(0, 0, W, H)];
      const ty = pos === 'top' ? H * 0.05 : pos === 'center' ? H * 0.35 : H * 0.64;
      return { panels, title: { x: Math.round(W * 0.05), y: Math.round(ty), w: Math.round(W * 0.90), h: Math.round(H * 0.30), band: true } };
    }
    case 'triptych': {
      const total = W - 4 * g, wL = total * 0.29, wC = total * 0.42, wR = total * 0.29;
      const panels = [R(g, g, wL, H - 2 * g), R(g + wL + g, g, wC, H - 2 * g), R(g + wL + wC + 2 * g, g, wR, H - 2 * g)];
      const ty = pos === 'top' ? H * 0.07 : pos === 'center' ? H * 0.40 : H * 0.72;
      return { panels, title: { x: Math.round(W * 0.10), y: Math.round(ty), w: Math.round(W * 0.80), h: Math.round(H * 0.20), band: true } };
    }
    case 'magazine': {
      const panels = [
        R(0, 0, W, H),
        R(W * 0.05, H * 0.68, W * 0.26, H * 0.24),
        R(W * 0.69, H * 0.68, W * 0.26, H * 0.24),
      ];
      if (pos === 'top') return { panels, title: { x: 0, y: Math.round(H * 0.02), w: W, h: Math.round(H * 0.22), band: false } };
      const ty = pos === 'center' ? H * 0.38 : H * 0.42;
      return { panels, title: { x: Math.round(W * 0.08), y: Math.round(ty), w: Math.round(W * 0.84), h: Math.round(H * 0.22), band: true } };
    }
    default:
      return layoutRects('nine', W, H, titlePos);
  }
}

let scratch = null;
function getScratch(w, h) {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
  return scratch;
}

function gradePixels(imgData, lut, strength) {
  const d = imgData.data, keep = 1 - strength;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) | 0;
    const o = lum * 3;
    d[i] = d[i] * keep + lut[o] * strength;
    d[i + 1] = d[i + 1] * keep + lut[o + 1] * strength;
    d[i + 2] = d[i + 2] * keep + lut[o + 2] * strength;
  }
}

function drawPanelPhoto(octx, img, w, h, panel) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const swapped = panel.rot === 90 || panel.rot === 270;
  const fw = swapped ? h : w, fh = swapped ? w : h;
  const base = Math.max(fw / iw, fh / ih) * panel.scale;
  const pw = iw * base, ph = ih * base;
  octx.save();
  octx.translate(w / 2 + panel.dx * w, h / 2 + panel.dy * h);
  octx.rotate((panel.rot * Math.PI) / 180);
  if (panel.flip) octx.scale(-1, 1);
  octx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
  octx.restore();
}

function drawPlaceholder(octx, w, h) {
  octx.fillStyle = '#241040';
  octx.fillRect(0, 0, w, h);
  octx.strokeStyle = 'rgba(255, 46, 136, 0.25)';
  octx.lineWidth = Math.max(2, w * 0.01);
  for (let x = -h; x < w + h; x += Math.max(14, w * 0.07)) {
    octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x + h, h); octx.stroke();
  }
  const size = Math.max(14, Math.min(w, h) * 0.14);
  octx.font = `${size}px 'Bebas Neue', sans-serif`;
  octx.textAlign = 'center'; octx.textBaseline = 'middle';
  octx.fillStyle = 'rgba(245, 238, 252, 0.65)';
  octx.fillText('ADD PHOTO', w / 2, h / 2);
}

function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function fitFont(ctx, text, family, maxW, start) {
  let size = start;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const data = x.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 34;
  }
  x.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s, s);
  ctx.strokeStyle = '#14041f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -40, 14, -72); ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.5;
    ctx.beginPath(); ctx.moveTo(14, -72);
    ctx.quadraticCurveTo(14 + Math.cos(a) * 34, -72 + Math.sin(a) * 30, 14 + Math.cos(a) * 52, -72 + Math.sin(a) * 46 + 16);
    ctx.stroke();
  }
  ctx.restore();
}

/** Two original procedural scenes (drawn by code, not photos): a sunset beach and a neon street. */
export function makeScene(kind, w = 1200, h = 800) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const rnd = mulberry32(kind === 'beach' ? 20261121 : 770031);
  if (kind === 'beach') {
    const sky = x.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#2b0a4e'); sky.addColorStop(0.45, '#a4135c');
    sky.addColorStop(0.8, '#ff5e3a'); sky.addColorStop(1, '#ffd166');
    x.fillStyle = sky; x.fillRect(0, 0, w, h * 0.62);
    x.fillStyle = '#fff3c4';
    x.beginPath(); x.arc(w * 0.5, h * 0.42, h * 0.13, 0, Math.PI * 2); x.fill();
    const sea = x.createLinearGradient(0, h * 0.62, 0, h * 0.82);
    sea.addColorStop(0, '#0ea5b7'); sea.addColorStop(1, '#0b3d66');
    x.fillStyle = sea; x.fillRect(0, h * 0.62, w, h * 0.20);
    x.fillStyle = '#e8b06a'; x.fillRect(0, h * 0.82, w, h * 0.18);
    x.fillStyle = 'rgba(255, 241, 196, 0.5)';
    for (let i = 0; i < 5; i++) x.fillRect(w * (0.42 + i * 0.035), h * (0.63 + i * 0.035), w * 0.16, 3);
    drawPalm(x, w * 0.12, h * 0.84, h / 420, -0.08);
    drawPalm(x, w * 0.88, h * 0.86, h / 520, 0.10);
    drawPalm(x, w * 0.78, h * 0.83, h / 640, -0.05);
  } else {
    x.fillStyle = '#0a0618'; x.fillRect(0, 0, w, h);
    const glow = x.createRadialGradient(w * 0.7, h * 0.3, 10, w * 0.7, h * 0.3, h * 0.7);
    glow.addColorStop(0, 'rgba(255, 46, 136, 0.35)'); glow.addColorStop(1, 'rgba(10, 6, 24, 0)');
    x.fillStyle = glow; x.fillRect(0, 0, w, h);
    for (let b = 0; b < 6; b++) {
      const bw = w * (0.10 + rnd() * 0.08), bx = (b * w) / 6 + rnd() * 10, bh = h * (0.35 + rnd() * 0.35);
      x.fillStyle = b % 2 ? '#150b2e' : '#1d1038';
      x.fillRect(bx, h - bh, bw, bh);
      for (let wy = h - bh + 12; wy < h - 14; wy += 26) {
        for (let wx = bx + 8; wx < bx + bw - 12; wx += 22) {
          if (rnd() < 0.42) {
            x.fillStyle = rnd() < 0.5 ? 'rgba(255, 209, 102, 0.85)' : 'rgba(45, 212, 191, 0.85)';
            x.fillRect(wx, wy, 12, 16);
          }
        }
      }
    }
    x.save();
    x.shadowColor = '#ff2e88'; x.shadowBlur = 26;
    x.fillStyle = '#ff2e88'; x.fillRect(w * 0.30, h * 0.16, w * 0.30, h * 0.07);
    x.shadowColor = '#2dd4bf';
    x.fillStyle = '#2dd4bf'; x.fillRect(w * 0.62, h * 0.30, w * 0.22, h * 0.05);
    x.restore();
    const wet = x.createLinearGradient(0, h * 0.78, 0, h);
    wet.addColorStop(0, 'rgba(255, 46, 136, 0.25)'); wet.addColorStop(1, 'rgba(10, 6, 24, 0)');
    x.fillStyle = wet; x.fillRect(0, h * 0.78, w, h * 0.22);
    x.fillStyle = 'rgba(245, 238, 252, 0.75)';
    x.font = `${Math.round(h * 0.05)}px 'Bebas Neue', sans-serif`;
    x.textAlign = 'center';
    x.fillText('NEON STREET', w * 0.45, h * 0.215);
  }
  return c;
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { layout, grade, gradeStrength, title, subtitle, badge, titleFont, titleStyle,
 *   titlePos, heat, grain, vignette, halftone, panels: [{photo, scale, dx, dy, grade, border, flip, rot}] }
 * photos: [{ img }] — img may be an image or a canvas.
 * opts: { before } — when true, draws the raw photos only (no grade, effects or lettering).
 */
export function renderCover(canvas, state, photos, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const before = !!opts.before;
  ctx.save();
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, W, H);
  const { panels, title } = layoutRects(state.layout, W, H, state.titlePos || 'auto');
  const globalLut = LUTS[state.grade] || LUTS.sunset;
  const strength = before ? 0 : (state.gradeStrength ?? 85) / 100;

  panels.forEach((rect, i) => {
    const p = state.panels[i] || { photo: -1, scale: 1, dx: 0, dy: 0, grade: 'global', border: 'white', flip: false, rot: 0 };
    const photo = photos[p.photo];
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const off = getScratch(Math.max(2, rect.w), Math.max(2, rect.h));
    const octx = off.getContext('2d');
    octx.clearRect(0, 0, off.width, off.height);
    if (photo && photo.img) {
      drawPanelPhoto(octx, photo.img, off.width, off.height, p);
      if (strength > 0) {
        const lut = p.grade && p.grade !== 'global' ? (LUTS[p.grade] || globalLut) : globalLut;
        const data = octx.getImageData(0, 0, off.width, off.height);
        gradePixels(data, lut, strength);
        octx.putImageData(data, 0, 0);
      }
    } else {
      drawPlaceholder(octx, off.width, off.height);
    }
    ctx.drawImage(off, 0, 0);
    ctx.restore();

    // Ink band around the panel.
    if (!before && p.border !== 'none') {
      const bw = Math.max(3, Math.min(rect.w, rect.h) * 0.014);
      ctx.save();
      if (rect.rot) {
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.rotate((rect.rot * Math.PI) / 180);
        ctx.translate(-rect.w / 2, -rect.h / 2);
      } else {
        ctx.translate(rect.x, rect.y);
      }
      ctx.strokeStyle = p.border === 'black' ? '#14041f' : p.border === 'neon' ? '#ff2e88' : '#ffffff';
      ctx.lineWidth = bw;
      ctx.strokeRect(bw / 2, bw / 2, rect.w - bw, rect.h - bw);
      ctx.strokeStyle = 'rgba(20, 4, 31, 0.55)';
      ctx.lineWidth = Math.max(1, bw * 0.25);
      ctx.strokeRect(bw + 1, bw + 1, rect.w - 2 * bw - 2, rect.h - 2 * bw - 2);
      ctx.restore();
    }
  });

  if (!before) {
    // Title block.
    if (title.band) {
      ctx.fillStyle = 'rgba(8, 2, 18, 0.62)';
      rrect(ctx, title.x, title.y, title.w, title.h, Math.min(14, title.h * 0.12));
      ctx.fill();
    } else {
      const scrim = ctx.createLinearGradient(0, title.y, 0, title.y + title.h);
      scrim.addColorStop(0, 'rgba(8, 2, 18, 0.55)');
      scrim.addColorStop(1, 'rgba(8, 2, 18, 0)');
      ctx.fillStyle = scrim;
      ctx.fillRect(title.x, title.y, title.w, title.h);
    }
    if (state.halftone) {
      const step = Math.max(8, W * 0.008);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
      for (let y = title.y + step / 2; y < title.y + title.h; y += step) {
        for (let x = title.x + step / 2; x < title.x + title.w; x += step) {
          ctx.beginPath(); ctx.arc(x, y, step * 0.22, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const text = (state.title || '').trim().toUpperCase();
    const family = TITLE_FONTS[state.titleFont] || 'Anton';
    const pad = title.w * 0.06;
    const titleSize = fitFont(ctx, text || ' ', family, title.w - pad * 2, title.h * 0.42);
    const cx = title.x + title.w / 2;
    const titleY = title.y + title.h * 0.46;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (text) {
      ctx.font = `${titleSize}px ${family}`;
      ctx.save();
      if (state.titleStyle === 'gradient') {
        const grad = ctx.createLinearGradient(cx - title.w * 0.45, 0, cx + title.w * 0.45, 0);
        grad.addColorStop(0, '#ffd166'); grad.addColorStop(0.5, '#ff5e3a'); grad.addColorStop(1, '#ff2e88');
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'; ctx.shadowBlur = titleSize * 0.12; ctx.shadowOffsetY = titleSize * 0.03;
        ctx.strokeStyle = '#14041f'; ctx.lineWidth = titleSize * 0.07;
        ctx.strokeText(text, cx, titleY);
        ctx.fillStyle = grad; ctx.fillText(text, cx, titleY);
      } else if (state.titleStyle === 'neon') {
        ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = titleSize * 0.45;
        ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = titleSize * 0.04;
        ctx.strokeText(text, cx, titleY);
        ctx.fillStyle = '#fff0f7'; ctx.fillText(text, cx, titleY);
        ctx.shadowBlur = titleSize * 0.2;
        ctx.fillStyle = '#ffffff'; ctx.fillText(text, cx, titleY);
      } else if (state.titleStyle === 'outline') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = titleSize * 0.1;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = titleSize * 0.09;
        ctx.strokeText(text, cx, titleY);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'; ctx.shadowBlur = titleSize * 0.12; ctx.shadowOffsetY = titleSize * 0.03;
        ctx.strokeStyle = '#14041f'; ctx.lineWidth = titleSize * 0.07;
        ctx.strokeText(text, cx, titleY);
        ctx.fillStyle = '#ffffff'; ctx.fillText(text, cx, titleY);
      }
      ctx.restore();
    }

    const sub = (state.subtitle || '').trim();
    if (sub) {
      const subSize = Math.max(12, titleSize * 0.30);
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = subSize * 0.55;
      ctx.fillStyle = '#ff8fd0';
      ctx.fillText(sub, cx, title.y + title.h * 0.74);
      ctx.shadowBlur = 0;
    }

    const badge = (state.badge || '').trim();
    if (badge) {
      const bSize = Math.max(11, title.h * 0.13);
      ctx.font = `${bSize}px 'Bebas Neue', sans-serif`;
      const bw = ctx.measureText(badge.toUpperCase()).width + bSize * 1.6;
      const bh = bSize * 1.7;
      const bx = title.x + title.w - bw - title.w * 0.04;
      const by = title.y - bh * 0.35;
      ctx.save();
      ctx.translate(bx + bw / 2, by + bh / 2);
      ctx.rotate(-0.1);
      const bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      bg.addColorStop(0, '#ffd166'); bg.addColorStop(1, '#ff2e88');
      ctx.fillStyle = bg;
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.3);
      ctx.fill();
      ctx.fillStyle = '#14041f';
      ctx.font = `${bSize}px 'Bebas Neue', sans-serif`;
      ctx.fillText(badge.toUpperCase(), 0, 1);
      ctx.restore();
    }

    const heat = Math.max(0, Math.min(5, state.heat ?? 0));
    if (heat > 0) {
      const sr = Math.max(6, title.h * 0.085);
      const gap = sr * 2.4;
      const total = gap * 5;
      const sx = cx - total / 2 + gap / 2;
      const sy = title.y + title.h * 0.92;
      for (let i = 0; i < 5; i++) {
        star(ctx, sx + i * gap, sy, sr, i < heat ? '#ffd166' : 'rgba(245, 238, 252, 0.25)');
      }
    }

    if (state.grain) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (state.vignette) {
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(5, 1, 12, 0)');
      vg.addColorStop(1, 'rgba(5, 1, 12, 0.38)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  }
  ctx.restore();
}
