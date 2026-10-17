/* ══════════════════════════════════════════════════════════════
   ui/dialogs.js – Dialoge: Kurzanleitung, Projekt öffnen,
   Team, Projekt-Einstellungen, Sicherungen, Rückfragen.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, toast, initials } from './dom.js';
import { store } from '../store.js';
import { storage, slugify } from '../storage.js';
import { formatDateTime, formatIso, dowLong, todayIso, addDays, parseIso } from '../dateutil.js';
import { PALETTE, DEP_TYPES, CONSTRAINT_TYPES, newTask, taskById, flatTasks } from '../model.js';

let openModal = null;

export function closeModal() {
  const host = document.getElementById('modal-host');
  clear(host);
  host.hidden = true;
  const prev = openModal;
  openModal = null;
  if (prev && prev.onClose) prev.onClose();
}

/**
 * Allgemeiner Dialog.
 * @param {{title:string, className?:string, body:(box:HTMLElement, close:Function)=>void,
 *          footer?:(bar:HTMLElement, close:Function)=>void, onClose?:Function}} opts
 */
export function modal(opts) {
  const host = document.getElementById('modal-host');
  const close = () => closeModal();
  const box = el('div', { class: 'modal' + (opts.className ? ' ' + opts.className : '') });
  const body = el('div', { class: 'modal-body' });
  const foot = el('div', { class: 'modal-foot' });
  box.appendChild(el('div', { class: 'modal-head' },
    el('h2', { text: opts.title }),
    el('button', { class: 'iconbtn', title: 'Schließen (Esc)', onclick: close, text: '✕' })));
  box.appendChild(body);
  if (opts.footer !== null) box.appendChild(foot);
  clear(host);
  host.appendChild(box);
  host.hidden = false;
  host.onmousedown = (e) => { if (e.target === host) close(); };
  openModal = opts;
  if (opts.body) opts.body(body, close);
  if (opts.footer) opts.footer(foot, close);
  else foot.appendChild(el('button', { class: 'btn', onclick: close, text: 'Schließen' }));
  return { box, body, foot, close };
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('modal-host').hidden) { e.stopPropagation(); closeModal(); }
}, true);

/* ───────── Rückfrage ───────── */

export function confirmDialog(title, text, okLabel = 'OK', { danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    modal({
      title, className: 'small',
      body: (box) => box.appendChild(el('p', { text })),
      footer: (bar, close) => {
        bar.appendChild(el('button', { class: 'btn', text: 'Abbrechen', onclick: () => { done = true; resolve(false); close(); } }));
        bar.appendChild(el('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), text: okLabel, onclick: () => { done = true; resolve(true); close(); } }));
      },
      onClose: () => { if (!done) resolve(false); },
    });
  });
}

export function promptDialog(title, label, value = '') {
  return new Promise((resolve) => {
    let done = false;
    const input = el('input', { type: 'text', value });
    const submit = (close) => { done = true; resolve(input.value.trim() || null); close(); };
    modal({
      title, className: 'small',
      body: (box) => box.appendChild(el('div', { class: 'field' }, el('label', { text: label }), input)),
      footer: (bar, close) => {
        bar.appendChild(el('button', { class: 'btn', text: 'Abbrechen', onclick: () => { done = true; resolve(null); close(); } }));
        bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Übernehmen', onclick: () => submit(close) }));
      },
      onClose: () => { if (!done) resolve(null); },
    });
    setTimeout(() => { input.focus(); input.select(); }, 30);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(closeModal); } });
  });
}

/* ───────── Kurzanleitung ───────── */

