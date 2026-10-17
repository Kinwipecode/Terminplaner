/* ══════════════════════════════════════════════════════════════
   main.js – verbindet alles: Startbildschirm, Speichern,
   Ansichten, Werkzeugleiste, Tastenkürzel.
   ══════════════════════════════════════════════════════════════ */

import { store } from './store.js';
import { storage, downloadText, pickFile, readFileText, fileNameFor } from './storage.js';
import {
  emptyProject, sampleProject, migrateProject, validateProject,
  stats, taskById, STATUS, isSummary,
} from './model.js';
import { formatIso, relativeTime, todayIso, formatDateTime } from './dateutil.js';
import { el, toast, debounce, clear } from './ui/dom.js';
import {
  modal, helpDialog, openProjectDialog, resourcesDialog, projectSettingsDialog,
  backupsDialog, promptDialog, confirmDialog, recoveryDialog, closeModal,
} from './ui/dialogs.js';
import { renderDetail } from './ui/editor.js';
import { renderGantt, fitGantt, ganttScrollToToday } from './views/gantt.js';
import { renderTable } from './views/table.js';
import { renderCalendar } from './views/calendar.js';
import { renderBoard } from './views/board.js';

const $ = (sel) => document.querySelector(sel);
const VIEWS = ['gantt', 'table', 'calendar', 'board'];

/* ───────── Thema ───────── */

function initTheme() {
  const saved = localStorage.getItem('tplan.theme');
  setTheme(saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
}
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('tplan.theme', t);
}
function toggleTheme() { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }

/* ───────── Zeichnen ───────── */

let rafPending = false;
function requestRender() {
  if (rafPending) return;
  rafPending = true;
  const run = () => { if (!rafPending) return; rafPending = false; renderAll(); };
  // requestAnimationFrame wird in Hintergrund-Tabs nicht ausgelöst – Notnagel dazu
  requestAnimationFrame(run);
  setTimeout(run, 200);
}

function renderAll() {
  if (!store.project) return;
  const view = store.ui.view;
  document.body.dataset.view = view;
  for (const v of VIEWS) {
    const node = document.getElementById('view-' + v);
    if (!node) continue;
    node.hidden = v !== view;
    if (v !== view) continue;
    if (v === 'gantt') renderGantt(node);
    else if (v === 'table') renderTable(node);
    else if (v === 'calendar') renderCalendar(node);
    else if (v === 'board') renderBoard(node);
  }
  renderDetail($('#detail'));
  renderStatus();
  syncControls();
}

function renderStatus() {
  const p = store.project;
  if (!p) return;
  const s = stats(p);
  $('#stat-count').textContent = `${s.total} Aufgabe${s.total === 1 ? '' : 'n'}${s.late ? ` · ${s.late} über Ziel` : ''}`;
  $('#stat-range').textContent = s.from ? `${formatIso(s.from)} – ${formatIso(s.to)} (${s.spanDays} Tage)` : '–';
  $('#stat-progress').textContent = `${s.progress} % erledigt · ${s.done} fertig`;
  $('#stat-file').textContent = storage.fileName || 'keine Datei';
}

function syncControls() {
  document.querySelectorAll('.railbtn[data-view]').forEach((b) => b.classList.toggle('is-active', b.dataset.view === store.ui.view));
  document.querySelectorAll('#zoom-group button').forEach((b) => b.classList.toggle('is-active', b.dataset.zoom === store.ui.zoom));
  const title = $('#project-title');
  if (title && document.activeElement !== title) title.value = store.project.meta.name || 'Projekt';
  const ap = $('#auto-plan'); if (ap) ap.checked = store.ui.autoPlan;
  const sc = $('#show-critical'); if (sc) sc.checked = store.ui.showCritical;
  const sd = $('#show-deps'); if (sd) sd.checked = store.ui.showDeps;
  const undo = document.querySelector('[data-action="undo"]'); if (undo) undo.disabled = !store.canUndo;
  const redo = document.querySelector('[data-action="redo"]'); if (redo) redo.disabled = !store.canRedo;
  updateSaveState();
}

