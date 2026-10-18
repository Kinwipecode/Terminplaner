/* ══════════════════════════════════════════════════════════════
   ui/dialogs.js – Dialoge: Kurzanleitung, Projekt öffnen,
   Team, Projekt-Einstellungen, Sicherungen, Rückfragen.
   ══════════════════════════════════════════════════════════════ */

import { el, clear, initials, toast } from './dom.js';
import { POOL_UNITS, POOL_DURATION_MAX, poolDurationWorkdays } from '../pool.js';
import { store } from '../store.js';
import { storage, slugify } from '../storage.js';
import { THEMES, applyTheme, currentThemeId, toggleLightDark } from '../themes.js';
import { formatDateTime, formatIso, dowLong, todayIso, addDays, addMonths, parseIso, snapToWorkday, endFromDuration } from '../dateutil.js';
import { PALETTE, DEP_TYPES, CONSTRAINT_TYPES, newTask, taskById, flatTasks } from '../model.js';
import { versionLabel } from '../version.js';

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
        '<kbd>1</kbd>…<kbd>4</kbd> Ansicht wechseln · <kbd>Strg</kbd>+<kbd>S</kbd> sofort speichern · <kbd>Strg</kbd>+<kbd>P</kbd> drucken · <kbd>F1</kbd> Hilfe',
        '<b>Umschalt</b>+<kbd>←</kbd>/<kbd>→</kbd> Aufgabe einen Arbeitstag verschieben · <b>Umschalt</b>+<kbd>Strg</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> eine Woche · <b>Umschalt</b>+<kbd>Strg</kbd>+<kbd>←</kbd>/<kbd>→</kbd> einen Monat',
        '<kbd>Alt</kbd>+<kbd>L</kbd> sperren bzw. Schloss öffnen – eine gesperrte Aufgabe 🔒 lässt sich nicht ändern; ein Verschieben, das eine gesperrte Aufgabe mitziehen würde, wird mit Hinweis abgelehnt',
        'Mehrere Aufgaben markieren: <b>Klick</b>, <b>Strg</b>+<b>Klick</b> für einzelne, <b>Umschalt</b>+<b>Klick</b> für einen Bereich · <kbd>Strg</kbd>+<kbd>A</kbd> alles · <kbd>Entf</kbd> löschen · <kbd>Strg</kbd>+<kbd>C</kbd>/<kbd>V</kbd>/<kbd>D</kbd> kopieren/einfügen/duplizieren',
        '<b>Umschalt</b>+<kbd>↑</kbd>/<kbd>↓</kbd> Auswahl erweitern bzw. verkleinern (wie im Explorer)',
      ]));
      box.appendChild(sec('Maus und Ansicht im Gantt', [
        '<b>◉ Heute</b> (oder <kbd>Leertaste</kbd>): springt zum heutigen Datum – auch wenn es außerhalb des Plans liegt.',
        '<b>Strg</b> gedrückt halten und mit der <b>linken Maustaste ziehen</b> (oder die <b>mittlere Maustaste</b> ziehen): der Ausschnitt wandert – wie ein Hand-Werkzeug.',
        '<b>Strg</b>+<b>Mausrad</b>: stufenlos zoomen, genau um den Mauszeiger herum.',
        '<b>Umschalt</b>+<b>Mausrad</b>: seitlich rollen. Mausrad allein: senkrecht rollen.',
        'Die Anzeige <b>Zoom … %</b> neben den Rasterknöpfen zeigt den Maßstab; ein Klick darauf setzt ihn zurück.',
        '<b>⤢ Einpassen</b>: der ganze Zeitraum passt in die Fensterbreite.',
      ]));
      box.appendChild(sec('Ideen-Sammelbecken', [
        'Links auf <b>Ideen</b>: öffnet ein eigenes Browserfenster – ideal für den zweiten Bildschirm.',
        'Dort Aufgaben <b>ohne Termin</b> aufschreiben. Dann in den Plan ziehen oder anklicken und im Plan auf die Stelle klicken.',
        'Der Eintrag bleibt erhalten und kann <b>mehrfach</b> eingeplant werden; die Zahl in Klammern zeigt, wie oft.',
        'Eingeplante Aufgaben sind <b>türkis</b> gefärbt und damit sofort von den anderen zu unterscheiden.',
        'Die Liste wird mit dem Projekt gespeichert. Der <b>allgemeine Vorrat</b> gilt für alle Projekte und lässt sich in ein neues Projekt übernehmen.',
      ]));
      box.appendChild(sec('Farblayout', [
        'Links auf <b>Farbe</b> oder oben auf <b>◐</b>: neun fertige Farblayouts, ein Klick genügt – Nachtblau, Anthrazit, Tiefsee, Violettnacht, Hoher Kontrast, Tageslicht, Nordlicht, Papier, Sonnenschein.',
        'Die Wahl wird gemerkt und gilt beim nächsten Start weiter.',
        'Der Ausdruck bleibt unabhängig davon immer hell und druckerfreundlich.',
      ]));
      box.appendChild(sec('Drucken und PDF', [
        'Links auf <b>Drucken</b> (oder oben auf <b>🖨</b>, oder <kbd>Strg</kbd>+<kbd>P</kbd>): Blattformat wählen (A4/A3 hoch oder quer – oder <b>eigenes Maß</b> in Millimetern), Inhalt zusammenklicken, Seitenzahl wird laufend angezeigt.',
        '<b>🔍 Vorschau anzeigen</b>: die fertigen Blätter am Bildschirm ansehen (Blattwechsel, Zoom, Einpassen) – gedruckt wird erst auf Klick.',
        'Im Druckdialog als Drucker <b>„Microsoft Print to PDF“</b> wählen → man erhält eine PDF-Datei im eingestellten Blattformat.',
        'Ränder auf „Standard“ lassen, <b>Hintergrundgrafiken</b> einschalten, damit die Balken farbig bleiben.',
        'Reicht der Platz nicht, entstehen weitere Blätter: links wiederholen sich die Aufgaben, die Zeitachse läuft nach rechts weiter.',
      ]));
      box.appendChild(sec('Detailbereich im eigenen Fenster', [
        'Der <b>Detailbereich</b> (alles zur markierten Aufgabe) steht in einem <b>eigenen Fenster</b> – so hat der Plan den ganzen Bildschirm.',
        'Es geht beim <b>Markieren</b> einer Aufgabe von selbst auf. Wurde es geschlossen, ist es beim nächsten Markieren wieder da – an der zuletzt benutzten Stelle, auch auf dem zweiten Bildschirm.',
        'Links auf <b>🗗 Detail</b> schaltet den Fensterbetrieb ab: der Bereich steht dann wieder als rechte Spalte im Plan.',
        'Beim Beenden des Programms wird das Fenster mit geschlossen.',
      ]));
      box.appendChild(sec('Speichern & Datei', [
        'Oben in der Leiste: <b>＋</b> neues Projekt · <b>📂</b> Projekt öffnen · <b>🚪</b> Projekt schließen (zurück zur Startseite, die App bleibt offen) · <b>💾</b> jetzt speichern · <b>⤓</b> herunterladen.',
        'Speicherort über den Hinweis oben rechts ändern (z. B. anderer Ordner).',
        'Sicherungskopien liegen im Unterordner <code>Backups</code> – wiederherstellbar über 💾 → Sicherungen.',
        'Projektdatei weitergeben: einfach die <code>.tplan.json</code> kopieren oder per ⤓ herunterladen.',
        'Änderungen während des Arbeitens werden in die Datei geschrieben; schließt du den Tab, wird vorher noch einmal gespeichert.',
        '<b>Projekt schließen</b> speichert zuletzt noch einmal und hält das automatische Speichern an – erst dann kommt der Startbildschirm.',
      ]));
      box.appendChild(el('p', { class: 'hint', text: versionLabel() }));
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

      /* Darstellung: Zeilenhöhe */
      const rowSeg = el('div', { class: 'segmented' });
      for (const [v, t] of [[24, 'kompakt'], [30, 'normal'], [38, 'geräumig'], [46, 'sehr groß']]) {
        const b = el('button', {
          class: Number(p.settings.rowHeight || 30) === v ? 'is-active' : '',
          text: t,
          onclick: () => {
            store.setRowHeight(v);
            for (const x of rowSeg.children) x.classList.toggle('is-active', Number(x.dataset.v) === v);
          },
        });
        b.dataset.v = String(v);
        rowSeg.appendChild(b);
      }
      box.appendChild(el('div', { class: 'field' },
        el('label', { text: 'Zeilenhöhe in Listen und Gantt' }),
        rowSeg,
        el('div', { class: 'hint', text: 'Wird sofort angewendet und im Projekt gespeichert – praktisch bei vielen Aufgaben oder für touch-Bedienung.' })));
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Farblayout…', onclick: () => { close(); themeDialog(); } }));
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

