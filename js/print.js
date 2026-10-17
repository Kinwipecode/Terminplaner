/* ══════════════════════════════════════════════════════════════
   print.js – Druck- und PDF-Ausgabe.

   Erzeugt aus dem Projekt fertige Seiten im Blattformat A4 oder A3
   (hoch oder quer) und legt sie in #print-root. Danach genügt der
   normale Druckdialog des Browsers – dort „Microsoft Print to PDF“
   wählen und man bekommt eine PDF-Datei mit sauberen Blattgrenzen.

   Der Aufbau rechnet durchgehend in Millimetern, damit die Seiten
   exakt auf das Blatt passen. Bei mehr Inhalt als Platz entstehen
   weitere Blätter (Aufgaben wiederholen sich links, Zeitachse läuft
   nach rechts weiter).
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials, toast } from './ui/dom.js';
import { store } from './store.js';
import {
  STATUS, STATUS_ORDER, PRIORITY, PRIORITY_ORDER, DEP_TYPES, taskById, isSummary,
  stats, projectRange,
} from './model.js';
import {
  addDays, diffDays, startOfWeek, startOfMonth, endOfMonth, isoWeek, monthName,
  dowShort, formatIso, parseIso, todayIso, isWorkday, normalizeCalendar,
} from './dateutil.js';

/* ───────── Blattformate (Millimeter) ───────── */

export const FORMATS = {
  a4h: { label: 'A4 hoch', short: 'A4 hoch', w: 210, h: 297, margin: 12 },
  a4q: { label: 'A4 quer', short: 'A4 quer', w: 297, h: 210, margin: 12 },
  a3h: { label: 'A3 hoch', short: 'A3 hoch', w: 297, h: 420, margin: 14 },
  a3q: { label: 'A3 quer', short: 'A3 quer', w: 420, h: 297, margin: 14 },
};

export const DEFAULT_PRINT = {
  format: 'a4q',
  parts: { cover: true, gantt: true, table: false, calendar: false, board: false, legend: true },
  period: { mode: 'all', from: null, to: null },   // all | custom | upcoming
  raster: 'week',      // day | week | month
  fineness: 'mittel',  // grob | mittel | fein
  details: { deps: true, progress: true, weekends: true, critical: false, deadlines: true, notes: false },
  tableCols: 'main',   // main | all
  onlyFiltered: false,
};

const LS_PRINT = 'tplan.print';

export function loadPrintSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS_PRINT) || '{}'); } catch { /* egal */ }
  return {
    ...DEFAULT_PRINT,
    ...saved,
    parts: { ...DEFAULT_PRINT.parts, ...(saved.parts || {}) },
    details: { ...DEFAULT_PRINT.details, ...(saved.details || {}) },
    period: { ...DEFAULT_PRINT.period, ...(saved.period || {}) },
  };
}

export function savePrintSettings(s) {
  try { localStorage.setItem(LS_PRINT, JSON.stringify(s)); } catch { /* egal */ }
}

/* ───────── Rechnen für den Aufbau ───────── */

function geometry(s) {
  const f = FORMATS[s.format] || FORMATS.a4q;
  const contentW = f.w - 2 * f.margin;
  const contentH = f.h - 2 * f.margin;
  const leftW = Math.min(80, Math.max(44, Math.round(contentW * 0.21)));
  const timelineW = contentW - leftW;
  const rowH = 7, axisH = 10, headH = 13, footH = 7;
  const rowsArea = contentH - headH - axisH - footH;
  const rowsPerPage = Math.max(4, Math.floor(rowsArea / rowH));
  const base = { day: 4.5, week: 1.9, month: 0.7 }[s.raster] || 1.9;
  const factor = { grob: 0.65, mittel: 1, fein: 1.55 }[s.fineness] || 1;
  let dayW = Math.min(base * factor, timelineW / 7);
  const segDays = Math.max(7, Math.floor(timelineW / dayW));
  return { f, contentW, contentH, leftW, timelineW, rowH, axisH, headH, footH, rowsArea, rowsPerPage, dayW, segDays };
}

function printRange(project, s) {
  const r = projectRange(project);
  let from = r.min, to = r.max;
  if (s.period.mode === 'custom') {
    from = s.period.from || from;
    to = s.period.to || to;
  } else if (s.period.mode === 'upcoming') {
    from = todayIso();
  }
  if (!from) from = todayIso();
  if (!to || to < from) to = from;
  return { from: startOfWeek(from), to: addDays(startOfWeek(to), 6) };
}

/** Alle Aufgaben in Baumreihenfolge – zusammengeklappte Zweige eingeschlossen. */
function orderedTasks(project) {
  const out = [];
  const walk = (pid) => {
    for (const t of project.tasks) {
      if (t.parentId !== pid) continue;
      out.push(t);
      walk(t.id);
    }
  };
  walk(null);
  return out;
}

function printTasks(project, s) {
  const list = s.onlyFiltered ? store.visibleTasks() : orderedTasks(project);
  return list.filter((t) => t.start && t.end);
}

function monthsBetween(from, to, max = 36) {
  const out = [];
  let m = startOfMonth(from);
  let guard = 0;
  while (m <= to && out.length < max && guard++ < 200) {
    out.push(m);
    m = addDays(endOfMonth(m), 1);
  }
  return out;
}

/**
 * Seitenplan: welche Blätter entstehen – ohne DOM.
 * Wird sowohl für die Vorschau der Seitenzahl als auch für den
 * eigentlichen Aufbau benutzt, damit beide immer übereinstimmen.
 */
