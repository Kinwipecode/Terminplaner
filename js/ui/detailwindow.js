/* ══════════════════════════════════════════════════════════════
   ui/detailwindow.js – Detailbereich im eigenen Fenster.

   Der Bereich wird NICHT nachgebaut: das echte Element (#detail)
   wird in das zweite Fenster umgehängt. Damit bleiben Ereignis-
   behandlung und Store-Zugriff im Planungsfenster – es gibt nur
   eine Wahrheit, und alles (Termine, Vorgänger, Notizen …) wirkt
   sofort im Hauptfenster.

   Verhalten:
   • Standard ist AN – der Plan hat damit den ganzen Bildschirm.
   • Beim Markieren einer Aufgabe geht das Fenster von selbst auf.
   • Schließt man es (auch versehentlich), ist es beim nächsten
     Markieren wieder da.
   • Beim Beenden des Programms wird es geschlossen.
   • Links auf 🗗 Detail schaltet den Fensterbetrieb um (an/aus).
   ══════════════════════════════════════════════════════════════ */

import { toast } from './dom.js';
import { store } from '../store.js';

const WIN_NAME = 'tplan-detail';
const FEATURES = 'width=460,height=900,menubar=no,toolbar=no,location=no,status=no,noopener=no';
const LS_MODE = 'tplan.detailwindow.mode';
const LS_POS = 'tplan.detailwindow.pos';

let win = null;          // das geöffnete Fenster
let watch = null;        // Aufpasser: Fenster geschlossen? / Position merken
let requested = null;    // zuletzt angeforderte Fensterstelle
let blockedTold = false; // Hinweis auf Popup-Blocker nur einmal je Sitzung

/* Das Element wechselt nur seinen Platz, nie seine Identität – deshalb EINE
   Referenz merken. `document.getElementById('detail')` findet es nicht mehr,
   sobald es ausgehängt ist, und beim Schließen des Fensters ist es schon zu. */
const pane = document.getElementById('detail');

/* ───────── Betriebsart (an/aus) ───────── */

/** Standard: an – der Plan soll den ganzen Bildschirm haben. */
export function detailMode() {
  try { return localStorage.getItem(LS_MODE) !== '0'; } catch { return true; }
}

function setMode(on) {
  try { localStorage.setItem(LS_MODE, on ? '1' : '0'); } catch { /* egal */ }
  reflect();
}

/** Knopf in der Leiste zeigt den Zustand. */
function reflect() {
  const btn = document.querySelector('[data-action="detail-window"]');
  if (!btn) return;
  const on = detailMode();
  btn.classList.toggle('is-active', on);
  btn.title = on
    ? 'Detailbereich ist im eigenen Fenster (öffnet sich beim Markieren) – klicken holt ihn in den Plan'
    : 'Detailbereich in eigenem Fenster öffnen (z. B. zweiter Bildschirm)';
}

/* ───────── Tastatur aus dem Detailfenster weiterreichen ─────────

   Das Detailfenster ist ein eigenes Dokument: Tastenkürzel wie Umschalt+→
   („Termin einen Tag später“), Entf (löschen) oder Strg+Z hört nur das
   Planungsfenster. Ist das Detailfenster vorn, kommt kein Tastendruck dort an –
   deshalb wird er weitergereicht. Ausnahme: gilt der Druck einem Eingabefeld
   im Detailbereich, wird dort getippt und nichts weitergereicht. */

function attachKeyBridge(w) {
  if (!w || w.__tplanKeyBridge) return;   // nie zweimal – sonst zählt jeder Druck doppelt
  try {
    w.document.addEventListener('keydown', relayKey);
    w.__tplanKeyBridge = true;
  } catch { /* Fenster schon weg */ }
}

function relayKey(e) {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.isComposing) return;
  const weiter = document.dispatchEvent(new KeyboardEvent('keydown', {
    key: e.key, code: e.code,
    altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey,
    repeat: e.repeat, bubbles: true, cancelable: true,
  }));
  // Hat das Planungsfenster den Druck verbraucht (dispatchEvent → false), hier
  // ebenfalls die Standardwirkung unterdrücken – sonst rollt das Fenster dabei.
  if (!weiter) e.preventDefault();
}