/* ───────── Farblayout wählen ───────── */

function themePreview(themeId) {
  const p = el('div', { class: 'tc-preview', dataset: { theme: themeId } });
  p.appendChild(el('div', { class: 'tp-top' },
    el('span', { class: 'tp-dot' }),
    el('span', { class: 'tp-line', style: { width: '34%' } })));
  const panel = el('div', { class: 'tp-panel' });
  panel.appendChild(el('div', { class: 'tp-row' },
    el('span', { class: 'tp-name', style: { width: '20%' } }),
    el('span', { class: 'tp-bar', style: { width: '42%', background: 'var(--accent)' } })));
  panel.appendChild(el('div', { class: 'tp-row' },
    el('span', { class: 'tp-name', style: { width: '14%' } }),
    el('span', { class: 'tp-bar', style: { width: '24%', background: 'var(--ok)' } }),
    el('span', { class: 'tp-bar', style: { width: '16%', background: 'var(--warn)' } })));
  panel.appendChild(el('div', { class: 'tp-row' },
    el('span', { class: 'tp-name', style: { width: '28%' } }),
    el('span', { class: 'tp-bar', style: { width: '18%', background: 'var(--danger)' } })));
  p.appendChild(panel);
  p.appendChild(el('div', { class: 'tp-foot' },
    el('span', { class: 'tp-chip', style: { background: 'var(--accent)' } }),
    el('span', { class: 'tp-chip', style: { background: 'var(--accent-2)' } }),
    el('span', { class: 'tp-chip', style: { background: 'var(--fg-2)' } }),
    el('span', { class: 'tp-chip', style: { background: 'var(--line)' } })));
  return p;
}