export function planPages(project, s) {
  const g = geometry(s);
  const range = printRange(project, s);
  const tasks = printTasks(project, s);
  const notes = [];
  const list = [];

  if (s.parts.cover) list.push({ kind: 'cover' });

  if (s.parts.gantt) {
    const totalDays = diffDays(range.from, range.to) + 1;
    const segs = Math.max(1, Math.ceil(totalDays / g.segDays));
    const chunks = Math.max(1, Math.ceil(tasks.length / g.rowsPerPage));
    for (let c = 0; c < chunks; c++) {
      for (let k = 0; k < segs; k++) list.push({ kind: 'gantt', chunk: c, seg: k, chunks, segs });
    }
    if (chunks * segs > 40) notes.push(`Gantt ergibt ${chunks * segs} Blätter – größeres Blatt, größeres Raster oder kürzerer Zeitraum wäre handlicher.`);
    if (tasks.length > g.rowsPerPage) notes.push(`Aufgabenliste läuft über ${chunks} Blätter (${g.rowsPerPage} Zeilen je Blatt).`);
  }

  if (s.parts.table) {
    const rowH = 6;
    const rowsPerPage = Math.max(5, Math.floor((g.contentH - g.headH - g.footH - 8) / rowH));
    const pages = Math.max(1, Math.ceil(tasks.length / rowsPerPage));
    for (let i = 0; i < pages; i++) list.push({ kind: 'table', page: i, pages, rowsPerPage });
  }

  if (s.parts.calendar) {
    const months = monthsBetween(range.from, range.to);
    for (const m of months) list.push({ kind: 'calendar', month: m });
    if (months.length > 12) notes.push(`Kalender umfasst ${months.length} Monate – Zeitraum einschränken, wenn es kürzer sein soll.`);
  }

  if (s.parts.board) {
    const maxCards = Math.max(3, Math.floor((g.contentH - g.headH - g.footH - 16) / 12));
    const perCol = STATUS_ORDER.map((st) => tasks.filter((t) => t.status === st && !isSummary(project, t)));
    const maxLen = Math.max(1, ...perCol.map((c) => c.length));
    const pages = Math.max(1, Math.ceil(maxLen / maxCards));
    for (let i = 0; i < pages; i++) list.push({ kind: 'board', page: i, pages, maxCards });
  }

  if (s.parts.legend) list.push({ kind: 'legend' });

  return { list, notes, geometry: g, range, tasks };
}

/* ───────── kleine Helfer ───────── */

