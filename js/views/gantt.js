/* ══════════════════════════════════════════════════════════════
   views/gantt.js – Zeitstrahl mit Balken, Meilensteinen,
   Abhängigkeitspfeilen und Ziehen zum Verschieben.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials, drag } from '../ui/dom.js';
import { placeArmed, isPoolDrag, poolIdFromDrag } from '../ui/place.js';
import { contextMenu } from '../ui/menu.js';
import { lockBadge } from '../ui/lock.js';
import { store } from '../store.js';
import {
  addDays, diffDays, startOfWeek, formatIso, monthName, dowShort, dowLong, isoWeek,
  parseIso, snapToWorkday, endFromDuration, durationFromRange, todayIso, holidayName,
} from '../dateutil.js';
import { STATUS, PRIORITY, isSummary, taskById, DEP_TYPES } from '../model.js';

export const ZOOM_DAY_W = { day: 30, week: 12, month: 4.6, quarter: 1.9 };

const state = { from: '', to: '', dayW: 12, rows: [], rowIndex: new Map() };

/* ───────── Maßstab, Ziehen mit der Maus (Pan), Zoom per Mausrad ───────── */

let pan = null;              // { x, y, l, t, scroller } – laufendes Verschieben
let activeScroller = null;   // der gerade gezeichnete Gantt-Bereich

function leftWidth() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--left-w')) || 380;
}

function clampNum(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Mit der Maus ziehen (Strg+linke Taste oder mittlere Taste) – kurzer Klick wählt aus. */
function beginPan(scroller, ev, clickToggle = false) {
  pan = { x: ev.clientX, y: ev.clientY, l: scroller.scrollLeft, t: scroller.scrollTop, scroller, moved: false, clickToggle };
  scroller.classList.add('is-panning');
  document.body.style.cursor = 'grabbing';
}

function initPanHandlers() {
  if (initPanHandlers.done) return;
  initPanHandlers.done = true;
  window.addEventListener('mousemove', (e) => {
    if (!pan) return;
    if (Math.abs(e.clientX - pan.x) > 4 || Math.abs(e.clientY - pan.y) > 4) pan.moved = true;
    pan.scroller.scrollLeft = pan.l - (e.clientX - pan.x);
    pan.scroller.scrollTop = pan.t - (e.clientY - pan.y);
  });
  window.addEventListener('mouseup', (e) => {
    if (!pan) return;
    const wasClick = !pan.moved && pan.clickToggle;
    pan.scroller.classList.remove('is-panning');
    const finished = pan;
    pan = null;
    document.body.style.cursor = '';
    if (wasClick) {
      // Strg+Klick ohne Ziehen: Auswahl umschalten (wie im Explorer)
      const node = document.elementFromPoint(e.clientX, e.clientY);
      const row = node && node.closest ? node.closest('[data-task-id]') : null;
      if (row) store.select(row.dataset.taskId, 'toggle');
      else store.clearSelection();
    }
    void finished;
  });
}

/** Mausrad: Strg = zoomen (um den Mauszeiger herum), Umschalt = seitlich rollen. */
function onWheel(scroller, e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const dayW = state.dayW;
    if (!dayW) return;
    const leftW = leftWidth();
    const rect = scroller.getBoundingClientRect();
    const xInView = e.clientX - rect.left;
    const dayIdx = (xInView + scroller.scrollLeft - leftW) / dayW;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const next = clampNum(dayW * factor, 0.35, 90);
    if (Math.abs(next - dayW) < 0.002) return;
    store.ui.fitDayW = next;
    store.ui.pendingScroll = { left: Math.max(0, dayIdx * next + leftW - xInView), top: scroller.scrollTop };
    store.emit('change');
    return;
  }
  if (e.shiftKey) {
    e.preventDefault();
    scroller.scrollLeft += e.deltaY;
  }
}

/** Zum heutigen Datum springen (waagerecht mittig, senkrecht zur ersten heutigen Zeile). */
export function ganttScrollToToday() {
  const box = activeScroller || document.querySelector('.gantt');
  if (!box || !state.dayW) return;
  const today = todayIso();
  const leftW = leftWidth();
  const xTrack = diffDays(state.from, today) * state.dayW;
  const trackVisible = Math.max(60, box.clientWidth - leftW);
  box.scrollLeft = Math.max(0, xTrack - trackVisible / 2);
  const rows = state.rows || [];
  const rh = store.ui.rowH || 30;
  let idx = rows.findIndex((t) => t.start <= today && t.end >= today);
  if (idx < 0) idx = rows.findIndex((t) => t.start > today);
  box.scrollTop = idx > 0 ? Math.max(0, idx * rh - rh * 2) : 0;
}

