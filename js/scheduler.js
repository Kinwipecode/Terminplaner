/* ══════════════════════════════════════════════════════════════
   scheduler.js – Terminberechnung.
   · Vorwärtsrechnung: jede Aufgabe startet so früh wie ihre
     Vorgänger es zulassen (FS / SS / FF / SF mit Puffer).
   · Sammelaufgaben werden aus ihren Unteraufgaben zusammengefasst.
   · Rückwärtsrechnung: Puffer und kritischer Pfad.
   · Auto-Planung an  → Termine werden tatsächlich verschoben.
     Auto-Planung aus → nur Konflikte melden, nichts verschieben.
   ══════════════════════════════════════════════════════════════ */

import {
  addWorkdays, workdaysBetween, endFromDuration, durationFromRange,
  maxIso, minIso, todayIso, normalizeCalendar, defaultCalendar, snapToWorkday,
} from './dateutil.js';
import { childrenOf } from './model.js';

const HUGE = 36500; // Sicherheitsgrenze gegen Endlosschleifen

/** Frühestes Startdatum, das ein Vorgänger erzwingt. */
function candidateStart(dep, pred, duration, cal) {
  const lag = Number(dep.lag) || 0;
  const dur = Math.max(0, duration || 0);
  switch (dep.type) {
    case 'SS': return addWorkdays(pred.start, lag, cal);
    case 'FF': return addWorkdays(pred.end, lag - Math.max(0, dur - 1), cal, -1);
    case 'SF': return addWorkdays(pred.start, lag - Math.max(0, dur - 1), cal, -1);
    case 'FS':
    default:   return addWorkdays(pred.end, 1 + lag, cal);
  }
}

/** Spätestes Enddatum, das ein Nachfolger erzwingt (Rückwärtsrechnung). */
function latestFinishFrom(dep, succ, duration, cal) {
  const lag = Number(dep.lag) || 0;
  const dur = Math.max(0, duration || 0);
  switch (dep.type) {
    case 'SS': return addWorkdays(succ.start, -lag + Math.max(0, dur - 1), cal);
    case 'FF': return addWorkdays(succ.end, -lag, cal, -1);
    case 'SF': return addWorkdays(succ.end, -lag + Math.max(0, dur - 1), cal);
    case 'FS':
    default:   return addWorkdays(succ.start, -1 - lag, cal, -1);
  }
}

/**
 * Hauptfunktion.
 * @param {object} project
 * @param {{apply?:boolean}} opts  apply = Termine wirklich schreiben
 * @returns {{violations:Array, critical:Set<string>, slack:Map<string,number>, cycles:string[], changed:boolean}}
 */