export function themeDialog() {
  let renderGrid = () => {};
  modal({
    title: 'Farblayout der Oberfläche',
    body: (box) => {
      box.appendChild(el('p', { class: 'hint', text: 'Ein Klick genügt. Die Wahl wird gemerkt und gilt für alle Projekte – auch beim nächsten Start.' }));
      const grid = el('div', { class: 'theme-grid' });
      renderGrid = () => {
        clear(grid);
        for (const t of THEMES) {
          const active = t.id === currentThemeId();
          const card = el('button', {
            class: 'theme-card' + (active ? ' is-active' : ''),
            onclick: () => { applyTheme(t.id); renderGrid(); },
          });
          card.appendChild(themePreview(t.id));
          card.appendChild(el('div', { class: 'theme-meta' },
            el('div', { class: 'tm-name' }, el('span', { text: t.name }), el('span', { class: 'tm-tag', text: t.mode })),
            el('div', { class: 'tm-desc', text: t.desc })));
          grid.appendChild(card);
        }
      };
      renderGrid();
      box.appendChild(grid);
      box.appendChild(el('p', { class: 'hint', text: 'Die Balkenfarben behalten immer ihre Bedeutung (grün = erledigt, rot = blockiert, blau = offen). Der Ausdruck ist unabhängig vom Layout immer hell und druckerfreundlich.' }));
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Hell ⇄ Dunkel', title: 'Schnell zwischen hell und dunkel wechseln', onclick: () => { toggleLightDark(); renderGrid(); } }));
      bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Fertig', onclick: close }));
    },
  });
}