function updateSaveState() {
  const st = $('#save-state');
  const txt = $('#save-text');
  if (!st || !txt) return;
  st.classList.remove('is-dirty', 'is-saving', 'is-error');
  if (storage.lastError) { st.classList.add('is-error'); txt.textContent = 'Speicherfehler'; st.title = String(storage.lastError.message || storage.lastError); }
  else if (store.ui.saving) { st.classList.add('is-saving'); txt.textContent = 'Speichert…'; st.title = ''; }
  else if (store.ui.dirty || storage.isDirty) { st.classList.add('is-dirty'); txt.textContent = 'Änderung offen…'; st.title = 'Wird automatisch gespeichert'; }
  else if (storage.lastSaved) { txt.textContent = 'Gespeichert ' + relativeTime(storage.lastSaved); st.title = 'Automatisch gespeichert · ' + storage.label(); }
  else { txt.textContent = 'Bereit'; st.title = ''; }
  const chip = $('#storage-chip');
  if (chip) { chip.textContent = storage.label(); chip.title = 'Speicherort ändern (klicken)'; }
}

/* ───────── Autospeichern anbinden ───────── */

let storageBound = false;
function bindStorage() {
  if (storageBound) return;
  storageBound = true;
  storage.onChange((state) => {
    store.ui.dirty = storage.isDirty;
    store.ui.saving = !!(state && state.saving) || (storage._saving && storage.isDirty);
    updateSaveState();
    window.dispatchEvent(new CustomEvent('tplan:filestate'));
  });
  store.on((reason) => {
    if (reason === 'change') {
      storage.touch();
      store.ui.dirty = true;
      updateSaveState();
    }
    if (reason === 'load') { updateSaveState(); }
    if (reason === 'select' || reason === 'open-detail') {
      const host = $('#detail');
      if (reason === 'open-detail' || !host.contains(document.activeElement)) renderDetail(host);
      if (reason === 'select') requestRender();
      return;
    }
    requestRender();
  });
  window.addEventListener('resize', debounce(() => { if (store.project && store.ui.view === 'gantt' && store.ui.fitDayW) requestRender(); }, 180));
  window.addEventListener('tplan:filestate', () => { renderStatus(); updateSaveState(); });
}

/* ───────── Projekt öffnen / anlegen ───────── */

function showApp(show) {
  $('#welcome').hidden = show;
  $('#app').hidden = !show;
}

function activateProject(project, { fileName = null } = {}) {
  store.load(project);
  if (fileName) storage.fileName = fileName;
  storage.start(() => store.serialize());
  bindStorage();
  storage.markClean();
  if (storage.fileName && !storage.lastSaved) storage.lastSaved = Date.now();
  showApp(true);
  store.ui.dirty = false;
  requestRender();
  renderStatus();
  updateSaveState();
}

async function openProjectText(text, { fileName = null, sourceLabel = '' } = {}) {
  let raw;
  try { raw = JSON.parse(text); }
  catch (e) { toast('Datei ist keine gültige Projektdatei', 'err', 'JSON-Fehler: ' + e.message); return false; }
  const check = validateProject(raw);
  if (!check.ok) {
    const go = await confirmDialog('Datei prüfen', check.errors.join('\n') + '\n\nTrotzdem versuchen zu laden?', 'Trotzdem laden');
    if (!go) return false;
  }
  const proj = migrateProject(raw);
  if (!proj.tasks.length && !(raw.tasks || []).length) toast('Hinweis', 'warn', 'Das Projekt enthält noch keine Aufgaben.');
  activateProject(proj, { fileName });
  toast('Projekt geöffnet', 'ok', `${proj.meta.name}${sourceLabel ? ' · ' + sourceLabel : ''}`);
  return true;
}

async function ensureStorage(projectName) {
  if (storage.supported.folder) {
    try {
      await storage.chooseFolder();
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') {
        const ok = await storage.useBrowserStorage().catch(() => false);
        if (ok) { toast('Kein Ordner gewählt', 'warn', 'Der Plan wird vorläufig im Browser gespeichert. Über den Hinweis oben rechts kannst du jederzeit einen Ordner wählen.'); return true; }
      } else {
        toast('Ordner konnte nicht geöffnet werden', 'err', e.message || String(e));
      }
    }
  }
  const ok = await storage.useBrowserStorage().catch(() => false);
  if (!ok) { storage.useLocalStorage(); toast('Eingeschränkter Speicher', 'warn', 'Dieser Browser kann keine Dateien schreiben. Nutze ⤓ zum Herunterladen.'); }
  return true;
}

