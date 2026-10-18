/* ══════════════════════════════════════════════════════════════
   version.js – Programmversion der Terminplanung.

   Zwei Ziffern, bei jeder Auslieferung hochzählen (01 → 02 → …).
   Angezeigt wird sie an drei Stellen, damit man auf einen Blick
   sieht, welchen Stand man gerade vor sich hat:
   Statuszeile unten rechts, Startbildschirm, und im Detailfenster.
   ══════════════════════════════════════════════════════════════ */

export const APP_VERSION = '01';

/** Fertiger Text für die Anzeige. */
export function versionLabel() { return 'Version ' + APP_VERSION; }
