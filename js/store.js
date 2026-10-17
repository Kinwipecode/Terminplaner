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
import { schedule } from './scheduler.js';
import { addWorkdays, todayIso, startOfWeek } from './dateutil.js';

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
  },
  _listeners: new Set(),
  _render: null,

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  emit(reason = 'change') {
    for (const fn of this._listeners) { try { fn(reason); } catch (e) { console.error(e); } }
  },
  /** Vollständiges Neuzeichnen anfordern (nach Ansichtswechsel o. Ä.) */
  render() { if (this._render) this._render(); },

  /* ───────── Projekt laden ───────── */
  load(project, { resetUndo = true } = {}) {
    this.project = project;
    if (resetUndo) { this.undoStack = []; this.redoStack = []; }
    this.selectedId = null;
    this.ui.autoPlan = project.settings.autoPlan !== false;
    this.ui.showCritical = !!project.settings.showCritical;
    this.ui.showDeps = project.settings.showDeps !== false;
    this.ui.zoom = project.settings.zoom || 'week';
    this.ui.view = project.settings.defaultView || 'gantt';
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
    this.undoStack.push({ label, snapshot: before, selectedId: this.selectedId });
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack = [];
    sortTasks(this.project);
    renumberWbs(this.project);
    if (!noSchedule) this.reschedule();
    if (!silent) this.emit('change');
    return result;
  },

  undo() {
    if (!this.undoStack.length) return false;
    const entry = this.undoStack.pop();
    this.redoStack.push({ label: entry.label, snapshot: cloneProject(this.project), selectedId: this.selectedId });
    this.project = entry.snapshot;
    this.selectedId = taskById(this.project, entry.selectedId) ? entry.selectedId : null;
    this.reschedule();
    this.emit('change');
    return entry.label;
  },

  redo() {
    if (!this.redoStack.length) return false;
    const entry = this.redoStack.pop();
    this.undoStack.push({ label: entry.label, snapshot: cloneProject(this.project), selectedId: this.selectedId });
    this.project = entry.snapshot;
    this.selectedId = taskById(this.project, entry.selectedId) ? entry.selectedId : null;
    this.reschedule();
    this.emit('change');
    return entry.label;
  },

  get canUndo() { return this.undoStack.length > 0; },
  get canRedo() { return this.redoStack.length > 0; },
  get selected() { return this.selectedId ? taskById(this.project, this.selectedId) : null; },

  select(id) {
    this.selectedId = id || null;
    this.emit('select');
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
    let created = null;
    this.mutate('Aufgabe hinzufügen', (p) => {
      const sel = after ? taskById(p, after) : null;
      const base = sel && sel.type !== 'summary'
        ? { start: sel.end ? addWorkdays(sel.end, 1, p.settings.calendar) : todayIso(), parentId: sel.parentId }
        : { start: p.settings.projectStart || todayIso(), parentId: sel ? sel.id : null };
      const t = newTask(Object.assign(base, patch));
      if (t.type === 'milestone') { t.duration = 0; t.end = t.start; }
      p.tasks.splice(this._insertIndex(p, after), 0, t);
      created = t.id;
      this.selectedId = t.id;
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
      this.selectedId = t.id;
    });
    return created;
  },

  updateTask(id, patch, label = 'Aufgabe ändern') {
    this.mutate(label, (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      Object.assign(t, patch);
      if (patch.type === 'milestone') { t.duration = 0; t.end = t.start; }
      if (patch.start && patch.duration != null) { /* Termine werden neu berechnet */ }
      // Status und Fortschritt synchron halten
      if (patch.status === 'done' && t.progress < 100) t.progress = 100;
      if (patch.progress === 100 && t.status !== 'done') t.status = 'done';
      if (patch.progress != null && patch.progress < 100 && t.status === 'done') t.status = 'running';
    });
  },

  updateMany(ids, patch, label = 'Aufgaben ändern') {
    this.mutate(label, (p) => {
      for (const id of ids) {
        const t = taskById(p, id);
        if (t) Object.assign(t, patch);
      }
    });
  },

  deleteTask(id) {
    let name = '';
    this.mutate('Aufgabe löschen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      name = t.name;
      const kill = new Set([id, ...descendantsOf(p, id).map((x) => x.id)]);
      p.tasks = p.tasks.filter((x) => !kill.has(x.id));
      for (const rest of p.tasks) rest.deps = (rest.deps || []).filter((d) => !kill.has(d.id));
      if (kill.has(this.selectedId)) this.selectedId = null;
    });
    return name;
  },

  duplicateTask(id) {
    let created = null;
    this.mutate('Aufgabe duplizieren', (p) => {
      const src = taskById(p, id);
      if (!src) return false;
      const copy = newTask(Object.assign({}, src, {
        id: undefined, name: src.name + ' (Kopie)', deps: [], wbs: undefined,
      }));
      copy.id = uid();
      p.tasks.splice(this._insertIndex(p, id), 0, copy);
      created = copy.id;
      this.selectedId = copy.id;
    });
    return created;
  },

  /** Zeile nach oben/unten verschieben (innerhalb der Geschwister). */
  moveRow(id, dir) {
    this.mutate(dir < 0 ? 'Zeile nach oben' : 'Zeile nach unten', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      const sib = p.tasks.filter((x) => x.parentId === t.parentId);
      const i = sib.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sib.length) return false;
      const a = sib[i], b = sib[j];
      const ia = p.tasks.indexOf(a), ib = p.tasks.indexOf(b);
      // ganze Teilbäume tauschen
      const blockA = [a, ...descendantsOf(p, a.id)];
      const blockB = [b, ...descendantsOf(p, b.id)];
      const idxA = p.tasks.findIndex((x) => x.id === blockA[0].id);
      const idxB = p.tasks.findIndex((x) => x.id === blockB[0].id);
      const rest = p.tasks.filter((x) => !blockA.includes(x) && !blockB.includes(x));
      // nach oben: A vor B an die Stelle von B · nach unten: B vor A an die Stelle von A
      const insertAt = dir < 0 ? idxB : idxA;
      rest.splice(insertAt, 0, ...(dir < 0 ? [...blockA, ...blockB] : [...blockB, ...blockA]));
      p.tasks = rest;
    });
  },

  /** Einrücken: wird Unteraufgabe der vorherigen Zeile. */
  indent(id) {
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
    this.mutate('Termin verschieben', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      if (t.type === 'summary' || isSummary(p, t)) {
        // Sammelaufgabe: alle Unteraufgaben mitverschieben
        const kids = descendantsOf(p, id).filter((k) => !isSummary(p, k));
        const delta = start && t.start ? diffWorkdays(p, t.start, start) : 0;
        for (const k of kids) {
          if (!k.start) continue;
          k.start = addWorkdays(k.start, delta, p.settings.calendar);
          if (k.type === 'milestone') k.end = k.start;
          else k.end = addWorkdays(k.end, delta, p.settings.calendar);
          k.constraint = k.constraint || null;
        }
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
    this.mutate('Fortschritt setzen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.progress = Math.max(0, Math.min(100, Math.round(progress)));
      if (t.progress >= 100) t.status = 'done';
      else if (t.status === 'done') t.status = 'running';
    });
  },

  setStatus(id, status) {
    this.mutate('Status setzen', (p) => {
      const t = taskById(p, id);
      if (!t) return false;
      t.status = status;
      if (status === 'done') t.progress = 100;
      else if (t.progress >= 100) t.progress = status === 'open' ? 0 : 90;
    });
  },

  addDependency(id, predId, type = 'FS', lag = 0) {
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
    this.mutate('Abhängigkeit ändern', (p) => {
      const t = taskById(p, id);
      const d = t && (t.deps || []).find((x) => x.id === predId);
      if (!d) return false;
      Object.assign(d, patch);
    });
  },

  removeDependency(id, predId) {
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
