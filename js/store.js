/* ══════════════════════════════════════════════════════════════
   store.js – Zustand, Änderungen, Rückgängig/Wiederholen.
   Jede Änderung läuft über mutate(); dabei wird ein Schnappschuss
   für "Rückgängig" angelegt, die Termine werden neu berechnet und
   die Oberfläche bekommt ein Signal.
   ══════════════════════════════════════════════════════════════ */

import {
  newTask, newResource, sortTasks, renumberWbs, taskById, descendantsOf,
  prevSibling, childrenOf, isSummary, uid, STATUS, serializeProject,
} from './model.js';
import { loadGlobalPool, saveGlobalPool, newPoolEntry, POOL_COLOR, poolDurationWorkdays } from './pool.js';
import { schedule } from './scheduler.js';
import { addWorkdays, addDays, addMonths, todayIso, startOfWeek, snapToWorkday, endFromDuration } from './dateutil.js';

const MAX_UNDO = 120;

function cloneProject(p) {
  return typeof structuredClone === 'function' ? structuredClone(p) : JSON.parse(JSON.stringify(p));
}

export const store = {
  project: null,
  violations: [],
  critical: new Set(),
  slack: new Map(),
  undoStack: [],
  redoStack: [],
  selectedId: null,
  selectedIds: new Set(),
  clipboard: null,      // kopierte Aufgaben (projektintern)
  ui: {
    view: 'gantt',
    zoom: 'week',
    autoPlan: true,
    showCritical: false,
    showDeps: true,
    filter: { text: '', assignee: '', status: '' },
    calendarMonth: todayIso(),
    dirty: false,
    fileLabel: '',
    lastSaved: 0,
    saving: false,
    error: null,
    rowH: 30,          // Zeilenhöhe in Pixel (wird aus den Projekt-Einstellungen gesetzt)
    armedPool: null,   // Sammelbecken-Eintrag, der auf einen Klick zum Ablegen wartet
  },
  _listeners: new Set(),
  _render: null,

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  emit(reason = 'change', ...args) {
    for (const fn of this._listeners) { try { fn(reason, ...args); } catch (e) { console.error(e); } }
  },
  /** Vollständiges Neuzeichnen anfordern (nach Ansichtswechsel o. Ä.) */
  render() { if (this._render) this._render(); },

  /* ───────── Projekt laden ───────── */
  load(project, { resetUndo = true } = {}) {
    this.project = project;
    if (resetUndo) { this.undoStack = []; this.redoStack = []; }
    this.selectedId = null;
    this.selectedIds = new Set();
    this.ui.autoPlan = project.settings.autoPlan !== false;
    this.ui.showCritical = !!project.settings.showCritical;
    this.ui.showDeps = project.settings.showDeps !== false;
    this.ui.zoom = project.settings.zoom || 'week';
    this.ui.view = project.settings.defaultView || 'gantt';
    this.ui.rowH = Math.max(22, Math.min(60, Number(project.settings.rowHeight) || 30));
    this.ui.armedPool = null;
    this.reschedule();
    this.emit('load');
  },

  /* ───────── Terminberechnung ───────── */
  reschedule() {
    const res = schedule(this.project, { apply: this.ui.autoPlan });
    this.violations = res.violations;
    this.critical = res.critical;
    this.slack = res.slack;
    this.project.settings.autoPlan = this.ui.autoPlan;
    this.project.settings.showCritical = this.ui.showCritical;
    this.project.settings.showDeps = this.ui.showDeps;
    this.project.settings.zoom = this.ui.zoom;
    return res;
  },

  /* ───────── Änderung mit Rückgängig-Punkt ───────── */
  mutate(label, fn, { silent = false, noSchedule = false } = {}) {
    if (!this.project) return;
    const before = cloneProject(this.project);
    let result;
    try {
      result = fn(this.project);
    } catch (e) {
      console.error('Änderung fehlgeschlagen', e);
      this.project = before;
      throw e;
    }
    if (result === false) { this.project = before; return; } // abgebrochen
    this.undoStack.push({ label, snapshot: before, selectedId: this.selectedId, selectedIds: new Set(this.selectedIds) });
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack = [];
    sortTasks(this.project);
    renumberWbs(this.project);
    this.pruneSelection();
    if (!noSchedule) this.reschedule();
    if (!silent) this.emit('change');
    return result;
  },

  /** Auswahl auf noch vorhandene Aufgaben begrenzen. */
  pruneSelection() {
    const ids = new Set(this.project.tasks.map((t) => t.id));
    const next = new Set([...this.selectedIds].filter((id) => ids.has(id)));
    if (next.size !== this.selectedIds.size) this.selectedIds = next;
    if (this.selectedId && !ids.has(this.selectedId)) {
      this.selectedId = this.selectedInOrder().slice(-1)[0] ? this.selectedInOrder().slice(-1)[0].id : null;
    }
    return this.selectedIds;
  },

  undo() {
    if (!this.undoStack.length) return false;
    const entry = this.undoStack.pop();
    this.redoStack.push({ label: entry.label, snapshot: cloneProject(this.project), selectedId: this.selectedId, selectedIds: new Set(this.selectedIds) });
    this.project = entry.snapshot;
    this.selectedId = taskById(this.project, entry.selectedId) ? entry.selectedId : null;
    this.selectedIds = new Set([...(entry.selectedIds || [])].filter((id) => taskById(this.project, id)));
    this.pruneSelection();
    this.reschedule();
    this.emit('change');
    return entry.label;
  },

  redo() {
    if (!this.redoStack.length) return false;
    const entry = this.redoStack.pop();
    this.undoStack.push({ label: entry.label, snapshot: cloneProject(this.project), selectedId: this.selectedId, selectedIds: new Set(this.selectedIds) });
    this.project = entry.snapshot;
    this.selectedId = taskById(this.project, entry.selectedId) ? entry.selectedId : null;
    this.selectedIds = new Set([...(entry.selectedIds || [])].filter((id) => taskById(this.project, id)));
    this.pruneSelection();
    this.reschedule();
    this.emit('change');
    return entry.label;
  },

  get canUndo() { return this.undoStack.length > 0; },
  get canRedo() { return this.redoStack.length > 0; },
  get selected() { return this.selectedId ? taskById(this.project, this.selectedId) : null; },

  /** Projekt schließen – die App bleibt offen (Startbildschirm). */
  close() {
    this.project = null;
    this.selectedId = null;
    this.selectedIds = new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = null;
    this.ui.dirty = false;
    this.ui.saving = false;
    this.emit('close');
  },

  /* ───────── Auswahl (wie im Explorer: Klick, Strg+Klick, Umschalt+Klick) ───────── */

  /** Nur diese eine Aufgabe auswählen (nach dem Anlegen). */
  _only(id) { this.selectedId = id || null; this.selectedIds = id ? new Set([id]) : new Set(); },

  isSelected(id) { return this.selectedIds.has(id); },
  selectionCount() { return this.selectedIds.size; },
  selectedTasks() { return this.project.tasks.filter((t) => this.selectedIds.has(t.id)); },
  /** Auswahl als Baumreihenfolge (wie angezeigt). */
  selectedInOrder() {
    return this.visibleTasks().filter((t) => this.selectedIds.has(t.id));
  },

  /**
   * Auswahl ändern.
   * @param {string|null} id
   * @param {'replace'|'toggle'|'range'|'range-add'} mode
   */
  select(id, mode = 'replace') {
    if (!id) {
      this.selectedIds = new Set();
      this.selectedId = null;
      this.emit('select');
      return;
    }
    if (mode === 'toggle') {
      const next = new Set(this.selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      this.selectedIds = next;
      this.selectedId = next.has(id) ? id : (this.selectedInOrder().slice(-1)[0] || {}).id || null;
    } else if (mode === 'range' || mode === 'range-add') {
      const order = this.visibleTasks().map((t) => t.id);
      const anchor = (this.selectedId && order.includes(this.selectedId)) ? this.selectedId : id;
      const a = order.indexOf(anchor);
      const b = order.indexOf(id);
      if (a < 0 || b < 0) {
        this.selectedIds = new Set([id]);
      } else {
        const [s, e] = a < b ? [a, b] : [b, a];
        const range = order.slice(s, e + 1);
        this.selectedIds = mode === 'range-add' ? new Set([...this.selectedIds, ...range]) : new Set(range);
      }
      this.selectedId = anchor;   // Anker bleibt für weitere Umschalt-Klicks
    } else {
      this.selectedIds = new Set([id]);
      this.selectedId = id;
    }
    this.emit('select');
  },

  selectAll() {
    const ids = this.visibleTasks().map((t) => t.id);
    this.selectedIds = new Set(ids);
    if (!this.selectedId || !this.selectedIds.has(this.selectedId)) this.selectedId = ids[0] || null;
    this.emit('select');
  },

  clearSelection() { this.select(null); },

  /** Auswahl um eine Zeile erweitern/verkleinern (Umschalt+Pfeil). */
  extendSelection(direction) {
    const order = this.visibleTasks();
    if (!order.length) return false;
    const anchor = this.selectedId || (this.selectedIds.size ? [...this.selectedIds][0] : null);
    const last = this.selectedInOrder().slice(-1)[0];
    const baseId = last ? last.id : anchor;   // die bewegliche Kante ist das zuletzt markierte Feld
    const idx = order.findIndex((t) => t.id === baseId);
    if (idx < 0) { this.select(order[0].id); return true; }
    const next = order[idx + direction];
    if (!next) return false;
    const fromIdx = order.findIndex((t) => t.id === anchor);
    const [s, e] = fromIdx < 0 ? [idx + direction, idx + direction]
      : (fromIdx < idx + direction ? [fromIdx, idx + direction] : [idx + direction, fromIdx]);
    this.selectedIds = new Set(order.slice(s, e + 1).map((t) => t.id));
    this.emit('select');
    return true;
  },

  /** Auswahl löschen (mit allen Unteraufgaben). Gibt die Anzahl zurück. */
  deleteSelected() {
    const ids = [...this.selectedIds];
    if (!ids.length) return 0;
    const betroffen = new Set();
    for (const id of ids) {
      betroffen.add(id);
      for (const d of descendantsOf(this.project, id)) betroffen.add(d.id);
    }
    if (this.refuseIfLocked([...betroffen], 'löschen')) return 0;
    let count = 0;
    this.mutate('Aufgaben löschen', (p) => {
      const kill = new Set();
      for (const id of ids) {
        if (!taskById(p, id)) continue;
        kill.add(id);
        for (const d of descendantsOf(p, id)) kill.add(d.id);
      }
      count = kill.size;
      p.tasks = p.tasks.filter((t) => !kill.has(t.id));
      for (const t of p.tasks) t.deps = (t.deps || []).filter((d) => !kill.has(d.id));
    });
    this.selectedIds = new Set();
    this.selectedId = null;
    this.emit('select');
    return count;
  },

  /** Auswahl duplizieren – Unteraufgaben kommen mit. */
  duplicateSelected() {
    const roots = this.selectionRoots();
    if (!roots.length) return 0;
    let count = 0;
    this.mutate('Aufgaben duplizieren', (p) => {
      const inserted = [];
      for (const root of roots) {
        const copies = cloneSubtree(p, root, (t) => `${t.name} (Kopie)`);
        if (copies.length) inserted.push(...copies);
      }
      if (!inserted.length) return false;
      count = inserted.length;
      const lastIdx = Math.max(...roots.map((r) => p.tasks.findIndex((t) => t.id === r.id)));
      p.tasks.splice(lastIdx + 1, 0, ...inserted);
      this.selectedIds = new Set(inserted.map((t) => t.id));
      this.selectedId = inserted[0].id;
    });
    this.emit('select');
    return count;
  },

  /** Ausgewählte Aufgaben ohne ihre mitausgewählten Vorfahren. */
  selectionRoots() {
    const sel = this.selectedIds;
    return this.project.tasks.filter((t) => {
      if (!sel.has(t.id)) return false;
      let cur = t.parentId, guard = 0;
      while (cur && guard++ < 60) {
        if (sel.has(cur)) return false;
        cur = (taskById(this.project, cur) || {}).parentId;
      }
      return true;
    });
  },

  /** Auswahl in die Zwischenablage (intern + Text für Excel). */
  copySelection() {
    const roots = this.selectionRoots();
    if (!roots.length) return 0;
    const collected = [];
    const add = (t) => {
      collected.push(t);
      for (const k of childrenOf(this.project, t.id)) add(k);
    };
    roots.forEach(add);
    this.clipboard = {
      kind: 'terminplanung-aufgaben',
      at: new Date().toISOString(),
      tasks: collected.map((t) => ({
        id: t.id, parentId: t.parentId, name: t.name, type: t.type,
        start: t.start, end: t.end, duration: t.duration, progress: t.progress,
        status: t.status, priority: t.priority, assignees: t.assignees.slice(),
        deps: t.deps.map((d) => ({ ...d })), constraint: t.constraint,
        deadline: t.deadline, color: t.color, notes: t.notes, tags: t.tags.slice(),
        fromPool: t.fromPool || null,
      })),
    };
    // zusätzlich als Text (Tabulator-getrennt) in die Systemablage
    const header = ['Nr.', 'Aufgabe', 'Beginn', 'Ende', 'Dauer', 'Fortschritt', 'Status', 'Wer'];
    const lines = [header.join('\t')];
    for (const t of collected) {
      lines.push([t.wbs || '', t.name, t.start, t.end, t.duration, t.progress + '%',
        (STATUS[t.status] || {}).label || t.status,
        (t.assignees || []).map((a) => (this.project.resources.find((r) => r.id === a) || {}).name).filter(Boolean).join(', ')].join('\t'));
    }
    try { navigator.clipboard.writeText(lines.join('\n')); } catch { /* egal */ }
    return collected.length;
  },

  /** Zwischenablage als neue Aufgaben einfügen (nach der Auswahl bzw. am Ende). */
  pasteClipboard() {
    const clip = this.clipboard;
    if (!clip || !clip.tasks || !clip.tasks.length) return 0;
    let count = 0;
    this.mutate('Aufgaben einfügen', (p) => {
      const idMap = new Map();
      const copies = clip.tasks.map((src) => {
        const t = newTask(Object.assign({}, src, { id: undefined, deps: [], locked: false }));
        t.id = uid();
        idMap.set(src.id, t.id);
        return t;
      });
      copies.forEach((t, i) => {
        const src = clip.tasks[i];
        t.parentId = src.parentId && idMap.has(src.parentId) ? idMap.get(src.parentId) : null;
        t.deps = (src.deps || [])
          .filter((d) => idMap.has(d.id))
          .map((d) => ({ id: idMap.get(d.id), type: d.type, lag: d.lag }));
      });
      const roots = copies.filter((t) => !t.parentId);
      const lastSelected = this.selectedInOrder().slice(-1)[0];
      const at = lastSelected ? p.tasks.findIndex((x) => x.id === lastSelected.id) + 1 : p.tasks.length;
      p.tasks.splice(at, 0, ...roots);
      const byParent = new Map();
      for (const t of copies) {
        if (!t.parentId) continue;
        if (!byParent.has(t.parentId)) byParent.set(t.parentId, []);
        byParent.get(t.parentId).push(t);
      }
      for (const [pid, kids] of byParent) {
        const idx = p.tasks.findIndex((x) => x.id === pid);
        p.tasks.splice(idx + 1, 0, ...kids);
      }
      count = copies.length;
      this.selectedIds = new Set(copies.map((t) => t.id));
      this.selectedId = copies[0].id;
    });
    this.emit('select');
    return count;
  },

  /** Auswahl in den Papierkorb-Sinn: löschen ohne Rückfrage (Rückgängig möglich). */
  get hasClipboard() { return !!(this.clipboard && this.clipboard.tasks.length); },

  /* ───────── Schloss (Sperren) ───────── */

  /** Ist die Aufgabe gesperrt? */
  isLocked(id) {
    const t = this.project ? taskById(this.project, id) : null;
    return !!(t && t.locked);
  },

  /**
   * Sperrprüfung: meldet eine Sperre und lehnt die Änderung damit ab.
   * @param {string[]} ids  betroffene Aufgaben
   * @param {string} action Tätigkeit für die Meldung (z. B. „verschieben“)
   * @returns {boolean} true = abgelehnt (Meldung wurde abgesetzt)
   */
  refuseIfLocked(ids, action = 'ändern') {
    if (!this.project) return false;
    const hits = [...new Set(ids || [])]
      .map((id) => taskById(this.project, id))
      .filter((t) => t && t.locked);
    if (!hits.length) return false;
    const names = hits.map((t) => `„${t.name}“`);
    const viele = hits.length > 1;
    const liste = names.slice(0, 4).join(', ') + (names.length > 4 ? ` und ${names.length - 4} weitere` : '');
    this.emit('blocked', {
      action,
      ids: hits.map((t) => t.id),
      title: viele ? `${hits.length} Aufgaben sind gesperrt` : 'Aufgabe ist gesperrt',
      message: viele
        ? `${liste}: gesperrt – ${action} ist nicht möglich. Zuerst das Schloss öffnen.`
        : `${names[0]} ist gesperrt – ${action} ist nicht möglich. Zuerst das Schloss öffnen.`,
    });
    return true;
  },

  /**
   * Was ein Verschieben mitbewegen würde: die Zeilen samt Unteraufgaben, die
   * Zusammenfassungen darüber und – bei eingeschalteter Auto-Planung – die
   * Nachfolger, die terminlich nachrücken. Grundlage der Sperrprüfung.
   */
  moveCascade(ids) {
    const p = this.project;
    const out = new Set();
    const add = (t) => { if (t && !out.has(t.id)) out.add(t.id); };
    for (const id of ids || []) {
      const r = taskById(p, id);
      if (!r) continue;
      add(r);
      descendantsOf(p, r.id).forEach(add);
    }
    // Sammelaufgaben oberhalb (ihr Zeitraum fasst die Kinder zusammen)
    for (const id of [...out]) {
      let cur = taskById(p, id), guard = 0;
      while (cur && cur.parentId && guard++ < 60) {
        cur = taskById(p, cur.parentId);
        if (!cur) break;
        add(cur);
      }
    }
    // Nachfolger über Verknüpfungen (nur wenn die Auto-Planung sie mitzieht)
    if (this.ui.autoPlan) {
      const queue = [...out];
      const seen = new Set(queue);
      while (queue.length) {
        const id = queue.shift();
        for (const t of p.tasks) {
          if (seen.has(t.id)) continue;
          if (!(t.deps || []).some((d) => d.id === id)) continue;
          seen.add(t.id);
          add(t);
          descendantsOf(p, t.id).forEach(add);
          queue.push(t.id);
        }
      }
    }
    return out;
  },

  /** Sperrprüfung für ein Verschieben – samt Nachfolgern und Sammelaufgaben. */
  refuseIfLockedInMove(ids, action = 'verschieben') {
    if (!this.project) return false;
    return this.refuseIfLocked([...this.moveCascade(ids)], action);
  },

  /** Schloss einer Aufgabe umschalten. Gibt den neuen Zustand zurück. */
  toggleLock(id) {
    if (!this.project) return false;
    const t0 = taskById(this.project, id);
    if (!t0) return false;
    const on = !t0.locked;
    const name = t0.name;
    this.mutate(on ? 'Aufgabe sperren' : 'Schloss öffnen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.locked = on;
    });
    this.emit('lock-changed', { ids: [id], locked: on, name });
    return on;
  },

  /** Schloss für mehrere Aufgaben setzen (true = sperren). */
  setLock(ids, on) {
    const list = [...new Set(ids || [])].filter((id) => taskById(this.project, id));
    if (!list.length) return 0;
    const name = list.length > 1
      ? `${list.length} Aufgaben`
      : (taskById(this.project, list[0]) || {}).name;
    this.mutate(on ? 'Aufgaben sperren' : 'Schlösser öffnen', (p) => {
      for (const id of list) { const t = taskById(p, id); if (t) t.locked = !!on; }
    });
    this.emit('lock-changed', { ids: list, locked: !!on, name });
    return list.length;
  },

  /* ───────── Aufgaben ───────── */

  /** Einfügeposition: nach der ausgewählten Aufgabe, sonst am Ende. */
  _insertIndex(project, afterId) {
    if (!afterId) return project.tasks.length;
    const i = project.tasks.findIndex((t) => t.id === afterId);
    return i < 0 ? project.tasks.length : i + 1;
  },

  addTask(patch = {}, afterId = undefined) {
    const after = afterId === undefined ? this.selectedId : afterId;
    // Unteraufgabe einer gesperrten Sammelaufgabe? Erst das Schloss öffnen.
    if (patch && patch.parentId && this.refuseIfLocked([patch.parentId], 'eine Unteraufgabe hinzufügen')) return null;
    let created = null;
    this.mutate('Aufgabe hinzufügen', (p) => {
      const sel = after ? taskById(p, after) : null;
      // Neue Aufgaben landen immer auf derselben Ebene wie die markierte Aufgabe –
      // auch wenn diese eine Sammelaufgabe ist. Sonst rutscht jede weitere neue
      // Aufgabe in die Sammelaufgabe hinein, nur weil sie noch markiert ist.
      // Unteraufgabe bewusst über „Unteraufgabe hinzufügen“ (Kontextmenü, Detailbereich)
      // oder Alt+→ einrücken.
      const base = sel
        ? { start: sel.end ? addWorkdays(sel.end, 1, p.settings.calendar) : todayIso(), parentId: sel.parentId }
        : { start: p.settings.projectStart || todayIso(), parentId: null };
      const t = newTask(Object.assign(base, patch));
      if (t.type === 'milestone') { t.duration = 0; t.end = t.start; }
      p.tasks.splice(this._insertIndex(p, after), 0, t);
      created = t.id;
      this._only(t.id);
    });
    return created;
  },

  addMilestone() { return this.addTask({ name: 'Meilenstein', type: 'milestone' }); },

  addGroup() {
    const after = this.selectedId;
    let created = null;
    this.mutate('Sammelaufgabe hinzufügen', (p) => {
      const sel = after ? taskById(p, after) : null;
      const t = newTask({
        name: 'Neue Sammelaufgabe', type: 'summary',
        start: sel ? sel.start : (p.settings.projectStart || todayIso()),
        parentId: sel ? sel.parentId : null,
      });
      p.tasks.splice(this._insertIndex(p, after), 0, t);
      created = t.id;
      this._only(t.id);
    });
    return created;
  },

  updateTask(id, patch, label = 'Aufgabe ändern') {
    if (this.refuseIfLocked([id], 'ändern')) return false;
    this.mutate(label, (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      applyTaskPatch(t, patch);
    });
  },

  updateMany(ids, patch, label = 'Aufgaben ändern') {
    if (this.refuseIfLocked(ids, 'ändern')) return false;
    this.mutate(label, (p) => {
      for (const id of ids) {
        const t = taskById(p, id);
        if (t) applyTaskPatch(t, patch);
      }
    });
  },

  /** Alle ausgewählten Aufgaben um Tage/Wochen/Monate verschieben. */
  shiftSelected(amount, unit = 'day') {
    const roots = this.selectionRoots();
    const n = Number(amount) || 0;
    if (!roots.length || !n) return 0;
    if (this.refuseIfLockedInMove(roots.map((r) => r.id))) return 0;
    let done = 0;
    const word = { day: 'Tag(e)', week: 'Woche(n)', month: 'Monat(e)' }[unit] || 'Tag(e)';
    this.mutate(`${roots.length} Aufgaben ${n > 0 ? '+' : '−'}${Math.abs(n)} ${word}`, (p) => {
      for (const root of roots) {
        const t = taskById(p, root.id);
        if (!t) continue;
        const cal = p.settings.calendar;
        const step = unit === 'month' ? 0 : (unit === 'week' ? 7 : 1);
        const nsRaw = unit === 'month' ? addMonths(t.start, n) : addDays(t.start, n * step);
        const ns = snapToWorkday(nsRaw, cal, n > 0 ? 1 : -1);
        if (isSummary(p, t)) { shiftSubtree(p, t.id, diffWorkdays(p, t.start, ns)); done++; continue; }
        const dur = t.type === 'milestone' ? 0 : Math.max(1, t.duration || 1);
        t.start = ns;
        t.end = t.type === 'milestone' ? ns : endFromDuration(ns, dur, cal);
        if (t.constraint && t.constraint.type === 'MSO') t.constraint = { type: 'MSO', date: ns };
        else t.constraint = { type: 'SNET', date: ns };
        done++;
      }
    });
    return done;
  },

  deleteTask(id) {
    let name = '';
    if (this.refuseIfLocked([id, ...descendantsOf(this.project, id).map((x) => x.id)], 'löschen')) return '';
    this.mutate('Aufgabe löschen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      name = t.name;
      const kill = new Set([id, ...descendantsOf(p, id).map((x) => x.id)]);
      p.tasks = p.tasks.filter((x) => !kill.has(x.id));
      for (const rest of p.tasks) rest.deps = (rest.deps || []).filter((d) => !kill.has(d.id));
      if (kill.has(this.selectedId)) this.selectedId = null;
      this.selectedIds = new Set([...this.selectedIds].filter((x) => !kill.has(x)));
    });
    return name;
  },

  duplicateTask(id) {
    let created = null;
    this.mutate('Aufgabe duplizieren', (p) => {
      const src = taskById(p, id);
      if (!src) return false;
      const copy = newTask(Object.assign({}, src, {
        id: undefined, name: src.name + ' (Kopie)', deps: [], wbs: undefined, locked: false,
      }));
      copy.id = uid();
      p.tasks.splice(this._insertIndex(p, id), 0, copy);
      created = copy.id;
      this._only(copy.id);
    });
    return created;
  },

  /**
   * Zeilen in der Anzeigereihenfolge verschieben – nur die Reihenfolge ändert sich.
   * Termine, Dauer, Fortschritt, Namen und Zuweisungen bleiben unangetastet; die
   * Nummerierung (WBS) läuft mit, weil sie sich aus der Reihenfolge ergibt.
   * Markierte Zeilen wandern als Block; Unteraufgaben kommen mit. Je Ebene
   * (gleicher Elternteil) wird getrennt verschoben – nur Geschwister tauschen Plätze.
   * @param {number} dir  -1 = nach oben, +1 = nach unten
   * @param {string[]} [ids]  sonst die markierten Zeilen (ohne ihre mitmarkierten Vorfahren)
   * @returns {number} Anzahl verschobener Zeilen
   */
  moveRows(dir, ids = null) {
    const step = dir < 0 ? -1 : 1;
    const rows = (ids && ids.length ? ids.map((id) => taskById(this.project, id)) : this.selectionRoots()).filter(Boolean);
    if (!rows.length) return 0;
    if (this.refuseIfLocked(rows.map((t) => t.id), step < 0 ? 'nach oben verschieben' : 'nach unten verschieben')) return 0;

    let moved = 0;
    this.mutate(step < 0 ? 'Zeilen nach oben' : 'Zeilen nach unten', (p) => {
      // markierte Zeilen je Ebene sammeln
      const selByParent = new Map();
      for (const t of rows) {
        const key = t.parentId || '';
        if (!selByParent.has(key)) selByParent.set(key, new Set());
        selByParent.get(key).add(t.id);
      }
      // Geschwisterlisten in der jetzigen Reihenfolge
      const order = new Map();
      for (const t of p.tasks) {
        const key = t.parentId || '';
        if (!order.has(key)) order.set(key, []);
        order.get(key).push(t.id);
      }
      for (const [key, sel] of selByParent) {
        const L = order.get(key) || [];
        const idx = L.map((id, i) => (sel.has(id) ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) continue;
        const first = idx[0], last = idx[idx.length - 1];
        // Nachbar, an dem vorbei bewegt wird: oben der nächste nicht markierte davor, unten danach
        const anchorId = step < 0
          ? L.slice(0, first).reverse().find((id) => !sel.has(id))
          : L.slice(last + 1).find((id) => !sel.has(id));
        if (!anchorId) continue;                            // schon ganz oben bzw. unten
        const block = idx.map((i) => L[i]);
        const rest = L.filter((id) => !sel.has(id));
        const at = rest.indexOf(anchorId);
        rest.splice(step < 0 ? at : at + 1, 0, ...block);
        order.set(key, rest);
        moved += block.length;
      }
      if (!moved) return false;                             // nichts zu tun -> kein Rückgängig-Punkt
      // flaches Feld aus den neuen Geschwisterlisten wieder aufbauen (Tiefensuche)
      const byId = new Map(p.tasks.map((t) => [t.id, t]));
      const out = [];
      const emit = (parentKey) => {
        for (const id of order.get(parentKey) || []) {
          const t = byId.get(id);
          if (!t) continue;
          out.push(t);
          emit(id);
        }
      };
      emit('');
      for (const t of p.tasks) if (!out.includes(t)) out.push(t);   // Sicherheitsnetz
      p.tasks = out;
    });
    return moved;
  },

  /** Eine Zeile nach oben/unten verschieben (Kontextmenü). */
  moveRow(id, dir) { return this.moveRows(dir, [id]); },

  /** Einrücken: wird Unteraufgabe der vorherigen Zeile. */
  indent(id) {
    if (this.refuseIfLocked([id], 'einrücken')) return false;
    this.mutate('Einrücken', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      const prev = prevSibling(p, t);
      if (!prev) return false;
      t.parentId = prev.id;
      prev.collapsed = false;
      // direkt hinter die letzte Unteraufgabe des neuen Elternteils einsortieren
      const kids = descendantsOf(p, prev.id);
      const last = kids.length ? kids[kids.length - 1] : prev;
      const arr = p.tasks.filter((x) => x.id !== t.id);
      const at = arr.findIndex((x) => x.id === last.id);
      arr.splice(at + 1, 0, t);
      p.tasks = arr;
      // Aufgaben, die schon Unteraufgaben waren, bleiben es
      renumberWbs(p);
    });
  },

  /** Ausrücken: wird Geschwister der bisherigen Elternzeile. */
  outdent(id) {
    if (this.refuseIfLocked([id], 'ausrücken')) return false;
    this.mutate('Ausrücken', (p) => {
      const t = taskById(p, id);
      if (!t || !t.parentId) return false;
      const parent = taskById(p, t.parentId);
      if (!parent) { t.parentId = null; return; }
      const grand = parent.parentId;
      t.parentId = grand;
      const arr = p.tasks.filter((x) => x.id !== t.id);
      const at = arr.findIndex((x) => x.id === parent.id);
      // hinter dem gesamten bisherigen Eltern-Teilbaum einordnen
      const sub = [parent, ...descendantsOf(p, parent.id)];
      let insertAt = at + 1;
      for (const s of sub) { const k = arr.findIndex((x) => x.id === s.id); if (k > insertAt) insertAt = k; }
      arr.splice(insertAt + 1, 0, t);
      p.tasks = arr;
    });
  },

  toggleCollapse(id) {
    this.mutate('Gruppierung ändern', (p) => {
      const t = taskById(p, id);
      if (t) t.collapsed = !t.collapsed;
    }, { noSchedule: true });
  },

  /** Termin verschieben (Ziehen im Gantt / Kalender). */
  moveTaskDates(id, { start, end }, { addConstraint = false } = {}) {
    if (this.refuseIfLockedInMove([id])) return false;
    this.mutate('Termin verschieben', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      if (t.type === 'summary' || isSummary(p, t)) {
        // Sammelaufgabe: alle Unteraufgaben mitverschieben
        const delta = start && t.start ? diffWorkdays(p, t.start, start) : 0;
        shiftSubtree(p, id, delta);
        return;
      }
      t.start = start;
      if (t.type === 'milestone') t.end = start;
      else t.end = end;
      if (addConstraint && (t.deps || []).length) {
        t.constraint = { type: 'SNET', date: start };
      }
    });
  },

  setProgress(id, progress) {
    if (this.refuseIfLocked([id], 'den Fortschritt ändern')) return false;
    this.mutate('Fortschritt setzen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.progress = Math.max(0, Math.min(100, Math.round(progress)));
      if (t.progress >= 100) t.status = 'done';
      else if (t.status === 'done') t.status = 'running';
    });
  },

  setStatus(id, status) {
    if (this.refuseIfLocked([id], 'den Status ändern')) return false;
    this.mutate('Status setzen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.status = status;
      if (status === 'done') t.progress = 100;
      else if (t.progress >= 100) t.progress = status === 'open' ? 0 : 90;
    });
  },

  addDependency(id, predId, type = 'FS', lag = 0) {
    if (this.refuseIfLocked([id], 'eine Verknüpfung hinzufügen')) return false;
    this.mutate('Abhängigkeit hinzufügen', (p) => {
      const t = taskById(p, id);
      if (!t || !taskById(p, predId) || predId === id) return false;
      t.deps = t.deps || [];
      if (t.deps.some((d) => d.id === predId)) return false;
      // Zyklus vermeiden
      if (descendantsOf(p, id).some((d) => d.id === predId)) return false;
      if (createsCycle(p, id, predId)) return false;
      t.deps.push({ id: predId, type, lag: Number(lag) || 0 });
    });
  },

  updateDependency(id, predId, patch) {
    if (this.refuseIfLocked([id], 'eine Verknüpfung ändern')) return false;
    this.mutate('Abhängigkeit ändern', (p) => {
      const t = taskById(p, id);
      const d = t && (t.deps || []).find((x) => x.id === predId);
      if (!d) return false;
      Object.assign(d, patch);
    });
  },

  removeDependency(id, predId) {
    if (this.refuseIfLocked([id], 'eine Verknüpfung entfernen')) return false;
    this.mutate('Abhängigkeit entfernen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.deps = (t.deps || []).filter((d) => d.id !== predId);
    });
  },

  clearConstraint(id) {
    this.updateTask(id, { constraint: null }, 'Festlegung entfernen');
  },

  /* ───────── Ressourcen ───────── */
  addResource(patch = {}) {
    let id = null;
    this.mutate('Person hinzufügen', (p) => { const r = newResource(patch); p.resources.push(r); id = r.id; });
    return id;
  },
  updateResource(id, patch) {
    this.mutate('Person ändern', (p) => {
      const r = p.resources.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
    });
  },
  removeResource(id) {
    // Bei gesperrten Aufgaben würde die Zuweisung mitentfernt – das erst nach dem Öffnen.
    const betroffen = this.project.tasks.filter((t) => t.locked && (t.assignees || []).includes(id));
    if (betroffen.length) {
      this.refuseIfLocked(betroffen.map((t) => t.id), 'die Zuweisung dieser Person entfernen');
      return false;
    }
    this.mutate('Person entfernen', (p) => {
      p.resources = p.resources.filter((r) => r.id !== id);
      for (const t of p.tasks) t.assignees = (t.assignees || []).filter((a) => a !== id);
    });
  },

  /* ───────── Projekt ───────── */
  setProjectMeta(patch) {
    this.mutate('Projekt ändern', (p) => Object.assign(p.meta, patch), { noSchedule: true });
  },
  setCalendar(patch) {
    this.mutate('Kalender ändern', (p) => { p.settings.calendar = Object.assign(p.settings.calendar, patch); });
  },

  /* ───────── Termin verschieben (Menü, Tastatur, Dialog) ───────── */

  /**
   * Aufgabe um Tage, Wochen oder Monate verschieben.
   * @param {string} id
   * @param {number} amount  positiv = später, negativ = früher
   * @param {'day'|'week'|'month'} unit
   */
  shiftTask(id, amount, unit = 'day', { label = null } = {}) {
    const n = Number(amount) || 0;
    if (!n) return false;
    if (this.refuseIfLockedInMove([id])) return false;
    const unitName = { day: n === 1 ? 'Tag' : 'Tage', week: n === 1 ? 'Woche' : 'Wochen', month: n === 1 ? 'Monat' : 'Monate' }[unit] || 'Tage';
    const dirWord = n > 0 ? 'später' : 'früher';
    const text = label || `${Math.abs(n)} ${unitName} ${dirWord}`;
    let done = false;
    this.mutate(text, (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      const cal = p.settings.calendar;
      const step = unit === 'month' ? 0 : (unit === 'week' ? 7 : 1);
      const nsRaw = unit === 'month' ? addMonths(t.start, n) : addDays(t.start, n * step);
      const ns = snapToWorkday(nsRaw, cal, n > 0 ? 1 : -1);

      if (isSummary(p, t)) {
        // Sammelaufgabe: alle Unteraufgaben mitverschieben
        shiftSubtree(p, id, diffWorkdays(p, t.start, ns));
        done = true;
        return;
      }
      const dur = t.type === 'milestone' ? 0 : Math.max(1, t.duration || 1);
      t.start = ns;
      t.end = t.type === 'milestone' ? ns : endFromDuration(ns, dur, cal);
      // Festlegung mitziehen, damit der neue Termin auch hält
      if (t.constraint && t.constraint.type === 'MSO') t.constraint = { type: 'MSO', date: ns };
      else t.constraint = { type: 'SNET', date: ns };
      done = true;
    });
    return done;
  },

  /* ───────── Ideen-Sammelbecken ───────── */

  poolEntries(scope = 'project') {
    return scope === 'global' ? loadGlobalPool() : (this.project.pool || []);
  },

  /** Sammelbecken-Änderungen laufen über den Store (Projekt) bzw. localStorage (Vorrat). */
  addPoolEntry(text, { scope = 'project' } = {}) {
    const clean = String(text || '').trim();
    if (!clean) return null;
    const entry = newPoolEntry({ text: clean });
    if (scope === 'global') {
      saveGlobalPool([...loadGlobalPool(), entry]);
      this.emit('pool-global');
      return entry.id;
    }
    this.mutate('Idee aufschreiben', (p) => { p.pool = [...(p.pool || []), entry]; }, { noSchedule: true });
    return entry.id;
  },

  updatePoolEntry(id, patch, { scope = 'project' } = {}) {
    if (scope === 'global') {
      const list = loadGlobalPool().map((e) => (e.id === id ? { ...e, ...patch } : e));
      saveGlobalPool(list);
      this.emit('pool-global');
      return;
    }
    this.mutate('Idee ändern', (p) => {
      const e = (p.pool || []).find((x) => x.id === id);
      if (!e) return false;
      Object.assign(e, patch);
    }, { noSchedule: true });
  },

  removePoolEntry(id, { scope = 'project' } = {}) {
    if (scope === 'global') {
      saveGlobalPool(loadGlobalPool().filter((e) => e.id !== id));
      this.emit('pool-global');
      return;
    }
    this.mutate('Idee entfernen', (p) => {
      p.pool = (p.pool || []).filter((e) => e.id !== id);
      for (const t of p.tasks) if (t.fromPool === id) t.fromPool = null;
    }, { noSchedule: true });
  },

  /** Eintrag zwischen Projekt und allgemeinem Vorrat umlegen. */
  movePoolEntry(id, toScope) {
    const from = toScope === 'global' ? 'project' : 'global';
    const list = this.poolEntries(from);
    const entry = list.find((e) => e.id === id);
    if (!entry) return false;
    this.removePoolEntry(id, { scope: from });
    if (toScope === 'global') {
      saveGlobalPool([...loadGlobalPool(), entry]);
      this.emit('pool-global');
    } else {
      this.mutate('Idee ins Projekt holen', (p) => { p.pool = [...(p.pool || []), entry]; }, { noSchedule: true });
    }
    return true;
  },

  /** Alle Einträge des allgemeinen Vorrats ins Projekt übernehmen (für neue Projekte). */
  importGlobalPool() {
    const list = loadGlobalPool();
    if (!list.length) return 0;
    this.mutate('Vorrat übernehmen', (p) => {
      const have = new Set((p.pool || []).map((e) => e.id));
      const add = list.filter((e) => !have.has(e.id)).map((e) => ({ ...e, id: e.id }));
      p.pool = [...(p.pool || []), ...add];
    }, { noSchedule: true });
    return list.length;
  },

  poolEntry(id) {
    return (this.project.pool || []).find((e) => e.id === id) || null;
  },

  /** Wie oft wurde der Eintrag schon in den Plan gelegt? */
  placedCountFor(task) {
    if (!task || !task.fromPool) return 0;
    const e = this.poolEntry(task.fromPool);
    return e ? (e.placedCount || 0) : 0;
  },

  /**
   * Eintrag aus dem Sammelbecken in den Plan legen – erzeugt eine Aufgabe.
   * Derselbe Eintrag kann mehrfach gelegt werden; der Zähler läuft mit.
   */
  placePoolEntry(poolId, { start = null, afterId = null, parentId = null, status = 'open', scope = 'project' } = {}) {
    const entry = scope === 'global' ? loadGlobalPool().find((e) => e.id === poolId) : this.poolEntry(poolId);
    if (!entry) return null;
    if (parentId && this.refuseIfLocked([parentId], 'eine Idee hineinlegen')) return null;
    let created = null;
    this.mutate('Idee in den Plan legen', (p) => {
      const cal = p.settings.calendar;
      const s = snapToWorkday(start || p.settings.projectStart || todayIso(), cal, 1);
      // Dauer aus der Idee übernehmen (leer = 1 Arbeitstag)
      const days = poolDurationWorkdays(entry) || 1;
      const t = newTask({
        name: entry.text,
        notes: entry.note || '',
        color: POOL_COLOR,
        fromPool: entry.id,
        status,
        start: s,
        duration: days,
        parentId: parentId || null,
      });
      t.end = endFromDuration(s, days, cal);
      const e = (p.pool || []).find((x) => x.id === poolId);
      if (e) { e.placedCount = (e.placedCount || 0) + 1; e.placedAt = new Date().toISOString(); }
      const idx = afterId ? p.tasks.findIndex((x) => x.id === afterId) : -1;
      if (idx >= 0) p.tasks.splice(idx + 1, 0, t);
      else p.tasks.push(t);
      created = t.id;
      this._only(t.id);
    });
    return created;
  },

  /* ───────── Zeilenhöhe ───────── */

  setRowHeight(px) {
    const v = Math.max(22, Math.min(60, Math.round(Number(px) || 30)));
    this.mutate('Zeilenhöhe ändern', (p) => { p.settings.rowHeight = v; }, { noSchedule: true });
    this.ui.rowH = v;
    this.emit('change');
    return v;
  },

  /* ───────── bereit zum Ablegen (Sammelbecken) ───────── */

  arm(poolId, scope = 'project') {
    this.ui.armedPool = poolId ? { id: poolId, scope } : null;
    this.emit('armed');
  },
  disarm() { this.ui.armedPool = null; this.emit('armed'); },

  serialize() { return serializeProject(this.project); },

  /** IDs der gerade sichtbaren (nicht gefilterten, nicht eingeklappten) Aufgaben. */
  visibleTasks() {
    const f = this.ui.filter;
    const all = this.project.tasks;
    const text = (f.text || '').trim().toLowerCase();
    const hasFilter = !!(text || f.assignee || f.status);
    const match = (t) => {
      if (text) {
        const hay = [t.name, t.notes, (t.tags || []).join(' '), t.wbs].join(' ').toLowerCase();
        if (!hay.includes(text)) return false;
      }
      if (f.assignee && !(t.assignees || []).includes(f.assignee)) return false;
      if (f.status && t.status !== f.status) return false;
      return true;
    };
    // Treffer + ihre Vorfahren behalten (damit der Baum stimmt)
    const keep = new Set();
    if (hasFilter) {
      for (const t of all) {
        if (!match(t)) continue;
        keep.add(t.id);
        let cur = t.parentId, guard = 0;
        while (cur && guard++ < 100) { keep.add(cur); cur = (taskById(this.project, cur) || {}).parentId; }
      }
    }
    const out = [];
    const walk = (pid) => {
      for (const t of all) {
        if (t.parentId !== pid) continue;
        if (hasFilter && !keep.has(t.id)) continue;
        out.push(t);
        if (hasFilter) walk(t.id);        // beim Filtern automatisch aufklappen
        else if (!t.collapsed) walk(t.id);
      }
    };
    walk(null);
    return out;
  },

  monthAnchor() { return this.ui.calendarMonth || startOfWeek(todayIso()); },
  setMonthAnchor(isoDate) { this.ui.calendarMonth = isoDate; this.emit('change'); },
};