function hexA(hex, alpha) {
  const h = String(hex || '#888888').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function barColor(project, t) {
  if (t.color) return t.color;
  const first = (t.assignees || [])[0];
  const r = first ? project.resources.find((x) => x.id === first) : null;
  if (r && r.color) return r.color;
  return (STATUS[t.status] || STATUS.open).color;
}

function depthOf(project, t) {
  let d = 0, cur = t, guard = 0;
  while (cur && cur.parentId && guard++ < 60) { cur = taskById(project, cur.parentId); if (!cur) break; d++; }
  return d;
}

function personNames(project, t) {
  const names = (t.assignees || []).map((id) => (project.resources.find((r) => r.id === id) || {}).name).filter(Boolean);
  if (!names.length) return '';
  return names.map((n) => n.split(/\s+/).slice(-1)[0]).join(', ');
}

function mm(v) { return `${Math.round(v * 1000) / 1000}mm`; }

/* ───────── Seitenrahmen ───────── */

function pageBox(g, s, { title, sub, right, footerLeft, content }) {
  const f = g.f;
  const box = el('div', { class: 'pp', style: { width: mm(f.w), height: mm(f.h), padding: mm(f.margin) } });
  box.appendChild(el('div', { class: 'pp-head' },
    el('div', {},
      el('div', { class: 'ph-title', text: title }),
      sub ? el('div', { class: 'ph-sub', text: sub }) : null),
    el('div', { class: 'ph-right', text: right || '' })));
  box.appendChild(content);
  box.appendChild(el('div', { class: 'pp-foot', style: { left: mm(f.margin), right: mm(f.margin), bottom: mm(Math.max(4, f.margin - 3)) } },
    el('span', { text: footerLeft || '' }),
    el('span', { class: 'pf-right', text: right || '' })));
  return box;
}

/* ───────── Gantt-Blatt ───────── */

function ganttPage(project, s, plan, desc) {
  const g = plan.geometry;
  const cal = normalizeCalendar(project.settings.calendar);
  const totalDays = diffDays(plan.range.from, plan.range.to) + 1;
  const single = desc.segs === 1;
  const segDays = single ? totalDays : g.segDays;
  const segFrom = single ? plan.range.from : addDays(plan.range.from, desc.seg * g.segDays);
  const rawTo = single ? plan.range.to : addDays(segFrom, g.segDays - 1);
  const segTo = rawTo > plan.range.to ? plan.range.to : rawTo;
  const dayW = g.timelineW / segDays;
  const rows = plan.tasks.slice(desc.chunk * g.rowsPerPage, (desc.chunk + 1) * g.rowsPerPage);
  const rowsH = rows.length * g.rowH;

  const wrap = el('div', { class: 'pg-wrap' });

  /* linke Spalte: Nummer + Name */
  const left = el('div', { class: 'pg-left', style: { width: mm(g.leftW) } });
  left.appendChild(el('div', { class: 'pl-head', text: 'Aufgabe' }));
  for (const t of rows) {
    const sum = isSummary(project, t);
    const row = el('div', { class: 'pl-row' + (sum ? ' is-group' : '') });
    row.appendChild(el('span', { class: 'pl-nr', text: t.wbs || '' }));
    const txt = el('div', { class: 'pl-txt', style: { paddingLeft: mm(depthOf(project, t) * 2.4) } });
    txt.appendChild(el('div', { class: 'pl-name', text: (t.type === 'milestone' ? '◆ ' : '') + t.name }));
    const bits = [`${formatIso(t.start, 'short')}–${formatIso(t.end, 'short')}`];
    if (t.type !== 'milestone') bits.push(`${t.duration} AT`);
    if (t.progress) bits.push(`${t.progress}%`);
    const who = personNames(project, t);
    if (who) bits.push(who);
    if (s.details.deadlines && t.deadline) bits.push(`Ziel ${formatIso(t.deadline, 'short')}`);
    txt.appendChild(el('div', { class: 'pl-sub', text: bits.join(' · ') }));
    row.appendChild(txt);
    left.appendChild(row);
  }
  left.appendChild(el('div', { style: { height: mm(g.rowsArea - rowsH) } }));
  wrap.appendChild(left);

  /* Zeitachse */
  const track = el('div', { class: 'pg-track', style: { width: mm(g.timelineW) } });

  // Kopf: grobe und feine Einteilung – die feine Einheit folgt der gewählten
  // Einstellung und wird nur gröber, wenn die Beschriftung sonst zu eng würde.
  const axis = el('div', { class: 'pg-axis' });
  const coarse = []; const fine = [];
  let unit = s.raster;
  if (unit === 'day' && dayW < 3.2) unit = 'week';
  if (unit === 'day' && dayW < 1.15) unit = 'month';
  if (unit === 'week' && dayW * 7 < 6) unit = 'month';
  const coarseUnit = unit === 'month' ? 'year' : 'month';

  const unitsOf = (kind, from, to) => {
    const out = [];
    if (kind === 'day') {
      for (let d = from; d <= to; d = addDays(d, 1)) out.push({ from: d, to: d, label: String(parseIso(d).getUTCDate()) });
    } else if (kind === 'week') {
      for (let d = startOfWeek(from); d <= to; d = addDays(d, 7)) {
        const e = addDays(d, 6);
        out.push({ from: d < from ? from : d, to: e > to ? to : e, label: 'KW ' + isoWeek(d) });
      }
    } else if (kind === 'month') {
      for (let d = from; d <= to;) {
        const dt = parseIso(d);
        const e0 = endOfMonth(d);
        const e = e0 > to ? to : e0;
        out.push({ from: d, to: e, label: monthName(dt.getUTCMonth(), true) });
        d = addDays(e, 1);
      }
    } else {
      for (let d = from; d <= to;) {
        const dt = parseIso(d);
        const y0 = `${dt.getUTCFullYear()}-12-31`;
        const e = y0 > to ? to : y0;
        out.push({ from: d, to: e, label: String(dt.getUTCFullYear()) });
        d = addDays(e, 1);
      }
    }
    return out;
  };

  fine.push(...unitsOf(unit, segFrom, segTo));
  coarse.push(...unitsOf(coarseUnit, segFrom, segTo));
  for (const c of coarse) {
    const x = diffDays(segFrom, c.from) * dayW;
    const w = (diffDays(c.from, c.to) + 1) * dayW;
    const label = coarseUnit === 'month'
      ? `${monthName(parseIso(c.from).getUTCMonth())} ${parseIso(c.from).getUTCFullYear()}`
      : c.label;
    axis.appendChild(el('div', { class: 'pa-coarse', style: { left: mm(x), width: mm(w) }, text: label }));
  }
  for (const f2 of fine) {
    const x = diffDays(segFrom, f2.from) * dayW;
    const w = (diffDays(f2.from, f2.to) + 1) * dayW;
    axis.appendChild(el('div', { class: 'pa-fine', style: { left: mm(x), width: mm(w), lineHeight: mm(5) }, text: w > 6 ? f2.label : '' }));
  }
  track.appendChild(axis);

  /* Raster, Wochenenden, Balken */
  const area = el('div', { class: 'pg-rows', style: { height: mm(rowsH), position: 'relative' } });

  for (let i = 0; i < rows.length; i++) {
    const t = rows[i];
    const sum = isSummary(project, t);
    area.appendChild(el('div', { class: 'pg-row' + (sum ? ' is-group' : ''), style: { top: mm(i * g.rowH), height: mm(g.rowH) } }));
  }
  if (s.details.weekends) {
    for (let d = segFrom; d <= segTo; d = addDays(d, 1)) {
      if (isWorkday(d, cal)) continue;
      const x = diffDays(segFrom, d) * dayW;
      area.appendChild(el('div', { class: cal.holidays.includes(d) ? 'pg-hol' : 'pg-wknd', style: { left: mm(x), width: mm(dayW) } }));
    }
  }
  for (const f2 of fine) {
    const x = diffDays(segFrom, f2.from) * dayW;
    area.appendChild(el('div', { class: 'pg-vline', style: { left: mm(x) } }));
  }
  const today = todayIso();
  if (today >= segFrom && today <= segTo) {
    area.appendChild(el('div', { class: 'pg-today', style: { left: mm(diffDays(segFrom, today) * dayW + dayW / 2) } }));
  }

  const rowIndex = new Map();
  rows.forEach((t, i) => rowIndex.set(t.id, i));

  for (const t of rows) {
    const i = rowIndex.get(t.id);
    const sum = isSummary(project, t);
    const cy = i * g.rowH + g.rowH / 2;
    let x = diffDays(segFrom, t.start) * dayW;
    let w = (diffDays(t.start, t.end) + 1) * dayW;
    if (x < 0) { w += x; x = 0; }
    if (x + w > g.timelineW) w = g.timelineW - x;
    if (w <= 0) continue;
    const color = barColor(project, t);

    if (t.type === 'milestone') {
      const size = 2.6;
      area.appendChild(el('div', {
        class: 'pg-ms',
        style: {
          left: mm(x + dayW / 2 - size / 2), top: mm(cy - size / 2),
          background: color,
          outline: s.details.critical && store.critical.has(t.id) ? '.4mm solid #c62828' : 'none',
        },
      }));
      continue;
    }

    const barH = sum ? 2.6 : 3.6;
    const bar = el('div', {
      class: 'pg-bar' + (sum ? ' is-sum' : '') + (s.details.critical && store.critical.has(t.id) ? ' is-crit' : ''),
      style: {
        left: mm(x), top: mm(cy - barH / 2), width: mm(w), height: mm(barH),
        background: sum ? 'transparent' : hexA(color, .85),
      },
    });
    if (sum) bar.appendChild(el('div', { class: 'pb-sum' }));
    if (s.details.progress && t.progress > 0) {
      bar.appendChild(el('div', { class: 'pb-done', style: { width: `${Math.min(100, t.progress)}%` } }));
    }
    if (!sum && w > 22) bar.appendChild(el('div', { class: 'pb-label', text: t.name }));
    area.appendChild(bar);
  }

  /* Abhängigkeitspfeile */
  if (s.details.deps) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'pg-svg');
    svg.setAttribute('width', mm(g.timelineW));
    svg.setAttribute('height', mm(rowsH));
    svg.setAttribute('viewBox', `0 0 ${g.timelineW} ${rowsH}`);
    const pos = (t) => {
      const x1s = diffDays(segFrom, t.start) * dayW;
      const x1e = (diffDays(segFrom, t.start) + diffDays(t.start, t.end) + 1) * dayW;
      return { x1s, x1e };
    };
    for (const t of rows) {
      for (const dep of t.deps || []) {
        const pred = taskById(project, dep.id);
        if (!pred || !rowIndex.has(pred.id) || !rowIndex.has(t.id)) continue;
        const p1 = pos(pred), p2 = pos(t);
        let x1 = p1.x1e, x2 = p2.x1s;
        if (dep.type === 'SS') x1 = p1.x1s;
        if (dep.type === 'FF') x2 = p2.x1e;
        if (dep.type === 'SF') { x1 = p1.x1s; x2 = p2.x1e; }
        if (x1 > g.timelineW || x2 < 0) continue;
        const y1 = rowIndex.get(pred.id) * g.rowH + g.rowH / 2;
        const y2 = rowIndex.get(t.id) * g.rowH + g.rowH / 2;
        const path = document.createElementNS(svgNS, 'path');
        const crit = store.critical.has(pred.id) && store.critical.has(t.id) && s.details.critical;
        path.setAttribute('class', crit ? 'crit' : '');
        const gap = x2 - x1;
        let d;
        if (gap >= 3) d = `M${x1},${y1} H${x1 + 1.5} V${y2} H${x2 - 1.2}`;
        else {
          const bx = x1 + 2;
          const my = y1 + (y2 > y1 ? 2.4 : -2.4);
          d = `M${x1},${y1} H${bx} V${my} H${x2 - 3} V${y2} H${x2 - 1.2}`;
        }
        path.setAttribute('d', d);
        svg.appendChild(path);
        const head = document.createElementNS(svgNS, 'path');
        head.setAttribute('class', 'arrowhead');
        head.setAttribute('d', `M${x2 - 1.2},${y2 - 0.7} L${x2},${y2} L${x2 - 1.2},${y2 + 0.7} Z`);
        svg.appendChild(head);
      }
    }
    area.appendChild(svg);
  }

  track.appendChild(area);
  wrap.appendChild(track);

  const sub = `${FORMATS[s.format].short} · Zeitraum ${formatIso(segFrom)} bis ${formatIso(segTo)}`
    + (desc.chunks > 1 ? ` · Aufgaben ${desc.chunk + 1}/${desc.chunks}` : '');
  return pageBox(plan.geometry, s, {
    title: project.meta.name,
    sub,
    right: 'Gantt-Diagramm',
    footerLeft: `erstellt ${formatIso(todayIso(), 'long')}`,
    content: wrap,
  });
}

