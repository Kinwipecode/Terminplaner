/* ══════════════════════════════════════════════════════════════
   ui/editor.js – Detailbereich rechts: alles zu einer Aufgabe.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials, toast } from './dom.js';
import { pickPredecessorDialog } from './dialogs.js';
import { store } from '../store.js';
import { STATUS, STATUS_ORDER, PRIORITY, PRIORITY_ORDER, DEP_TYPES, CONSTRAINT_TYPES, PALETTE, taskById, descendantsOf } from '../model.js';
import { formatIso, endFromDuration, durationFromRange, snapToWorkday, workdaysBetween } from '../dateutil.js';

/* ───────── Mehrfachauswahl: Änderungen für alle markierten Aufgaben ───────── */

function renderMulti(host) {
  host.hidden = false;
  const tasks = store.selectedInOrder();
  const ids = tasks.map((t) => t.id);
  const p = store.project;

  host.appendChild(el('div', { class: 'detail-head' },
    el('h3', { text: `${ids.length} Aufgaben ausgewählt` }),
    el('button', { class: 'iconbtn', title: 'Auswahl aufheben (Esc)', text: '✕', onclick: () => store.clearSelection() })));

  const body = el('div', { class: 'detail-body' });
  host.appendChild(body);
  const field = (label, ...kids) => el('div', { class: 'field' }, el('label', { text: label }), ...kids);

  body.appendChild(el('div', { class: 'warnbox', style: { color: 'var(--fg-2)', background: 'var(--bg-3)', borderColor: 'var(--line)' },
    text: 'Änderungen hier gelten für alle markierten Aufgaben. Unteraufgaben werden mitgenommen.' }));

  /* Aktionen */
  const acts = el('div', { class: 'chip-row' });
  acts.appendChild(el('button', { class: 'pick', text: '⧉ Duplizieren', title: 'Kopien direkt hinter den Originalen (Strg+D)', onclick: () => store.emit('action-duplicate') }));
  acts.appendChild(el('button', { class: 'pick', text: '⧉ Kopieren', title: 'In die Zwischenablage (Strg+C)', onclick: () => store.emit('action-copy') }));
  acts.appendChild(el('button', { class: 'pick', text: '📋 Einfügen', title: 'Kopierte Aufgaben einfügen (Strg+V)', onclick: () => store.emit('action-paste') }));
  acts.appendChild(el('button', { class: 'pick', text: '🗑 Löschen', title: 'Alle markierten löschen (Entf)', onclick: () => store.emit('action-delete-selection') }));
  acts.appendChild(el('button', { class: 'pick', text: '✕ Auswahl aufheben', onclick: () => store.clearSelection() }));
  body.appendChild(field('Aktionen', acts));

  /* Termin verschieben – für alle */
  const shiftRow = el('div', { class: 'chip-row' });
  const sh = (label, amount, unit, title) => el('button', { class: 'pick', text: label, title, onclick: () => store.shiftSelected(amount, unit) });
  shiftRow.appendChild(sh('− 1 Monat', -1, 'month', 'Alle einen Monat früher'));
  shiftRow.appendChild(sh('− 1 Woche', -1, 'week', 'Alle eine Woche früher'));
  shiftRow.appendChild(sh('− 1 Tag', -1, 'day', 'Alle einen Arbeitstag früher'));
  shiftRow.appendChild(sh('+ 1 Tag', 1, 'day', 'Alle einen Arbeitstag später'));
  shiftRow.appendChild(sh('+ 1 Woche', 1, 'week', 'Alle eine Woche später'));
  shiftRow.appendChild(sh('+ 1 Monat', 1, 'month', 'Alle einen Monat später'));
  body.appendChild(field('Termin verschieben (alle)', shiftRow));

  /* Status / Priorität */
  const stSel = el('select', { onchange: (e) => { if (e.target.value) store.updateMany(ids, { status: e.target.value }, 'Status für Auswahl'); } },
    el('option', { value: '', text: '– unverändert –' }),
    ...STATUS_ORDER.map((s) => el('option', { value: s, text: STATUS[s].label })));
  const prSel = el('select', { onchange: (e) => { if (e.target.value) store.updateMany(ids, { priority: e.target.value }, 'Priorität für Auswahl'); } },
    el('option', { value: '', text: '– unverändert –' }),
    ...PRIORITY_ORDER.map((s) => el('option', { value: s, text: PRIORITY[s].label })));
  body.appendChild(el('div', { class: 'grid2' },
    field('Status', stSel),
    field('Priorität', prSel)));

  /* Fortschritt in Stufen */
  const progRow = el('div', { class: 'chip-row' });
  for (const v of [0, 25, 50, 75, 100]) {
    progRow.appendChild(el('button', { class: 'pick', text: v + ' %', onclick: () => store.updateMany(ids, { progress: v }, 'Fortschritt für Auswahl') }));
  }
  body.appendChild(field('Fortschritt setzen', progRow));

  /* Farbe */
  const colors = el('div', { class: 'chip-row' });
  for (const c of PALETTE) {
    colors.appendChild(el('button', { class: 'pick', style: { background: c, width: '26px', height: '22px', padding: '0' }, title: c, onclick: () => store.updateMany(ids, { color: c }, 'Farbe für Auswahl') }));
  }
  colors.appendChild(el('button', { class: 'pick', text: 'automatisch', onclick: () => store.updateMany(ids, { color: null }, 'Farbe für Auswahl') }));
  body.appendChild(field('Farbe', colors));

  /* Liste der markierten Aufgaben */
  const list = el('div', { class: 'dep-list' });
  for (const t of tasks) {
    list.appendChild(el('div', { class: 'dep-item' },
      el('span', { class: 't', text: `${t.wbs ? t.wbs + ' ' : ''}${t.name}` }),
      el('button', { class: 'iconbtn', title: 'Nur diese markieren', text: '◎', onclick: () => store.select(t.id) }),
      el('button', { class: 'iconbtn', title: 'Aus Auswahl entfernen', text: '✕', onclick: () => store.select(t.id, 'toggle') })));
  }
  body.appendChild(field('Markiert', list));

  body.appendChild(el('div', { class: 'hint', text: 'Tipp: Im Explorer-Stil markieren – Klick, Strg+Klick für einzelne, Umschalt+Klick für einen Bereich. Strg+A markiert alles.' }));
  void p;
}