async function newProject() {
  const name = await promptDialog('Neues Projekt', 'Wie soll das Projekt heißen? (wird auch der Dateiname)', 'Mein Projekt');
  if (!name) return;
  const ok = await ensureStorage(name);
  if (!ok) return;
  const project = emptyProject(name);
  store.load(project);
  try {
    const file = await storage.attachFile(name, store.serialize());
    storage.start(() => store.serialize());
    bindStorage();
    showApp(true);
    store.ui.dirty = false;
    requestRender();
    toast('Projekt angelegt', 'ok', `${file} · ${storage.label()}`);
  } catch (e) {
    toast('Datei konnte nicht angelegt werden', 'err', e.message || String(e));
    showApp(true);
    bindStorage();
    requestRender();
  }
}

async function openFromStorage(fileName) {
  try {
    const text = await storage.readProject(fileName);
    if (!text) { toast('Datei leer oder nicht lesbar', 'err', fileName); return; }
    await openProjectText(text, { fileName });
  } catch (e) {
    toast('Öffnen fehlgeschlagen', 'err', e.message || String(e));
  }
}

async function importFile() {
  const f = await pickFile();
  if (!f) return;
  try {
    const text = await readFileText(f);
    const guessedName = fileNameFor(f.name.replace(/\.tplan\.json$|\.json$/i, ''));
    if (!storage.isReady) {
      // Noch kein Speicherort: im Browser-Speicher ablegen
      const ok = await storage.useBrowserStorage().catch(() => false);
      if (!ok) storage.useLocalStorage();
    }
    if (storage.backend && !storage.fileName) storage.fileName = guessedName;
    await openProjectText(text, { fileName: storage.fileName || guessedName, sourceLabel: f.name });
  } catch (e) {
    toast('Import fehlgeschlagen', 'err', e.message || String(e));
  }
}

async function openDemo() {
  const ok = await storage.useBrowserStorage().catch(() => false);
  if (!ok) storage.useLocalStorage();
  const project = sampleProject();
  activateProject(project);
  try { await storage.attachFile(project.meta.name, store.serialize()); } catch { /* egal */ }
  toast('Beispielprojekt geladen', 'ok', 'Zum Ausprobieren – einfach ändern und beobachten.');
  setTimeout(ganttScrollToToday, 60);
}

/* ───────── Werkzeugleiste / Aktionen ───────── */

function setView(v) {
  if (!VIEWS.includes(v)) return;
  store.ui.view = v;
  store.project.settings.defaultView = v;
  requestRender();
}

async function saveNow() {
  if (!storage.isReady) { await exportDownload(); return; }
  await storage.flush();
  toast('Gespeichert', 'ok', storage.label());
  updateSaveState();
}

async function exportDownload() {
  const name = fileNameFor(store.project.meta.name);
  downloadText(store.serialize(), name);
  toast('Datei heruntergeladen', 'ok', name);
}

const actions = {
  'add-task': () => store.addTask(),
  'add-milestone': () => store.addMilestone(),
  'add-group': () => store.addGroup(),
  'undo': () => { const l = store.undo(); if (l) toast('Rückgängig: ' + l, 'ok', '', 1800); },
  'redo': () => { const l = store.redo(); if (l) toast('Wiederholt: ' + l, 'ok', '', 1800); },
  'new': () => newProject(),
  'open': () => openProjectDialog((name, backup) => {
    if (backup && backup.text) openProjectText(backup.text, { fileName: storage.fileName, sourceLabel: 'Sicherung' });
    else if (name) openFromStorage(name);
  }),
  'save-now': () => saveNow(),
  'export': () => exportDownload(),
  'help': () => helpDialog(),
  'theme': () => toggleTheme(),
  'resources': () => resourcesDialog(),
  'project-settings': () => projectSettingsDialog(),
  'fit': () => { store.ui.fitDayW = null; fitGantt(); },
  'clear-filter': () => { store.ui.filter = { text: '', assignee: '', status: '' }; $('#filter-text').value = ''; $('#filter-assignee').value = ''; $('#filter-status').value = ''; store.emit('change'); },
  'backups': () => backupsDialog((text, backupName) => openProjectText(text, { fileName: storage.fileName, sourceLabel: backupName })),
  'scroll-today': () => ganttScrollToToday(),
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) {
    const fn = actions[btn.dataset.action];
    if (fn) { e.preventDefault(); fn(); return; }
  }
  const vb = e.target.closest('.railbtn[data-view]');
  if (vb) setView(vb.dataset.view);
});

