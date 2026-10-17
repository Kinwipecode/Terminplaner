/* ══════════════════════════════════════════════════════════════
   model.js – Datenmodell des Projekts, Hilfsfunktionen für den
   Aufgabenbaum, Vorlagen und Beispielprojekt.
   ══════════════════════════════════════════════════════════════ */

import { todayIso, addWorkdays, endFromDuration, durationFromRange, normalizeCalendar, defaultCalendar, minIso, maxIso, diffDays, snapToWorkday } from './dateutil.js';
import { normalizePool, newPoolEntry, POOL_COLOR } from './pool.js';

export const FILE_FORMAT = 'terminplanung';
export const FILE_VERSION = 1;
export const FILE_EXT = '.tplan.json';

export const STATUS = {
  open:    { label: 'Offen',     color: '#38bdf8' },
  running: { label: 'Läuft',     color: '#6366f1' },
  blocked: { label: 'Blockiert', color: '#ef4444' },
  done:    { label: 'Erledigt',  color: '#22c55e' },
};
export const STATUS_ORDER = ['open', 'running', 'blocked', 'done'];

export const PRIORITY = {
  low:      { label: 'Niedrig',  color: '#64748b' },
  normal:   { label: 'Normal',   color: '#38bdf8' },
  high:     { label: 'Hoch',     color: '#f59e0b' },
  critical: { label: 'Kritisch', color: '#ef4444' },
};
export const PRIORITY_ORDER = ['low', 'normal', 'high', 'critical'];

export const DEP_TYPES = {
  FS: 'Ende → Anfang',
  SS: 'Anfang → Anfang',
  FF: 'Ende → Ende',
  SF: 'Anfang → Ende',
};

export const CONSTRAINT_TYPES = {
  ASAP:  'So früh wie möglich',
  MSO:   'Muss beginnen am',
  SNET:  'Beginnt nicht vor',
  MFO:   'Muss enden am',
  FNLT:  'Endet nicht nach',
};

export const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
  '#22c55e', '#14b8a6', '#38bdf8', '#0ea5e9', '#64748b',
];

let counter = 0;
export function uid(prefix = 't') {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ───────── Aufgaben ───────── */

export function newTask(patch = {}) {
  const t = {
    id: uid(),
    parentId: null,
    name: 'Neue Aufgabe',
    type: 'task',              // task | milestone | summary
    start: snapToWorkday(todayIso(), defaultCalendar(), 1),
    end: snapToWorkday(todayIso(), defaultCalendar(), 1),
    duration: 1,               // in Arbeitstagen; 0 = Meilenstein
    progress: 0,               // 0..100
    status: 'open',
    priority: 'normal',
    assignees: [],             // Ressourcen-IDs
    deps: [],                  // {id, type, lag}
    constraint: null,          // {type, date}
    deadline: null,
    color: null,
    notes: '',
    tags: [],
    collapsed: false,
    fromPool: null,            // ID des Sammelbecken-Eintrags, falls daraus entstanden
  };
  Object.assign(t, patch);
  if (t.type === 'milestone') { t.duration = 0; t.end = t.start; }
  return t;
}

export function newResource(patch = {}) {
  return Object.assign({
    id: uid('r'),
    name: 'Neue Person',
    type: 'person',            // person | team | material
    email: '',
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    capacity: 100,             // %
  }, patch);
}

export function emptyProject(name = 'Neues Projekt') {
  const t = snapToWorkday(todayIso(), defaultCalendar(), 1);
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    meta: {
      name,
      description: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: '',
    },
    settings: {
      projectStart: t,
      calendar: defaultCalendar(),
      defaultView: 'gantt',
      showCritical: false,
      showDeps: true,
      autoPlan: true,
      zoom: 'week',
      rowHeight: 30,            // Zeilenhöhe in Pixel (22 … 56)
    },
    resources: [],
    tasks: [],
    pool: [],                   // Ideen-Sammelbecken (Aufgaben ohne Termin)
    views: {},
  };
}

/* ───────── Baum-Hilfsfunktionen ───────── */

export function childrenOf(project, parentId) {
  return project.tasks.filter((t) => t.parentId === parentId);
}

export function taskById(project, id) {
  return project.tasks.find((t) => t.id === id) || null;
}

export function descendantsOf(project, id) {
  const out = [];
  const walk = (pid) => {
    for (const c of project.tasks) {
      if (c.parentId === pid) { out.push(c); walk(c.id); }
    }
  };
  walk(id);
  return out;
}