export function helpDialog() {
  modal({
    title: 'Kurzanleitung',
    body: (box) => {
      const sec = (h, items) => el('div', { class: 'help-sec' }, el('h3', { text: h }), el('ul', {}, items.map((i) => el('li', { html: i }))));
      box.appendChild(el('p', { class: 'hint', html: 'Alles wird <b>automatisch gespeichert</b> – du musst nie auf „Speichern“ drücken. Der Punkt oben zeigt den Zustand: <b>grün</b> = gespeichert, <b>gelb</b> = wird gleich gespeichert.' }));
      box.appendChild(sec('In fünf Schritten', [
        '<b>1. Neues Projekt</b> → Ordner wählen (z. B. <i>Dokumente\\Projekte</i>). Dort wird die Projektdatei <code>*.tplan.json</code> angelegt.',
        '<b>2. Aufgaben anlegen</b> mit <kbd>Einfg</kbd> oder „＋ Aufgabe“. Doppelklick auf eine Zeile öffnet die Details rechts.',
        '<b>3. Termine ziehen</b> – im Gantt den Balken greifen und verschieben, an den Enden ziehen zum Verlängern. Bei aktiver Auto-Planung wandern die Nachfolger mit.',
        '<b>4. Abhängigkeiten</b> im Detailbereich rechts hinzufügen (Vorgänger + Art + Puffer).',
        '<b>5. Ansichten wechseln</b> mit den Symbolen links: Gantt, Tabelle, Kalender, Board.',
      ]));
      box.appendChild(sec('Tastenkürzel', [
        '<kbd>Strg</kbd>+<kbd>Z</kbd> rückgängig · <kbd>Strg</kbd>+<kbd>Y</kbd> wiederholen',
        '<kbd>Einfg</kbd> neue Aufgabe · <kbd>Entf</kbd> löschen · <kbd>F2</kbd> umbenennen',
        '<kbd>Alt</kbd>+<kbd>→</kbd> einrücken · <kbd>Alt</kbd>+<kbd>←</kbd> ausrücken · <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> Zeile verschieben',
        '<kbd>1</kbd>…<kbd>4</kbd> Ansicht wechseln · <kbd>Strg</kbd>+<kbd>S</kbd> sofort speichern · <kbd>F1</kbd> Hilfe',
      ]));
      box.appendChild(sec('Speichern & Datei', [
        'Speicherort über den Hinweis oben rechts ändern (z. B. anderer Ordner).',
        'Sicherungskopien liegen im Unterordner <code>Backups</code> – wiederherstellbar über 💾 → Sicherungen.',
        'Projektdatei weitergeben: einfach die <code>.tplan.json</code> kopieren oder per ⤓ herunterladen.',
        'Änderungen während des Arbeitens werden in die Datei geschrieben; schließt du den Tab, wird vorher noch einmal gespeichert.',
      ]));
    },
  });
}

/* ───────── Projekt öffnen ───────── */

export async function openProjectDialog(onPick) {
  const files = await storage.listProjects();
  const backups = await storage.listBackups().catch(() => []);
  modal({
    title: 'Projekt öffnen',
    body: (box) => {
      box.appendChild(el('p', { class: 'hint', text: `Speicherort: ${storage.label()}` }));
      if (!files.length) box.appendChild(el('p', { class: 'hint', text: 'Keine Projektdateien gefunden.' }));
      const list = el('div', { class: 'filelist' });
      for (const f of files) {
        list.appendChild(el('div', { class: 'fileitem', onclick: async () => { closeModal(); onPick(f.name); } },
          el('span', { text: '📄' }),
          el('div', { class: 'fi-name', text: f.name }),
          el('div', { class: 'fi-meta', text: f.lastModified ? formatDateTime(f.lastModified) : `${Math.round(f.size / 1024)} KB` })));
      }
      box.appendChild(list);
      if (backups.length) {
        box.appendChild(el('h3', { style: { fontSize: '12px', marginTop: '16px' }, text: 'Sicherungskopien' }));
        const bl = el('div', { class: 'filelist' });
        for (const b of backups.slice(0, 12)) {
          bl.appendChild(el('div', { class: 'fileitem', onclick: async () => {
            closeModal();
            const text = await storage.readBackup(b.name);
            onPick(null, { backupName: b.name, text });
          } },
            el('span', { text: '🛟' }),
            el('div', { class: 'fi-name', text: b.name }),
            el('div', { class: 'fi-meta', text: formatDateTime(b.lastModified) })));
        }
        box.appendChild(bl);
      }
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Schließen', onclick: close }));
      bar.appendChild(el('button', { class: 'btn', text: 'Ordner wechseln…', onclick: async () => {
        close();
        try { await storage.chooseFolder(); toast('Ordner gewechselt', 'ok', storage.label()); openProjectDialog(onPick); }
        catch (e) { toast('Ordner konnte nicht geöffnet werden', 'err', e.message); }
      } }));
    },
  });
}

/* ───────── Team / Ressourcen ───────── */