/* ───────── Termin verschieben (Dialog) ───────── */

export function shiftTaskDialog(task = store.selected) {
  if (!task) { toast('Bitte zuerst eine Aufgabe auswählen', 'warn'); return; }
  const p = store.project;
  const cal = p.settings.calendar;
  let amount = 1;
  let unit = 'day';
  let dir = 1;

  const preview = el('div', { class: 'hint', style: { fontSize: '12.5px' } });
  const amountI = el('input', { type: 'number', value: '1', min: '1', max: '99', style: { width: '80px' }, onchange: (e) => { amount = Math.max(1, Number(e.target.value) || 1); e.target.value = String(amount); update(); } });

  const unitSeg = el('div', { class: 'segmented' });
  for (const [v, t] of [['day', 'Tage'], ['week', 'Wochen'], ['month', 'Monate']]) {
    const b = el('button', { class: v === unit ? 'is-active' : '', text: t, onclick: () => { unit = v; refresh(); } });
    b.dataset.v = v;
    unitSeg.appendChild(b);
  }
  const dirSeg = el('div', { class: 'segmented' });
  for (const [v, t] of [[1, 'später →'], [-1, '← früher']]) {
    const b = el('button', { class: v === dir ? 'is-active' : '', text: t, onclick: () => { dir = v; refresh(); } });
    b.dataset.v = String(v);
    dirSeg.appendChild(b);
  }
  function refresh() {
    for (const b of unitSeg.children) b.classList.toggle('is-active', b.dataset.v === unit);
    for (const b of dirSeg.children) b.classList.toggle('is-active', b.dataset.v === String(dir));
    update();
  }

  function computeDates() {
    const n = amount * dir;
    const step = unit === 'month' ? 0 : (unit === 'week' ? 7 : 1);
    const nsRaw = unit === 'month' ? addMonths(task.start, n) : addDays(task.start, n * step);
    const ns = snapToWorkday(nsRaw, cal, n > 0 ? 1 : -1);
    const dur = task.type === 'milestone' ? 0 : Math.max(1, task.duration || 1);
    const ne = task.type === 'milestone' ? ns : endFromDuration(ns, dur, cal);
    return { ns, ne };
  }

  function update() {
    const { ns, ne } = computeDates();
    preview.innerHTML = `<b>${formatIso(task.start)}</b>${task.type === 'milestone' ? '' : ' – <b>' + formatIso(task.end) + '</b>'}`
      + ` &nbsp;→&nbsp; <b style="color:var(--accent)">${formatIso(ns)}</b>${task.type === 'milestone' ? '' : ' – <b style="color:var(--accent)">' + formatIso(ne) + '</b>'}`
      + ` &nbsp;(Dauer ${task.duration} Arbeitstag(e))`;
  }
  update();

  const autoI = el('input', { type: 'checkbox', checked: store.ui.autoPlan, onchange: (e) => {
    store.ui.autoPlan = e.target.checked;
    store.reschedule();
    store.emit('change');
  } });

  modal({
    title: 'Termin verschieben',
    className: 'small',
    body: (box) => {
      box.appendChild(el('p', { class: 'hint', text: `Aufgabe: „${task.name}“` }));
      box.appendChild(el('div', { class: 'grid2' },
        el('div', { class: 'field' }, el('label', { text: 'Wie viele' }), amountI),
        el('div', { class: 'field' }, el('label', { text: 'Richtung' }), dirSeg)));
      box.appendChild(el('div', { class: 'field' }, el('label', { text: 'Einheit' }), unitSeg));
      box.appendChild(el('div', { class: 'field' }, el('label', { text: 'Neuer Termin' }), preview));
      box.appendChild(el('label', { class: 'toggle' }, autoI, el('span', { class: 'track' }), el('span', { text: 'Auto-Planung: Nachfolger mitverschieben' })));
      box.appendChild(el('p', { class: 'hint', text: 'Der neue Termin wird als Festlegung gespeichert („beginnt nicht vor …“), damit er hält. Über den Detailbereich lässt sich das wieder lösen.' }));
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Abbrechen', onclick: close }));
      bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Verschieben', onclick: () => {
        store.shiftTask(task.id, amount * dir, unit);
        close();
      } }));
    },
  });
}