/* ───────── Tabellenblatt ───────── */

function tablePage(project, s, plan, desc) {
  const g = plan.geometry;
  const rows = plan.tasks.slice(desc.page * desc.rowsPerPage, (desc.page + 1) * desc.rowsPerPage);
  const all = s.tableCols === 'all';
  const cols = all
    ? [
        { k: 'wbs', t: 'Nr.', w: '5%' }, { k: 'name', t: 'Aufgabe', w: '22%' },
        { k: 'start', t: 'Beginn', w: '8%' }, { k: 'end', t: 'Ende', w: '8%' },
        { k: 'dur', t: 'Dauer', w: '5%', num: 1 }, { k: 'prog', t: 'Fortschritt', w: '9%' },
        { k: 'status', t: 'Status', w: '8%' }, { k: 'prio', t: 'Prio', w: '6%' },
        { k: 'who', t: 'Wer', w: '9%' }, { k: 'deps', t: 'Vorgänger', w: '10%' },
        { k: 'dead', t: 'Ziel', w: '8%' }, { k: 'notes', t: 'Notiz', w: '10%' },
      ]
    : [
        { k: 'wbs', t: 'Nr.', w: '6%' }, { k: 'name', t: 'Aufgabe', w: '38%' },
        { k: 'start', t: 'Beginn', w: '11%' }, { k: 'end', t: 'Ende', w: '11%' },
        { k: 'dur', t: 'Dauer', w: '7%', num: 1 }, { k: 'prog', t: 'Fortschritt', w: '12%' },
        { k: 'status', t: 'Status', w: '10%' }, { k: 'who', t: 'Wer', w: '15%' },
      ];

  const table = el('table', { class: 'pt-table' });
  const thead = el('thead');
  const htr = el('tr');
  for (const c of cols) htr.appendChild(el('th', { class: c.num ? 'num' : '', style: { width: c.w }, text: c.t }));
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = el('tbody');
  for (const t of rows) {
    const sum = isSummary(project, t);
    const tr = el('tr', { class: sum ? 'grp' : '' });
    const cell = (key) => {
      switch (key) {
        case 'wbs': return el('td', { class: 'num', style: { fontFamily: 'var(--mono)', fontSize: '6.5pt' }, text: t.wbs || '' });
        case 'name': return el('td', { class: 'nm', style: { paddingLeft: mm(1.2 + depthOf(project, t) * 2) }, text: (t.type === 'milestone' ? '◆ ' : '') + t.name });
        case 'start': return el('td', { text: formatIso(t.start) });
        case 'end': return el('td', { text: formatIso(t.end) });
        case 'dur': return el('td', { class: 'num', text: String(t.duration) });
        case 'prog': return el('td', {}, el('div', { style: { display: 'flex', alignItems: 'center', gap: '1.5mm' } },
          el('div', { class: 'pt-bar', style: { flex: '1' } }, el('i', { style: { width: t.progress + '%' } })),
          el('span', { style: { fontSize: '6.5pt', color: 'var(--p-fg-3)', width: '7mm' }, text: t.progress + '%' })));
        case 'status': return el('td', {}, el('span', { class: 'pt-dot', style: { background: STATUS[t.status].color } }), STATUS[t.status].label);
        case 'prio': return el('td', { text: PRIORITY[t.priority] ? PRIORITY[t.priority].label : '–' });
        case 'who': return el('td', { class: 'nm', text: personNames(project, t) || '–' });
        case 'deps': return el('td', { class: 'nm', text: (t.deps || []).map((d) => {
          const p = taskById(project, d.id);
          const lag = d.lag ? (d.lag > 0 ? `+${d.lag}` : String(d.lag)) : '';
          return `${p ? (p.wbs || p.name) : '?'} ${d.type}${lag}`;
        }).join(', ') || '–' });
        case 'dead': return el('td', { text: t.deadline ? formatIso(t.deadline) : '–' });
        case 'notes': return el('td', { class: 'nm', text: (t.notes || '').replace(/\s+/g, ' ') });
        default: return el('td');
      }
    };
    for (const c of cols) tr.appendChild(cell(c.k));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return pageBox(g, s, {
    title: project.meta.name,
    sub: `Aufgabenliste${desc.pages > 1 ? ` · Blatt ${desc.page + 1}/${desc.pages}` : ''}`,
    right: 'Tabelle',
    footerLeft: `erstellt ${formatIso(todayIso(), 'long')}`,
    content: table,
  });
}

/* ───────── Kalenderblatt ───────── */

function calendarPage(project, s, plan, desc) {
  const g = plan.geometry;
  const cal = normalizeCalendar(project.settings.calendar);
  const anchor = desc.month;
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(last), 6);
  const today = todayIso();

  const cellW = g.contentW / 7;
  const areaH = g.contentH - g.headH - 6 - g.footH;
  const cellH = areaH / 6;

  const grid = el('div', { class: 'pc-grid', style: { gridTemplateRows: `6mm repeat(6, ${mm(cellH)})` } });
  for (let i = 0; i < 7; i++) grid.appendChild(el('div', { class: 'pc-dow', text: dowShort((i + 1) % 7) }));

  const byDay = new Map();
  for (const t of plan.tasks) {
    if (isSummary(project, t)) continue;
    let d = t.start < gridStart ? gridStart : t.start;
    const e = t.end > gridEnd ? gridEnd : t.end;
    let guard = 0;
    for (; d <= e && guard++ < 40; d = addDays(d, 1)) {
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d).push(t);
    }
  }

  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    const dt = parseIso(day);
    const inMonth = day >= first && day <= last;
    const cell = el('div', {
      class: 'pc-cell' + (inMonth ? '' : ' out') + (isWorkday(day, cal) ? '' : ' wknd') + (day === today ? ' today' : ''),
    });
    cell.appendChild(el('div', { class: 'pc-day' },
      el('span', { text: String(dt.getUTCDate()) }),
      dt.getUTCDate() === 1 ? el('span', { text: monthName(dt.getUTCMonth(), true) }) : null));
    for (const t of (byDay.get(day) || []).slice(0, 6)) {
      cell.appendChild(el('div', {
        class: 'pc-ev' + (t.status === 'done' ? ' done' : ''),
        style: { borderLeftColor: barColor(project, t) },
        text: (t.type === 'milestone' ? '◆ ' : '') + t.name,
      }));
    }
    if ((byDay.get(day) || []).length > 6) {
      cell.appendChild(el('div', { class: 'pc-ev', text: `+${byDay.get(day).length - 6} weitere` }));
    }
    grid.appendChild(cell);
  }

  return pageBox(g, s, {
    title: project.meta.name,
    sub: `${monthName(parseIso(first).getUTCMonth())} ${parseIso(first).getUTCFullYear()}`,
    right: 'Kalender',
    footerLeft: `erstellt ${formatIso(todayIso(), 'long')}`,
    content: grid,
  });
}

