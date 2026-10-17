/* ══════════════════════════════════════════════════════════════
   sideboard.js – Steuerung des Sammelbecken-Fensters.

   Dieses Fenster ist eigenständig (eigenes Browserfenster, z. B. für
   den zweiten Bildschirm). Es spricht mit dem Planungsfenster über
   einen BroadcastChannel; ist keines offen, lassen sich wenigstens
   die Einträge des allgemeinen Vorrats bearbeiten.

   Ablegen im Plan: Eintrag mit der Maus ins Planungsfenster ziehen –
   oder anklicken (dann „bereit zum Ablegen“) und im Plan die Stelle
   anklicken.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, toast } from './ui/dom.js';
import { loadGlobalPool, saveGlobalPool, normalizePool, POOL_COLOR, POOL_UNITS, POOL_DURATION_MAX, poolDurationWorkdays, poolDurationText } from './pool.js';
import { toggleLightDark } from './themes.js';
import { formatDateTime } from './dateutil.js';

const CHANNEL = 'tplan-pool';
const ME = 'sb-' + Math.random().toString(36).slice(2, 8);

let chan = null;
let connected = false;
let projectName = '';
let projectPool = [];
let globalPool = loadGlobalPool();
let scope = 'project';
let hideDone = false;
let armedId = null;
let lastHello = 0;

const $ = (s) => document.querySelector(s);

/* ───────── Verbindung ───────── */

function send(msg) {
  const payload = Object.assign({ from: ME, at: Date.now() }, msg);
  let delivered = false;
  try { if (chan) { chan.postMessage(payload); delivered = true; } } catch { delivered = false; }
  // Nur wenn kein BroadcastChannel vorhanden ist, den Rückfallweg über localStorage nutzen –
  // sonst käme jeder Auftrag doppelt an.
  if (!delivered && (msg.type === 'add' || msg.type === 'update' || msg.type === 'remove' || msg.type === 'move' || msg.type === 'import-global')) {
    try { localStorage.setItem('tplan.pool.ping', JSON.stringify(payload)); } catch { /* egal */ }
  }
}

function initChannel() {
  if ('BroadcastChannel' in window) {
    chan = new BroadcastChannel(CHANNEL);
    chan.onmessage = (ev) => handle(ev.data);
  }
  // Ping über localStorage (Rückfallweg und für den storage-Event im Hauptfenster)
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'tplan.pool.global') { globalPool = loadGlobalPool(); render(); }
    if (ev.key === 'tplan.pool.ping' && ev.newValue) {
      try { const m = JSON.parse(ev.newValue); if (m && m.from !== ME) handle(m); } catch { /* egal */ }
    }
  });
}

function handle(msg) {
  if (!msg || msg.from === ME) return;
  switch (msg.type) {
    case 'state':
      connected = true;
      projectName = msg.projectName || '';
      projectPool = normalizePool(msg.pool || []);
      globalPool = normalizePool(msg.global || globalPool);
      paintConnection();
      render();
      break;
    case 'bye':
      connected = false;
      paintConnection();
      render();
      break;
    case 'placed':
      // Rückmeldung: Zähler aktualisieren
      if (msg.scope === 'global') {
        globalPool = loadGlobalPool();
      } else {
        const e = projectPool.find((x) => x.id === msg.id);
        if (e) e.placedCount = msg.count;
      }
      armedId = null;
      render();
      break;
    default:
      break;
  }
}

function paintConnection() {
  const chip = $('#sb-conn');
  if (connected) {
    chip.textContent = '● mit Planungsfenster verbunden';
    chip.style.color = 'var(--ok)';
    chip.style.borderColor = 'rgba(34,197,94,.4)';
  } else {
    chip.textContent = '○ kein Planungsfenster';
    chip.style.color = 'var(--warn)';
    chip.style.borderColor = 'rgba(245,158,11,.4)';
  }
  $('#sb-project').textContent = connected
    ? `${projectName || 'Projekt'} · ${projectPool.length} Einträge`
    : 'Hauptfenster öffnen, um das Projekt-Sammelbecken zu bearbeiten';
}

/* ───────── Darstellung ───────── */

function entries() {
  const list = scope === 'global' ? globalPool : projectPool;
  return hideDone ? list.filter((e) => !e.done) : list;
}

