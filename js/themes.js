/* ══════════════════════════════════════════════════════════════
   themes.js – fertige Farblayouts.

   Die Farben selbst stehen in css/themes.css (ein Block je
   Layout). Hier stehen nur Name, Beschreibung und die Auswahl.
   ══════════════════════════════════════════════════════════════ */

export const THEMES = [
  { id: 'nacht',     name: 'Nachtblau',      mode: 'dunkel', desc: 'Der Standard: tiefes Blau, ruhige Flächen, kräftige Akzente.' },
  { id: 'anthrazit', name: 'Anthrazit',      mode: 'dunkel', desc: 'Neutrales Grau mit Bernstein-Akzent – tritt optisch zurück.' },
  { id: 'tiefsee',   name: 'Tiefsee',        mode: 'dunkel', desc: 'Petrol und Türkis, gute Trennung von Balken und Raster.' },
  { id: 'violett',   name: 'Violettnacht',   mode: 'dunkel', desc: 'Dunkles Violett, weiche Kontraste.' },
  { id: 'kontrast',  name: 'Hoher Kontrast', mode: 'dunkel', desc: 'Schwarz mit Gelb – maximaler Unterschied, gut für Beamer.' },
  { id: 'hell',      name: 'Tageslicht',     mode: 'hell',   desc: 'Helles, neutrales Blaugrau. Gut bei Tageslicht.' },
  { id: 'nord',      name: 'Nordlicht',      mode: 'hell',   desc: 'Kühles Blaugrau, sehr zurückhaltend.' },
  { id: 'papier',    name: 'Papier',         mode: 'hell',   desc: 'Warmes Weiß wie Papier, brauner Akzent.' },
  { id: 'sonne',     name: 'Sonnenschein',   mode: 'hell',   desc: 'Warmes Hellgelb mit Orange – freundlich und hell.' },
];

const LS_THEME = 'tplan.theme';
const LS_LAST_DARK = 'tplan.theme.dark';

const ALIAS = { dark: 'nacht', light: 'hell' };

export function themeById(id) {
  const key = ALIAS[id] || id;
  return THEMES.find((t) => t.id === key) || THEMES[0];
}

export function currentThemeId() {
  return themeById(document.documentElement.dataset.theme || 'nacht').id;
}

export function currentTheme() {
  return themeById(currentThemeId());
}

export function applyTheme(id, { quiet = false } = {}) {
  const theme = themeById(id);
  document.documentElement.dataset.theme = theme.id;
  try {
    localStorage.setItem(LS_THEME, theme.id);
    if (theme.mode === 'dunkel') localStorage.setItem(LS_LAST_DARK, theme.id);
  } catch { /* egal */ }
  if (!quiet) window.dispatchEvent(new CustomEvent('tplan:theme', { detail: theme }));
  return theme;
}

/** Beim Start: gemerktes Layout anwenden (hell/dunkel-Schnellwahl inklusive). */
export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(LS_THEME); } catch { /* egal */ }
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'hell' : 'nacht';
  }
  return applyTheme(saved, { quiet: true });
}

/** Schnell zwischen hell und dunkel wechseln (merkt sich das dunkle Layout). */
export function toggleLightDark() {
  const cur = currentTheme();
  if (cur.mode === 'hell') {
    let last = 'nacht';
    try { last = localStorage.getItem(LS_LAST_DARK) || 'nacht'; } catch { /* egal */ }
    return applyTheme(last);
  }
  return applyTheme('hell');
}