export function renderDetail(host) {
  clear(host);
  if (store.selectionCount() > 1) { renderMulti(host); return; }
  renderSingle(host);
}

/** Detailbereich für genau eine Aufgabe. */
function renderSingle(host) {
  const task = store.selected;
  if (!task) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  const p = store.project;

  const head = el('div', { class: 'detail-head' },
    el('h3', { text: task.type === 'milestone' ? '◆ Meilenstein' : task.type === 'summary' ? '⊞ Sammelaufgabe' : 'Aufgabe' }),
    el('button', { class: 'iconbtn', title: 'Schließen', text: '✕', onclick: () => store.select(null) }));
  host.appendChild(head);

  const body = el('div', { class: 'detail-body' });
  host.appendChild(body);

  const field = (label, ...kids) => el('div', { class: 'field' }, el('label', { text: label }), ...kids);

  /* Name */
  body.appendChild(field('Bezeichnung',
    el('input', { type: 'text', value: task.name, onchange: (e) => store.updateTask(task.id, { name: e.target.value }, 'Aufgabe umbenennen') })));

  /* Termine */
  const cal = p.settings.calendar;
  body.appendChild(el('div', { class: 'grid3' },
    field('Beginn', el('input', { type: 'date', value: task.start, onchange: (e) => {
      const ns = snapToWorkday(e.target.value, cal, 1);
      const dur = Math.max(1, task.duration || 1);
      store.moveTaskDates(task.id, { start: ns, end: task.type === 'milestone' ? ns : endFromDuration(ns, dur, cal) }, { addConstraint: true });
    } })),
    field('Ende', el('input', { type: 'date', value: task.end, disabled: task.type === 'milestone', onchange: (e) => {
      let ne = snapToWorkday(e.target.value, cal, -1);
      if (ne < task.start) ne = task.start;
      const dur = Math.max(1, durationFromRange(task.start, ne, cal));
      store.updateTask(task.id, { end: endFromDuration(task.start, dur, cal), duration: dur }, 'Ende ändern');
    } })),
    field('Dauer (AT)', el('input', { type: 'number', min: '0', value: String(task.duration), disabled: task.type === 'milestone', onchange: (e) => {
      const dur = Math.max(0, Number(e.target.value) || 0);
      store.updateTask(task.id, { duration: dur, end: endFromDuration(task.start, dur, cal) }, 'Dauer ändern');
    } }))));

  /* Termin verschieben */
  const shiftRow = el('div', { class: 'chip-row' });
  const shiftBtn = (label, amount, unit, title) => el('button', {
    class: 'pick', text: label, title,
    onclick: () => store.shiftTask(task.id, amount, unit),
  });
  shiftRow.appendChild(shiftBtn('− 1 Monat', -1, 'month', 'Einen Monat früher'));
  shiftRow.appendChild(shiftBtn('− 1 Woche', -1, 'week', 'Eine Woche früher (Umschalt+↑)'));
  shiftRow.appendChild(shiftBtn('− 1 Tag', -1, 'day', 'Einen Arbeitstag früher (Umschalt+←)'));
  shiftRow.appendChild(shiftBtn('+ 1 Tag', 1, 'day', 'Einen Arbeitstag später (Umschalt+→)'));
  shiftRow.appendChild(shiftBtn('+ 1 Woche', 1, 'week', 'Eine Woche später (Umschalt+↓)'));
  shiftRow.appendChild(shiftBtn('+ 1 Monat', 1, 'month', 'Einen Monat später'));
  shiftRow.appendChild(el('button', { class: 'pick', text: 'Verschieben…', title: 'Betrag und Einheit wählen', onclick: () => store.emit('open-shift') }));
  body.appendChild(field('Termin verschieben', shiftRow));

  /* Fortschritt */
  body.appendChild(field(`Fortschritt – ${task.progress} %`,
    el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(task.progress), oninput: (e) => { e.target.parentNode.querySelector('label').textContent = `Fortschritt – ${e.target.value} %`; }, onchange: (e) => store.setProgress(task.id, Number(e.target.value)) })));

  /* Status / Priorität / Ziel */
  const stSel = el('select', { onchange: (e) => store.setStatus(task.id, e.target.value) }, ...STATUS_ORDER.map((s) => el('option', { value: s, text: STATUS[s].label })));
  stSel.value = task.status;
  const prSel = el('select', { onchange: (e) => store.updateTask(task.id, { priority: e.target.value }, 'Priorität ändern') }, ...PRIORITY_ORDER.map((s) => el('option', { value: s, text: PRIORITY[s].label })));
  prSel.value = task.priority;
  body.appendChild(el('div', { class: 'grid2' },
    field('Status', stSel),
    field('Priorität', prSel)));
  body.appendChild(el('div', { class: 'grid2' },
    field('Ziel (spätestes Ende)', el('input', { type: 'date', value: task.deadline || '', onchange: (e) => store.updateTask(task.id, { deadline: e.target.value || null }, 'Ziel ändern') })),
    field('Art', (() => {
      const s = el('select', { onchange: (e) => store.updateTask(task.id, { type: e.target.value, duration: e.target.value === 'milestone' ? 0 : Math.max(1, task.duration), end: e.target.value === 'milestone' ? task.start : task.end }, 'Art ändern') },
        el('option', { value: 'task', text: 'Aufgabe' }),
        el('option', { value: 'milestone', text: 'Meilenstein' }),
        el('option', { value: 'summary', text: 'Sammelaufgabe' }));
      s.value = task.type === 'summary' && !p.tasks.some((x) => x.parentId === task.id) ? 'summary' : task.type === 'milestone' ? 'milestone' : 'task';
      return s;
    })())));

  if (task.conflict) body.appendChild(el('div', { class: 'warnbox', text: '⚠ Dieser Termin ist mit seinen Vorgängern nicht vereinbar. Auto-Planung einschalten oder Vorgänger prüfen.' }));
  const viol = store.violations.filter((v) => v.taskId === task.id);
  for (const v of viol) body.appendChild(el('div', { class: 'warnbox', text: '⚠ ' + v.message }));

  if (task.fromPool) {
    const n = store.placedCountFor(task);
    const entry = store.poolEntry(task.fromPool);
    body.appendChild(el('div', { class: 'rc-row', style: { borderLeft: '3px solid var(--pool)' } },
      el('span', { class: 'pool-badge', text: `(${n})`, title: 'Wie oft diese Idee schon in den Plan gelegt wurde' }),
      el('div', { class: 'nm', style: { fontSize: '11.5px' } },
        el('div', { text: `Aus dem Ideen-Sammelbecken: „${entry ? entry.text : '?'}“` }),
        el('div', { class: 'hint', text: `${n}× in den Plan gelegt – der Eintrag kann weiterhin mehrfach verwendet werden.` })),
      el('button', { class: 'btn', text: 'Zur Idee', onclick: () => store.emit('open-pool', task.fromPool) })));
  }

  /* Wer */
  const whoRow = el('div', { class: 'chip-row' });
  if (!p.resources.length) whoRow.appendChild(el('span', { class: 'hint', text: 'Noch keine Personen – links unter „Team“ anlegen.' }));
  for (const r of p.resources) {
    const on = (task.assignees || []).includes(r.id);
    whoRow.appendChild(el('button', { class: 'pick' + (on ? ' on' : ''), onclick: () => {
      const list = (task.assignees || []).slice();
      const i = list.indexOf(r.id);
      if (i >= 0) list.splice(i, 1); else list.push(r.id);
      store.updateTask(task.id, { assignees: list }, 'Zuweisung ändern');
    } },
      el('span', { class: 'avatar', style: { background: r.color, display: 'inline-grid', marginRight: '5px' }, text: initials(r.name) }),
      r.name));
  }
  body.appendChild(field('Beteiligt', whoRow));

  /* Vorgänger */
  const depList = el('div', { class: 'dep-list' });
  const deps = task.deps || [];
  if (!deps.length) depList.appendChild(el('span', { class: 'hint', text: 'keine Vorgänger' }));
  for (const d of deps) {
    const pred = taskById(p, d.id);
    const item = el('div', { class: 'dep-item' });
    item.appendChild(el('span', { class: 't', title: pred ? pred.name : '?', text: pred ? `${pred.wbs ? pred.wbs + ' ' : ''}${pred.name}` : '(gelöscht)' }));
    const typeSel = el('select', { title: 'Art der Verknüpfung', onchange: (e) => store.updateDependency(task.id, d.id, { type: e.target.value }) },
      ...Object.entries(DEP_TYPES).map(([k, v]) => el('option', { value: k, text: k })));
    typeSel.value = d.type;
    item.appendChild(typeSel);
    item.appendChild(el('input', { type: 'number', value: String(d.lag || 0), title: 'Puffer in Arbeitstagen', onchange: (e) => store.updateDependency(task.id, d.id, { lag: Number(e.target.value) || 0 }) }));
    item.appendChild(el('button', { class: 'iconbtn', title: 'Verknüpfung entfernen', text: '✕', onclick: () => store.removeDependency(task.id, d.id) }));
    depList.appendChild(item);
  }
  body.appendChild(field('Vorgänger (Art · Puffer)',
    depList,
    el('button', { class: 'btn', text: '＋ Vorgänger hinzufügen', onclick: () => {
      const exclude = new Set([task.id, ...descendantsOf(p, task.id).map((x) => x.id)]);
      pickPredecessorDialog(exclude, (predId) => store.addDependency(task.id, predId));
    } })));

  /* Nachfolger */
  const succs = p.tasks.filter((t) => (t.deps || []).some((d) => d.id === task.id));
  if (succs.length) {
    const list = el('div', { class: 'chip-row' });
    for (const s of succs) list.appendChild(el('button', { class: 'pick', text: `${s.wbs ? s.wbs + ' ' : ''}${s.name}`, onclick: () => store.select(s.id) }));
    body.appendChild(field('Nachfolger', list));
  }

  /* Puffer / Kritisch */
  const slack = store.slack.get(task.id);
  if (slack != null && task.type !== 'summary') {
    body.appendChild(el('div', { class: 'hint', text: slack === 0 ? 'Auf dem kritischen Pfad (kein Puffer).' : `Puffer: ${slack} Arbeitstag(e).` }));
  }

  /* Festlegung */
  const con = task.constraint;
  body.appendChild(field('Termin-Festlegung',
    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
      (() => {
        const s = el('select', { onchange: (e) => {
          const type = e.target.value;
          if (type === 'ASAP') store.clearConstraint(task.id);
          else store.updateTask(task.id, { constraint: { type, date: con?.date || task.start } }, 'Festlegung ändern');
        } }, ...Object.entries(CONSTRAINT_TYPES).map(([k, v]) => el('option', { value: k, text: v })));
        s.value = con ? con.type : 'ASAP';
        return s;
      })(),
      con ? el('input', { type: 'date', value: con.date, onchange: (e) => store.updateTask(task.id, { constraint: { type: con.type, date: e.target.value } }, 'Festlegung ändern') }) : null,
      con ? el('button', { class: 'iconbtn', title: 'Festlegung entfernen', text: '✕', onclick: () => store.clearConstraint(task.id) }) : null)));

  /* Farbe */
  const swatches = el('div', { class: 'chip-row' });
  for (const c of PALETTE) {
    swatches.appendChild(el('button', { class: 'pick', style: { background: c, width: '26px', height: '22px', padding: '0', borderColor: task.color === c ? 'var(--fg)' : 'transparent' }, title: c, onclick: () => store.updateTask(task.id, { color: c }, 'Farbe ändern') }));
  }
  swatches.appendChild(el('button', { class: 'pick', text: 'automatisch', onclick: () => store.updateTask(task.id, { color: null }, 'Farbe zurücksetzen') }));
  body.appendChild(field('Farbe', swatches));

  /* Notizen */
  body.appendChild(field('Notizen', el('textarea', { rows: 4, value: task.notes || '', placeholder: 'Beschreibung, Links, Offenes…', onchange: (e) => store.updateTask(task.id, { notes: e.target.value }, 'Notizen ändern') })));

  /* Aktionen */
  const acts = el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } });
  acts.appendChild(el('button', { class: 'btn', text: '⧉ Duplizieren', onclick: () => store.duplicateTask(task.id) }));
  acts.appendChild(el('button', { class: 'btn', text: '＋ Unteraufgabe', onclick: () => { const id = store.addTask({ parentId: task.id, start: task.start }, task.id); store.indent(id); } }));
  if (task.parentId) acts.appendChild(el('button', { class: 'btn', text: 'Ausrücken', onclick: () => store.outdent(task.id) }));
  acts.appendChild(el('button', { class: 'btn btn-danger', text: 'Löschen', onclick: async () => {
    const n = descendantsOf(p, task.id).length;
    const ok = window.confirm(n ? `„${task.name}“ und ${n} Unteraufgabe(n) löschen?` : `„${task.name}“ löschen?`);
    if (ok) { store.deleteTask(task.id); toast('Gelöscht – mit Strg+Z rückgängig zu machen', 'ok'); }
  } }));
  body.appendChild(acts);

  /* Info */
  const info = workdaysBetween(task.start, task.end, cal);
  body.appendChild(el('div', { class: 'hint', text: `${formatIso(task.start)} – ${formatIso(task.end)} · ${info} Arbeitstag(e) im Zeitraum · Nr. ${task.wbs || '–'}` }));
}
