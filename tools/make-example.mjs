// Erzeugt examples/beispiel-projekt.tplan.json aus dem eingebauten Beispielprojekt.
// Aufruf: node tools/make-example.mjs
import { sampleProject, serializeProject } from '../js/model.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const p = sampleProject();
const out = join(here, '..', 'examples', 'beispiel-projekt.tplan.json');
writeFileSync(out, serializeProject(p) + '\n', 'utf8');
console.log('geschrieben:', out, '·', p.tasks.length, 'Aufgaben');