export function fitGantt() {
  const box = document.querySelector('.gantt');
  const view = document.getElementById('view-gantt');
  if (!box || !view) return;
  const available = view.clientWidth - 380 - 30;
  const days = diffDays(state.from, state.to) + 1 || 1;
  /* Mindestens 4 px je Tag: bei mehrjährigen Zeitstrahlen wäre sonst nichts mehr
     erkennbar – dann lieber rollen. */
  const dayW = Math.max(4, available / days);
  store.ui.fitDayW = dayW;
  store.emit('change');
}

function endOfWeek(isoStr) { return addDays(startOfWeek(isoStr), 6); }

/* ───────── Spaltenkopf ───────── */

function buildHeader(range, dayW) {
  const head = el('div', { class: 'g-head' });
  const left = el('div', { class: 'g-head-left' }, 'Aufgabe');
  head.appendChild(left);

  const track = el('div', { class: 'g-head-track', style: { width: (range.days * dayW) + 'px' } });
  const months = el('div', { class: 'g-head-months' });
  const units = el('div', { class: 'g-head-units' });
  const cal = store.project.settings.calendar;
  const zoom = store.ui.zoom;

  const coarse = el('div', { class: 'g-head-coarse', style: { display: 'flex', height: '22px', borderBottom: '1px solid var(--line-soft)' } });
  // Grobe Zeile: Jahr oder Monat
  let cur = range.from;
  const coarseUnits = [];
  if (zoom === 'day' || zoom === 'week') {
    while (cur <= range.to) {
      const d = parseIso(cur);
      const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
      const end = monthEnd > range.to ? range.to : monthEnd;
      coarseUnits.push({ label: `${monthName(d.getUTCMonth())} ${d.getUTCFullYear()}`, from: cur, to: end });
      cur = addDays(end, 1);
    }
  } else {
    while (cur <= range.to) {
      const d = parseIso(cur);
      const yearEnd = `${d.getUTCFullYear()}-12-31`;
      const end = yearEnd > range.to ? range.to : yearEnd;
      coarseUnits.push({ label: String(d.getUTCFullYear()), from: cur, to: end });
      cur = addDays(end, 1);
    }
  }
  for (const u of coarseUnits) {
    coarse.appendChild(el('div', { style: { width: ((diffDays(u.from, u.to) + 1) * dayW) + 'px' }, text: u.label }));
  }
  void months;

  // Feine Zeile
  const fineUnits = [];
  if (zoom === 'day') {
    for (let s = range.from; s <= range.to; s = addDays(s, 1)) fineUnits.push({ from: s, to: s, label: String(parseIso(s).getUTCDate()), day: true });
  } else if (zoom === 'week') {
    for (let s = startOfWeek(range.from); s <= range.to; s = addDays(s, 7)) {
      const e = addDays(s, 6);
      fineUnits.push({ from: s < range.from ? range.from : s, to: e > range.to ? range.to : e, label: 'KW ' + isoWeek(s), day: false });
    }
  } else if (zoom === 'month') {
    for (let s = range.from; s <= range.to;) {
      const d = parseIso(s);
      const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
      const e = monthEnd > range.to ? range.to : monthEnd;
      fineUnits.push({ from: s, to: e, label: monthName(d.getUTCMonth(), true), day: false });
      s = addDays(e, 1);
    }
  } else {
    for (let s = range.from; s <= range.to;) {
      const d = parseIso(s);
      const q = Math.floor(d.getUTCMonth() / 3);
      const qEnd = new Date(Date.UTC(d.getUTCFullYear(), q * 3 + 3, 0)).toISOString().slice(0, 10);
      const e = qEnd > range.to ? range.to : qEnd;
      fineUnits.push({ from: s, to: e, label: `Q${q + 1}`, day: false });
      s = addDays(e, 1);
    }
  }
  for (const u of fineUnits) {
    const w = (diffDays(u.from, u.to) + 1) * dayW;
    const cls = [];
    if (u.day) {
      const dd = parseIso(u.from).getUTCDay();
      if (!cal.workdays.includes(dd)) cls.push('wknd');
      if (cal.holidays.includes(u.from)) cls.push('hol');
      if (u.from === todayIso()) cls.push('today-h');
    }
    const attrs = { class: cls.join(' '), style: { width: w + 'px' }, text: u.label };
    if (u.day) {
      const nm = holidayName(cal, u.from);
      attrs.title = `${dowLong(parseIso(u.from).getUTCDay())}, ${formatIso(u.from)}`
        + (nm ? ` · Feiertag: ${nm}` : (cal.holidays.includes(u.from) ? ' · freier Tag' : (!cal.workdays.includes(parseIso(u.from).getUTCDay()) ? ' · Wochenende' : '')));
    }
    units.appendChild(el('div', attrs));
  }

  /* Wochentagszeile über den Tageszahlen (nur wenn die Spalten breit genug sind) */
  const showDows = zoom === 'day';
  const dows = el('div', { class: 'g-head-dows' });
  if (showDows) {
    for (let s = range.from; s <= range.to; s = addDays(s, 1)) {
      const dd = parseIso(s).getUTCDay();
      const cls = [];
      if (!cal.workdays.includes(dd)) cls.push('wknd');
      if (cal.holidays.includes(s)) cls.push('hol');
      if (s === todayIso()) cls.push('today-h');
      const nm = holidayName(cal, s);
      dows.appendChild(el('div', {
        class: cls.join(' '),
        style: { width: dayW + 'px' },
        text: dowShort(dd),
        title: `${dowLong(dd)}, ${formatIso(s)}${nm ? ` · Feiertag: ${nm}` : ''}`,
      }));
    }
  }

  track.appendChild(coarse);
  if (showDows) track.appendChild(dows);
  track.appendChild(units);
  track.style.height = (22 + (showDows ? 18 : 0) + 22) + 'px';
  head.appendChild(track);
  return { head, fineUnits, coarseUnits };
}