/* ───────── Hilfen ───────── */

/** Eine Änderung auf eine Aufgabe anwenden – Status und Fortschritt bleiben stimmig. */
function applyTaskPatch(t, patch) {
  Object.assign(t, patch);
  if (patch.type === 'milestone') { t.duration = 0; t.end = t.start; }
  if (patch.status === 'done' && t.progress < 100) t.progress = 100;
  if (patch.progress === 100 && t.status !== 'done') t.status = 'done';
  if (patch.progress != null && patch.progress < 100 && t.status === 'done') t.status = 'running';
  if (patch.progress != null && patch.progress > 0 && patch.progress < 100 && t.status === 'open') t.status = 'running';
}

/**
 * Aufgabe samt Unteraufgaben kopieren.
 * @param {object} project
 * @param {object} root
 * @param {(t:object)=>string} nameFor – Name der Kopie
 * @returns {Array<object>} Kopien in Baumreihenfolge
 */
function cloneSubtree(project, root, nameFor = (t) => t.name) {
  const out = [];
  const walk = (src, parentId) => {
    const copy = newTask(Object.assign({}, src, { id: undefined, deps: [], wbs: undefined, locked: false }));
    copy.id = uid();
    copy.name = nameFor(src);
    copy.parentId = parentId;
    copy.deps = (src.deps || []).map((d) => ({ ...d }));
    out.push(copy);
    for (const kid of childrenOf(project, src.id)) walk(kid, copy.id);
  };
  walk(root, root.parentId || null);
  return out;
}