export function schedule(project, opts = {}) {
  const apply = opts.apply !== false;
  const cal = normalizeCalendar(project.settings.calendar || defaultCalendar());
  project.settings.calendar = cal;
  const byId = new Map(project.tasks.map((t) => [t.id, t]));
  const projectStart = project.settings.projectStart || todayIso();
  const violations = [];
  const cycles = [];
  const memo = new Map();
  let changed = false;

  const setDates = (task, start, end) => {
    if (task.start !== start || task.end !== end) changed = true;
    task.start = start;
    task.end = end;
  };

  /* ── Vorwärtsrechnung (rekursiv, mit Zyklusschutz) ── */
  const stack = new Set();
  function forward(task) {
    if (memo.has(task.id)) return memo.get(task.id);
    if (stack.has(task.id)) {
      cycles.push(task.id);
      return { start: task.start || projectStart, end: task.end || projectStart };
    }
    stack.add(task.id);
    const kids = childrenOf(project, task.id);

    if (kids.length) {
      // Sammelaufgabe: aus Unteraufgaben zusammenfassen
      let s = null, e = null;
      for (const k of kids) {
        const r = forward(k);
        s = minIso(s, r.start);
        e = maxIso(e, r.end);
      }
      if (task.locked) {
        // Gesperrte Sammelaufgabe: Zeitraum, Fortschritt und Status bleiben stehen.
        if (s && (task.start !== s || task.end !== e)) {
          violations.push({
            taskId: task.id,
            kind: 'lock',
            message: `„${task.name}“ ist gesperrt und bleibt am ${task.start} – aus den Unteraufgaben ergäbe sich ${s} bis ${e}. Schloss öffnen, um das nachzuführen.`,
          });
        }
      } else if (s) {
        setDates(task, s, e);
        const kidsReal = kids.filter((k) => k.type !== 'summary');
        const wsum = kidsReal.reduce((a, k) => a + Math.max(1, k.duration), 0) || 1;
        task.progress = Math.round(kidsReal.reduce((a, k) => a + (Number(k.progress) || 0) * Math.max(1, k.duration), 0) / wsum);
        const allDone = kidsReal.length && kidsReal.every((k) => k.status === 'done' || k.progress >= 100);
        const anyRun = kidsReal.some((k) => k.status === 'running' || (k.progress > 0 && k.progress < 100));
        const anyBlocked = kidsReal.some((k) => k.status === 'blocked');
        task.status = allDone ? 'done' : anyBlocked ? 'blocked' : anyRun ? 'running' : 'open';
      }
      if (s) task.duration = task.locked ? task.duration : durationFromRange(task.start, task.end, cal);
      task.type = 'summary';
    } else {
      // Blattaufgabe
      let est = projectStart;
      let depBound = null;
      for (const dep of task.deps || []) {
        const pred = byId.get(dep.id);
        if (!pred || pred.id === task.id) continue;
        const r = forward(pred);
        const c = candidateStart(dep, r, task.duration, cal);
        if (c) { est = maxIso(est, c); depBound = maxIso(depBound, c); }
      }
      const con = task.constraint && task.constraint.date ? task.constraint : null;
      let start;
      if (con && con.type === 'MSO') start = con.date;
      else if (con && con.type === 'SNET') start = maxIso(est, con.date);
      else if (task.deps && task.deps.length) start = est;   // nur wenn es Vorgänger gibt
      else start = task.start || projectStart;               // freie Aufgabe bleibt, wo sie ist
      // Auf einen Arbeitstag einrasten (sonst stimmen Dauer und Balken nicht überein)
      const snapped = snapToWorkday(start, cal, 1);
      if (snapped !== start && !(con && con.type === 'MSO')) start = snapped;

      if (task.locked) {
        /* Schloss: der Termin steht fest. Die Berechnung wird nur gemeldet,
           damit sichtbar ist, dass die Aufgabe woanders hin müsste. */
        const sollEnd = task.type === 'milestone' ? start : endFromDuration(start, task.duration, cal);
        if (task.start !== start || task.end !== sollEnd) {
          violations.push({
            taskId: task.id,
            kind: 'lock',
            message: `„${task.name}“ ist gesperrt und bleibt am ${task.start} – berechnet wäre ${start}. Schloss öffnen, um den Termin anzupassen.`,
          });
        }
        if (task.type === 'milestone') task.duration = 0;
      } else if (task.type === 'milestone') {
        if (apply) setDates(task, start, start);
        else if (task.start !== start) { task.earliestStart = start; }
        task.duration = 0;
      } else {
        const end = endFromDuration(start, task.duration, cal);
        if (apply) setDates(task, start, end);
        else task.earliestStart = start;
      }

      // Konflikte melden
      if (!apply && depBound && (task.start < depBound)) {
        violations.push({
          taskId: task.id,
          kind: 'dep',
          message: `„${task.name}“ beginnt am ${task.start}, Vorgänger erlauben das erst ab ${depBound}.`,
        });
      }
      if (con && con.type === 'MSO' && depBound && con.date < depBound) {
        violations.push({ taskId: task.id, kind: 'constraint', message: `Fester Start von „${task.name}“ liegt vor dem frühesten möglichen Termin (${depBound}).` });
      }
    }
    stack.delete(task.id);
    const res = { start: task.start, end: task.end };
    memo.set(task.id, res);
    return res;
  }
  for (const t of project.tasks) forward(t);

  /* ── Rückwärtsrechnung: Puffer & kritischer Pfad ── */
  const successors = new Map();
  for (const t of project.tasks) {
    for (const dep of t.deps || []) {
      if (!byId.has(dep.id)) continue;
      if (!successors.has(dep.id)) successors.set(dep.id, []);
      successors.get(dep.id).push({ succ: t, dep });
    }
  }
  // Projektende = spätestes Enddatum
  let projectEnd = projectStart;
  for (const t of project.tasks) if (t.end) projectEnd = maxIso(projectEnd, t.end);
  // Feiertage/Deadlines als Endgrenze
  for (const t of project.tasks) if (t.deadline) projectEnd = maxIso(projectEnd, t.deadline);

  const slack = new Map();
  const critical = new Set();
  const latest = new Map();
  const backStack = new Set();
  function backward(task) {
    if (latest.has(task.id)) return latest.get(task.id);
    if (backStack.has(task.id)) return task.end;
    backStack.add(task.id);
    const succs = successors.get(task.id) || [];
    let lf = null;
    if (succs.length) {
      for (const { succ, dep } of succs) {
        backward(succ);
        const c = latestFinishFrom(dep, succ, task.duration, cal);
        lf = lf === null ? c : minIso(lf, c);
      }
    } else {
      lf = projectEnd;
    }
    if (task.deadline) lf = minIso(lf, task.deadline);
    if (lf < task.end) lf = task.end; // Puffer nie negativ
    backStack.delete(task.id);
    latest.set(task.id, lf);
    const s = Math.max(0, workdaysBetween(task.end, lf, cal) - 1);
    slack.set(task.id, s);
    if (s === 0) critical.add(task.id);
    return lf;
  }
  for (const t of project.tasks) backward(t);

  // Deadlines prüfen
  for (const t of project.tasks) {
    if (t.deadline && t.end > t.deadline && t.status !== 'done') {
      violations.push({ taskId: t.id, kind: 'deadline', message: `„${t.name}“ endet am ${t.end}, Ziel war ${t.deadline}.` });
    }
  }
  // Zyklen in Abhängigkeiten
  for (const id of new Set(cycles)) {
    const t = byId.get(id);
    violations.push({ taskId: id, kind: 'cycle', message: `Abhängigkeitsschleife über „${t ? t.name : id}“ – bitte prüfen.` });
  }

  // Konfliktmarkierungen zurücksetzen (Sperren zählen mit: sie zeigen einen gestauten Termin)
  const conflictIds = new Set(violations.filter((v) => v.kind === 'dep' || v.kind === 'cycle' || v.kind === 'lock').map((v) => v.taskId));
  for (const t of project.tasks) t.conflict = conflictIds.has(t.id);

  return { violations, critical, slack, cycles, changed };
}

