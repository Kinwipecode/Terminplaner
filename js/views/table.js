/* ══════════════════════════════════════════════════════════════
   views/table.js – Aufgabenliste mit allen Feldern, direkt
   bearbeitbar, gruppier- und sortierbar.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials } from '../ui/dom.js';
import { placeArmed, isPoolDrag, poolIdFromDrag } from '../ui/place.js';
import { contextMenu } from '../ui/menu.js';
import { store } from '../store.js';
import { STATUS, STATUS_ORDER, PRIORITY, PRIORITY_ORDER, taskById, isSummary } from '../model.js';
import { formatIso, endFromDuration, durationFromRange, snapToWorkday, todayIso } from '../dateutil.js';

const ui = { sortKey: 'wbs', sortDir: 1, groupBy: '' };

/** Läuft die Aufgabe heute? (für die Markierung in der Liste) */
function isTodayTask(task) {
  const today = todayIso();
  return !!task.start && !!task.end && task.start <= today && task.end >= today;
}

function header(cols, onSort) {
  const tr = el('tr');
  for (const c of cols) {
    const th = el('th', {
      class: (c.num ? 'num ' : '') + (c.sortable === false ? 'no-sort' : ''),
      style: c.width ? { width: c.width } : null,
      title: c.sortable === false ? '' : 'Nach dieser Spalte sortieren',
      onclick: c.sortable === false ? null : () => onSort(c.key),
    }, c.label, ui.sortKey === c.key ? (ui.sortDir > 0 ? ' ▲' : ' ▼') : '');
    tr.appendChild(th);
  }
  return tr;
}

const COLS = [
  { key: 'wbs', label: 'Nr.', width: '56px' },
  { key: 'name', label: 'Aufgabe' },
  { key: 'start', label: 'Beginn', width: '104px' },
  { key: 'end', label: 'Ende', width: '104px' },
  { key: 'duration', label: 'Dauer', width: '62px', num: true },
  { key: 'progress', label: 'Fortschritt', width: '120px' },
  { key: 'status', label: 'Status', width: '104px' },
  { key: 'priority', label: 'Priorität', width: '104px' },
  { key: 'assignees', label: 'Wer', width: '120px', sortable: false },
  { key: 'deps', label: 'Vorgänger', width: '150px', sortable: false },
  { key: 'deadline', label: 'Ziel', width: '104px' },
];

function groupLabel(task, key) {
  if (key === 'status') return STATUS[task.status] ? STATUS[task.status].label : 'Ohne Status';
  if (key === 'priority') return PRIORITY[task.priority] ? PRIORITY[task.priority].label : 'Ohne Priorität';
  if (key === 'assignee') {
    const first = (task.assignees || [])[0];
    const r = first ? store.project.resources.find((x) => x.id === first) : null;
    return r ? r.name : 'Niemand zugewiesen';
  }
  return '';
}