export function isSummary(project, task) {
  return task.type === 'summary' || project.tasks.some((t) => t.parentId === task.id);
}

export function depthOf(project, task) {
  let d = 0, cur = task, guard = 0;
  while (cur && cur.parentId && guard++ < 50) {
    cur = taskById(project, cur.parentId);
    if (!cur) break;
    d++;
  }
  return d;
}

/** Aufgaben in Baum-Reihenfolge (Sammelaufgaben inklusive). */
export function flatTasks(project) {
  const out = [];
  const walk = (parentId) => {
    for (const t of project.tasks) {
      if (t.parentId !== parentId) continue;
      out.push(t);
      if (t.collapsed) continue;
      walk(t.id);
    }
  };
  walk(null);
  return out;
}

/** WBS-Nummern neu vergeben (1, 1.1, 1.1.2 …). */
export function renumberWbs(project) {
  let n = 0;
  const walk = (parentId, prefix) => {
    for (const t of project.tasks) {
      if (t.parentId !== parentId) continue;
      n++;
      const no = prefix ? `${prefix}.${n}` : String(n);
      t.wbs = no;
      const saveN = n; n = 0;
      walk(t.id, no);
      n = saveN;
    }
  };
  walk(null, '');
  project.tasks.forEach((t) => { if (t.wbs == null) t.wbs = ''; });
}

export function sortTasks(project) {
  // Reihenfolge im Array = Anzeigereihenfolge; nur nach Eltern gruppieren.
  const order = [];
  const walk = (pid) => {
    for (const t of project.tasks) if (t.parentId === pid) { order.push(t); walk(t.id); }
  };
  walk(null);
  const seen = new Set(order.map((t) => t.id));
  project.tasks.forEach((t) => { if (!seen.has(t.id)) order.push(t); });
  project.tasks = order;
}

/** Index-Positionen der Nachbarn (für Ein-/Ausrücken). */
export function prevSibling(project, task) {
  const sib = project.tasks.filter((t) => t.parentId === task.parentId);
  const i = sib.findIndex((t) => t.id === task.id);
  return i > 0 ? sib[i - 1] : null;
}

export function nextSibling(project, task) {
  const sib = project.tasks.filter((t) => t.parentId === task.parentId);
  const i = sib.findIndex((t) => t.id === task.id);
  return i >= 0 && i < sib.length - 1 ? sib[i + 1] : null;
}

/** Alle Nachfolger (transitiv) über Abhängigkeiten. */
export function successorsOf(project, id) {
  const out = [];
  for (const t of project.tasks) {
    if ((t.deps || []).some((d) => d.id === id)) out.push(t);
  }
  return out;
}

export function projectRange(project) {
  let min = null, max = null;
  for (const t of project.tasks) {
    if (t.type === 'summary') continue;
    if (t.start) min = minIso(min, t.start);
    if (t.end) max = maxIso(max, t.end);
  }
  if (!min) { min = project.settings.projectStart || todayIso(); max = addWorkdays(min, 20, project.settings.calendar || defaultCalendar()); }
  return { min, max };
}

export function stats(project) {
  const real = project.tasks.filter((t) => t.type !== 'summary');
  const done = real.filter((t) => t.status === 'done' || t.progress >= 100);
  const progress = real.length
    ? Math.round(real.reduce((s, t) => s + (Number(t.progress) || 0), 0) / real.length)
    : 0;
  const r = projectRange(project);
  return {
    total: real.length,
    done: done.length,
    progress,
    from: r.min,
    to: r.max,
    spanDays: r.min && r.max ? diffDays(r.min, r.max) + 1 : 0,
    late: real.filter((t) => t.deadline && t.end > t.deadline && t.status !== 'done').length,
  };
}

/* ───────── Prüfen / Reparieren / Migrieren ───────── */

export function validateProject(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') { errors.push('Datei enthält kein gültiges Projekt.'); return { ok: false, errors }; }
  if (raw.format && raw.format !== FILE_FORMAT) errors.push(`Unbekanntes Dateiformat "${raw.format}".`);
  if (!Array.isArray(raw.tasks)) errors.push('Feld "tasks" fehlt oder ist keine Liste.');
  return { ok: errors.length === 0, errors };
}