/* ───────── Plätze des Bereichs ───────── */

/** Unsichtbar beiseitestellen – der Plan hat dann den ganzen Bildschirm. */
function parkDetail() {
  const park = document.getElementById('detail-park');
  if (!park || !pane) return false;
  park.appendChild(pane);
  return true;
}

/** Zurück in den Plan (rechte Spalte). */
function putIntoPlan() {
  const ws = document.querySelector('main.workspace');
  if (!ws || !pane) return false;
  ws.appendChild(pane);
  return true;
}

/** Bereich gerade in einem eigenen Fenster? */
export function isDetailDetached() { return !!(win && !win.closed); }

/** Das geöffnete Fenster (für Prüfskripte und Tests). */
export function detailWindowRef() { return win && !win.closed ? win : null; }

/* ───────── Position ───────── */

function savedPos() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_POS) || 'null');
    if (v && Number.isFinite(v.left) && Number.isFinite(v.top)) return v;
  } catch { /* egal */ }
  return null;
}

/** Erster Start: zweiter Bildschirm, sonst rechts auf diesem. */
function firstPos() {
  try {
    if (screen.isExtended) {
      return { left: (screen.availLeft || 0) + (screen.availWidth || 0) + 40, top: (screen.availTop || 0) + 60 };
    }
    return { left: Math.round((screen.availWidth || 1200) - 520), top: Math.round((screen.availTop || 0) + 80) };
  } catch { return null; }
}

function posFeatures() {
  const p = savedPos() || firstPos();
  if (!p) return '';
  requested = { left: Math.round(p.left), top: Math.round(p.top) };
  return `,left=${requested.left},top=${requested.top}`;
}

/** Merken, wohin der Nutzer das Fenster geschoben hat. */
function rememberPos() {
  if (!win || win.closed) return;
  try {
    if (!Number.isFinite(win.screenX) || !Number.isFinite(win.screenY)) return;
    // Manche Browser melden für Popups (0,0), obwohl sie woanders stehen – dann gilt
    // die bisherige Stelle weiter, sonst springt das Fenster in die Ecke.
    const nullPoint = win.screenX === 0 && win.screenY === 0 && requested && (requested.left || requested.top);
    if (nullPoint) return;
    localStorage.setItem(LS_POS, JSON.stringify({ left: win.screenX, top: win.screenY }));
  } catch { /* egal */ }
}

/* ───────── Farblayout ───────── */

/** Farblayout des Planungsfensters übernehmen (auch bei späterem Wechsel). */
export function syncDetailTheme() {
  if (!win || win.closed) return;
  try { win.document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'nacht'; }
  catch { /* Fenster gerade weg */ }
}

/* ───────── Fenster auf / zu ───────── */

/**
 * Fenster öffnen und den Bereich hineinhängen.
 * @param {{auto?: boolean}} o  auto = vom Markieren ausgelöst
 */