export function resourcesDialog() {
  modal({
    title: 'Team & Beteiligte',
    body: (box) => {
      const list = el('div', { class: 'filelist' });
      const render = () => {
        clear(list);
        const p = store.project;
        if (!p.resources.length) list.appendChild(el('p', { class: 'hint', text: 'Noch niemand eingetragen.' }));
        for (const r of p.resources) {
          const used = p.tasks.filter((t) => (t.assignees || []).includes(r.id)).length;
          list.appendChild(el('div', { class: 'rc-row' },
            el('span', { class: 'avatar', style: { background: r.color }, text: initials(r.name) }),
            el('input', { class: 'nm', type: 'text', value: r.name, onchange: (e) => store.updateResource(r.id, { name: e.target.value }) }),
            el('input', { type: 'text', value: r.email || '', placeholder: 'E-Mail', style: { width: '160px' }, onchange: (e) => store.updateResource(r.id, { email: e.target.value }) }),
            el('span', { class: 'fi-meta', text: `${used} Aufg.` }),
            el('input', { class: 'sw', type: 'color', value: r.color, oninput: (e) => store.updateResource(r.id, { color: e.target.value }) }),
            el('button', { class: 'iconbtn', title: 'Entfernen', text: '✕', onclick: async () => {
              if (await confirmDialog('Person entfernen?', `„${r.name}“ wird aus allen Aufgaben entfernt.`, 'Entfernen', { danger: true })) { store.removeResource(r.id); render(); }
            } })));
        }
      };
      render();
      box.appendChild(list);
      box.appendChild(el('div', { style: { marginTop: '12px' } },
        el('button', { class: 'btn btn-accent', text: '＋ Person hinzufügen', onclick: () => { store.addResource({ color: PALETTE[store.project.resources.length % PALETTE.length] }); render(); } })));
    },
  });
}

/* ───────── Projekt-Einstellungen ───────── */

export function projectSettingsDialog() {
  const p = store.project;
  modal({
    title: 'Projekt-Einstellungen',
    body: (box) => {
      const nameI = el('input', { type: 'text', value: p.meta.name });
      const descI = el('textarea', { rows: 3, value: p.meta.description || '' });
      const authorI = el('input', { type: 'text', value: p.meta.author || '' });
      const startI = el('input', { type: 'date', value: p.settings.projectStart });
      box.appendChild(el('div', { class: 'field' }, el('label', { text: 'Projektname (wird Dateiname)' }), nameI));
      box.appendChild(el('div', { class: 'field' }, el('label', { text: 'Beschreibung' }), descI));
      box.appendChild(el('div', { class: 'grid2' },
        el('div', { class: 'field' }, el('label', { text: 'Projektbeginn' }), startI),
        el('div', { class: 'field' }, el('label', { text: 'Verantwortlich' }), authorI)));

      const wd = p.settings.calendar.workdays;
      const dayRow = el('div', { class: 'chip-row' });
      [['Mo', 1], ['Di', 2], ['Mi', 3], ['Do', 4], ['Fr', 5], ['Sa', 6], ['So', 0]].forEach(([lab, num]) => {
        const b = el('button', { class: 'pick' + (wd.includes(num) ? ' on' : ''), text: lab, onclick: () => {
          const cur = store.project.settings.calendar.workdays.slice();
          const i = cur.indexOf(num);
          if (i >= 0) cur.splice(i, 1); else cur.push(num);
          if (!cur.length) { toast('Mindestens ein Arbeitstag nötig', 'warn'); return; }
          store.setCalendar({ workdays: cur });
          b.classList.toggle('on');
        } });
        dayRow.appendChild(b);
      });
      box.appendChild(el('div', { class: 'field' }, el('label', { text: 'Arbeitstage' }), dayRow));

      const holIn = el('input', { type: 'date' });
      const holList = el('div', { class: 'chip-row' });
      const renderHol = () => {
        clear(holList);
        const list = store.project.settings.calendar.holidays.slice().sort();
        if (!list.length) holList.appendChild(el('span', { class: 'hint', text: 'keine Feiertage eingetragen' }));
        for (const h of list) {
          holList.appendChild(el('span', { class: 'tag removable', title: 'Entfernen', text: formatIso(h), onclick: () => {
            store.setCalendar({ holidays: store.project.settings.calendar.holidays.filter((x) => x !== h) }); renderHol();
          } }));
        }
      };
      renderHol();
      box.appendChild(el('div', { class: 'field' },
        el('label', { text: 'Feiertage / freie Tage' }),
        el('div', { style: { display: 'flex', gap: '8px' } }, holIn,
          el('button', { class: 'btn', text: 'Hinzufügen', onclick: () => { if (holIn.value) { store.setCalendar({ holidays: [...store.project.settings.calendar.holidays, holIn.value] }); holIn.value = ''; renderHol(); } } })),
        holList));
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Abbrechen', onclick: close }));
      bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Übernehmen', onclick: async () => {
        const p2 = store.project;
        const newName = nameI.value.trim() || 'Projekt';
        const renamed = newName !== p2.meta.name;
        store.setProjectMeta({ name: newName, description: descI.value, author: authorI.value });
        store.mutate('Projektbeginn ändern', (pr) => { pr.settings.projectStart = startI.value; });
        close();
        if (renamed && storage.isReady) {
          try {
            const newFile = await storage.renameFile(newName, store.serialize());
            toast('Datei umbenannt', 'ok', newFile);
            window.dispatchEvent(new CustomEvent('tplan:filestate'));
          } catch (e) { toast('Umbenennen fehlgeschlagen', 'err', e.message); }
        }
      } }));
    },
  });
}