/** Fehlende Felder ergänzen, damit ältere/teilweise Dateien laden. */
export function migrateProject(raw) {
  const p = emptyProject(raw?.meta?.name || 'Projekt');
  const src = raw || {};
  p.meta = Object.assign(p.meta, src.meta || {});
  p.settings = Object.assign(p.settings, src.settings || {});
  p.settings.calendar = normalizeCalendar(p.settings.calendar);
  p.resources = Array.isArray(src.resources) ? src.resources.map((r) => newResource(r)) : [];
  p.pool = normalizePool(src.pool);
  p.views = src.views || {};
  const known = new Set();
  p.tasks = (Array.isArray(src.tasks) ? src.tasks : []).map((t) => {
    const base = newTask({});
    const task = Object.assign(base, t);
    task.id = t.id || base.id;
    if (known.has(task.id)) task.id = uid();
    known.add(task.id);
    task.deps = Array.isArray(t.deps) ? t.deps.filter((d) => d && d.id).map((d) => ({ id: d.id, type: DEP_TYPES[d.type] ? d.type : 'FS', lag: Number(d.lag) || 0 })) : [];
    task.assignees = Array.isArray(t.assignees) ? t.assignees.slice() : [];
    task.tags = Array.isArray(t.tags) ? t.tags.slice() : [];
    task.progress = Math.max(0, Math.min(100, Number(task.progress) || 0));
    if (!STATUS[task.status]) task.status = task.progress >= 100 ? 'done' : 'open';
    if (!PRIORITY[task.priority]) task.priority = 'normal';
    if (task.type === 'milestone') { task.duration = 0; task.end = task.start; }
    task.fromPool = t.fromPool || null;
    return task;
  });
  // Verwaiste Eltern/Abhängigkeiten entfernen
  const ids = new Set(p.tasks.map((t) => t.id));
  p.tasks.forEach((t) => {
    if (t.parentId && !ids.has(t.parentId)) t.parentId = null;
    t.deps = t.deps.filter((d) => ids.has(d.id) && d.id !== t.id);
    if (t.fromPool && !p.pool.some((e) => e.id === t.fromPool)) t.fromPool = null;
  });
  // Zyklen in der Elternschaft auflösen
  p.tasks.forEach((t) => {
    let cur = t.parentId, guard = 0;
    while (cur && guard++ < 200) {
      if (cur === t.id) { t.parentId = null; break; }
      cur = (p.tasks.find((x) => x.id === cur) || {}).parentId;
    }
  });
  sortTasks(p);
  renumberWbs(p);
  return p;
}

export function serializeProject(project) {
  project.meta.modified = new Date().toISOString();
  renumberWbs(project);
  const clean = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    meta: project.meta,
    settings: project.settings,
    resources: project.resources,
    tasks: project.tasks.map((t) => ({
      id: t.id, parentId: t.parentId, wbs: t.wbs, name: t.name, type: t.type,
      start: t.start, end: t.end, duration: t.duration, progress: t.progress,
      status: t.status, priority: t.priority, assignees: t.assignees, deps: t.deps,
      constraint: t.constraint, deadline: t.deadline, color: t.color, notes: t.notes,
      tags: t.tags, collapsed: t.collapsed, fromPool: t.fromPool || null,
    })),
    pool: (project.pool || []).map((e) => ({
      id: e.id, text: e.text, note: e.note, createdAt: e.createdAt,
      placedCount: e.placedCount || 0, placedAt: e.placedAt, done: !!e.done,
    })),
    views: project.views,
  };
  return JSON.stringify(clean, null, 2);
}

/* ───────── Beispielprojekt ───────── */

