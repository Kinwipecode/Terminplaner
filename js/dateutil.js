/* ══════════════════════════════════════════════════════════════
   dateutil.js – Datumsrechnung auf Basis von ISO-Texten (JJJJ-MM-TT).
   Alle Rechnungen laufen in UTC, damit Sommer-/Winterzeit keine
   Tage verschiebt. Arbeitskalender: Arbeitstage + Feiertage.
   ══════════════════════════════════════════════════════════════ */

export const MS_DAY = 86400000;

export function parseIso(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export function iso(date) {
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  const n = new Date();
  return iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
}

export function addDays(isoStr, n) {
  const d = parseIso(isoStr);
  if (!d) return isoStr;
  return iso(new Date(d.getTime() + n * MS_DAY));
}

/** Differenz in Kalendertagen (b - a). */
export function diffDays(a, b) {
  return Math.round((parseIso(b) - parseIso(a)) / MS_DAY);
}

/** Wochentag: 0 = Sonntag … 6 = Samstag */
export function dow(isoStr) {
  return parseIso(isoStr).getUTCDay();
}

export function minIso(a, b) { return !a ? b : !b ? a : (a <= b ? a : b); }
export function maxIso(a, b) { return !a ? b : !b ? a : (a >= b ? a : b); }

/* ───────── Arbeitskalender ───────── */

export function defaultCalendar() {
  return { workdays: [1, 2, 3, 4, 5], holidays: [], extraWorkdays: [] };
}

export function normalizeCalendar(cal) {
  const c = Object.assign(defaultCalendar(), cal || {});
  c.workdays = Array.isArray(c.workdays) && c.workdays.length ? c.workdays.map(Number) : [1, 2, 3, 4, 5];
  c.holidays = Array.isArray(c.holidays) ? c.holidays.filter(Boolean) : [];
  c.extraWorkdays = Array.isArray(c.extraWorkdays) ? c.extraWorkdays.filter(Boolean) : [];
  return c;
}

export function isWorkday(isoStr, cal) {
  if (!isoStr) return false;
  if (cal.extraWorkdays.includes(isoStr)) return true;
  if (cal.holidays.includes(isoStr)) return false;
  return cal.workdays.includes(dow(isoStr));
}

/** Nächstgelegener Arbeitstag (dir = 1 vorwärts, -1 rückwärts). */
export function snapToWorkday(isoStr, cal, dir = 1) {
  let s = isoStr, guard = 0;
  while (!isWorkday(s, cal) && guard++ < 400) s = addDays(s, dir);
  return s;
}

/** n Arbeitstage verschieben. n = 0 → auf Arbeitstag einrasten. */
export function addWorkdays(isoStr, n, cal, dir = 1) {
  let s = snapToWorkday(isoStr, cal, dir);
  let left = Math.abs(n), step = n >= 0 ? 1 : -1;
  let guard = 0;
  while (left > 0 && guard++ < 4000) {
    s = addDays(s, step);
    if (isWorkday(s, cal)) left--;
  }
  return s;
}

/** Anzahl Arbeitstage von a bis b (beide einschließlich). 0 wenn b < a. */
export function workdaysBetween(a, b, cal) {
  if (!a || !b || b < a) return 0;
  let n = 0, s = a, guard = 0;
  while (s <= b && guard++ < 20000) {
    if (isWorkday(s, cal)) n++;
    s = addDays(s, 1);
  }
  return n;
}

/** Enddatum aus Start + Dauer (Arbeitstage, Dauer 1 = Start = Ende). */
export function endFromDuration(start, duration, cal) {
  const dur = Math.max(0, Number(duration) || 0);
  if (dur <= 0) return start;
  return addWorkdays(start, dur - 1, cal);
}

export function durationFromRange(start, end, cal) {
  if (!start || !end) return 0;
  if (end < start) return 0;
  return workdaysBetween(start, end, cal);
}

/** Anteil (0..1) zwischen zwei Daten – für Balken-Beschriftungen. */
export function progressOfRange(start, end, at, cal) {
  const total = workdaysBetween(start, end, cal);
  if (!total) return 0;
  return workdaysBetween(start, at, cal) / total;
}

/* ───────── Formatierung (deutsch) ───────── */

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTHS_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const DOW_SHORT = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const DOW_LONG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

export const monthName = (m, short) => (short ? MONTHS_SHORT : MONTHS)[m];
export const dowShort = (d) => DOW_SHORT[d];
export const dowLong = (d) => DOW_LONG[d];

export function formatIso(isoStr, style = 'medium') {
  const d = parseIso(isoStr);
  if (!d) return '–';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  if (style === 'short') return `${dd}.${mm}.`;
  if (style === 'long') return `${dowShort(d.getUTCDay())}, ${dd}. ${MONTHS[d.getUTCMonth()]} ${yyyy}`;
  if (style === 'iso') return isoStr;
  return `${dd}.${mm}.${yyyy}`;
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function relativeTime(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'gerade eben';
  if (s < 60) return `vor ${s} Sek.`;
  if (s < 3600) return `vor ${Math.round(s / 60)} Min.`;
  return formatDateTime(ts);
}

/** ISO-Kalenderwoche */
export function isoWeek(isoStr) {
  const d = parseIso(isoStr);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round((t - first) / MS_DAY / 7);
}

/** Erster Tag der Woche (Mo) für ein Datum. */
export function startOfWeek(isoStr) {
  const d = dow(isoStr);
  return addDays(isoStr, d === 0 ? -6 : 1 - d);
}

export function startOfMonth(isoStr) {
  const d = parseIso(isoStr);
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

export function endOfMonth(isoStr) {
  const d = parseIso(isoStr);
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

export function clampIso(isoStr, min, max) {
  if (min && isoStr < min) return min;
  if (max && isoStr > max) return max;
  return isoStr;
}