/* ───────── Tastenkürzel ───────── */

function inField() {
  const a = document.activeElement;
  return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
}

document.addEventListener('keydown', (e) => {
  if (!store.project) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? actions.redo() : actions.undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); actions.redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveNow(); return; }
  if (mod && e.key.toLowerCase() === 'n') { e.preventDefault(); newProject(); return; }
  if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); actions.open(); return; }
  if (mod && e.key.toLowerCase() === 'f') { e.preventDefault(); $('#filter-text').focus(); return; }
  if (e.key === 'F1') { e.preventDefault(); helpDialog(); return; }
  if (e.key === 'Escape') { if (document.getElementById('modal-host').hidden) store.select(null); return; }
  if (inField()) return;
  if (e.key === 'Insert') { e.preventDefault(); store.addTask(); return; }
  if (e.key === 'Delete') { e.preventDefault(); if (store.selectedId) store.deleteTask(store.selectedId); return; }
  if (e.key === 'F2') { e.preventDefault(); const t = store.selected; if (t) promptDialog('Umbenennen', 'Neue Bezeichnung', t.name).then((v) => v && store.updateTask(t.id, { name: v }, 'Aufgabe umbenennen')); return; }
  if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); if (store.selectedId) store.indent(store.selectedId); return; }
  if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); if (store.selectedId) store.outdent(store.selectedId); return; }
  if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); if (store.selectedId) store.moveRow(store.selectedId, -1); return; }
  if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); if (store.selectedId) store.moveRow(store.selectedId, 1); return; }
  if (['1', '2', '3', '4'].includes(e.key)) { setView(VIEWS[Number(e.key) - 1]); return; }
  if (e.key === ' ') { e.preventDefault(); ganttScrollToToday(); return; }
});

/* ───────── Filter & Steuerelemente ───────── */