/* ───────── Ideen-Sammelbecken (Fenster im Hauptfenster) ───────── */

/**
 * Dauer einer Idee: Zahl + Einheit, darf leer bleiben.
 * Steht eine Dauer drin, bekommt die daraus entstehende Aufgabe diese Länge.
 */
function poolDurationControl(entry, scope, rerender) {
  const days = poolDurationWorkdays(entry);
  const wrap = el('span', { class: 'pool-dur' + (days ? ' is-set' : '') });
  wrap.appendChild(el('input', {
    class: 'pool-dur-num',
    type: 'number', min: '1', max: String(POOL_DURATION_MAX), step: '1',
    placeholder: '–',
    value: entry.duration > 0 ? String(entry.duration) : '',
    title: 'Dauer der Idee (freiwillig) – leer lassen, wenn noch keine Dauer feststeht',
    onchange: (ev) => {
      const n = Math.round(Number(ev.target.value) || 0);
      store.updatePoolEntry(entry.id, { duration: n > 0 ? Math.min(POOL_DURATION_MAX, n) : 0, unit: entry.unit || 'day' }, { scope });
      rerender();
    },
  }));
  wrap.appendChild(el('select', {
    class: 'pool-dur-unit',
    title: 'Einheit: Tage, Wochen oder Monate',
    onchange: (ev) => { store.updatePoolEntry(entry.id, { unit: ev.target.value, duration: entry.duration || 0 }, { scope }); rerender(); },
  }, ...POOL_UNITS.map((u) => el('option', { value: u.v, text: u.label, selected: (entry.unit || 'day') === u.v }))));
  wrap.appendChild(el('span', {
    class: 'pool-dur-out',
    title: days ? 'So lang wird die Aufgabe beim Einplanen' : 'Ohne Angabe wird die Aufgabe 1 Arbeitstag lang',
    text: days ? (days === 1 ? '1 AT' : `${days} AT`) : '',
  }));
  return wrap;
}

