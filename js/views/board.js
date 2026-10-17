/* ══════════════════════════════════════════════════════════════
   views/board.js – Kanban-Board nach Status.
   Karten zwischen den Spalten ziehen ändert den Status.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials } from '../ui/dom.js';
import { store } from '../store.js';
import { STATUS, STATUS_ORDER, PRIORITY, isSummary, taskById } from '../model.js';
import { formatIso, todayIso } from '../dateutil.js';

export function renderBoard(container) {
  clear(container);
  const p = store.project;
  const wrap = el('div', { class: 'boardwrap' });
  const tasks = store.visibleTasks().filter((t) => !isSummary(p, t) && t.type !== 'summary');

  for (const status of STATUS_ORDER) {
    const list = tasks.filter((t) => t.status === status);
    const col = el('div', { class: 'col', dataset: { status } });
    col.appendChild(el('div', { class: 'col-head' },
      el('span', { class: 'pdot', style: { background: STATUS[status].color } }),
      el('span', { text: STATUS[status].label }),
      el('span', { class: 'cnt', text: `· ${list.length}` })));
    const body = el('div', { class: 'col-body' });

    for (const t of list) {
      const card = el('div', { class: 'card', draggable: 'true', dataset: { taskId: t.id }, style: { borderLeftColor: t.color || STATUS[t.status].color } });
      card.appendChild(el('div', { class: 'card-title', text: (t.type === 'milestone' ? '◆ ' : '') + t.name }));
      const meta = el('div', { class: 'card-meta' });
      if (t.wbs) meta.appendChild(el('span', { text: '#' + t.wbs }));
      meta.appendChild(el('span', { text: `${formatIso(t.start, 'short')} – ${formatIso(t.end, 'short')}` }));
      if (t.priority && t.priority !== 'normal') meta.appendChild(el('span', { style: { color: PRIORITY[t.priority].color }, text: PRIORITY[t.priority].label }));
      if (t.deadline && t.end > t.deadline && t.status !== 'done') meta.appendChild(el('span', { style: { color: 'var(--danger)' }, title: 'Ziel: ' + t.deadline, text: '⏰' }));
      if (t.start <= todayIso() && t.end >= todayIso() && t.status !== 'done') meta.appendChild(el('span', { style: { color: 'var(--accent)' }, text: 'läuft heute' }));
      for (const a of t.assignees || []) {
        const r = p.resources.find((x) => x.id === a);
        if (r) meta.appendChild(el('span', { class: 'avatar', style: { background: r.color }, title: r.name, text: initials(r.name) }));
      }
      card.appendChild(meta);
      if (t.progress > 0) {
        const bar = el('div', { class: 'mini-bar', style: { marginTop: '6px' } }, el('i', { style: { width: t.progress + '%', background: STATUS[t.status].color } }));
        card.appendChild(bar);
      }
      card.addEventListener('click', () => { store.select(t.id); store.emit('open-detail'); });
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; card.classList.add('is-dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
      body.appendChild(card);
    }
    if (!list.length) body.appendChild(el('div', { class: 'hint', style: { padding: '10px' }, text: 'leer' }));

    body.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop-target'); });
    body.addEventListener('dragleave', () => col.classList.remove('drop-target'));
    body.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drop-target');
      const id = e.dataTransfer.getData('text/plain');
      const t = taskById(store.project, id);
      if (!t || t.status === status) return;
      store.setStatus(t.id, status);
    });
    col.appendChild(body);
    wrap.appendChild(col);
  }

  container.appendChild(wrap);
  if (!tasks.length) container.appendChild(el('div', { class: 'g-empty', text: 'Keine Aufgaben vorhanden.' }));
}
