/* ══════════════════════════════════════════════════════════════
   ui/dom.js – kleine Helfer für den Aufbau der Oberfläche.
   ══════════════════════════════════════════════════════════════ */

/** Element bauen: el('div', {class:'x', onclick:fn}, kind1, kind2 …) */
export function el(tag, attrs = null, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (k === 'value') node.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'hidden') node[k] = !!v;
      else node.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function throttle(fn, ms = 100) {
  let last = 0, timer = null, lastArgs = null;
  return (...args) => {
    lastArgs = args;
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...lastArgs); }
    else if (!timer) timer = setTimeout(() => { timer = null; last = Date.now(); fn(...lastArgs); }, ms - (now - last));
  };
}

/* ───────── Hinweismeldungen ───────── */

export function toast(message, kind = 'info', sub = '', ms = 4200) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = el('div', { class: `toast ${kind}` },
    el('div', { text: message }),
    sub ? el('small', { text: sub }) : null);
  host.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateX(18px)';
    setTimeout(() => node.remove(), 320);
  }, ms);
  return node;
}

/** Farbe aufhellen/abdunkeln (für Balken-Verläufe) */
export function shade(hex, amt) {
  const h = String(hex || '#6366f1').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt)));
  g = Math.max(0, Math.min(255, Math.round(g + amt)));
  b = Math.max(0, Math.min(255, Math.round(b + amt)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Freies Ziehen mit der Maus: drag(el, {onStart, onMove, onEnd}) */
export function drag(node, { onStart, onMove, onEnd }) {
  const down = (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const start = { x: ev.clientX, y: ev.clientY, ev };
    const move = (e) => onMove && onMove(e, { dx: e.clientX - start.x, dy: e.clientY - start.y, start });
    const up = (e) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.classList.remove('is-dragging');
      if (onEnd) onEnd(e, { dx: e.clientX - start.x, dy: e.clientY - start.y, start, cancelled: false });
    };
    document.body.classList.add('is-dragging');
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    if (onStart) onStart(ev, start);
  };
  node.addEventListener('mousedown', down);
  return () => node.removeEventListener('mousedown', down);
}
