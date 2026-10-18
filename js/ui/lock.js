/* ══════════════════════════════════════════════════════════════
   ui/lock.js – das Schloss einer Aufgabe.

   Ein gesperrtes Element lässt sich nicht ändern, bis das Schloss
   wieder offen ist. Angezeigt wird das überall gleich: das Zeichen
   🔒 neben dem Namen, anklickbar zum Öffnen.
   ══════════════════════════════════════════════════════════════ */

import { el } from './dom.js';
import { store } from '../store.js';

/**
 * Schloss-Zeichen für eine Aufgabe (null, wenn sie nicht gesperrt ist).
 * @param {object} task
 * @param {{cls?:string, style?:object, title?:string}} [opts]
 */
export function lockBadge(task, opts = {}) {
  if (!task || !task.locked) return null;
  return el('span', {
    class: 'lock-badge' + (opts.cls ? ' ' + opts.cls : ''),
    style: opts.style || null,
    title: opts.title || 'Gesperrt – diese Aufgabe lässt sich nicht ändern. Klick öffnet das Schloss.',
    text: '🔒',
    onclick: (e) => { e.stopPropagation(); e.preventDefault(); store.toggleLock(task.id); },
  });
}

/** Knopf „🔒 Sperren“ / „🔓 Schloss öffnen“ für eine oder mehrere markierte Aufgaben. */
export function lockButton(tasks, { cls = 'pick' } = {}) {
  const list = (tasks || []).filter(Boolean);
  const alleGesperrt = list.length > 0 && list.every((t) => t.locked);
  return el('button', {
    class: cls + (alleGesperrt ? ' on' : ''),
    title: alleGesperrt
      ? 'Schloss öffnen – die Aufgabe(n) lassen sich wieder ändern (Alt+L)'
      : 'Sperren – die Aufgabe(n) lassen sich dann nicht mehr ändern (Alt+L)',
    text: alleGesperrt ? '🔓 Schloss öffnen' : '🔒 Sperren',
    onclick: () => store.setLock(list.map((t) => t.id), !alleGesperrt),
  });
}
