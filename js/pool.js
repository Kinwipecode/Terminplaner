/* ══════════════════════════════════════════════════════════════
   pool.js – das Ideen-Sammelbecken.

   Einträge ohne Termin: nur ein Text. Sie werden per Ziehen (oder
   Klicken) in den Plan gelegt; dabei entsteht eine Aufgabe. Derselbe
   Eintrag kann beliebig oft gelegt werden – wie oft, steht in
   `placedCount` und wird als Zahl in Klammern angezeigt.

   Zwei Ablagen:
     · Projekt-Sammelbecken  → liegt in der Projektdatei (project.pool)
     · Allgemeiner Vorrat    → liegt im Browser (localStorage), damit
                               neue Projekte ihn übernehmen können
   ══════════════════════════════════════════════════════════════ */

/** Eigene Farbe für Aufgaben aus dem Sammelbecken – so sind sie sofort erkennbar. */
export const POOL_COLOR = '#14b8a6';

const LS_GLOBAL = 'tplan.pool.global';

let counter = 0;
export function poolId() {
  counter += 1;
  return `p${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function newPoolEntry(patch = {}) {
  return Object.assign({
    id: poolId(),
    text: 'Neue Idee',
    note: '',
    createdAt: new Date().toISOString(),
    placedCount: 0,
    placedAt: null,
    done: false,
  }, patch);
}

/** Fehlende Felder ergänzen (auch für ältere Projektdateien). */
export function normalizePoolEntry(raw) {
  const e = newPoolEntry({});
  if (!raw || typeof raw !== 'object') return e;
  e.id = String(raw.id || e.id);
  e.text = String(raw.text != null ? raw.text : (raw.name || 'Idee'));
  e.note = String(raw.note || '');
  e.createdAt = raw.createdAt || e.createdAt;
  e.placedCount = Math.max(0, Number(raw.placedCount) || 0);
  e.placedAt = raw.placedAt || null;
  e.done = !!raw.done;
  return e;
}

export function normalizePool(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map(normalizePoolEntry).filter((e) => {
    if (seen.has(e.id)) { e.id = poolId(); }
    seen.add(e.id);
    return e.text.trim().length > 0;
  });
}

/* ───────── allgemeiner Vorrat (gilt für alle Projekte) ───────── */

export function loadGlobalPool() {
  try { return normalizePool(JSON.parse(localStorage.getItem(LS_GLOBAL) || '[]')); }
  catch { return []; }
}

export function saveGlobalPool(list) {
  try { localStorage.setItem(LS_GLOBAL, JSON.stringify(normalizePool(list))); return true; }
  catch { return false; }
}