function render() {
  const list = $('#sb-list');
  clear(list);
  const items = entries();
  $('#sb-count').textContent = `${items.length} von ${(scope === 'global' ? globalPool : projectPool).length}`;
  if (!items.length) {
    list.appendChild(el('div', { class: 'sb-empty' },
      el('div', { text: scope === 'global' ? 'Der allgemeine Vorrat ist leer.' : 'Noch keine Ideen aufgeschrieben.' }),
      el('div', { class: 'hint', style: { marginTop: '6px' }, text: 'Oben eintippen und Eingabe drücken.' })));
    return;
  }
  for (const e of items) {
    const placed = (e.placedCount || 0) > 0;
    const card = el('div', {
      class: 'sb-card' + (placed ? ' is-placed' : '') + (e.done ? ' is-done' : '') + (armedId === e.id ? ' is-armed' : ''),
      draggable: 'true',
      title: placed
        ? `Schon ${e.placedCount}× im Plan – ins Planungsfenster ziehen, um einen weiteren Termin anzulegen`
        : 'Ins Planungsfenster ziehen, um einen Termin daraus zu machen',
    });
    card.appendChild(el('span', { class: 'sb-grip', text: '⠿' }));

    const main = el('div', { class: 'sb-main' });
    const text = el('div', { class: 'sb-text', text: e.text });
    main.appendChild(text);
    const meta = el('div', { class: 'sb-meta' });
    meta.appendChild(el('span', {
      class: 'sb-count-badge' + (placed ? '' : ' zero'),
      title: 'Wie oft dieser Eintrag schon in den Plan gelegt wurde',
      text: `(${e.placedCount || 0})`,
    }));
    if (placed) meta.appendChild(el('span', { text: 'im Plan' }));
    if (e.createdAt) meta.appendChild(el('span', { text: 'aufgeschrieben ' + formatDateTime(Date.parse(e.createdAt) || Date.now()) }));
    if (e.placedAt) meta.appendChild(el('span', { text: 'zuletzt geplant ' + formatDateTime(Date.parse(e.placedAt) || Date.now()) }));
    main.appendChild(meta);
    main.appendChild(durationRow(e));
    card.appendChild(main);

    const acts = el('div', { class: 'sb-actions' });
    acts.appendChild(el('button', { class: 'iconbtn', title: 'Text ändern', text: '✎', onclick: (ev) => { ev.stopPropagation(); editText(text, e); } }));
    acts.appendChild(el('button', { class: 'iconbtn', title: e.done ? 'Wieder als offen markieren' : 'Als erledigt markieren', text: e.done ? '↺' : '✓', onclick: (ev) => {
      ev.stopPropagation();
      patchEntry(e.id, { done: !e.done });
    } }));
    acts.appendChild(el('button', { class: 'iconbtn', title: scope === 'global' ? 'Ins Projekt-Sammelbecken holen' : 'In den allgemeinen Vorrat legen', text: scope === 'global' ? '↧' : '↥', onclick: (ev) => {
      ev.stopPropagation();
      if (scope === 'global' && !connected) { toast('Hauptfenster nötig', 'warn', 'Zum Übernehmen ins Projekt bitte das Planungsfenster öffnen.'); return; }
      send({ type: 'move', id: e.id, toScope: scope === 'global' ? 'project' : 'global' });
      hint('Verschoben.');
    } }));
    acts.appendChild(el('button', { class: 'iconbtn', title: 'Löschen', text: '🗑', onclick: async (ev) => {
      ev.stopPropagation();
      if (!window.confirm(`„${e.text}“ löschen?`)) return;
      removeEntry(e.id);
    } }));
    card.appendChild(acts);

    card.addEventListener('click', () => {
      if (armedId === e.id) { armedId = null; send({ type: 'disarm' }); hint('Abgelegt-Modus beendet.'); }
      else {
        armedId = e.id;
        send({ type: 'arm', id: e.id, scope });
        const dt = poolDurationText(e);
        hint(`„${e.text}“ ist bereit${dt ? ` (${dt})` : ''} – jetzt im Planungsfenster auf die gewünschte Stelle klicken.`);
        window.focus();
      }
      render();
    });

    card.addEventListener('dragstart', (ev) => {
      armedId = e.id;
      try {
        ev.dataTransfer.setData('text/plain', 'tplan-pool:' + e.id);
        ev.dataTransfer.setData('application/x-tplan-pool', e.id);
        ev.dataTransfer.effectAllowed = 'copy';
      } catch { /* egal */ }
      send({ type: 'arm', id: e.id, scope });
      card.classList.add('is-dragging');
      hint('Ins Planungsfenster ziehen und dort ablegen.');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      setTimeout(() => { if (armedId === e.id) { armedId = null; send({ type: 'disarm' }); render(); } }, 1200);
    });

    list.appendChild(card);
  }
}

/* ───────── Dauer einer Idee (freiwillig) ───────── */

/**
 * Zeile „Dauer [Zahl] [Einheit]“ – darf leer bleiben.
 * Steht eine Dauer drin, wird sie beim Einplanen zur Dauer der Aufgabe.
 */