/** Nur den kritischen Pfad/Puffer neu berechnen, ohne Termine zu ändern. */
export function analyze(project) {
  return schedule(project, { apply: false });
}

/** Ressourcen-Auslastung je Woche (grobe Übersicht für den Team-Dialog). */
export function workload(project, weeks = 8) {
  const cal = normalizeCalendar(project.settings.calendar || defaultCalendar());
  const start = project.settings.projectStart || todayIso();
  const rows = project.resources.map((r) => ({ resource: r, weeks: [] }));
  const byId = new Map(rows.map((r) => [r.resource.id, r]));
  const weekStart = [];
  let ws = start;
  for (let i = 0; i < weeks; i++) { weekStart.push(ws); ws = addWorkdays(ws, 5, cal); }
  const weekEnd = weekStart.map((s) => addWorkdays(s, 4, cal));
  for (const t of project.tasks) {
    if (t.type === 'summary' || !t.start || !t.end) continue;
    for (const rid of t.assignees || []) {
      const row = byId.get(rid);
      if (!row) continue;
      for (let i = 0; i < weeks; i++) {
        const overlap = workdaysBetween(maxIso(t.start, weekStart[i]), minIso(t.end, weekEnd[i]), cal);
        if (overlap > 0) row.weeks[i] = (row.weeks[i] || 0) + overlap;
      }
    }
  }
  return { weekStart, weekEnd, rows };
}
