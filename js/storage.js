/* ══════════════════════════════════════════════════════════════
   storage.js – Speichern ohne Nachdenken.

   Drei Speicherarten, automatisch gewählt:
     1. "Ordner"  – File System Access API: du wählst einmal einen
                    Ordner, die Projektdatei liegt dort als echte
                    Datei und wird bei jeder Änderung aktualisiert.
     2. "Browser" – Origin Private File System (OPFS): automatisch,
                    ohne Dialog, Datei liegt im Browser-Speicher.
     3. "Notfall" – localStorage + Download/Import als Rückfall.

   Eigenschaften:
     · Autospeichern ~0,7 s nach der letzten Änderung
     · zusätzlich beim Tab-Wechsel, beim Schließen und alle 30 s
     · Sicherungskopien (Backups/) mit Rotation
     · "nicht gespeichert"-Marke überlebt einen Absturz und wird
       beim nächsten Start gemeldet
   ══════════════════════════════════════════════════════════════ */

import { FILE_EXT } from './model.js';

const IDB_NAME = 'terminplanung';
const IDB_STORE = 'handles';
const LS_DIRTY = 'tplan.dirty';
const LS_RECENT = 'tplan.recent';
const LS_LOCAL = 'tplan.local.';
const DEBOUNCE_MS = 700;
const AUTOSAVE_MS = 30000;
const BACKUP_MIN_MS = 5 * 60 * 1000;
const MAX_BACKUPS = 12;

/* ───────── kleine IndexedDB-Hilfe (nur für den Ordner-Zugriff) ───────── */

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); res(); };
    tx.onerror = () => { db.close(); rej(tx.error); };
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const r = tx.objectStore(IDB_STORE).get(key);
    r.onsuccess = () => { db.close(); res(r.result); };
    r.onerror = () => { db.close(); rej(r.error); };
  });
}
async function idbDel(key) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => { db.close(); res(); };
  });
}

/* ───────── Dateinamen ───────── */

export function slugify(name) {
  const s = String(name || 'projekt')
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 _.-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
  return s || 'projekt';
}
export function fileNameFor(projectName) {
  const s = slugify(projectName);
  return s.endsWith('.tplan.json') ? s : s + FILE_EXT;
}

function ts() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* ══════════════════════════════════════════════════════════════
   Speicher-Objekt
   ══════════════════════════════════════════════════════════════ */