/* ───────── Hintergrund (Wochenenden, Raster) ───────── */

function buildBackground(range, dayW, height) {
  const bg = el('div', { class: 'g-bg', style: { position: 'absolute', left: 'var(--left-w)', top: '0', width: (range.days * dayW) + 'px', height: height + 'px', zIndex: '0', pointerEvents: 'none' } });
  const cal = store.project.settings.calendar;
  const zoom = store.ui.zoom;
  if (zoom === 'day' || zoom === 'week') {
    for (let s = range.from; s <= range.to; s = addDays(s, 1)) {
      const d = parseIso(s);
      const dd = d.getUTCDay();
      const cls = ['grid-day'];
      if (!cal.workdays.includes(dd)) cls.push('wknd');
      if (cal.holidays.includes(s)) cls.push('hol');
      if (dd === 1) cls.push('grid-strong');
      bg.appendChild(el('div', { class: cls.join(' '), style: { left: (diffDays(range.from, s) * dayW) + 'px', width: dayW + 'px' } }));
    }
  } else {
    for (let s = range.from; s <= range.to;) {
      const d = parseIso(s);
      const isMonth = zoom === 'month';
      const endIso = isMonth
        ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
        : new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3 + 3, 0)).toISOString().slice(0, 10);
      const e = endIso > range.to ? range.to : endIso;
      bg.appendChild(el('div', { class: 'grid-day grid-strong', style: { left: (diffDays(range.from, s) * dayW) + 'px', width: ((diffDays(s, e) + 1) * dayW) + 'px' } }));
      s = addDays(e, 1);
    }
  }
  return bg;
}

/* ───────── Zeilen ───────── */

function taskColor(task) {
  if (task.color) return task.color;
  const p = store.project;
  const first = (task.assignees || [])[0];
  const r = first ? p.resources.find((x) => x.id === first) : null;
  if (r && r.color) return r.color;
  return (STATUS[task.status] || STATUS.open).color;
}