export function poolDialog(highlightId = null, onOpenWindow = null) {
  let scope = 'project';
  let renderList = () => {};

  modal({
    title: 'Ideen-Sammelbecken',
    body: (box) => {
      box.appendChild(el('p', { class: 'hint', text: 'Aufgaben ohne Termin aufschreiben. Anklicken → im Plan auf die Stelle klicken (oder in den Plan ziehen). Der Eintrag bleibt erhalten und lässt sich mehrfach einplanen – die Zahl in Klammern zählt mit.' }));

      const tabs = el('div', { class: 'segmented' });
      for (const [v, t] of [['project', 'Projekt-Sammelbecken'], ['global', 'Allgemeiner Vorrat']]) {
        const b = el('button', { class: v === scope ? 'is-active' : '', text: t, onclick: () => { scope = v; refreshTabs(); renderList(); } });
        b.dataset.v = v;
        tabs.appendChild(b);
      }
      function refreshTabs() { for (const b of tabs.children) b.classList.toggle('is-active', b.dataset.v === scope); }
      box.appendChild(tabs);

      const input = el('input', { type: 'text', placeholder: 'Neue Idee aufschreiben…' });
      const add = () => { if (input.value.trim()) { store.addPoolEntry(input.value, { scope }); input.value = ''; renderList(); } };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      box.appendChild(el('div', { style: { display: 'flex', gap: '8px' } }, input,
        el('button', { class: 'btn btn-accent', text: '＋ Aufschreiben', onclick: add })));

      const list = el('div', { class: 'filelist' });
      renderList = () => {
        clear(list);
        const items = store.poolEntries(scope);
        if (!items.length) list.appendChild(el('p', { class: 'hint', text: scope === 'global' ? 'Der allgemeine Vorrat ist leer.' : 'Noch keine Ideen aufgeschrieben.' }));
        for (const e of items) {
          const placed = (e.placedCount || 0) > 0;
          const row = el('div', { class: 'rc-row', style: placed ? { borderLeft: '3px solid var(--pool)' } : null });
          row.appendChild(el('span', { class: 'pool-badge' + (placed ? '' : ' soft'), text: `(${e.placedCount || 0})`, title: 'Wie oft schon in den Plan gelegt' }));
          const txt = el('input', { class: 'nm', type: 'text', value: e.text, onchange: (ev) => { store.updatePoolEntry(e.id, { text: ev.target.value.trim() || e.text }, { scope }); renderList(); } });
          // Name oben, Dauer darunter – so bleibt der Name gut lesbar
          row.appendChild(el('div', { class: 'pool-row-main' }, txt, poolDurationControl(e, scope, renderList)));
          row.appendChild(el('button', { class: 'btn', text: 'In den Plan legen', title: 'Danach im Plan auf die gewünschte Stelle klicken', onclick: () => {
            store.arm(e.id, scope);
            closeModal();
            toast(`„${e.text}“ ist bereit`, 'ok', 'Jetzt im Gantt oder Kalender auf die gewünschte Stelle klicken.');
          } }));
          row.appendChild(el('button', { class: 'iconbtn', title: e.done ? 'wieder offen' : 'erledigt', text: e.done ? '↺' : '✓', onclick: () => { store.updatePoolEntry(e.id, { done: !e.done }, { scope }); renderList(); } }));
          row.appendChild(el('button', { class: 'iconbtn', title: scope === 'global' ? 'ins Projekt holen' : 'in den allgemeinen Vorrat', text: scope === 'global' ? '↧' : '↥', onclick: () => { store.movePoolEntry(e.id, scope === 'global' ? 'project' : 'global'); renderList(); } }));
          row.appendChild(el('button', { class: 'iconbtn', title: 'löschen', text: '🗑', onclick: async () => {
            if (await confirmDialog('Idee löschen?', `„${e.text}“ wird aus der Liste entfernt. Bereits eingeplante Aufgaben bleiben.`, 'Löschen', { danger: true })) {
              store.removePoolEntry(e.id, { scope });
              renderList();
            }
          } }));
          if (highlightId === e.id) row.style.boxShadow = '0 0 0 2px var(--accent)';
          list.appendChild(row);
        }
      };
      renderList();
      box.appendChild(list);
    },
    footer: (bar, close) => {
      bar.appendChild(el('button', { class: 'btn', text: 'Allgemeinen Vorrat ins Projekt holen', onclick: () => {
        const n = store.importGlobalPool();
        renderList();
        toast(n ? `${n} Eintrag/Einträge übernommen` : 'Vorrat ist leer', n ? 'ok' : 'warn');
      } }));
      if (onOpenWindow) bar.appendChild(el('button', { class: 'btn', text: 'Fenster für zweiten Bildschirm', onclick: () => { close(); onOpenWindow(); } }));
      bar.appendChild(el('button', { class: 'btn btn-primary', text: 'Fertig', onclick: close }));
    },
  });
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