function wireControls() {
  const ftext = $('#filter-text');
  ftext.addEventListener('input', debounce(() => { store.ui.filter.text = ftext.value; store.emit('change'); }, 200));
  $('#filter-assignee').addEventListener('change', (e) => { store.ui.filter.assignee = e.target.value; store.emit('change'); });
  $('#filter-status').addEventListener('change', (e) => { store.ui.filter.status = e.target.value; store.emit('change'); });

  $('#auto-plan').addEventListener('change', (e) => {
    store.ui.autoPlan = e.target.checked;
    store.reschedule();
    store.emit('change');
    toast(e.target.checked ? 'Auto-Planung an' : 'Auto-Planung aus', 'ok',
      e.target.checked ? 'Nachfolger werden automatisch mitverschoben.' : 'Termine bleiben stehen, Konflikte werden nur gemeldet.', 2600);
  });
  $('#show-critical').addEventListener('change', (e) => { store.ui.showCritical = e.target.checked; store.reschedule(); store.emit('change'); });
  $('#show-deps').addEventListener('change', (e) => { store.ui.showDeps = e.target.checked; store.emit('change'); });

  document.querySelectorAll('#zoom-group button').forEach((b) => b.addEventListener('click', () => {
    store.ui.zoom = b.dataset.zoom; store.ui.fitDayW = null; store.emit('change');
  }));

  $('#project-title').addEventListener('change', async (e) => {
    const name = e.target.value.trim() || 'Projekt';
    e.target.value = name;
    const old = store.project.meta.name;
    store.setProjectMeta({ name });
    if (name !== old && storage.isReady) {
      try {
        const f = await storage.renameFile(name, store.serialize());
        toast('Datei umbenannt', 'ok', f);
      } catch (err) { toast('Umbenennen fehlgeschlagen', 'err', err.message || String(err)); }
    }
  });

  $('#storage-chip').addEventListener('click', async () => {
    modal({
      title: 'Speicherort',
      className: 'small',
      body: (box) => {
        box.appendChild(el('p', { class: 'hint', text: 'Aktuell: ' + storage.label() }));
        const btn = (label, sub, fn, disabled) => {
          const b = el('button', { class: 'btn btn-lg', style: { width: '100%', marginBottom: '8px' }, disabled, onclick: fn },
            el('span', { text: label }), el('small', { text: sub }));
          box.appendChild(b);
        };
        btn('📁 Ordner auf der Festplatte wählen', 'Empfohlen – die Projektdatei liegt als echte Datei in diesem Ordner', async () => {
          try {
            await storage.chooseFolder();
            const f = await storage.attachFile(store.project.meta.name, store.serialize());
            closeModal(); toast('Ordner gewechselt', 'ok', `${f} · ${storage.label()}`);
            window.dispatchEvent(new CustomEvent('tplan:filestate'));
          } catch (err) { if (err && err.name !== 'AbortError') toast('Fehlgeschlagen', 'err', err.message || String(err)); }
        }, !storage.supported.folder);
        btn('🗄️ Im Browser speichern', 'Ohne Dialog, Datei bleibt im Browser-Speicher dieses Rechners', async () => {
          await storage.useBrowserStorage();
          try { await storage.attachFile(store.project.meta.name, store.serialize()); } catch { /* egal */ }
          closeModal(); toast('Browser-Speicher aktiv', 'ok', storage.label());
          window.dispatchEvent(new CustomEvent('tplan:filestate'));
        });
        btn('⤓ Nur herunterladen', 'Kein Autospeichern – Datei manuell sichern', async () => { closeModal(); await exportDownload(); });
        btn('🛟 Sicherungen ansehen', 'Automatische Kopien wiederherstellen', () => { closeModal(); actions.backups(); });
        if (!storage.supported.folder) box.appendChild(el('p', { class: 'hint', text: 'Hinweis: Ordner-Zugriff gibt es nur in Chrome, Edge und Opera. In anderen Browsern wird im Browser gespeichert.' }));
      },
    });
  });
}

/* ───────── Datei per Drag & Drop ───────── */

function wireDropZone() {
  const hint = $('#drop-hint');
  let depth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); depth++; if (e.dataTransfer.types.includes('Files')) hint.hidden = false; });
  window.addEventListener('dragover', (e) => { e.preventDefault(); });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) hint.hidden = true; });
  window.addEventListener('drop', async (e) => {
    e.preventDefault(); depth = 0; hint.hidden = true;
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    try {
      const text = await readFileText(f);
      if (!storage.isReady) { const ok = await storage.useBrowserStorage().catch(() => false); if (!ok) storage.useLocalStorage(); }
      if (storage.backend && !storage.fileName) storage.fileName = fileNameFor(f.name.replace(/\.tplan\.json$|\.json$/i, ''));
      await openProjectText(text, { fileName: storage.fileName, sourceLabel: f.name });
    } catch (err) { toast('Datei konnte nicht gelesen werden', 'err', err.message || String(err)); }
  });
}

/* ───────── Startbildschirm ───────── */

function wireWelcome() {
  $('#w-start').onclick = () => newProject();
  $('#w-open').onclick = async () => {
    if (!storage.isReady) {
      let ok = false;
      try { ok = await storage.restoreFolder({ needPermission: false }); } catch { ok = false; }
      if (ok === true && !storage.dirHandle) ok = false;
      if (!storage.dirHandle) {
        if (storage.supported.folder) {
          const ch = await storage.chooseFolder().catch(async (e) => {
            if (e && e.name === 'AbortError') {
              // Abgebrochen: im Browser-Speicher nachsehen
              await storage.useBrowserStorage().catch(() => false);
              return 'browser';
            }
            toast('Ordner nicht geöffnet', 'err', e.message || String(e));
            return null;
          });
          if (!ch) return;
        } else {
          const b = await storage.useBrowserStorage().catch(() => false);
          if (!b) { toast('Kein Speicherort verfügbar', 'err', 'Dieser Browser kann keine Dateien verwalten.'); return; }
        }
      }
    }
    openProjectDialog((name, backup) => {
      if (backup && backup.text) openProjectText(backup.text, { fileName: storage.fileName, sourceLabel: 'Sicherung' });
      else if (name) openFromStorage(name);
    });
  };
  $('#w-import').onclick = () => importFile();
  $('#w-demo').onclick = () => openDemo();
  document.querySelectorAll('.linkbtn[data-action="help"]').forEach((b) => { b.onclick = () => helpDialog(); });
}