function leftCell(task, depth, hasKids) {
  const p = store.project;
  const cell = el('div', { class: 'g-left' + (task.locked ? ' is-locked' : '') });
  cell.appendChild(el('div', { class: 'g-twist', text: hasKids ? (task.collapsed ? '▶' : '▼') : '', onclick: (e) => { e.stopPropagation(); if (hasKids) store.toggleCollapse(task.id); } }));
  cell.appendChild(el('div', { class: 'g-indent', style: { width: (depth * 14) + 'px' } }));
  cell.appendChild(el('div', { class: 'g-wbs', text: task.wbs || '' }));
  const name = el('div', { class: 'g-name' + (isSummary(p, task) ? ' is-group' : '') + (task.type === 'milestone' ? ' is-ms' : ''), title: task.name });
  if (task.type === 'milestone') name.appendChild(el('span', { text: '◆ ' }));
  name.appendChild(document.createTextNode(task.name));
  const lk = lockBadge(task, { cls: 'in-name' });
  if (lk) name.appendChild(lk);
  name.addEventListener('dblclick', (e) => { e.stopPropagation(); inlineRename(name, task); });
  cell.appendChild(name);

  const meta = el('div', { class: 'g-meta' });
  if (task.fromPool) {
    const n = store.placedCountFor(task);
    meta.appendChild(el('span', {
      class: 'pool-badge',
      title: `Aus dem Ideen-Sammelbecken – bisher ${n}× in den Plan gelegt`,
      text: `(${n})`,
    }));
  }
  if (task.priority && task.priority !== 'normal') meta.appendChild(el('span', { class: 'pdot', style: { background: PRIORITY[task.priority].color }, title: 'Priorität: ' + PRIORITY[task.priority].label }));
  if (task.deadline && task.end > task.deadline && task.status !== 'done') meta.appendChild(el('span', { title: 'Ziel überschritten: ' + task.deadline, text: '⏰' }));
  if ((task.deps || []).length) meta.appendChild(el('span', { title: (task.deps || []).length + ' Vorgänger', text: '⛓' }));
  for (const a of (task.assignees || []).slice(0, 3)) {
    const r = p.resources.find((x) => x.id === a);
    if (r) meta.appendChild(el('span', { class: 'avatar', style: { background: r.color }, title: r.name, text: initials(r.name) }));
  }
  if (task.progress > 0 && task.type !== 'milestone') meta.appendChild(el('span', { text: task.progress + '%' }));
  cell.appendChild(meta);
  return cell;
}

function inlineRename(node, task) {
  const input = el('input', { type: 'text', value: task.name, style: { flex: '1', minWidth: '0' } });
  const parent = node.parentNode;
  parent.replaceChild(input, node);
  input.focus(); input.select();
  let done = false;
  const finish = (save) => {
    if (done) return; done = true;
    if (save && input.value.trim() && input.value.trim() !== task.name) store.updateTask(task.id, { name: input.value.trim() }, 'Aufgabe umbenennen');
    else store.emit('change');
  };
  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
}

/* ───────── Balken ───────── */

function buildBar(task, range, dayW, rowIdx, isSum) {
  const x = diffDays(range.from, task.start) * dayW;
  const days = diffDays(task.start, task.end) + 1;
  const w = Math.max(3, days * dayW);
  const color = taskColor(task);

  if (task.type === 'milestone') {
    const d = el('div', { class: 'ms-diamond', style: { left: (x + dayW / 2) + 'px', background: color }, title: `${task.name}\n${formatIso(task.start)}` });
    attachDrag(d, task, range, dayW, 'move');
    d.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); rowMenu(e, task); });
    return d;
  }

  const bar = el('div', {
    class: 'bar' + (isSum ? ' is-summary' : '') + (task.locked ? ' is-locked' : '') + (store.ui.showCritical && store.critical.has(task.id) ? ' is-critical' : '') + (task.conflict ? ' is-conflict' : ''),
    style: { left: x + 'px', width: w + 'px', background: isSum ? 'transparent' : color },
    title: `${task.name}\n${formatIso(task.start)} – ${formatIso(task.end)} · ${task.duration} AT · ${task.progress}%${task.locked ? ' · gesperrt' : ''}`,
  });
  if (isSum) {
    bar.appendChild(el('div', { class: 'sbar' }));
    bar.appendChild(el('div', { class: 'fill', style: { width: task.progress + '%' } }));
  } else {
    bar.appendChild(el('div', { class: 'fill', style: { width: (100 - task.progress) + '%', right: '0', left: 'auto' } }));
  }
  if (w > 54) {
    bar.appendChild(el('div', { class: 'bar-label', text: (task.locked ? '🔒 ' : '') + task.name + (isSum ? '' : ` · ${task.progress}%`) }));
  }
  if (!isSum) {
    const hl = el('div', { class: 'handle l', title: 'Anfang verschieben' });
    const hr = el('div', { class: 'handle r', title: 'Ende verschieben' });
    attachDrag(hl, task, range, dayW, 'resize-l');
    attachDrag(hr, task, range, dayW, 'resize-r');
    bar.appendChild(hl); bar.appendChild(hr);
  }
  attachDrag(bar, task, range, dayW, isSum ? 'none' : 'move');
  bar.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); rowMenu(e, task); });
  void rowIdx;
  return bar;
}