/* ───────── Board-Blatt ───────── */

function boardPage(project, s, plan, desc) {
  const g = plan.geometry;
  const wrap = el('div', { class: 'pb-cols' });
  const tasks = plan.tasks.filter((t) => !isSummary(project, t));
  for (const st of STATUS_ORDER) {
    const list = tasks.filter((t) => t.status === st);
    const slice = list.slice(desc.page * desc.maxCards, (desc.page + 1) * desc.maxCards);
    const col = el('div', { class: 'pb-col' });
    col.appendChild(el('div', { class: 'pb-col-head' },
      el('span', { class: 'pt-dot', style: { background: STATUS[st].color, margin: '0' } }),
      el('span', { text: STATUS[st].label }),
      el('span', { style: { marginLeft: 'auto', color: 'var(--p-fg-3)' }, text: `${list.length}` })));
    const body = el('div', { class: 'pb-col-body' });
    for (const t of slice) {
      const card = el('div', { class: 'pb-card', style: { borderLeftColor: barColor(project, t) } });
      card.appendChild(el('div', { class: 'pbc-t', text: (t.type === 'milestone' ? '◆ ' : '') + t.name }));
      const meta = el('div', { class: 'pbc-m' });
      meta.appendChild(el('span', { text: `${formatIso(t.start, 'short')}–${formatIso(t.end, 'short')}` }));
      meta.appendChild(el('span', { text: `${t.progress}%` }));
      const who = personNames(project, t);
      if (who) meta.appendChild(el('span', { text: who }));
      if (s.details.deadlines && t.deadline) meta.appendChild(el('span', { text: `Ziel ${formatIso(t.deadline, 'short')}` }));
      card.appendChild(meta);
      body.appendChild(card);
    }
    if (!slice.length) body.appendChild(el('div', { class: 'pbc-m', text: '–' }));
    col.appendChild(body);
    wrap.appendChild(col);
  }
  return pageBox(g, s, {
    title: project.meta.name,
    sub: `Board nach Status${desc.pages > 1 ? ` · Blatt ${desc.page + 1}/${desc.pages}` : ''}`,
    right: 'Board',
    footerLeft: `erstellt ${formatIso(todayIso(), 'long')}`,
    content: wrap,
  });
}

/* ───────── Deckblatt ───────── */

