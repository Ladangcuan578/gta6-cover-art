// Fixed scenes for screenshots: ?shot=cover shows one exported cover full-bleed,
// ?shot=portrait the portrait cover, ?shot=editor the editor with photos loaded.
// Query params pick the scene: layout, grade, title, subtitle, badge, titleFont,
// titleStyle, titlePos, heat, photo (comma list of sample names).
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  const names = (query.get('photo') || 'pier').split(',').map((s) => s.trim()).filter(Boolean);
  await api.loadSamples(names);

  const preset = {
    layout: query.get('layout') || 'nine',
    grade: query.get('grade') || 'sunset',
    title: query.get('title') || 'NEON SHORE',
    subtitle: query.get('subtitle') || 'a neon coast story',
    badge: query.get('badge') || 'EST. 2026',
    titleFont: query.get('titleFont') || 'anton',
    titleStyle: query.get('titleStyle') || 'gradient',
    titlePos: query.get('titlePos') || 'auto',
    heat: Number(query.get('heat') ?? 4),
    photos: names,
  };
  api.applyShot(preset);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    api.setPreviewSize(1920, 1080);
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    api.setPreviewSize(1080, 1350);
  } else {
    api.setPreviewSize(960, 540);
  }

  api.render();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