function durationRow(e) {
  const days = poolDurationWorkdays(e);
  const wrap = el('div', { class: 'sb-dur' + (days ? ' is-set' : '') });

  const num = el('input', {
    class: 'sb-dur-num',
    type: 'number', min: '1', max: String(POOL_DURATION_MAX), step: '1',
    placeholder: '–',
    value: e.duration > 0 ? String(e.duration) : '',
    title: 'Dauer der Idee (freiwillig). Leer lassen, wenn noch keine Dauer feststeht.',
    onclick: (ev) => ev.stopPropagation(),
    onkeydown: (ev) => ev.stopPropagation(),
    onchange: (ev) => {
      ev.stopPropagation();
      const n = Math.round(Number(ev.target.value) || 0);
      patchEntry(e.id, { duration: n > 0 ? Math.min(POOL_DURATION_MAX, n) : 0, unit: e.unit || 'day' });
    },
  });

  const unit = el('select', {
    class: 'sb-dur-unit',
    title: 'Einheit: Tage, Wochen oder Monate',
    onclick: (ev) => ev.stopPropagation(),
    onchange: (ev) => {
      ev.stopPropagation();
      patchEntry(e.id, { unit: ev.target.value, duration: e.duration || 0 });
    },
  }, ...POOL_UNITS.map((u) => el('option', { value: u.v, text: u.label, selected: (e.unit || 'day') === u.v })));

  wrap.appendChild(el('span', { class: 'sb-dur-label', text: 'Dauer' }));
  wrap.appendChild(num);
  wrap.appendChild(unit);
  wrap.appendChild(el('span', {
    class: 'sb-dur-out',
    title: days ? 'So lang wird die Aufgabe beim Einplanen' : 'Keine Dauer angegeben – die Aufgabe wird 1 Arbeitstag lang',
    text: days ? (days === 1 ? '= 1 Arbeitstag' : `= ${days} Arbeitstage`) : 'ohne Angabe',
  }));
  return wrap;
}

function editText(node, entry) {
  node.setAttribute('contenteditable', 'true');
  node.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(range);
  const finish = (save) => {
    node.removeAttribute('contenteditable');
    const val = node.textContent.trim();
    if (save && val && val !== entry.text) patchEntry(entry.id, { text: val });
    else render();
  };
  node.addEventListener('blur', () => finish(true), { once: true });
  node.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') { ev.preventDefault(); node.blur(); }
    if (ev.key === 'Escape') { ev.preventDefault(); node.textContent = entry.text; node.blur(); }
  });
}

/* ───────── Änderungen ───────── */

function addEntry(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  if (scope === 'global') {
    const entry = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: clean, note: '', createdAt: new Date().toISOString(), placedCount: 0, placedAt: null, done: false };
    globalPool = [...globalPool, entry];
    saveGlobalPool(globalPool);
    send({ type: 'added-global', entry });
    hint(`„${clean}“ im allgemeinen Vorrat ergänzt.`);
    render();
    return;
  }
  if (!connected) {
    toast('Hauptfenster nötig', 'warn', 'Das Projekt-Sammelbecken gehört zur Projektdatei – bitte das Planungsfenster öffnen.');
    return;
  }
  send({ type: 'add', text: clean, scope: 'project' });
  hint(`„${clean}“ aufgeschrieben.`);
}

function patchEntry(id, patch) {
  if (scope === 'global') {
    globalPool = globalPool.map((e) => (e.id === id ? { ...e, ...patch } : e));
    saveGlobalPool(globalPool);
    send({ type: 'update-global', id, patch });
    render();
    return;
  }
  if (!connected) { toast('Hauptfenster nötig', 'warn', 'Bitte das Planungsfenster öffnen.'); return; }
  send({ type: 'update', id, patch, scope: 'project' });
}

function removeEntry(id) {
  if (scope === 'global') {
    globalPool = globalPool.filter((e) => e.id !== id);
    saveGlobalPool(globalPool);
    send({ type: 'remove-global', id });
    render();
    return;
  }
  if (!connected) { toast('Hauptfenster nötig', 'warn', 'Bitte das Planungsfenster öffnen.'); return; }
  send({ type: 'remove', id, scope: 'project' });
}

function hint(text) { $('#sb-hint').textContent = text; }

/* ───────── Bedienung ───────── */

function wire() {
  const input = $('#sb-input');
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); addEntry(input.value); input.value = ''; }
  });
  $('#sb-add-btn').addEventListener('click', () => { addEntry(input.value); input.value = ''; input.focus(); });

  document.querySelectorAll('.sb-tab').forEach((b) => b.addEventListener('click', () => {
    scope = b.dataset.scope;
    document.querySelectorAll('.sb-tab').forEach((x) => x.classList.toggle('is-active', x === b));
    armedId = null;
    send({ type: 'disarm' });
    render();
  }));

  $('#sb-hide-done').addEventListener('change', (ev) => { hideDone = ev.target.checked; render(); });
  document.querySelectorAll('[data-sb]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.sb === 'theme') { toggleLightDark(); render(); }
    if (b.dataset.sb === 'open-main') window.open('index.html', 'terminplanung');
  }));

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { armedId = null; send({ type: 'disarm' }); render(); }
  });
  window.addEventListener('beforeunload', () => send({ type: 'bye' }));
}

/* ───────── Start ───────── */

function hello() {
  lastHello = Date.now();
  send({ type: 'hello' });
}

function boot() {
  initChannel();
  wire();
  paintConnection();
  render();
  hello();
  // solange kein Planungsfenster antwortet, regelmäßig fragen
  const timer = setInterval(() => {
    if (connected) { clearInterval(timer); return; }
    hello();
    if (Date.now() - lastHello > 4000) {
      connected = false;
      paintConnection();
    }
  }, 1500);
  setTimeout(() => { if (!connected) paintConnection(); }, 2500);
  void POOL_COLOR;
}

boot();