export const storage = {
  backend: null,        // 'folder' | 'browser' | 'local'
  dirHandle: null,
  dirLabel: '',
  fileName: '',
  lastSaved: 0,
  lastError: null,
  supported: {
    folder: typeof window !== 'undefined' && 'showDirectoryPicker' in window && window.isSecureContext,
    opfs: typeof navigator !== 'undefined' && !!(navigator.storage && navigator.storage.getDirectory),
  },

  _listeners: new Set(),
  _timer: null,
  _interval: null,
  _dirty: false,
  _getText: null,
  _lastBackup: 0,
  _saving: null,

  onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  _emit(state) { for (const fn of this._listeners) { try { fn(state); } catch (e) { console.error(e); } } },

  get isDirty() { return this._dirty; },
  get isReady() { return !!(this.backend && (this.dirHandle || this.backend === 'local') && this.fileName); },

  label() {
    if (this.backend === 'folder') return `Ordner: ${this.dirLabel || 'gewählt'} / ${this.fileName}`;
    if (this.backend === 'browser') return `Browser-Speicher / ${this.fileName}`;
    if (this.backend === 'local') return `Notfallspeicher im Browser / ${this.fileName}`;
    return 'kein Speicherort';
  },

  /* ── Ordner wählen ── */
  async chooseFolder() {
    if (!this.supported.folder) throw new Error('Dieser Browser kann keine Ordner freigeben (nur Chrome, Edge, Opera).');
    const handle = await window.showDirectoryPicker({ id: 'terminplanung', mode: 'readwrite', startIn: 'documents' });
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') throw new Error('Zugriff auf den Ordner wurde nicht erlaubt.');
    await this._useFolderHandle(handle);
    return handle;
  },

  async _useFolderHandle(handle) {
    this.dirHandle = handle;
    this.backend = 'folder';
    this.dirLabel = handle.name || 'Ordner';
    try { await idbSet('dir', handle); } catch (e) { console.warn('Ordner-Zugriff konnte nicht gemerkt werden', e); }
    this._emit();
  },

  /* ── gemerkten Ordner beim Start wiederherstellen ── */
  async restoreFolder({ needPermission = true } = {}) {
    if (!this.supported.folder) return false;
    let handle = null;
    try { handle = await idbGet('dir'); } catch { /* ignore */ }
    if (!handle) return false;
    const opts = { mode: 'readwrite' };
    let state = 'granted';
    try { state = await handle.queryPermission(opts); } catch { return false; }
    if (state !== 'granted') {
      if (needPermission) return { needsPermission: true, handle };
      try { state = await handle.requestPermission(opts); } catch { state = 'denied'; }
      if (state !== 'granted') return false;
    }
    this.dirHandle = handle;
    this.backend = 'folder';
    this.dirLabel = handle.name || 'Ordner';
    this._emit();
    return true;
  },

  async reRequestFolder(handle) {
    const h = handle || this.dirHandle;
    if (!h) return false;
    const state = await h.requestPermission({ mode: 'readwrite' });
    if (state !== 'granted') return false;
    this.dirHandle = h; this.backend = 'folder'; this.dirLabel = h.name || 'Ordner';
    this._emit();
    return true;
  },

  /* ── Browser-Speicher (OPFS) ── */
  async useBrowserStorage() {
    if (!this.supported.opfs) { this.backend = 'local'; this._emit(); return false; }
    const root = await navigator.storage.getDirectory();
    this.dirHandle = root;
    this.backend = 'browser';
    this.dirLabel = 'Browser-Speicher';
    this._emit();
    return true;
  },

  useLocalStorage() {
    this.backend = 'local';
    this.dirHandle = null;
    this.dirLabel = 'Notfallspeicher';
    this._emit();
    return true;
  },

  /* ── Datei-Zugriff ── */
  async _fileHandle(name, create) {
    if (this.backend === 'local') return null;
    return this.dirHandle.getFileHandle(name, { create: !!create });
  },

  async _writeFile(name, text) {
    const fh = await this._fileHandle(name, true);
    if (!fh) return;
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
  },

  async _readFile(name) {
    const fh = await this._fileHandle(name, false);
    if (!fh) return null;
    const f = await fh.getFile();
    return f.text();
  },

  async _removeFile(name) {
    if (this.backend === 'local' || !this.dirHandle) return;
    try { await this.dirHandle.removeEntry(name); } catch { /* egal */ }
  },

  /* ── Projektliste im aktuellen Speicherort ── */
  async listProjects() {
    const out = [];
    if (this.backend === 'local' || !this.dirHandle) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LS_LOCAL)) out.push({ name: k.slice(LS_LOCAL.length), size: (localStorage.getItem(k) || '').length, lastModified: 0 });
      }
      return out;
    }
    for await (const entry of this.dirHandle.values()) {
      if (entry.kind !== 'file') continue;
      if (!/\.(tplan\.json|json)$/i.test(entry.name)) continue;
      let size = 0, lastModified = 0;
      try { const f = await entry.getFile(); size = f.size; lastModified = f.lastModified; } catch { /* ignore */ }
      out.push({ name: entry.name, size, lastModified });
    }
    out.sort((a, b) => b.lastModified - a.lastModified || a.name.localeCompare(b.name));
    return out;
  },

  async readProject(name) {
    if (this.backend === 'local') return localStorage.getItem(LS_LOCAL + name);
    return this._readFile(name);
  },

  /** Neues Projekt: Dateiname festlegen und sofort anlegen. */
  async attachFile(projectName, text) {
    this.fileName = fileNameFor(projectName);
    this._remember({ name: this.fileName, backend: this.backend, dirLabel: this.dirLabel, at: Date.now() });
    await this.writeNow(text, { backup: false });
    return this.fileName;
  },

  async renameFile(newProjectName, text) {
    const old = this.fileName;
    const next = fileNameFor(newProjectName);
    if (old === next) { await this.writeNow(text, { backup: false }); return next; }
    this.fileName = next;
    await this.writeNow(text, { backup: true });
    if (old) await this._removeFile(old);
    this._remember({ name: next, backend: this.backend, dirLabel: this.dirLabel, at: Date.now() });
    return next;
  },

  /* ── Schreiben ── */
  async writeNow(text, { backup = true } = {}) {
    if (!this.backend || !this.fileName) throw new Error('Kein Speicherort festgelegt.');
    const doWrite = async () => {
      if (this.backend === 'local') {
        try { localStorage.setItem(LS_LOCAL + this.fileName, text); }
        catch (e) {
          if (String(e.name).includes('Quota')) {
            // Notfall: nur die letzten Daten behalten
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(LS_LOCAL) && k !== LS_LOCAL + this.fileName) localStorage.removeItem(k);
            }
            localStorage.setItem(LS_LOCAL + this.fileName, text);
          } else throw e;
        }
      } else {
        if (backup) await this._maybeBackup(text);
        await this._writeFile(this.fileName, text);
      }
      this.lastSaved = Date.now();
      this.lastError = null;
      localStorage.removeItem(LS_DIRTY);
      this._dirty = false;
      this._emit();
    };
    // Schreibvorgänge nacheinander abarbeiten, nie parallel
    this._saving = (this._saving || Promise.resolve()).then(doWrite, doWrite);
    return this._saving;
  },

  async _maybeBackup(text) {
    const now = Date.now();
    if (now - this._lastBackup < BACKUP_MIN_MS) return;
    this._lastBackup = now;
    try {
      await this._writeFile(`Backups/${this.fileName.replace(FILE_EXT, '')}-${ts()}${FILE_EXT}`, text);
      await this._rotateBackups();
    } catch (e) { console.warn('Sicherungskopie fehlgeschlagen', e); }
  },

  async _rotateBackups() {
    try {
      const dir = await this.dirHandle.getDirectoryHandle('Backups', { create: true });
      const names = [];
      for await (const e of dir.values()) if (e.kind === 'file') names.push(e.name);
      names.sort();
      while (names.length > MAX_BACKUPS) {
        const old = names.shift();
        try { await dir.removeEntry(old); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  },

  async listBackups() {
    if (this.backend !== 'folder' && this.backend !== 'browser') return [];
    try {
      const dir = await this.dirHandle.getDirectoryHandle('Backups', { create: true });
      const out = [];
      for await (const e of dir.values()) {
        if (e.kind === 'file' && e.name.startsWith(slugify(this.fileName.replace(FILE_EXT, '')))) {
          const f = await e.getFile();
          out.push({ name: e.name, size: f.size, lastModified: f.lastModified });
        }
      }
      out.sort((a, b) => b.name.localeCompare(a.name));
      return out;
    } catch { return []; }
  },

  async readBackup(name) {
    const dir = await this.dirHandle.getDirectoryHandle('Backups', { create: false });
    const fh = await dir.getFileHandle(name, { create: false });
    return (await fh.getFile()).text();
  },

  /* ── Autospeichern ── */
  start(getText) {
    this.stop();
    this._getText = getText;
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => { if (this._dirty) this.flush(); }, AUTOSAVE_MS);
    window.addEventListener('beforeunload', this._onBeforeUnload);
    window.addEventListener('pagehide', this._onHide);
    document.addEventListener('visibilitychange', this._onVisibility);
  },
  stop() {
    if (this._timer) clearTimeout(this._timer);
    if (this._interval) clearInterval(this._interval);
    this._timer = null; this._interval = null;
    window.removeEventListener('beforeunload', this._onBeforeUnload);
    window.removeEventListener('pagehide', this._onHide);
    document.removeEventListener('visibilitychange', this._onVisibility);
  },

  _onVisibility: () => { if (document.visibilityState === 'hidden') storage.flush(); },
  _onHide: () => { storage.flush(); },
  _onBeforeUnload: (e) => {
    if (storage._dirty) {
      storage.flush();
      if (storage.lastError || (storage.backend === 'local' && storage._dirty)) {
        e.preventDefault();
        e.returnValue = 'Die letzte Änderung wird noch gespeichert.';
        return e.returnValue;
      }
    }
    return undefined;
  },

  /** Änderung melden – speichert verzögert. */
  touch() {
    this._dirty = true;
    try {
      localStorage.setItem(LS_DIRTY, JSON.stringify({ file: this.fileName, at: Date.now(), backend: this.backend }));
    } catch { /* ignore */ }
    this._emit();
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), DEBOUNCE_MS);
  },

  /** Sofort speichern. */
  async flush() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (!this._getText || !this.fileName) return;
    if (this.backend === 'local' && !this._dirty) return;
    this._emit({ saving: true });
    try {
      await this.writeNow(this._getText());
    } catch (e) {
      this.lastError = e;
      this._emit();
      console.error('Speichern fehlgeschlagen', e);
    }
  },

  /* ── Letzte Projekte merken ── */
  _remember(entry) {
    try {
      const list = this.recent().filter((r) => !(r.name === entry.name && r.dirLabel === entry.dirLabel));
      list.unshift(entry);
      localStorage.setItem(LS_RECENT, JSON.stringify(list.slice(0, 8)));
    } catch { /* ignore */ }
  },
  recent() {
    try { return JSON.parse(localStorage.getItem(LS_RECENT) || '[]'); } catch { return []; }
  },

  /* ── Absturzwarnung ── */
  pendingDirty() {
    try {
      const raw = localStorage.getItem(LS_DIRTY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o && o.file ? o : null;
    } catch { return null; }
  },
  clearDirtyFlag() { localStorage.removeItem(LS_DIRTY); },

  /** Zustand als "gespeichert" markieren (z. B. direkt nach dem Öffnen). */
  markClean() { this._dirty = false; this.clearDirtyFlag(); this._emit(); },

  async forgetFolder() { this.dirHandle = null; this.backend = null; try { await idbDel('dir'); } catch { /* ignore */ } this._emit(); },
};

/* ───────── Download / Import ───────── */

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}

export function pickFile() {
  return new Promise((resolve) => {
    const input = document.getElementById('file-input');
    const onChange = () => {
      const f = input.files && input.files[0];
      input.value = '';
      input.removeEventListener('change', onChange);
      resolve(f || null);
    };
    input.addEventListener('change', onChange);
    input.click();
  });
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
