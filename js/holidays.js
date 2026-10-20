/* ══════════════════════════════════════════════════════════════
   holidays.js – gesetzliche Feiertage in der Schweiz und in
   Deutschland, jeweils für das ganze Land oder die Region
   (Kanton / Bundesland).

   Wie „Feiertage hinzufügen“ in Outlook: Land und Region wählen,
   Jahre wählen, übernehmen. Die beweglichen Feiertage hängen an
   Ostern und werden gerechnet, die festen stehen als Regel drin –
   damit gilt die Liste für jedes Jahr, auch für künftige.

   Schweiz: Grundlage ist die amtliche Liste des Bundesamts für
   Justiz (maschinenlesbar über date.nager.at), geprüft gegen die
   Jahre 2025–2029 – die Kantonslisten sind über die Jahre gleich.
   Gesamtschweizerisch ist nur der Bundesfeiertag; alles andere ist
   kantonale Sache. Tage, die nur regional oder gewohnheitsmäßig
   frei sind, tragen einen Hinweis und lassen sich nach dem
   Übernehmen einzeln wieder löschen.

   Deutschland: 9 bundesweite plus die regionalen Feiertage je
   Bundesland (bewegliche ebenfalls aus Ostern gerechnet).

   Bewusst NICHT enthalten: Schulferien, reine Lokalanlässe und
   Feiertage anderer Länder.
   ══════════════════════════════════════════════════════════════ */

import { addDays, todayIso, iso, parseIso, dow } from './dateutil.js';

/* ───────── Länder und Regionen ───────── */

export const COUNTRIES = [
  { id: 'CH', name: 'Schweiz' },
  { id: 'DE', name: 'Deutschland' },
];

/** Kantone der Schweiz (amtliche Kürzel). */
export const CANTONS = [
  { id: 'ZH', name: 'Zürich' }, { id: 'BE', name: 'Bern' }, { id: 'LU', name: 'Luzern' },
  { id: 'UR', name: 'Uri' }, { id: 'SZ', name: 'Schwyz' }, { id: 'OW', name: 'Obwalden' },
  { id: 'NW', name: 'Nidwalden' }, { id: 'GL', name: 'Glarus' }, { id: 'ZG', name: 'Zug' },
  { id: 'FR', name: 'Freiburg' }, { id: 'SO', name: 'Solothurn' }, { id: 'BS', name: 'Basel-Stadt' },
  { id: 'BL', name: 'Basel-Landschaft' }, { id: 'SH', name: 'Schaffhausen' },
  { id: 'AR', name: 'Appenzell Ausserrhoden' }, { id: 'AI', name: 'Appenzell Innerrhoden' },
  { id: 'SG', name: 'St. Gallen' }, { id: 'GR', name: 'Graubünden' }, { id: 'AG', name: 'Aargau' },
  { id: 'TG', name: 'Thurgau' }, { id: 'TI', name: 'Tessin' }, { id: 'VD', name: 'Waadt' },
  { id: 'VS', name: 'Wallis' }, { id: 'NE', name: 'Neuenburg' }, { id: 'GE', name: 'Genf' },
  { id: 'JU', name: 'Jura' },
];

/** Auswahl in der Oberfläche – die 16 Bundesländer. */
export const STATES = [
  { id: 'BW', name: 'Baden-Württemberg' },
  { id: 'BY', name: 'Bayern' },
  { id: 'BE', name: 'Berlin' },
  { id: 'BB', name: 'Brandenburg' },
  { id: 'HB', name: 'Bremen' },
  { id: 'HH', name: 'Hamburg' },
  { id: 'HE', name: 'Hessen' },
  { id: 'MV', name: 'Mecklenburg-Vorpommern' },
  { id: 'NI', name: 'Niedersachsen' },
  { id: 'NW', name: 'Nordrhein-Westfalen' },
  { id: 'RP', name: 'Rheinland-Pfalz' },
  { id: 'SL', name: 'Saarland' },
  { id: 'SN', name: 'Sachsen' },
  { id: 'ST', name: 'Sachsen-Anhalt' },
  { id: 'SH', name: 'Schleswig-Holstein' },
  { id: 'TH', name: 'Thüringen' },
];

/* Regionen für die Oberfläche: „CH“/„DE“ = ganzes Land,
   „CH:ZH“ = Kanton Zürich, „DE:BY“ = Bundesland Bayern. */
