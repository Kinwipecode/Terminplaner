/* ══════════════════════════════════════════════════════════════
   ui/place.js – gemeinsame Helfer zum Ablegen von Ideen aus dem
   Sammelbecken (Gantt, Tabelle, Kalender, Board benutzen dieselben).
   ══════════════════════════════════════════════════════════════ */

import { toast } from './dom.js';
import { store } from '../store.js';

const MIME = 'application/x-tplan-pool';
const PREFIX = 'tplan-pool:';

/** Ist das ein Ziehen aus dem Sammelbecken? */
export function isPoolDrag(e) {
  if (store.ui.armedPool) return true;
  const types = e && e.dataTransfer ? Array.from(e.dataTransfer.types || []) : [];
  return types.includes('text/plain') || types.includes(MIME);
}

/** Kennung des gezogenen Eintrags (Rückfall: der bereitliegende Eintrag). */
export function poolIdFromDrag(e) {
  try {
    const custom = e.dataTransfer && e.dataTransfer.getData(MIME);
    if (custom) return custom;
    const plain = e.dataTransfer && e.dataTransfer.getData('text/plain');
    if (plain && plain.startsWith(PREFIX)) return plain.slice(PREFIX.length);
  } catch { /* egal */ }
  return store.ui.armedPool ? store.ui.armedPool.id : null;
}

/** Daten beim Ziehen setzen (im Sammelbecken-Fenster benutzt). */
export function setPoolDragData(e, poolId) {
  try {
    e.dataTransfer.setData('text/plain', PREFIX + poolId);
    e.dataTransfer.setData(MIME, poolId);
    e.dataTransfer.effectAllowed = 'copy';
  } catch { /* egal */ }
}

/**
 * Eintrag aus dem Sammelbecken an der gewünschten Stelle ablegen.
 * @param {{start?:string, afterId?:string|null, parentId?:string|null, status?:string}} target
 * @param {string} [poolId] – sonst der bereitliegende Eintrag
 */
export function placeArmed(target = {}, poolId = null) {
  const armed = store.ui.armedPool;
  const id = poolId || (armed && armed.id);
  if (!id) return false;
  const scope = (armed && armed.id === id) ? armed.scope : 'project';
  const newId = store.placePoolEntry(id, {
    start: target.start || null,
    afterId: target.afterId || null,
    parentId: target.parentId || null,
    status: target.status || 'open',
    scope,
  });
  store.disarm();
  if (newId) {
    const t = store.project.tasks.find((x) => x.id === newId);
    const n = t ? store.placedCountFor(t) : 0;
    toast(`„${t ? t.name : 'Idee'}“ eingeplant`, 'ok',
      `${n}× im Plan · der Eintrag bleibt für weitere Termine erhalten.`);
  }
  return !!newId;
}