async function initWelcome() {
  const note = $('#capability-note');
  if (storage.supported.folder) note.textContent = 'Ordner-Speicherung verfügbar.';
  else if (storage.supported.opfs) note.textContent = 'Dieser Browser speichert im Browser-Speicher (Ordner nur mit Chrome/Edge).';
  else note.textContent = 'Eingeschränkter Browser – bitte Dateien manuell herunterladen.';

  // Gemerkten Ordner wiederherstellen
  let restored = false;
  try { restored = await storage.restoreFolder({ needPermission: false }); } catch { restored = false; }
  if (restored !== true) restored = false;

  const recent = storage.recent().filter((r) => r.backend === 'folder' || r.backend === 'browser');
  const last = recent[0];
  const resumeBox = $('#resume-box');
  if (last && last.backend === 'browser' && storage.supported.opfs) {
    // Projekt liegt im Browser-Speicher: kein Dialog nötig
    $('#resume-title').textContent = `Weiter mit „${String(last.name).replace(/\.tplan\.json$/, '')}“`;
    $('#resume-path').textContent = 'Browser-Speicher · zuletzt ' + (last.at ? formatDateTime(last.at) : '');
    resumeBox.hidden = false;
    $('#resume-btn').textContent = 'Fortsetzen';
    $('#resume-btn').onclick = async () => {
      await storage.useBrowserStorage();
      await openFromStorage(last.name);
    };
  } else if (restored && last) {
    $('#resume-title').textContent = `Weiter mit „${String(last.name).replace(/\.tplan\.json$/, '')}“`;
    $('#resume-path').textContent = storage.label();
    resumeBox.hidden = false;
    $('#resume-btn').textContent = 'Fortsetzen';
    $('#resume-btn').onclick = async () => { await openFromStorage(last.name); };
  } else if (restored) {
    $('#resume-title').textContent = 'Ordner ist noch verbunden';
    $('#resume-path').textContent = storage.label();
    resumeBox.hidden = false;
    $('#resume-btn').textContent = 'Projektliste zeigen';
    $('#resume-btn').onclick = () => actions.open();
  } else if (last && storage.supported.folder) {
    // Zugriff muss erneut bestätigt werden
    resumeBox.hidden = false;
    $('#resume-title').textContent = `Weiter mit „${String(last.name).replace(/\.tplan\.json$/, '')}“`;
    $('#resume-path').textContent = 'Ordner-Zugriff bestätigen (' + (last.dirLabel || 'Ordner') + ')';
    $('#resume-btn').textContent = 'Zugriff erlauben';
    $('#resume-btn').onclick = async () => {
      try {
        const ok = await storage.restoreFolder({ needPermission: true });
        if (ok !== true || !storage.dirHandle) { toast('Zugriff nicht erteilt', 'warn', 'Bitte den Ordner über „Vorhandene Projektdatei öffnen“ neu wählen.'); return; }
        await openFromStorage(last.name);
      } catch (e) { toast('Ordner konnte nicht verbunden werden', 'err', e.message || String(e)); }
    };
  }

  // Warnung nach unerwartetem Ende
  const pending = storage.pendingDirty();
  if (pending && recent.length) {
    setTimeout(() => recoveryDialog({ file: pending.file, at: pending.at }, {
      onRestoreBackup: () => actions.backups(),
      onOpenFile: (file) => {
        if (storage.dirHandle) { storage.fileName = file; openFromStorage(file); }
        else toast('Bitte zuerst den Ordner wählen', 'warn');
      },
    }), 400);
  }
}

/* ───────── Start ───────── */

function boot() {
  initTheme();
  wireControls();
  wireDropZone();
  wireWelcome();
  initWelcome();
  store._render = requestRender;
  showApp(false);
  // Für Fortgeschrittene / Fehlersuche in der Browser-Konsole
  window.tplan = { store, storage, render: requestRender };
}

boot();
