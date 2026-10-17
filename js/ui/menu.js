/* ══════════════════════════════════════════════════════════════
   ui/menu.js – kleines Kontextmenü (Rechtsklick).
   ══════════════════════════════════════════════════════════════ */

import { el, clear } from './dom.js';

let current = null;

export function closeMenu() {
  if (current) { current.remove(); current = null; }
}

export function contextMenu(x, y, items) {
  closeMenu();
  const box = el('div', { class: 'ctxmenu' });
  for (const it of items) {
    if (it === '-') { box.appendChild(el('div', { class: 'ctxsep' })); continue; }
    box.appendChild(el('button', {
      class: 'ctxitem' + (it.danger ? ' danger' : ''),
      disabled: !!it.disabled,
      onclick: () => { closeMenu(); it.run(); },
    }, el('span', { text: it.label }), it.hint ? el('kbd', { text: it.hint }) : null));
  }
  document.body.appendChild(box);
  const r = box.getBoundingClientRect();
  box.style.left = Math.min(x, window.innerWidth - r.width - 8) + 'px';
  box.style.top = Math.min(y, window.innerHeight - r.height - 8) + 'px';
  current = box;
  setTimeout(() => {
    const off = (ev) => { if (!box.contains(ev.target)) { closeMenu(); document.removeEventListener('mousedown', off); } };
    document.addEventListener('mousedown', off);
  }, 0);
  return box;
}

const style = document.createElement('style');
style.textContent = `
.ctxmenu { position: fixed; z-index: 400; background: var(--panel); border: 1px solid var(--line);
  border-radius: 10px; box-shadow: var(--shadow-2); padding: 5px; min-width: 210px; }
.ctxitem { display: flex; align-items: center; justify-content: space-between; gap: 14px; width: 100%;
  border: none; background: transparent; color: var(--fg); text-align: left; padding: 6px 9px;
  border-radius: 7px; font-size: 12.5px; }
.ctxitem:hover:not(:disabled) { background: var(--accent-soft); }
.ctxitem:disabled { opacity: .4; }
.ctxitem.danger { color: var(--danger); }
.ctxsep { height: 1px; background: var(--line); margin: 4px 6px; }
`;
document.head.appendChild(style);
void clear;