function attachDrag(node, task, range, dayW, mode) {
  if (mode === 'none') return;
  drag(node, {
    onStart: () => { node.classList.add('is-dragging'); store.select(task.id); },
    onMove: (e, info) => {
      const dd = Math.round(info.dx / dayW);
      if (mode === 'move') node.style.transform = `translateX(${dd * dayW}px)`;
      else if (mode === 'resize-r') node.style.width = Math.max(3, (diffDays(task.start, task.end) + 1) * dayW + dd * dayW) + 'px';
      else if (mode === 'resize-l') {
        node.style.transform = `translateX(${dd * dayW}px)`;
        node.style.width = Math.max(3, (diffDays(task.start, task.end) + 1) * dayW - dd * dayW) + 'px';
      }
    },
    onEnd: (e, info) => {
      node.classList.remove('is-dragging');
      node.style.transform = '';
      node.style.width = '';
      const dd = Math.round(info.dx / dayW);
      if (!dd) { store.emit('change'); return; }
      const cal = store.project.settings.calendar;
      if (mode === 'move') {
        const ns = snapToWorkday(addDays(task.start, dd), cal, dd > 0 ? 1 : -1);
        const shift = diffDays(task.start, ns);
        const ne = addDays(task.end, shift);
        store.moveTaskDates(task.id, { start: ns, end: task.type === 'milestone' ? ns : ne }, { addConstraint: true });
      } else if (mode === 'resize-r') {
        let ne = addDays(task.end, dd);
        if (ne < task.start) ne = task.start;
        ne = snapToWorkday(ne, cal, dd > 0 ? -1 : 1);
        const dur = Math.max(1, durationFromRange(task.start, ne, cal));
        store.updateTask(task.id, { end: endFromDuration(task.start, dur, cal), duration: dur }, 'Dauer ändern');
      } else if (mode === 'resize-l') {
        let ns = addDays(task.start, dd);
        if (ns > task.end) ns = task.end;
        ns = snapToWorkday(ns, cal, dd > 0 ? -1 : 1);
        const dur = Math.max(1, durationFromRange(ns, task.end, cal));
        store.updateTask(task.id, { start: ns, end: endFromDuration(ns, dur, cal), duration: dur, constraint: { type: 'SNET', date: ns } }, 'Anfang ändern');
      }
    },
  });
}

/* ───────── Kontextmenü einer Zeile ───────── */

/** Einträge, die es nur bei Mehrfachauswahl gibt. */
export function multiMenuItems(task) {
  const n = store.selectionCount();
  if (n < 2 || !store.isSelected(task.id)) return [];
  const alleGesperrt = store.selectedTasks().every((t) => t.locked);
  return [
    { label: `${n} Aufgaben duplizieren`, hint: 'Strg+D', run: () => store.emit('action-duplicate') },
    { label: `${n} Aufgaben kopieren`, hint: 'Strg+C', run: () => store.emit('action-copy') },
    store.hasClipboard ? { label: 'Einfügen', hint: 'Strg+V', run: () => store.emit('action-paste') } : null,
    { label: alleGesperrt ? `${n} Schlösser öffnen` : `${n} Aufgaben sperren`, hint: 'Alt+L', run: () => store.emit('action-lock') },
    { label: `${n} Aufgaben löschen`, danger: true, hint: 'Entf', run: () => store.emit('action-delete-selection') },
    '-',
  ].filter(Boolean);
}

