/* ══════════════════════════════════════════════════════════════
   views/calendar.js – Monatskalender mit Ziehen zum Verschieben.
   ══════════════════════════════════════════════════════════════ */

import { el, clear } from '../ui/dom.js';
import { placeArmed, isPoolDrag, poolIdFromDrag } from '../ui/place.js';
import { store } from '../store.js';
import { STATUS, taskById } from '../model.js';
import {
  parseIso, addDays, startOfWeek, startOfMonth, endOfMonth, iso, todayIso,
  monthName, dowShort, snapToWorkday, diffDays,
} from '../dateutil.js';

export function renderCalendar(container) {
  clear(container);
  const p = store.project;
  const cal = p.settings.calendar;
  const anchor = store.monthAnchor();
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(last), 6);
  const today = todayIso();

  /* Kopfzeile */
  const head = el('div', { class: 'cal-head' });
  head.appendChild(el('button', { class: 'btn', text: '‹', title: 'Voriger Monat', onclick: () => store.setMonthAnchor(addDays(first, -1)) }));
  head.appendChild(el('button', { class: 'btn', text: 'Heute', onclick: () => store.setMonthAnchor(todayIso()) }));
  head.appendChild(el('button', { class: 'btn', text: '›', title: 'Nächster Monat', onclick: () => store.setMonthAnchor(addDays(last, 1)) }));
  const d = parseIso(first);
  head.appendChild(el('h2', { text: `${monthName(d.getUTCMonth())} ${d.getUTCFullYear()}` }));
  head.appendChild(el('span', { class: 'hint', text: 'Aufgabe in einen anderen Tag ziehen zum Verschieben · ＋ legt an diesem Tag an' }));
  container.appendChild(head);

  const wrap = el('div', { class: 'calwrap' });
  const grid = el('div', { class: 'cal-grid' });
  for (let i = 0; i < 7; i++) grid.appendChild(el('div', { class: 'cal-dow', text: dowShort((i + 1) % 7) }));

  const tasks = store.visibleTasks().filter((t) => t.type !== 'summary');
  const byDay = new Map();
  for (const t of tasks) {
    if (!t.start || !t.end) continue;
    let s = t.start < gridStart ? gridStart : t.start;
    const e = t.end > gridEnd ? gridEnd : t.end;
    let guard = 0;
    for (let day = s; day <= e && guard++ < 400; day = addDays(day, 1)) {
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(t);
    }
  }

  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    const dt = parseIso(day);
    const dd = dt.getUTCDay();
    const inMonth = day >= first && day <= last;
    const isWknd = !cal.workdays.includes(dd);
    const cell = el('div', {
      class: 'cal-cell' + (inMonth ? '' : ' out') + (isWknd ? ' wknd' : '') + (day === today ? ' today' : ''),
      dataset: { day },
    });
    const num = el('div', { class: 'cal-daynum' },
      el('span', { text: String(dt.getUTCDate()) + (dt.getUTCDate() === 1 ? ' ' + monthName(dt.getUTCMonth(), true) : '') }),
      el('button', { class: 'cal-add', title: 'Aufgabe an diesem Tag', text: '＋', onclick: (e) => { e.stopPropagation(); store.addTask({ start: day, duration: 1 }, null); } }));
    cell.appendChild(num);

    for (const t of (byDay.get(day) || [])) {
      const color = t.color || (STATUS[t.status] || STATUS.open).color;
      const ev = el('div', {
        class: 'cal-ev' + (t.type === 'milestone' ? ' is-ms' : '') + (t.status === 'done' ? ' is-done' : '')
          + (t.locked ? ' is-locked' : '')
          + (store.isSelected(t.id) ? (store.selectedId === t.id ? ' is-sel' : ' is-multi') : ''),
        draggable: 'true',
        style: { borderLeftColor: color },
        title: `${t.name}\n${t.start} – ${t.end} · ${t.progress}%${t.locked ? ' · gesperrt' : ''}`,
        text: (t.locked ? '🔒 ' : '') + (t.type === 'milestone' ? '◆ ' : '') + t.name,
      });
      ev.addEventListener('click', (e) => {
        e.stopPropagation();
        store.select(t.id, e.shiftKey ? 'range' : ((e.ctrlKey || e.metaKey) ? 'toggle' : 'replace'));
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) store.emit('open-detail');
      });
      ev.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; ev.classList.add('is-dragging'); });
      ev.addEventListener('dragend', () => ev.classList.remove('is-dragging'));
      cell.appendChild(ev);
    }

    cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.classList.add('drop-target'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drop-target');
      const poolId = isPoolDrag(e) ? poolIdFromDrag(e) : null;
      if (poolId) {
        e.stopPropagation();
        const d = snapToWorkday(day, cal, 1);
        placeArmed({ start: d }, poolId);
        return;
      }
      const id = e.dataTransfer.getData('text/plain');
      const t = taskById(store.project, id);
      if (!t) return;
      const shift = diffDays(t.start, day);
      if (!shift) return;
      const ns = snapToWorkday(day, cal, shift > 0 ? 1 : -1);
      const real = diffDays(t.start, ns);
      const ne = t.type === 'milestone' ? ns : addDays(t.end, real);
      store.moveTaskDates(t.id, { start: ns, end: ne }, { addConstraint: true });
    });
    cell.addEventListener('click', () => {
      if (store.ui.armedPool) {
        placeArmed({ start: snapToWorkday(day, cal, 1) });
        return;
      }
      store.select(null);
    });
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  container.appendChild(wrap);
  void iso;
}