export function renderTable(container) {
  clear(container);
  const p = store.project;

  /* Werkzeugleiste */
  const bar = el('div', { class: 'tbl-toolbar' });
  bar.appendChild(el('button', { class: 'btn btn-accent', text: '＋ Aufgabe', onclick: () => store.addTask() }));
  bar.appendChild(el('button', { class: 'btn', text: '⊞ Sammelaufgabe', onclick: () => store.addGroup() }));
  bar.appendChild(el('span', { class: 'sep' }));
  bar.appendChild(el('button', { class: 'btn', text: 'Alt+→ Einrücken', onclick: () => store.selectedId && store.indent(store.selectedId) }));
  bar.appendChild(el('button', { class: 'btn', text: 'Alt+← Ausrücken', onclick: () => store.outdent(store.selectedId) }));
  bar.appendChild(el('button', { class: 'btn', text: '↑ Hoch', onclick: () => store.moveRow(store.selectedId, -1) }));
  bar.appendChild(el('button', { class: 'btn', text: '↓ Runter', onclick: () => store.moveRow(store.selectedId, 1) }));
  bar.appendChild(el('button', { class: 'btn', text: '⧉ Duplizieren', onclick: () => store.duplicateTask(store.selectedId) }));
  bar.appendChild(el('button', { class: 'btn btn-danger', text: 'Löschen', onclick: () => store.deleteTask(store.selectedId) }));
  bar.appendChild(el('span', { class: 'sep' }));
  bar.appendChild(el('span', { class: 'hint', text: 'Gruppieren:' }));
  const gsel = el('select', { class: 'mini', onchange: (e) => { ui.groupBy = e.target.value; store.emit('change'); } },
    el('option', { value: '', text: 'keine' }),
    el('option', { value: 'status', text: 'Status' }),
    el('option', { value: 'priority', text: 'Priorität' }),
    el('option', { value: 'assignee', text: 'Person' }));
  gsel.value = ui.groupBy;
  bar.appendChild(gsel);
  bar.appendChild(el('span', { class: 'hint', text: 'Doppelklick auf eine Zeile öffnet die Details.' }));
  container.appendChild(bar);

  /* Tabelle */
  const wrap = el('div', { class: 'tablewrap' });
  const table = el('table', { class: 'tbl' });
  const thead = el('thead');
  const sortBy = (key) => {
    if (ui.sortKey === key) ui.sortDir *= -1;
    else { ui.sortKey = key; ui.sortDir = 1; }
    store.emit('change');
  };
  thead.appendChild(header(COLS, sortBy));
  table.appendChild(thead);
  const tbody = el('tbody');

  const tasks = store.visibleTasks().slice();
  const dir = ui.sortDir;
  const key = ui.sortKey;
  const val = (t) => {
    if (key === 'wbs') return String(t.wbs || '').split('.').map((n) => String(n).padStart(3, '0')).join('.');
    if (key === 'name') return (t.name || '').toLowerCase();
    if (key === 'start') return t.start || '';
    if (key === 'end') return t.end || '';
    if (key === 'duration') return Number(t.duration) || 0;
    if (key === 'progress') return Number(t.progress) || 0;
    if (key === 'status') return STATUS_ORDER.indexOf(t.status);
    if (key === 'priority') return PRIORITY_ORDER.indexOf(t.priority);
    if (key === 'deadline') return t.deadline || '9999';
    return '';
  };
  if (!ui.groupBy) {
    tasks.sort((a, b) => {
      const va = val(a), vb = val(b);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  } else {
    tasks.sort((a, b) => {
      const ga = groupLabel(a, ui.groupBy), gb = groupLabel(b, ui.groupBy);
      if (ga !== gb) return ga.localeCompare(gb, 'de');
      const va = val(a), vb = val(b);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }

  const renderRow = (task) => {
    const depth = (() => { let d = 0, cur = task, g = 0; while (cur.parentId && g++ < 50) { cur = taskById(p, cur.parentId); if (!cur) break; d++; } return d; })();
    const tr = el('tr', {
      class: (store.selectedId === task.id ? 'is-sel ' : '') + (isSummary(p, task) ? 'is-group ' : '') + (isTodayTask(task) ? 'is-today' : ''),
      dataset: { taskId: task.id },
    });
    tr.addEventListener('mousedown', (e) => {
      if (!e.target.closest('input,select,button')) {
        if (store.ui.armedPool) {
          e.preventDefault();
          placeArmed({ start: task.start, afterId: task.id, parentId: task.parentId });
          return;
        }
        store.select(task.id);
      }
    });
    tr.addEventListener('dblclick', (e) => { if (!e.target.closest('input,select')) { store.select(task.id); store.emit('open-detail'); } });
    tr.addEventListener('contextmenu', (e) => {
      e.preventDefault(); store.select(task.id);
      contextMenu(e.clientX, e.clientY, [
        { label: 'Details zeigen', run: () => store.emit('open-detail') },
        '-',
        { label: 'Termin: 1 Tag später', run: () => store.shiftTask(task.id, 1, 'day') },
        { label: 'Termin: 1 Woche später', run: () => store.shiftTask(task.id, 1, 'week') },
        { label: 'Termin: 1 Monat später', run: () => store.shiftTask(task.id, 1, 'month') },
        { label: 'Termin: 1 Tag früher', run: () => store.shiftTask(task.id, -1, 'day') },
        { label: 'Termin: 1 Woche früher', run: () => store.shiftTask(task.id, -1, 'week') },
        { label: 'Termin: 1 Monat früher', run: () => store.shiftTask(task.id, -1, 'month') },
        { label: 'Termin verschieben…', run: () => store.emit('open-shift') },
        '-',
        { label: 'Einrücken', run: () => store.indent(task.id) },
        { label: 'Ausrücken', run: () => store.outdent(task.id) },
        { label: 'Duplizieren', run: () => store.duplicateTask(task.id) },
        { label: 'Aufgabe löschen', danger: true, run: () => store.deleteTask(task.id) },
      ]);
    });

    // Ideen aus dem Sammelbecken hier ablegen
    tr.addEventListener('dragover', (e) => { if (isPoolDrag(e)) { e.preventDefault(); e.stopPropagation(); tr.classList.add('drop-target'); } });
    tr.addEventListener('dragleave', () => tr.classList.remove('drop-target'));
    tr.addEventListener('drop', (e) => {
      if (!isPoolDrag(e)) return;
      const poolId = poolIdFromDrag(e);
      tr.classList.remove('drop-target');
      if (!poolId) return;
      e.preventDefault();
      e.stopPropagation();
      placeArmed({ start: task.start, afterId: task.id, parentId: task.parentId }, poolId);
    });

    // Nr. + Name
    tr.appendChild(el('td', { class: 'num' },
      el('span', { style: { paddingLeft: (depth * 13) + 'px', fontFamily: 'var(--mono)', fontSize: '10.5px', color: 'var(--fg-3)' }, text: task.wbs || '' })));
    const nameTd = el('td');
    const nameInput = el('input', {
      class: 'cell-input', type: 'text', value: task.name,
      onchange: (e) => store.updateTask(task.id, { name: e.target.value }, 'Aufgabe umbenennen'),
    });
    nameTd.appendChild(nameInput);
    if (task.type === 'milestone') nameTd.insertBefore(el('span', { text: '◆ ', title: 'Meilenstein', style: { color: 'var(--accent-2)' } }), nameInput);
    if (task.fromPool) {
      const n = store.placedCountFor(task);
      nameTd.appendChild(el('span', { class: 'pool-badge', style: { marginLeft: '6px' }, title: `Aus dem Ideen-Sammelbecken – ${n}× in den Plan gelegt`, text: `(${n})` }));
    }
    tr.appendChild(nameTd);

    // Beginn / Ende
    const startI = el('input', { class: 'cell-input', type: 'date', value: task.start, onchange: (e) => {
      const cal = store.project.settings.calendar;
      const ns = snapToWorkday(e.target.value, cal, 1);
      const dur = Math.max(1, task.duration || 1);
      const ne = task.type === 'milestone' ? ns : endFromDuration(ns, dur, cal);
      store.moveTaskDates(task.id, { start: ns, end: ne }, { addConstraint: true });
    } });
    tr.appendChild(el('td', {}, startI));
    const endI = el('input', { class: 'cell-input', type: 'date', value: task.end, onchange: (e) => {
      const cal = store.project.settings.calendar;
      let ne = snapToWorkday(e.target.value, cal, -1);
      if (ne < task.start) ne = task.start;
      const dur = Math.max(1, durationFromRange(task.start, ne, cal));
      store.updateTask(task.id, { end: endFromDuration(task.start, dur, cal), duration: dur }, 'Ende ändern');
    } });
    tr.appendChild(el('td', {}, endI));

    // Dauer
    tr.appendChild(el('td', { class: 'num' },
      el('input', { class: 'cell-input', type: 'number', min: '0', step: '1', value: String(task.duration), style: { textAlign: 'right' }, onchange: (e) => {
        const cal = store.project.settings.calendar;
        const dur = Math.max(0, Number(e.target.value) || 0);
        if (task.type === 'milestone') { store.updateTask(task.id, { duration: 0, end: task.start }); return; }
        store.updateTask(task.id, { duration: dur, end: endFromDuration(task.start, dur, cal) }, 'Dauer ändern');
      } })));

    // Fortschritt
    const progTd = el('td');
    const bar = el('div', { class: 'mini-bar', title: 'Ziehen zum Ändern' });
    const fill = el('i', { style: { width: task.progress + '%', background: task.progress >= 100 ? 'var(--ok)' : 'var(--accent)' } });
    bar.appendChild(fill);
    const range = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(task.progress), style: { width: '70px' }, oninput: (e) => { fill.style.width = e.target.value + '%'; }, onchange: (e) => store.setProgress(task.id, Number(e.target.value)) });
    progTd.appendChild(el('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, bar, range, el('span', { class: 'hint', style: { minWidth: '30px' }, text: task.progress + '%' })));
    tr.appendChild(progTd);

    // Status
    const st = el('select', { class: 'cell-input', onchange: (e) => store.setStatus(task.id, e.target.value) },
      ...STATUS_ORDER.map((s) => el('option', { value: s, text: STATUS[s].label })));
    st.value = task.status;
    tr.appendChild(el('td', {}, st));

    // Priorität
    const pr = el('select', { class: 'cell-input', onchange: (e) => store.updateTask(task.id, { priority: e.target.value }, 'Priorität ändern') },
      ...PRIORITY_ORDER.map((s) => el('option', { value: s, text: PRIORITY[s].label })));
    pr.value = task.priority;
    tr.appendChild(el('td', {}, pr));

    // Wer
    const who = el('td', { style: { cursor: 'pointer' }, title: 'Klicken zum Bearbeiten', onclick: () => { store.select(task.id); store.emit('open-detail'); } });
    const chips = el('div', { class: 'chip-row' });
    for (const a of task.assignees || []) {
      const r = p.resources.find((x) => x.id === a);
      if (r) chips.appendChild(el('span', { class: 'avatar', style: { background: r.color }, title: r.name, text: initials(r.name) }));
    }
    if (!(task.assignees || []).length) chips.appendChild(el('span', { class: 'hint', text: '–' }));
    who.appendChild(chips);
    tr.appendChild(who);

    // Vorgänger
    const depTd = el('td', { title: 'Klicken zum Bearbeiten', style: { cursor: 'pointer' }, onclick: () => { store.select(task.id); store.emit('open-detail'); } });
    if (!(task.deps || []).length) depTd.appendChild(el('span', { class: 'hint', text: '–' }));
    else {
      const txt = (task.deps || []).map((d) => {
        const pred = taskById(p, d.id);
        const lag = d.lag ? (d.lag > 0 ? `+${d.lag}` : String(d.lag)) : '';
        return `${pred ? (pred.wbs || pred.name) : '?'} ${d.type}${lag}`;
      }).join(', ');
      depTd.appendChild(el('span', { class: 'hint', text: txt, title: txt }));
    }
    tr.appendChild(depTd);

    // Ziel
    tr.appendChild(el('td', {},
      el('input', { class: 'cell-input', type: 'date', value: task.deadline || '', style: task.deadline && task.end > task.deadline && task.status !== 'done' ? { color: 'var(--danger)' } : null, onchange: (e) => store.updateTask(task.id, { deadline: e.target.value || null }, 'Ziel ändern') })));

    return tr;
  };

  let lastGroup = null;
  for (const task of tasks) {
    if (ui.groupBy) {
      const g = groupLabel(task, ui.groupBy);
      if (g !== lastGroup) {
        lastGroup = g;
        const tr = el('tr', { class: 'is-group' });
        const td = el('td', { colspan: String(COLS.length), style: { background: 'var(--bg-3)', color: 'var(--fg-2)', fontWeight: '600' }, text: g });
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    }
    tbody.appendChild(renderRow(task));
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
  if (!tasks.length) container.appendChild(el('div', { class: 'g-empty', text: 'Keine Aufgaben – mit „＋ Aufgabe“ anlegen.' }));
}