export const REGIONS = {
  CH: [
    { id: 'CH', name: 'Ganze Schweiz (nur die 4 gemeinsamen)' },
    { id: 'CH:UEB', name: 'Ganze Schweiz – Feiertagsfahrplan (SBB/Post/Bund)' },
    ...CANTONS.map((c) => ({ id: `CH:${c.id}`, name: `${c.name} (${c.id})` })),
  ],
  DE: [
    { id: 'DE', name: 'Bundesweit (nur die 9 überall gültigen)' },
    ...STATES.map((s) => ({ id: `DE:${s.id}`, name: `${s.name} (${s.id})` })),
  ],
};

/** Regionen eines Landes (für die Auswahlliste). */
export function regions(country) { return REGIONS[country] || []; }

/** Anzeigename einer Region (versteht auch alte Kürzel wie „BY“). */
export function regionName(id) {
  const s = String(id == null ? '' : id);
  for (const list of Object.values(REGIONS)) {
    const hit = list.find((r) => r.id === s);
    if (hit) return hit.name;
  }
  if (s.length === 2) {
    const c = CANTONS.find((x) => x.id === s);
    if (c) return c.name;
    const st = STATES.find((x) => x.id === s);
    if (st) return st.name;
  }
  return s;
}

export function stateName(id) { return regionName(id); }

/**
 * Ostersonntag eines Jahres (Anonymus-Gregorianus-Algorithmus).
 * @returns {string} ISO-Datum
 */
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);          // 3 = März, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(new Date(Date.UTC(year, month - 1, day)));
}

/** Mittwoch vor dem 23. November (Buß- und Bettag). */
export function bussUndBettag(year) {
  const ref = `${year}-11-23`;
  const back = (dow(ref) - 3 + 7) % 7;          // 3 = Mittwoch
  return addDays(ref, -back);
}

/* ───────── Schweiz: kantonale Sonderfälle ───────── */

/** Erster Donnerstag im April (Näfelser Fahrt, Kanton Glarus). */
function firstThursdayApril(year) {
  const first = `${year}-04-01`;
  const shift = (4 - dow(first) + 7) % 7;       // 4 = Donnerstag
  return addDays(first, shift);
}

/** Donnerstag nach dem ersten Sonntag im September (Jeûne genevois, Genf). */
function jeuneGenevois(year) {
  const first = `${year}-09-01`;
  const toSunday = (7 - dow(first)) % 7;
  return addDays(addDays(first, toSunday), 4);
}

/** Montag nach dem Eidgenössischen Bettag (3. Sonntag im September) – Waadt. */
function bettagsMontag(year) {
  const first = `${year}-09-01`;
  const toSunday = (7 - dow(first)) % 7;
  const thirdSunday = addDays(addDays(first, toSunday), 14);
  return addDays(thirdSunday, 1);
}

/* ───────── Schweiz: Feiertage je Kanton ─────────
   Aufbau: [Datum „MM-TT“ bzw. Abstand zu Ostern, Name, Art, Kantone, Zusatzhinweis]
   Art: „Public“ = kantonsweit anerkannt · „Observance“ = nur regional oder gewohnheitsmäßig frei.
   „ALL“ = für alle Kantone.   Quelle: siehe Kopf dieser Datei. */