function coverPage(project, s, plan) {
  const g = plan.geometry;
  const st = stats(project);
  const cal = normalizeCalendar(project.settings.calendar);
  const wrap = el('div', { class: 'pcv' });
  const top = el('div', { class: 'pcv-top' });
  top.appendChild(el('div', { class: 'pcv-title', text: project.meta.name }));
  top.appendChild(el('div', { class: 'pcv-sub', text: `Projektplan · Stand ${formatIso(todayIso(), 'long')}` }));
  wrap.appendChild(top);

  if (project.meta.description) wrap.appendChild(el('div', { class: 'pcv-desc', text: project.meta.description }));

  const facts = el('div', { class: 'pcv-facts' });
  const fact = (k, v) => el('div', { class: 'pcv-fact' }, el('div', { class: 'pf-k', text: k }), el('div', { class: 'pf-v', text: v }));
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  facts.appendChild(fact('Projektbeginn', formatIso(project.settings.projectStart, 'long')));
  facts.appendChild(fact('Zeitraum', `${formatIso(st.from)} – ${formatIso(st.to)}`));
  facts.appendChild(fact('Aufgaben', `${st.total} (davon ${st.done} erledigt)`));
  facts.appendChild(fact('Fortschritt', `${st.progress} %`));
  facts.appendChild(fact('Meilensteine', String(project.tasks.filter((t) => t.type === 'milestone').length)));
  facts.appendChild(fact('Beteiligte', String(project.resources.length)));
  facts.appendChild(fact('Arbeitstage', cal.workdays.slice().sort().map((d) => dayNames[d]).join(' ')));
  facts.appendChild(fact('Freie Tage', String(cal.holidays.length)));
  if (project.meta.author) facts.appendChild(fact('Verantwortlich', project.meta.author));
  if (st.late) facts.appendChild(fact('Über Ziel', `${st.late} Aufgabe(n)`));
  wrap.appendChild(facts);

  const groups = project.tasks.filter((t) => !t.parentId && isSummary(project, t));
  if (groups.length) {
    const bars = el('div', { class: 'pcv-bars' });
    bars.appendChild(el('div', { class: 'pf-k', text: 'Fortschritt der Hauptgruppen' }));
    for (const grp of groups.slice(0, 12)) {
      bars.appendChild(el('div', { class: 'pcv-barline' },
        el('span', { class: 'pl-n', text: grp.name }),
        el('span', { class: 'pl-b' }, el('i', { style: { width: grp.progress + '%' } })),
        el('span', { class: 'pl-p', text: grp.progress + '%' })));
    }
    wrap.appendChild(bars);
  }

  wrap.appendChild(el('div', { class: 'pcv-foot', text: '' }));
  return pageBox(g, s, {
    title: '',
    sub: '',
    right: '',
    footerLeft: `Erstellt mit Terminplanung · Blattformat ${FORMATS[s.format].label} · ${formatIso(todayIso(), 'long')}`,
    content: wrap,
  });
}

/* ───────── Legendenblatt ───────── */

function legendPage(project, s, plan) {
  const g = plan.geometry;
  const grid = el('div', { class: 'plg' });

  const box = (title, items) => {
    const b = el('div', { class: 'plg-box' }, el('h4', { text: title }));
    for (const it of items) b.appendChild(it);
    return b;
  };
  const item = (swatch, text) => el('div', { class: 'plg-item' }, swatch, el('span', { text }));

  grid.appendChild(box('Status', STATUS_ORDER.map((k) => item(
    el('span', { class: 'plg-swatch', style: { background: STATUS[k].color } }), STATUS[k].label))));

  grid.appendChild(box('Priorität', PRIORITY_ORDER.map((k) => item(
    el('span', { class: 'plg-swatch', style: { background: PRIORITY[k].color } }), PRIORITY[k].label))));

  grid.appendChild(box('Balken und Zeichen', [
    item(el('span', { class: 'plg-swatch', style: { background: '#5b8def' } }), 'Aufgabe – Balken von Beginn bis Ende'),
    item(el('span', { class: 'plg-swatch', style: { background: '#5b8def', position: 'relative' } }, el('i', { style: { display: 'block', height: '100%', width: '45%', background: 'rgba(0,0,0,.42)' } })), 'dunkler Teil = bereits erledigt (%)'),
    item(el('span', { class: 'plg-swatch', style: { background: '#98a2b3' } }), 'Sammelaufgabe – aus Unteraufgaben zusammengefasst'),
    item(el('span', { class: 'plg-diamond', style: { background: '#8b5cf6' } }), 'Meilenstein (ein Tag, keine Dauer)'),
    item(el('span', { class: 'plg-swatch', style: { background: 'transparent', border: '.4mm solid #c62828' } }), 'kritischer Pfad (kein Puffer)'),
  ]));

  grid.appendChild(box('Abhängigkeiten', [
    el('div', { class: 'plg-note', text: Object.entries(DEP_TYPES).map(([k, v]) => `${k} = ${v}`).join(' · ') }),
    el('div', { class: 'plg-note', style: { marginTop: '2mm' }, text: 'Pfeile zeigen vom Vorgänger zum Nachfolger. Läuft eine Verknüpfung über ein Blattende hinaus, wird sie dort nicht gezeichnet.' }),
  ]));

  grid.appendChild(box('Dieser Ausdruck', [
    el('div', { class: 'plg-note', text: `Blattformat: ${FORMATS[s.format].label} (${FORMATS[s.format].w} × ${FORMATS[s.format].h} mm)` }),
    el('div', { class: 'plg-note', text: `Zeitraum: ${formatIso(plan.range.from)} bis ${formatIso(plan.range.to)}` }),
    el('div', { class: 'plg-note', text: `Gantt-Raster: ${({ day: 'Tage', week: 'Wochen', month: 'Monate' })[s.raster]}, Feinheit ${s.fineness}` }),
    el('div', { class: 'plg-note', text: `Aufgaben: ${plan.tasks.length}${s.onlyFiltered ? ' (gefiltert)' : ''}` }),
    el('div', { class: 'plg-note', text: `Wochenenden und Feiertage sind schattiert, die rote Linie ist heute.` }),
  ]));

  grid.appendChild(box('Blattübersicht', plan.list.map((d, i) => {
    const name = { cover: 'Deckblatt', gantt: 'Gantt', table: 'Tabelle', calendar: 'Kalender', board: 'Board', legend: 'Legende' }[d.kind];
    const extra = d.kind === 'gantt' ? ` (Aufgaben ${d.chunk + 1}/${d.chunks}, Zeitachse ${d.seg + 1}/${d.segs})`
      : (d.kind === 'calendar' ? ` (${monthName(parseIso(d.month).getUTCMonth())} ${parseIso(d.month).getUTCFullYear()})` : '');
    return el('div', { class: 'plg-note', text: `${i + 1}. ${name}${extra}` });
  })));

  return pageBox(g, s, {
    title: project.meta.name,
    sub: 'Legende und Angaben zum Ausdruck',
    right: 'Legende',
    footerLeft: `erstellt ${formatIso(todayIso(), 'long')}`,
    content: grid,
  });
}