function rowMenu(ev, task) {
  const p = store.project;
  if (!store.isSelected(task.id)) store.select(task.id);
  const n = store.placedCountFor(task);
  contextMenu(ev.clientX, ev.clientY, [
    ...multiMenuItems(task),
    { label: 'Aufgabe hinzufügen', hint: 'Einfg', run: () => store.addTask({}, task.id) },
    { label: 'Unteraufgabe hinzufügen', run: () => { const id = store.addTask({ parentId: task.id, start: task.start }, task.id); store.indent(id); } },
    { label: 'Duplizieren', run: () => store.duplicateTask(task.id) },
    '-',
    { label: task.locked ? '🔓 Schloss öffnen' : '🔒 Sperren', hint: 'Alt+L', run: () => store.toggleLock(task.id) },
    '-',
    { label: 'Termin: 1 Tag später', hint: 'Umschalt+→', run: () => store.shiftTask(task.id, 1, 'day') },
    { label: 'Termin: 1 Woche später', hint: 'Umschalt+Strg+↓', run: () => store.shiftTask(task.id, 1, 'week') },
    { label: 'Termin: 1 Monat später', hint: 'Umschalt+Strg+→', run: () => store.shiftTask(task.id, 1, 'month') },
    { label: 'Termin: 1 Tag früher', hint: 'Umschalt+←', run: () => store.shiftTask(task.id, -1, 'day') },
    { label: 'Termin: 1 Woche früher', hint: 'Umschalt+Strg+↑', run: () => store.shiftTask(task.id, -1, 'week') },
    { label: 'Termin: 1 Monat früher', hint: 'Umschalt+Strg+←', run: () => store.shiftTask(task.id, -1, 'month') },
    { label: 'Termin verschieben…', run: () => store.emit('open-shift') },
    '-',
    { label: 'Einrücken', hint: 'Alt+→', run: () => store.indent(task.id) },
    { label: 'Ausrücken', hint: 'Alt+←', run: () => store.outdent(task.id) },
    { label: 'Nach oben', hint: 'Umschalt+↑', run: () => store.moveRows(-1) },
    { label: 'Nach unten', hint: 'Umschalt+↓', run: () => store.moveRows(1) },
    '-',
    { label: 'Details zeigen', run: () => store.emit('open-detail') },
    task.fromPool ? { label: `Zur Idee im Sammelbecken (${n}×)`, run: () => store.emit('open-pool', task.fromPool) } : null,
    { label: 'Aufgabe löschen', danger: true, hint: 'Entf', run: () => store.deleteTask(task.id) },
  ].filter(Boolean));
  void p;
}

/* ───────── Hauptfunktion ───────── */