const CH_FIXED = [
  ['01-01', 'Neujahr', 'Public', 'ALL', ''],
  // Zürich führt den Berchtoldstag als kantonalen Feiertag (Personalamt ZH); die
  // amtliche Bundesliste nennt AG, BE, FR, SH, TG, VD.
  ['01-02', 'Berchtoldstag', 'Public', 'AG BE FR SH TG VD ZH', 'in AG und FR nur in bestimmten Gemeinden'],
  ['01-06', 'Heilige Drei Könige', 'Public', 'TI', ''],
  ['01-06', 'Heilige Drei Könige', 'Observance', 'SZ UR', ''],
  ['03-01', 'Jahrestag der Ausrufung der Republik', 'Public', 'NE', ''],
  ['03-19', 'Josefstag', 'Public', 'SZ VS', ''],
  ['03-19', 'Josefstag', 'Observance', 'LU NW TI UR', ''],
  ['05-01', 'Tag der Arbeit', 'Public', 'BL BS JU NE SH SO ZH', ''],
  ['05-01', 'Tag der Arbeit', 'Observance', 'TG TI', ''],
  ['06-29', 'Peter und Paul', 'Observance', 'TI', ''],
  ['08-01', 'Bundesfeier', 'Public', 'ALL', ''],
  ['08-15', 'Mariä Himmelfahrt', 'Public', 'AG FR LU NW OW SO SZ TI UR VS ZG', ''],
  ['08-15', 'Mariä Himmelfahrt', 'Observance', 'AI JU', ''],
  ['11-01', 'Allerheiligen', 'Public', 'AG FR GL LU NW OW SG SO SZ TI UR VS ZG', ''],
  ['11-01', 'Allerheiligen', 'Observance', 'AI JU', ''],
  ['12-08', 'Mariä Empfängnis', 'Public', 'AG FR NW OW UR VS ZG', ''],
  ['12-08', 'Mariä Empfängnis', 'Observance', 'AI JU LU SZ TI', ''],
  ['12-25', 'Weihnachtstag', 'Public', 'ALL', ''],
  ['12-26', 'Stephanstag', 'Public', 'AG AI AR BE BL BS FR GL GR LU SG SH TG TI ZH', ''],
  ['12-26', 'Stephanstag', 'Observance', 'OW SZ UR', ''],
  ['12-31', 'Restauration de la République', 'Public', 'GE', ''],
];

const CH_EASTER = [
  [-2, 'Karfreitag', 'Public', 'AG AI AR BE BL BS FR GE GL GR JU LU NE NW OW SG SH SO SZ TG UR VD ZG ZH', ''],
  [1, 'Ostermontag', 'Public', 'AG AI AR BE BL BS FR GE GL GR JU SG SH TG TI VD ZH', ''],
  [1, 'Ostermontag', 'Observance', 'OW SZ UR', ''],
  [39, 'Auffahrt', 'Public', 'ALL', ''],
  [50, 'Pfingstmontag', 'Public', 'AG AI AR BE BL BS FR GE GL GR JU SG SH TG VD ZH', ''],
  [50, 'Pfingstmontag', 'Observance', 'OW SZ TI UR', ''],
  [60, 'Fronleichnam', 'Public', 'AG AI FR JU LU NW OW SO SZ UR VS ZG', ''],
  [60, 'Fronleichnam', 'Observance', 'TI', ''],
];

/* Feiertage, die nur in einzelnen Ländern gelten.
   `note` = Einschränkung, wird an den Namen gehängt. */