export function openDetailWindow({ auto = false } = {}) {
  if (isDetailDetached()) return true;
  if (!pane) return false;

  const w = window.open('detail.html', WIN_NAME, FEATURES + posFeatures());
  if (!w) {
    // Popup-Blocker: nichts verlieren – Bereich sichtbar in den Plan holen.
    putIntoPlan();
    if (!blockedTold) {
      blockedTold = true;
      toast('Fenster wurde blockiert', 'warn',
        'Bitte Pop-ups für diese Seite erlauben. Der Detailbereich bleibt so lange rechts im Plan.');
    }
    return false;
  }
  win = w;
  w.focus();

  // Erst umhängen, wenn die Zieldatei geladen ist (vorher ist das Dokument leer).
  const started = Date.now();
  const takeOver = () => {
    if (!win || win.closed) { win = null; return; }
    let host = null;
    try { host = win.document.getElementById('dwin'); } catch { host = null; }
    if (!host) {
      if (Date.now() - started < 6000) setTimeout(takeOver, 60);
      else {
        win = null;
        putIntoPlan();
        toast('Fenster konnte nicht gefüllt werden', 'warn', 'Der Detailbereich bleibt im Plan.');
      }
      return;
    }
    host.appendChild(pane);            // Umhängen – Ereignisse wandern mit
    attachKeyBridge(win);              // Tastenkürzel auch hier wirksam
    syncDetailTheme();
    store.emit('detail-moved');        // Inhalt für die jetzige Markierung aufbauen
    startWatch();
    if (!auto) {
      toast('Detailbereich in eigenem Fenster', 'ok',
        'Fenster frei verschieben – beim Markieren öffnet es sich von selbst wieder.');
    }
  };
  setTimeout(takeOver, 60);
  return true;
}

/** Fenster schließen; Bereich je nach Betriebsart in den Plan oder beiseite. */
function closeWindow({ quiet = true } = {}) {
  const w = win;
  if (w && !w.closed) { rememberPos(); try { w.close(); } catch { /* schon zu */ } }
  win = null;
  stopWatch();
  if (detailMode()) parkDetail(); else putIntoPlan();
  store.emit('detail-moved');          // Bereich in der neuen Umgebung aufbauen
  if (!quiet) toast('Detailbereich wieder im Planungsfenster', 'ok');
  return true;
}

/** Bereich in den Plan holen (Fenster schließen). */
export function dockDetailWindow({ quiet = false } = {}) {
  const wasOpen = isDetailDetached();
  closeWindow({ quiet: true });
  if (wasOpen && !quiet) toast('Detailbereich wieder im Planungsfenster', 'ok');
  return true;
}

/** Schalter links in der Leiste: Fensterbetrieb an/aus. */
export function toggleDetailWindow() {
  if (detailMode()) {
    setMode(false);
    dockDetailWindow({ quiet: false });
    return false;
  }
  setMode(true);
  openDetailWindow({ auto: false });
  return true;
}

/**
 * Beim Markieren aufrufen: öffnet das Fenster, wenn der Betrieb an ist und es
 * (noch) nicht offen ist – so ist es auch nach einem versehentlichen Schließen
 * beim nächsten Markieren wieder da.
 */
export function ensureDetailWindow() {
  if (!detailMode() || isDetailDetached() || !store.project) return false;
  if (!store.selectedId) return false;  // ohne markierte Aufgabe gibt es nichts zu zeigen
  return openDetailWindow({ auto: true });
}

/* ───────── Beim Start ───────── */

/** Betrieb an ⇒ Bereich sofort aus dem Plan nehmen (Platz gewinnen). */
export function initDetailWindow() {
  if (detailMode()) parkDetail();
  reflect();
}

/* ───────── Aufpasser ───────── */

function startWatch() {
  stopWatch();
  watch = setInterval(() => {
    if (!win || win.closed) {          // vom Nutzer geschlossen
      win = null;
      stopWatch();
      if (detailMode()) parkDetail(); else putIntoPlan();
      store.emit('detail-moved');
      return;
    }
    rememberPos();                     // verschobenes Fenster merken
  }, 600);
}

function stopWatch() { if (watch) { clearInterval(watch); watch = null; } }

/* ───────── Anbindung ───────── */

window.addEventListener('tplan:theme', syncDetailTheme);

/* Programm beendet ⇒ Fenster zu (kein verwaistes Fenster zurücklassen). */
const shutWindow = () => { if (win && !win.closed) { try { win.close(); } catch { /* egal */ } } };
window.addEventListener('beforeunload', shutWindow);
window.addEventListener('pagehide', shutWindow);

/* Projekt geschlossen ⇒ Fenster zu, Bereich beiseite. */
store.on((reason) => {
  if (reason === 'close' && isDetailDetached()) closeWindow({ quiet: true });
});