export function renderGantt(container) {
  const box = container.querySelector('.gantt');
  const scroll = box ? { l: box.scrollLeft, t: box.scrollTop } : { l: 0, t: 0 };
  clear(container);
  // Beim Zoomen mit dem Mausrad die Blickposition beibehalten
  if (store.ui.pendingScroll) {
    scroll.l = store.ui.pendingScroll.left;
    scroll.t = store.ui.pendingScroll.top;
    store.ui.pendingScroll = null;
  }

  const project = store.project;
  const tasks = store.visibleTasks();
  const rows = tasks;
  const RH = store.ui.rowH || 30;   // Zeilenhöhe (im Setup einstellbar)

  // Zeitraum bestimmen – „heute“ ist immer mit dabei, damit der Heute-Knopf wirkt,
  // und die Einstellung „bis Jahr“ gibt die äußerste Grenze vor (Zeitstrahl bis Jahresende).
  let min = project.settings.projectStart;
  let max = project.settings.projectStart;
  for (const t of project.tasks) {
    if (t.type === 'summary') continue;
    if (t.start && t.start < min) min = t.start;
    if (t.end && t.end > max) max = t.end;
  }
  const nowIso = todayIso();
  if (nowIso < min) min = nowIso;
  if (nowIso > max) max = nowIso;
  min = addDays(min, -7);
  const ziel = `${store.horizonYear()}-12-31`;      // „Feiertage und Zeitstrahl bis Jahr“
  if (ziel > max) max = ziel;                        // bis Jahresende zeichnen
  else max = addDays(max, 14);                       // sonst nur Rand hinter der letzten Aufgabe
  const from = startOfWeek(min);
  const to = endOfWeek(max);
  const days = diffDays(from, to) + 1;
  const dayW = store.ui.fitDayW || ZOOM_DAY_W[store.ui.zoom] || 12;
  state.from = from; state.to = to; state.dayW = dayW; state.rows = rows;

  const scroller = el('div', { class: 'gantt' });
  const inner = el('div', { class: 'gantt-inner' });
  const { head } = buildHeader({ from, to, days }, dayW);
  inner.appendChild(head);

  const body = el('div', { class: 'g-body', style: { position: 'relative', height: (rows.length * RH) + 'px' } });
  const bg = buildBackground({ from, to, days }, dayW, rows.length * RH);
  body.appendChild(bg);

  const rowIndex = new Map();
  rows.forEach((t, i) => rowIndex.set(t.id, i));
  state.rowIndex = rowIndex;

  const trackW = days * dayW;
  const project2 = store.project;

  rows.forEach((task, i) => {
    const depth = (() => { let d = 0, cur = task; let g = 0; while (cur.parentId && g++ < 50) { cur = taskById(project2, cur.parentId); if (!cur) break; d++; } return d; })();
    const hasKids = project2.tasks.some((x) => x.parentId === task.id);
    const sel = store.isSelected(task.id);
    const row = el('div', {
      class: 'g-row' + (sel ? (store.selectedId === task.id ? ' is-sel' : ' is-multi') : ''),
      dataset: { taskId: task.id },
    });
    row.appendChild(leftCell(task, depth, hasKids));
    const track = el('div', { class: 'g-track', style: { width: trackW + 'px' } });
    const isSum = hasKids || task.type === 'summary';
    track.appendChild(buildBar(task, { from, to, days }, dayW, i, isSum));
    row.appendChild(track);
    row.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;           // Rechtsklick behält die Mehrfachauswahl
      if (e.target.closest('.g-twist') || e.target.closest('.bar') || e.target.closest('.ms-diamond')) return;
      if (e.ctrlKey || e.metaKey) return;   // Strg = Ausschnitt verschieben (Pan)
      if (store.ui.armedPool) { e.preventDefault(); placeArmed({ start: task.start, afterId: task.id, parentId: task.parentId }); return; }
      store.select(task.id, e.shiftKey ? 'range' : 'replace');
    });
    row.addEventListener('contextmenu', (e) => { e.preventDefault(); rowMenu(e, task); });
    body.appendChild(row);
  });

  // Abhängigkeitspfeile
  if (store.ui.showDeps) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'deps-svg');
    svg.setAttribute('width', String(trackW));
    svg.setAttribute('height', String(rows.length * RH));
    svg.style.left = 'var(--left-w)';
    svg.style.top = '0';
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="dep-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 z" fill="var(--fg-3)"/>
      </marker>
      <marker id="dep-arrow-crit" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 z" fill="var(--danger)"/>
      </marker>`;
    svg.appendChild(defs);
    for (const task of rows) {
      for (const dep of task.deps || []) {
        const pred = taskById(project2, dep.id);
        if (!pred || !rowIndex.has(pred.id) || !rowIndex.has(task.id)) continue;
        const x1e = (diffDays(from, pred.start) + diffDays(pred.start, pred.end) + 1) * dayW;
        const x1s = diffDays(from, pred.start) * dayW;
        const y1 = rowIndex.get(pred.id) * RH + RH / 2;
        const x2s = diffDays(from, task.start) * dayW;
        const x2e = (diffDays(from, task.start) + diffDays(task.start, task.end) + 1) * dayW;
        const y2 = rowIndex.get(task.id) * RH + RH / 2;
        let x1 = x1e, x2 = x2s;
        if (dep.type === 'SS') x1 = x1s;
        if (dep.type === 'FF') x2 = x2e;
        if (dep.type === 'SF') { x1 = x1s; x2 = x2e; }
        const crit = store.ui.showCritical && store.critical.has(pred.id) && store.critical.has(task.id);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', crit ? 'crit' : '');
        path.setAttribute('marker-end', crit ? 'url(#dep-arrow-crit)' : 'url(#dep-arrow)');
        const gap = x2 - x1;
        let d;
        if (gap >= 18) d = `M${x1},${y1} H${x1 + 9} V${y2} H${x2 - 8}`;
        else {
          const bx = x1 + 11;
          const my = y1 + (y2 > y1 ? 16 : -16);
          d = `M${x1},${y1} H${bx} V${my} H${x2 - 18} V${y2} H${x2 - 8}`;
        }
        path.setAttribute('d', d);
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${pred.name} → ${task.name} (${DEP_TYPES[dep.type] || 'FS'}${dep.lag ? `, Puffer ${dep.lag} AT` : ''})`;
        path.appendChild(title);
        svg.appendChild(path);
      }
    }
    body.appendChild(svg);
  }

  // Heute-Linie
  const today = new Date().toISOString().slice(0, 10);
  if (today >= from && today <= to) {
    body.appendChild(el('div', { class: 'today-line', style: { left: `calc(var(--left-w) + ${diffDays(from, today) * dayW + dayW / 2}px)` } }));
  }

  inner.appendChild(body);
  scroller.appendChild(inner);

  /* ── Ideen aus dem Sammelbecken hier ablegen (Ziehen oder Klicken) ── */
  const leftW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--left-w')) || 380;
  const dropLine = el('div', { class: 'g-drop-line', hidden: true });
  const dropTag = el('div', { class: 'g-drop-tag', hidden: true });
  body.appendChild(dropLine);
  body.appendChild(dropTag);

  const targetAt = (e) => {
    const rect = body.getBoundingClientRect();
    const trackX = e.clientX - rect.left - leftW;
    if (trackX < 0) return null;
    const dayIdx = Math.max(0, Math.floor(trackX / dayW));
    const date = snapToWorkday(addDays(from, dayIdx), store.project.settings.calendar, 1);
    const rowIdx = Math.max(0, Math.min(rows.length - 1, Math.floor((e.clientY - rect.top) / RH)));
    const task = rows[rowIdx] || null;
    return {
      date, rowIdx, task,
      afterId: task ? task.id : null,
      parentId: task ? task.parentId : null,
      label: task ? `nach „${task.name}“` : 'oberste Ebene',
    };
  };
  const poolIdOf = (e) => poolIdFromDrag(e);

  scroller.addEventListener('dragover', (e) => {
    if (!isPoolDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    const t = targetAt(e);
    if (!t) return;
    dropLine.hidden = false;
    dropLine.style.top = (t.rowIdx * RH) + 'px';
    dropTag.hidden = false;
    dropTag.style.top = (t.rowIdx * RH) + 'px';
    dropTag.style.left = `calc(var(--left-w) + ${Math.max(0, diffDays(from, t.date) * dayW)}px)`;
    dropTag.textContent = `${formatIso(t.date, 'short')} · ${t.label}`;
  });
  scroller.addEventListener('dragleave', () => { dropLine.hidden = true; dropTag.hidden = true; });
  scroller.addEventListener('drop', (e) => {
    const poolId = poolIdOf(e);
    if (!poolId || !isPoolDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dropLine.hidden = true;
    dropTag.hidden = true;
    const t = targetAt(e);
    if (!t) return;
    placeArmed({ start: t.date, afterId: t.afterId, parentId: t.parentId }, poolId);
  });
  scroller.addEventListener('mousedown', (e) => {
    if (!store.ui.armedPool) return;
    if (e.target.closest('.bar') || e.target.closest('.ms-diamond') || e.target.closest('.g-twist')) return;
    const rect = body.getBoundingClientRect();
    if (e.clientX - rect.left < leftW) return;   // Klick in der Namensspalte
    e.preventDefault();
    const t = targetAt(e);
    if (t) placeArmed({ start: t.date, afterId: t.afterId, parentId: t.parentId });
  });
  /* ── Maus: Strg+Ziehen verschiebt den Ausschnitt, Strg+Mausrad zoomt ── */
  activeScroller = scroller;
  initPanHandlers();
  scroller.addEventListener('mousedown', (e) => {
    if (!(e.ctrlKey || e.metaKey || e.button === 1)) return;
    e.preventDefault();
    // Strg+Klick (ohne Ziehen) schaltet die Auswahl um, Strg+Ziehen verschiebt den Ausschnitt
    beginPan(scroller, e, e.button === 0 && (e.ctrlKey || e.metaKey));
  });
  scroller.addEventListener('wheel', (e) => onWheel(scroller, e), { passive: false });

  if (!rows.length) {
    scroller.appendChild(el('div', { class: 'g-empty' },
      el('p', { text: 'Noch keine Aufgaben.' }),
      el('button', { class: 'btn btn-accent', text: '＋ Erste Aufgabe anlegen', onclick: () => store.addTask({ name: 'Aufgabe 1' }, null) })));
  }
  container.appendChild(scroller);
  scroller.scrollLeft = scroll.l;
  scroller.scrollTop = scroll.t;
  void snapToWorkday;
}

export { state as ganttState };