/* ───────── Sicherungen ───────── */

export async function backupsDialog(onRestore) {
  const backups = await storage.listBackups().catch(() => []);
  modal({
    title: 'Sicherungen',
    body: (box) => {
      box.appendChild(el('p', { class: 'hint', text: `Automatische Kopien im Unterordner „Backups“ (${backups.length}).` }));
      if (!backups.length) box.appendChild(el('p', { class: 'hint', text: 'Noch keine Sicherungen vorhanden.' }));
      const list = el('div', { class: 'filelist' });
      for (const b of backups) {
        list.appendChild(el('div', { class: 'fileitem' },
          el('span', { text: '🛟' }),
          el('div', { class: 'fi-name', text: b.name }),
          el('div', { class: 'fi-meta', text: formatDateTime(b.lastModified) }),
          el('button', { class: 'btn', text: 'Wiederherstellen', onclick: async () => {
            if (!await confirmDialog('Wiederherstellen?', 'Der aktuelle Stand wird durch diese Sicherung ersetzt (rückgängig möglich).', 'Wiederherstellen')) return;
            const text = await storage.readBackup(b.name);
            closeModal();
            onRestore(text, b.name);
          } })));
      }
      box.appendChild(list);
    },
  });
}

/* ───────── Vorgänger wählen ───────── */

export function pickPredecessorDialog(excludeIds, onPick) {
  const input = el('input', { type: 'search', placeholder: 'Aufgabe suchen…' });
  const list = el('div', { class: 'filelist' });
  const render = () => {
    clear(list);
    const q = input.value.trim().toLowerCase();
    const items = flatTasks(store.project).filter((t) => !excludeIds.has(t.id) && t.type !== 'summary' && (!q || t.name.toLowerCase().includes(q)));
    for (const t of items.slice(0, 200)) {
      list.appendChild(el('div', { class: 'fileitem', onclick: () => { closeModal(); onPick(t.id); } },
        el('div', { class: 'fi-name', text: `${t.wbs ? t.wbs + '  ' : ''}${t.name}` }),
        el('div', { class: 'fi-meta', text: `${formatIso(t.start, 'short')} – ${formatIso(t.end, 'short')}` })));
    }
    if (!items.length) list.appendChild(el('p', { class: 'hint', text: 'Nichts gefunden.' }));
  };
  input.addEventListener('input', render);
  modal({
    title: 'Vorgänger wählen',
    body: (box) => { box.appendChild(input); box.appendChild(list); render(); },
    footer: (bar, close) => bar.appendChild(el('button', { class: 'btn', text: 'Abbrechen', onclick: close })),
  });
  setTimeout(() => input.focus(), 30);
}

/* ───────── Beispiel-/Wiederherstellungs-Hinweis ───────── */

export function recoveryDialog(info, { onRestoreBackup, onOpenFile }) {
  modal({
    title: 'Ungespeicherte Änderungen gefunden',
    body: (box) => {
      box.appendChild(el('p', { text: `Beim letzten Mal wurden Änderungen an „${info.file}“ nicht mehr abgeschlossen (${formatDateTime(info.at)}).` }));
      box.appendChild(el('p', { class: 'hint', text: 'Die Datei enthält in der Regel den letzten gespeicherten Stand. Prüfe sie und nutze bei Bedarf eine Sicherung.' }));
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Verstanden', onclick: () => { storage.clearDirtyFlag(); close(); } }));
      if (onRestoreBackup) bar.appendChild(el('button', { class: 'btn', text: 'Sicherungen zeigen', onclick: () => { storage.clearDirtyFlag(); close(); onRestoreBackup(); } }));
      if (onOpenFile) bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Datei öffnen', onclick: () => { storage.clearDirtyFlag(); close(); onOpenFile(info.file); } }));
    },
  });
}