const REGIONAL_DE = [
  { m: 1,  d: 6,  name: 'Heilige Drei Könige', states: ['BW', 'BY', 'ST'] },
  { m: 3,  d: 8,  name: 'Internationaler Frauentag', states: ['BE', 'MV'] },
  { m: 8,  d: 15, name: 'Mariä Himmelfahrt', states: ['SL', 'BY'], note: 'in Bayern nur katholische Gemeinden' },
  { m: 9,  d: 20, name: 'Weltkindertag', states: ['TH'] },
  { m: 10, d: 31, name: 'Reformationstag', states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'] },
  { m: 11, d: 1,  name: 'Allerheiligen', states: ['BW', 'BY', 'NW', 'RP', 'SL'] },
];

/* ───────── Listen bauen ───────── */

/** Feiertage in der Schweiz für „ganzes Land“, „Feiertagsfahrplan“ oder einen Kanton. */
function chHolidays(year, regionId) {
  const code = regionId.startsWith('CH:') ? regionId.slice(3) : null;
  const out = [];
  const push = (date, name, note) => out.push({ date, name: note ? `${name} – ${note}` : name });
  const e = easterSunday(year);

  // Feiertagsfahrplan der überregionalen Betriebe (SBB, Post, Bundesverwaltung)
  if (code === 'UEB') {
    push(`${year}-01-01`, 'Neujahr');
    push(`${year}-01-02`, 'Berchtoldstag', 'auch dort, wo er kein kantonaler Feiertag ist');
    push(addDays(e, -2), 'Karfreitag');
    push(addDays(e, 1), 'Ostermontag');
    push(addDays(e, 39), 'Auffahrt');
    push(addDays(e, 50), 'Pfingstmontag');
    push(`${year}-08-01`, 'Bundesfeier');
    push(`${year}-12-25`, 'Weihnachtstag');
    push(`${year}-12-26`, 'Stephanstag');
    return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  const relevant = (cs) => (code ? (cs === 'ALL' || cs.split(' ').includes(code)) : cs === 'ALL');
  const noteFor = (typ, extra) => {
    const bits = [];
    if (typ === 'Observance') bits.push('nur regional bzw. gewohnheitsmäßig frei');
    if (extra) bits.push(extra);
    return bits.join('; ');
  };

  for (const [mmdd, name, typ, cs, extra] of CH_FIXED) {
    if (!relevant(cs)) continue;
    const date = `${year}-${mmdd}`;
    // In Appenzell Innerrhoden und Ausserrhoden gilt der Stephanstag nur,
    // wenn er nicht auf einen Dienstag oder Samstag fällt.
    if (mmdd === '12-26' && (code === 'AI' || code === 'AR') && (dow(date) === 2 || dow(date) === 6)) continue;
    push(date, name, noteFor(typ, extra));
  }
  for (const [off, name, typ, cs, extra] of CH_EASTER) {
    if (!relevant(cs)) continue;
    push(addDays(e, off), name, noteFor(typ, extra));
  }
  // kantonale Sonderfälle (nur, wenn auch ein Kanton gewählt ist)
  if (code === 'GL') push(firstThursdayApril(year), 'Näfelser Fahrt', 'erster Donnerstag im April, Ausnahmen möglich');
  if (code === 'GE') push(jeuneGenevois(year), 'Jeûne genevois', 'Donnerstag nach dem ersten Sonntag im September');
  if (code === 'VD') push(bettagsMontag(year), 'Bettagsmontag', 'Montag nach dem Eidgenössischen Bettag');

  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Feiertage in Deutschland (bundesweit plus die regionalen des Bundeslandes). */
function deHolidays(year, state) {
  const out = [];
  const add = (date, name, note) => out.push({ date, name: note ? `${name} – ${note}` : name });
  const inState = (list) => !!state && state !== 'DE' && list.includes(state);

  // bundesweit
  add(`${year}-01-01`, 'Neujahr');
  const e = easterSunday(year);
  add(addDays(e, -2), 'Karfreitag');
  add(addDays(e, 1), 'Ostermontag');
  add(`${year}-05-01`, 'Tag der Arbeit');
  add(addDays(e, 39), 'Christi Himmelfahrt');
  add(addDays(e, 50), 'Pfingstmontag');
  add(`${year}-10-03`, 'Tag der Deutschen Einheit');
  add(`${year}-12-25`, '1. Weihnachtstag');
  add(`${year}-12-26`, '2. Weihnachtstag');

  // bewegliche, die nur in einzelnen Ländern gelten
  if (inState(['BB'])) { add(e, 'Ostersonntag'); add(addDays(e, 49), 'Pfingstsonntag'); }
  if (inState(['BW', 'BY', 'HE', 'NW', 'RP', 'SL'])) add(addDays(e, 60), 'Fronleichnam');
  if (inState(['SN'])) add(bussUndBettag(year), 'Buß- und Bettag');

  // feste, regionale
  for (const h of REGIONAL_DE) {
    if (!inState(h.states)) continue;
    const date = `${year}-${String(h.m).padStart(2, '0')}-${String(h.d).padStart(2, '0')}`;
    add(date, h.name, h.note);
  }

  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/**
 * Alle Feiertage eines Jahres.
 * @param {number} year
 * @param {string} region  'CH' · 'CH:ZH' (Kanton) · 'DE' · 'DE:BY' (Bundesland) – alte Form „BY“ geht auch
 * @returns {{date:string, name:string}[]}
 */
export function holidaysForYear(year, region = 'DE') {
  const id = String(region == null ? '' : region);
  if (id.startsWith('CH')) return chHolidays(year, id);
  return deHolidays(year, id.startsWith('DE:') ? id.slice(3) : id);
}

/**
 * Feiertage für einen Zeitraum (alle Jahre darin abdecken).
 * @param {string} fromIso
 * @param {string} toIso
 * @param {string} region
 */
export function holidaysForRange(fromIso, toIso, region = 'DE') {
  const a = parseIso(fromIso) || parseIso(todayIso());
  const b = parseIso(toIso) || a;
  if (!a || !b) return [];
  const out = [];
  for (let y = a.getUTCFullYear(); y <= b.getUTCFullYear(); y++) out.push(...holidaysForYear(y, region));
  return out.filter((h) => h.date >= fromIso && h.date <= toIso);
}