/* ───────── Aufbau ───────── */

let pageStyleEl = null;

function setPageRule(s) {
  const f = FORMATS[s.format] || FORMATS.a4q;
  if (!pageStyleEl) {
    pageStyleEl = document.createElement('style');
    pageStyleEl.id = 'print-page-style';
    document.head.appendChild(pageStyleEl);
  }
  pageStyleEl.textContent = `@page { size: ${f.w}mm ${f.h}mm; margin: 0; }`;
}

/**
 * Baut alle Druckseiten in #print-root auf.
 * @returns {{pages:number, notes:string[]}}
 */
export function buildPrintLayout(project, s) {
  const root = document.getElementById('print-root');
  if (!root) return { pages: 0, notes: ['Druckbereich fehlt.'] };
  const plan = planPages(project, s);
  clear(root);
  setPageRule(s);
  for (const desc of plan.list) {
    let node = null;
    if (desc.kind === 'cover') node = coverPage(project, s, plan);
    else if (desc.kind === 'gantt') node = ganttPage(project, s, plan, desc);
    else if (desc.kind === 'table') node = tablePage(project, s, plan, desc);
    else if (desc.kind === 'calendar') node = calendarPage(project, s, plan, desc);
    else if (desc.kind === 'board') node = boardPage(project, s, plan, desc);
    else if (desc.kind === 'legend') node = legendPage(project, s, plan);
    if (node) root.appendChild(node);
  }
  root.dataset.pages = String(plan.list.length);
  root.dataset.built = new Date().toISOString();
  return { pages: plan.list.length, notes: plan.notes };
}