/** Alle Unteraufgaben einer Sammelaufgabe um n Arbeitstage verschieben. */
function shiftSubtree(project, id, deltaWorkdays) {
  if (!deltaWorkdays) return 0;
  const cal = project.settings.calendar;
  const kids = descendantsOf(project, id).filter((k) => !isSummary(project, k));
  for (const k of kids) {
    if (!k.start) continue;
    k.start = addWorkdays(k.start, deltaWorkdays, cal);
    if (k.type === 'milestone') k.end = k.start;
    else k.end = addWorkdays(k.end, deltaWorkdays, cal);
    if (k.constraint && k.constraint.type === 'SNET') k.constraint = { type: 'SNET', date: k.start };
    if (k.constraint && k.constraint.type === 'MSO') k.constraint = { type: 'MSO', date: k.start };
  }
  return kids.length;
}

function diffWorkdays(project, fromIso, toIso) {
  if (!fromIso || !toIso) return 0;
  const cal = project.settings.calendar;
  const dir = toIso >= fromIso ? 1 : -1;
  let n = 0, cur = fromIso, guard = 0;
  while (cur !== toIso && guard++ < 5000) { cur = addWorkdays(cur, dir, cal); n += dir; }
  return n;
}

/** Zyklusprüfung: würde predId → id einen Kreis erzeugen? */
function createsCycle(project, id, predId) {
  const seen = new Set();
  const walk = (cur) => {
    if (cur === id) return true;
    if (seen.has(cur)) return false;
    seen.add(cur);
    const t = taskById(project, cur);
    if (!t) return false;
    for (const d of t.deps || []) if (walk(d.id)) return true;
    return false;
  };
  return walk(predId);
}

export { STATUS, childrenOf };
