/* ══════════════════════════════════════════════════════════════
   poolhub.js – Brücke zwischen Planungsfenster und Sammelbecken-
   Fenster (BroadcastChannel, mit localStorage als Rückfallweg).

   Das Planungsfenster ist der einzige Schreiber der Projektdatei.
   Das Sammelbecken-Fenster schickt Aufträge hierher.
   ══════════════════════════════════════════════════════════════ */

import { store } from './store.js';
import { loadGlobalPool } from './pool.js';

const CHANNEL = 'tplan-pool';
const ME = 'main';
let chan = null;

function send(msg) {
  try { if (chan) chan.postMessage(Object.assign({ from: ME }, msg)); } catch { /* egal */ }
}

/** Aktuellen Stand an alle Sammelbecken-Fenster schicken. */
export function broadcastPool() {
  if (!store.project) return;
  send({
    type: 'state',
    projectName: store.project.meta.name || '',
    pool: store.project.pool || [],
    global: loadGlobalPool(),
  });
}

function handle(msg) {
  if (!msg || msg.from === ME || !store.project) return;
  switch (msg.type) {
    case 'hello':
      broadcastPool();
      break;
    case 'add':
      store.addPoolEntry(msg.text, { scope: 'project' });
      break;
    case 'update':
      store.updatePoolEntry(msg.id, msg.patch || {}, { scope: 'project' });
      break;
    case 'remove':
      store.removePoolEntry(msg.id, { scope: 'project' });
      break;
    case 'move':
      store.movePoolEntry(msg.id, msg.toScope === 'global' ? 'global' : 'project');
      break;
    case 'arm':
      store.arm(msg.id, msg.scope === 'global' ? 'global' : 'project');
      break;
    case 'disarm':
      store.disarm();
      break;
    case 'added-global':
    case 'update-global':
    case 'remove-global':
      broadcastPool();
      break;
    default:
      break;
  }
}

export function startPoolHub() {
  const hasChannel = 'BroadcastChannel' in window;
  if (hasChannel) {
    chan = new BroadcastChannel(CHANNEL);
    chan.onmessage = (ev) => handle(ev.data);
  }
  // Rückfallweg: localStorage-Ereignisse – nur nutzen, wenn es keinen Kanal gibt
  // (sonst würde jeder Auftrag doppelt ausgeführt).
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'tplan.pool.global') { broadcastPool(); return; }
    if (!hasChannel && ev.key === 'tplan.pool.ping' && ev.newValue) {
      try {
        const m = JSON.parse(ev.newValue);
        if (m && m.from !== ME) handle(m);
      } catch { /* egal */ }
    }
  });
  store.on((reason) => {
    if (reason === 'change' || reason === 'load' || reason === 'pool-global') broadcastPool();
    if (reason === 'armed' && !store.ui.armedPool) send({ type: 'placed' });
  });
  window.addEventListener('beforeunload', () => send({ type: 'bye' }));
  broadcastPool();
}