/** Drucken bzw. PDF erzeugen. */
export function printNow(project, s) {
  const res = buildPrintLayout(project, s);
  const oldTitle = document.title;
  const oldTheme = document.documentElement.dataset.theme;
  // Auf Papier immer hell drucken
  document.documentElement.dataset.theme = 'hell';
  document.title = `${project.meta.name} – Projektplan ${formatIso(todayIso())}`;
  const restore = () => {
    document.documentElement.dataset.theme = oldTheme;
    document.title = oldTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  setTimeout(() => {
    window.print();
    // Falls kein afterprint kommt (manche Browser), spätestens nach 2 Minuten zurücksetzen
    setTimeout(restore, 120000);
  }, 60);
  return res;
}

/** Wird vom Browser bei Strg+P aufgerufen – Layout notfalls erzeugen. */
export function ensurePrintLayout(project, s) {
  const root = document.getElementById('print-root');
  if (!root || !root.children.length) buildPrintLayout(project, s || loadPrintSettings());
}

/* ───────── Auswahlfenster ───────── */

export function openPrintDialog() {
  const project = store.project;
  const s = loadPrintSettings();
  let built = null;

  const modalEl = document.createElement('div');
  const api = openModalRaw('Drucken / PDF erzeugen', modalEl);
  const body = modalEl;
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '12px';

  const row = (label, ...kids) => el('div', { class: 'field' }, el('label', { text: label }), ...kids);
  const seg = (options, value, onPick) => {
    const wrap = el('div', { class: 'segmented' });
    for (const o of options) {
      const b = el('button', { class: o.v === value ? 'is-active' : '', text: o.t, onclick: () => { onPick(o.v); } });
      b.dataset.v = o.v;
      wrap.appendChild(b);
    }
    return wrap;
  };
  const refreshSeg = (wrap, value) => {
    for (const b of wrap.children) b.classList.toggle('is-active', b.dataset.v === String(value));
  };
  const check = (label, checked, onChange) => {
    const input = el('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) });
    return el('label', { class: 'toggle', style: { gap: '8px' } }, input, el('span', { class: 'track' }), el('span', { text: label }));
  };
  const chip = (label, on) => el('button', { class: 'pick' + (on ? ' on' : ''), text: label });

  /* Blattformat */
  const fmtSeg = seg(Object.entries(FORMATS).map(([v, f]) => ({ v, t: f.label })), s.format, (v) => { s.format = v; refreshSeg(fmtSeg, v); update(); });
  body.appendChild(row('Blattformat (A4 oder A3)', fmtSeg));

  /* Inhalt */
  const partsRow = el('div', { class: 'chip-row' });
  for (const [key, label] of [['cover', 'Deckblatt'], ['gantt', 'Gantt-Diagramm'], ['table', 'Tabelle'], ['calendar', 'Kalender'], ['board', 'Board'], ['legend', 'Legende']]) {
    const b = chip(label, s.parts[key]);
    b.onclick = () => { s.parts[key] = !s.parts[key]; b.classList.toggle('on', s.parts[key]); update(); };
    partsRow.appendChild(b);
  }
  body.appendChild(row('Was soll aufs Papier?', partsRow));

  /* Zeitraum */
  const fromI = el('input', { type: 'date', value: s.period.from || '' });
  const toI = el('input', { type: 'date', value: s.period.to || '' });
  const upd = () => { s.period.from = fromI.value || null; s.period.to = toI.value || null; update(); };
  fromI.onchange = upd; toI.onchange = upd;
  const periodSeg = seg([
    { v: 'all', t: 'gesamtes Projekt' },
    { v: 'upcoming', t: 'ab heute' },
    { v: 'custom', t: 'eigener Zeitraum' },
  ], s.period.mode, (v) => { s.period.mode = v; refreshSeg(periodSeg, v); dates.style.opacity = v === 'custom' ? '1' : '.4'; update(); });
  const dates = el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', opacity: s.period.mode === 'custom' ? '1' : '.4' } },
    el('span', { class: 'hint', text: 'von' }), fromI, el('span', { class: 'hint', text: 'bis' }), toI);
  body.appendChild(row('Zeitraum', periodSeg, dates));

  /* Gantt-Feinteilung */
  const rasterSeg = seg([{ v: 'day', t: 'Tage' }, { v: 'week', t: 'Wochen' }, { v: 'month', t: 'Monate' }], s.raster, (v) => { s.raster = v; refreshSeg(rasterSeg, v); update(); });
  const fineSeg = seg([{ v: 'grob', t: 'grob (viel Zeit je Blatt)' }, { v: 'mittel', t: 'mittel' }, { v: 'fein', t: 'fein (wenig Zeit je Blatt)' }], s.fineness, (v) => { s.fineness = v; refreshSeg(fineSeg, v); update(); });
  body.appendChild(row('Gantt: Raster der Zeitachse', rasterSeg, fineSeg));

  /* Details */
  const detRow = el('div', { class: 'chip-row' });
  const detLabels = { deps: 'Abhängigkeitspfeile', progress: 'Fortschritt', weekends: 'Wochenenden/Feiertage', critical: 'kritischer Pfad', deadlines: 'Zieltermine' };
  for (const [key, label] of Object.entries(detLabels)) {
    const b = chip(label, s.details[key]);
    b.onclick = () => { s.details[key] = !s.details[key]; b.classList.toggle('on', s.details[key]); update(); };
    detRow.appendChild(b);
  }
  body.appendChild(row('Einzelheiten im Gantt', detRow));

  /* Tabelle */
  const colsSeg = seg([{ v: 'main', t: 'Hauptspalten' }, { v: 'all', t: 'alle Spalten' }], s.tableCols, (v) => { s.tableCols = v; refreshSeg(colsSeg, v); update(); });
  body.appendChild(row('Tabelle: Spalten', colsSeg));

  /* Aufgabenauswahl */
  const filtSeg = seg([{ v: 'all', t: 'alle Aufgaben' }, { v: 'filter', t: 'nur die gefilterten' }], s.onlyFiltered ? 'filter' : 'all', (v) => { s.onlyFiltered = v === 'filter'; refreshSeg(filtSeg, v); update(); });
  body.appendChild(row('Welche Aufgaben?', filtSeg));

  /* Vorschau der Seitenzahl */
  const info = el('div', { class: 'warnbox', style: { color: 'var(--fg-2)', background: 'var(--bg-3)', borderColor: 'var(--line)' } });
  body.appendChild(info);

  const hint = el('div', { class: 'hint', text: 'Im Druckdialog als Drucker „Microsoft Print to PDF“ (oder einen anderen PDF-Drucker) wählen – die Blätter werden genau in A4/A3 ausgegeben. Ränder auf „Standard“ bzw. „Keine“ stellen, Hintergrundgrafiken einschalten.' });
  body.appendChild(hint);

  function update() {
    const plan = planPages(project, s);
    const counts = {};
    for (const d of plan.list) counts[d.kind] = (counts[d.kind] || 0) + 1;
    const names = { cover: 'Deckblatt', gantt: 'Gantt', table: 'Tabelle', calendar: 'Kalender', board: 'Board', legend: 'Legende' };
    const parts = Object.entries(counts).map(([k, v]) => `${names[k]} ${v}`).join(' · ');
    info.innerHTML = `<b>${plan.list.length} Blatt ${FORMATS[s.format].label}</b> (${FORMATS[s.format].w} × ${FORMATS[s.format].h} mm)<br>`
      + (parts ? parts : 'kein Inhalt gewählt')
      + (plan.notes.length ? `<br><span style="color:var(--warn)">${plan.notes.join('<br>')}</span>` : '');
    savePrintSettings(s);
  }
  update();

  /* Fußzeile mit Aktionen */
  const foot = api.footer;
  const btnPreview = el('button', { class: 'btn', text: 'Vorschau bauen', onclick: () => {
    const res = buildPrintLayout(project, s);
    toast('Druckvorschau steht', 'ok', `${res.pages} Blatt · jetzt Strg+P oder „Drucken / PDF“`);
  } });
  const btnPrint = el('button', { class: 'btn btn-primary', text: '🖨 Drucken / PDF erzeugen', onclick: () => {
    const res = printNow(project, s);
    toast('Druckdialog geöffnet', 'ok', `${res.pages} Blatt ${FORMATS[s.format].label}`);
  } });
  foot.appendChild(el('button', { class: 'btn', text: 'Schließen', onclick: () => api.close() }));
  foot.appendChild(btnPreview);
  foot.appendChild(btnPrint);
  void check;
  void built;
}

/* ───────── Dialog-Gerüst (unabhängig von ui/dialogs.js) ───────── */

function openModalRaw(title, bodyHost) {
  const host = document.getElementById('modal-host');
  const box = el('div', { class: 'modal' });
  const bodyWrap = el('div', { class: 'modal-body' });
  const foot = el('div', { class: 'modal-foot' });
  const close = () => { clear(host); host.hidden = true; };
  box.appendChild(el('div', { class: 'modal-head' },
    el('h2', { text: title }),
    el('button', { class: 'iconbtn', title: 'Schließen (Esc)', text: '✕', onclick: close })));
  box.appendChild(bodyWrap);
  box.appendChild(foot);
  bodyWrap.appendChild(bodyHost);
  clear(host);
  host.appendChild(box);
  host.hidden = false;
  host.onmousedown = (e) => { if (e.target === host) close(); };
  return { box, body: bodyWrap, footer: foot, close };
}
