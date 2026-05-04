import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = resolve(__dirname, '../flamerelay/static/locales');

function leafPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null ? leafPaths(v, path) : [path];
  });
}

function syncStructure(source, target) {
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = syncStructure(value, target[key] ?? {});
    } else {
      // Preserve existing translation; new keys default to empty string for Weblate
      result[key] = typeof target[key] === 'string' ? target[key] : '';
    }
  }
  return result;
}

const en = JSON.parse(
  readFileSync(join(localesDir, 'en', 'translation.json'), 'utf8'),
);
const enKeys = new Set(leafPaths(en));

const targetLocales = readdirSync(localesDir).filter(
  (d) => d !== 'en' && statSync(join(localesDir, d)).isDirectory(),
);

for (const lang of targetLocales) {
  const filePath = join(localesDir, lang, 'translation.json');
  const existing = JSON.parse(readFileSync(filePath, 'utf8'));
  const existingKeys = new Set(leafPaths(existing));

  const added = [...enKeys].filter((k) => !existingKeys.has(k));
  const removed = [...existingKeys].filter((k) => !enKeys.has(k));

  writeFileSync(
    filePath,
    JSON.stringify(syncStructure(en, existing), null, 2) + '\n',
    'utf8',
  );

  if (added.length === 0 && removed.length === 0) {
    console.log(
      `✓ ${lang}/translation.json already in sync (${enKeys.size} keys)`,
    );
  } else {
    if (added.length)
      console.log(
        `+ ${lang}: added ${added.length} key(s):\n${added.map((k) => `  ${k}`).join('\n')}`,
      );
    if (removed.length)
      console.log(
        `- ${lang}: removed ${removed.length} orphan(s):\n${removed.map((k) => `  ${k}`).join('\n')}`,
      );
    console.log(
      `✓ ${lang}/translation.json synced (${enKeys.size} keys total)`,
    );
  }
}