export function sampleProject() {
  const p = emptyProject('Beispielprojekt – Website-Neulaufbau');
  const cal = p.settings.calendar;
  const start = snapToWorkday(todayIso(), cal, 1);
  p.meta.description = 'Beispielplan zum Ausprobieren. Zeilen ziehen, Abhängigkeiten ändern, Ansichten wechseln.';
  p.settings.projectStart = start;

  const p1 = newResource({ name: 'Anna Weber',  email: 'anna@example.org',  color: '#6366f1' });
  const p2 = newResource({ name: 'Ben Krause',  email: 'ben@example.org',   color: '#22c55e' });
  const p3 = newResource({ name: 'Clara Sander', email: 'clara@example.org', color: '#f59e0b' });
  const p4 = newResource({ name: 'Extern: Agentur', type: 'team', color: '#ec4899' });
  p.resources = [p1, p2, p3, p4];

  const mk = (patch) => {
    const t = newTask(patch);
    if (t.type !== 'milestone') {
      t.end = endFromDuration(t.start, t.duration, cal);
    }
    p.tasks.push(t);
    return t;
  };

  const g1 = mk({ name: 'Konzept & Planung', type: 'summary', start, duration: 1 });
  const a1 = mk({ name: 'Anforderungen sammeln', start, duration: 4, parentId: g1.id, assignees: [p1.id], priority: 'high' });
  const a2 = mk({ name: 'Zielgruppen-Workshop', start: addWorkdays(a1.end, 1, cal), duration: 2, parentId: g1.id, assignees: [p1.id, p2.id] });
  const a3 = mk({ name: 'Konzept freigegeben', type: 'milestone', start: addWorkdays(a2.end, 1, cal), parentId: g1.id, color: '#8b5cf6' });

  const g2 = mk({ name: 'Design', type: 'summary', start: a3.start, duration: 1 });
  const b1 = mk({ name: 'Wireframes', start: a3.start, duration: 5, parentId: g2.id, assignees: [p4.id], color: '#ec4899' });
  const b2 = mk({ name: 'Screendesign', start: addWorkdays(b1.end, 1, cal), duration: 8, parentId: g2.id, assignees: [p4.id], color: '#ec4899', priority: 'high' });
  const b3 = mk({ name: 'Design-Review', start: addWorkdays(b2.end, 1, cal), duration: 1, parentId: g2.id, assignees: [p1.id] });

  const g3 = mk({ name: 'Umsetzung', type: 'summary', start: a3.start, duration: 1 });
  const c1 = mk({ name: 'Datenmodell & API', start: addWorkdays(b2.start, 0, cal), duration: 6, parentId: g3.id, assignees: [p2.id], priority: 'critical' });
  const c2 = mk({ name: 'Frontend-Grundgerüst', start: addWorkdays(b3.end, 1, cal), duration: 5, parentId: g3.id, assignees: [p2.id] });
  const c3 = mk({ name: 'Seiten einbauen', start: addWorkdays(c2.end, 1, cal), duration: 10, parentId: g3.id, assignees: [p2.id, p3.id] });
  const c4 = mk({ name: 'Redaktion Inhalte', start: addWorkdays(b1.end, 1, cal), duration: 12, parentId: g3.id, assignees: [p3.id], color: '#f59e0b' });
  const c5 = mk({ name: 'Tests & Fehlerbehebung', start: addWorkdays(c3.end, 1, cal), duration: 5, parentId: g3.id, assignees: [p2.id, p3.id] });

  const g4 = mk({ name: 'Abschluss', type: 'summary', start: a3.start, duration: 1 });
  const d1 = mk({ name: 'Abnahme mit Kunde', start: addWorkdays(c5.end, 1, cal), duration: 1, parentId: g4.id, assignees: [p1.id], priority: 'high' });
  const d2 = mk({ name: 'Live-Schaltung', type: 'milestone', start: addWorkdays(d1.end, 1, cal), parentId: g4.id, color: '#22c55e' });

  const link = (t, pred, type = 'FS', lag = 0) => t.deps.push({ id: pred.id, type, lag });
  link(a2, a1); link(a3, a2);
  link(b1, a3); link(b2, b1); link(b3, b2);
  link(c1, b2, 'SS', 1); link(c2, b3); link(c3, c2); link(c4, b1, 'SS', 2); link(c5, c3);
  link(d1, c5); link(d1, c4, 'FS', 0); link(d2, d1);

  /* Ideen-Sammelbecken – Aufgaben ohne Termin, zum Ausprobieren */
  const i1 = newPoolEntry({ text: 'Schulung für die Redaktion' });
  const i2 = newPoolEntry({ text: 'Foto-Shooting Produktbilder' });
  const i3 = newPoolEntry({ text: 'Barrierefreiheit prüfen', note: 'Kontrast, Tastaturbedienung, Screenreader', placedCount: 1 });
  p.pool = [i1, i2, i3];
  // eine Aufgabe, die schon aus dem Sammelbecken stammt (türkis, mit Zähler)
  mk({
    name: i3.text, start: addWorkdays(c5.end, 1, cal), duration: 3, parentId: g4.id,
    assignees: [p2.id], color: POOL_COLOR, fromPool: i3.id,
  });

  a1.progress = 100; a1.status = 'done';
  a2.progress = 100; a2.status = 'done';
  b1.progress = 100; b1.status = 'done';
  b2.progress = 65; b2.status = 'running';
  c1.progress = 40; c1.status = 'running';
  c4.progress = 20; c4.status = 'running';
  c2.progress = 10; c2.status = 'running';

  p.tasks.forEach((t) => { if (t.type === 'summary') t.duration = 1; });
  sortTasks(p);
  renumberWbs(p);
  return p;
}
